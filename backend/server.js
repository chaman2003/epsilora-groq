import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import User from './models/User.js';
import Course from './models/Course.js';
import Quiz from './models/Quiz.js'; // Import Quiz model
import QuizAttempt from './models/QuizAttempt.js';
import progressRoutes from './routes/progress.js';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') :
      [
        'https://epsilora-groq.vercel.app',
        'https://epsilora-groq-git-main-chaman2003.vercel.app',
        'https://epsilora-groq-chaman2003.vercel.app',
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174'
      ];
    
    // Allow requests with no origin (like mobile apps or curl requests) 
    // or any Vercel deployment URL
    if (!origin) {
      callback(null, true); // Allow requests with no origin
    } else if (
        allowedOrigins.includes(origin) || 
        /^https:\/\/epsilora-groq.*\.vercel\.app$/.test(origin)) {
      callback(null, origin); // Reflect the request origin in the response
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add additional headers for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Never use wildcard with credentials
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware to handle requests and responses
app.use(express.json());

// Global timeout and error handling middleware
app.use((req, res, next) => {
  // Set global timeouts
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes

  // Enhanced error handling
  res.handleError = function(error, statusCode = 500) {
    console.error(`Error in ${req.method} ${req.path}:`, error);
    this.status(statusCode).json({
      message: error.message || 'Unexpected server error',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  };

  next();
});

// Lazy initialization for non-critical components
// Remove Gemini AI
// let genAI = null;
let mongoConnected = false;

// MongoDB connection as a separate function that can be called on-demand
const connectToMongoDB = async () => {
  if (mongoConnected) return true; // Skip if already connected
  
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Simplified connection options optimized for serverless
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // These options are important for serverless environments
      bufferCommands: false, // Don't buffer commands when not connected
      autoCreate: false, // Don't create indexes automatically
      // Set max pool size low to avoid connection issues
      maxPoolSize: 5
    };
    
    await mongoose.connect(MONGODB_URI, mongoOptions);
    console.log('Connected to MongoDB successfully');
    mongoConnected = true;
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    mongoConnected = false;
    return false;
  }
};

// Function to call Groq API
const callGroqAPI = async (prompt, temperature = 0.7, maxTokens = 2048) => {
  try {
    console.log('Calling Groq API with prompt:', prompt.substring(0, 100) + '...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
};

// Authentication middleware with on-demand MongoDB connection
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // Connect to MongoDB first if needed
    if (!mongoConnected) {
      const connected = await connectToMongoDB();
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Modified login endpoint with on-demand MongoDB connection and optimized flow
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', new Date().toISOString());
    const { email, password } = req.body;

    // Validate input immediately before any DB operations
    if (!email || !password) {
      console.log('Login attempt failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Connect to MongoDB only when needed and for each request
    const connected = await connectToMongoDB();
    if (!connected) {
      return res.status(503).json({ 
        message: 'Database service unavailable',
        error: 'Unable to connect to database'
      });
    }

    // Find user
    console.log(`Attempting to find user with email: ${email}`);
    const user = await User.findOne({ email }).lean();

    if (!user) {
      console.log(`Login attempt failed: No user found for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`Login attempt failed: Invalid password for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if JWT_SECRET is properly set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables, using fallback');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Login successful for user: ${email}`);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Send an appropriate error response
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Verify token route
app.post('/api/auth/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ valid: false });
    }
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Protected route to get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Course routes with authentication
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      userId: req.user.id
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

// Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [{
    role: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Chat History Endpoints
app.get('/api/chat-history', authenticateToken, async (req, res) => {
  try {
    const chatHistories = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(chatHistories);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.post('/api/chat-history', authenticateToken, async (req, res) => {
  try {
    const newChat = new ChatHistory({
      userId: req.user.id,
      messages: req.body.messages
    });
    await newChat.save();
    res.json(newChat);
  } catch (error) {
    console.error('Error saving chat history:', error);
    res.status(500).json({ error: 'Failed to save chat history' });
  }
});

app.put('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    // Update the entire messages array instead of using $push
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.user.id },
      { messages: req.body.messages },
      { new: true }
    );
    res.json(chatHistory);
  } catch (error) {
    console.error('Error updating chat history:', error);
    res.status(500).json({ error: 'Failed to update chat history' });
  }
});

// Add endpoint to delete all chat histories for a user
app.delete('/api/chat-history/all', authenticateToken, async (req, res) => {
  try {
    const result = await ChatHistory.deleteMany({ userId: req.user.id });
    console.log(`Deleted ${result.deletedCount} chat histories for user ${req.user.id}`);
    res.json({ 
      message: 'All chat histories deleted successfully',
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all chat histories:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

app.delete('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.user.id
    });
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

// Add endpoint to get specific chat history by ID
app.get('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({
      _id: req.params.chatId,
      userId: req.user.id
    });
    
    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    
    res.json(chatHistory);
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Utility function for exponential backoff retry
async function retryOperation(operation, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      // Check if error is retriable
      const retriableErrors = [
        'ECONNABORTED', 
        'ECONNRESET', 
        'ETIMEDOUT', 
        'Service Unavailable', 
        'Too Many Requests'
      ];

      const isRetriableError = retriableErrors.some(errorType => 
        error.message.includes(errorType)
      );

      if (!isRetriableError || retries === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retry attempt ${retries + 1}: Waiting ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  throw new Error('Max retries exceeded');
}

// Add a route handler for the legacy endpoint to maintain backward compatibility
app.post('/api/generate-quiz', async (req, res) => {
  console.log('Legacy endpoint /api/generate-quiz called, forwarding to /api/quiz/generate');
  // Forward request to the actual endpoint handler
  const quizRouteHandler = app._router.stack
    .filter(layer => layer.route)
    .find(layer => layer.route.path === '/api/quiz/generate' && layer.route.methods.post);
  
  if (quizRouteHandler && quizRouteHandler.handle) {
    return quizRouteHandler.handle(req, res);
  } else {
    // Fallback to redirecting if we can't find the handler
    res.redirect(307, '/api/quiz/generate');
  }
});

// Update quiz generation endpoint to use Groq API
app.post('/api/quiz/generate', async (req, res) => {
  const startTime = Date.now();
  try {
    const { courseId, numberOfQuestions, difficulty, timePerQuestion } = req.body;
    
    const actualNumberOfQuestions = Math.min(Number(numberOfQuestions) || 5, 10);
    
    if (!courseId || !actualNumberOfQuestions || !difficulty) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        details: {
          courseId: !!courseId,
          numberOfQuestions: !!actualNumberOfQuestions,
          difficulty: !!difficulty
        }
      });
    }

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error('Groq API key not found');
      return res.status(500).json({
        message: 'Server configuration error',
        error: 'API key not configured'
      });
    }
    
    // Connect to MongoDB on-demand
    if (!mongoConnected) {
      const connected = await connectToMongoDB();
      if (!connected) {
        return res.status(503).json({ 
          message: 'Database service unavailable',
          error: 'Unable to connect to database'
        });
      }
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create an even more explicit prompt for Groq
    const promptText = `Create ${actualNumberOfQuestions} multiple choice questions about "${course.name}" at ${difficulty} difficulty. Each question must have exactly 4 options labeled A, B, C, D and one correct answer. Format as a valid JSON array like this exact format: [{question:"question text",options:["A. option text","B. option text","C. option text","D. option text"],correctAnswer:"A"}]. Don't include any explanations, just return the JSON array.`;

    console.log(`Generating ${actualNumberOfQuestions} questions at ${difficulty} difficulty for course: ${course.name}`);
    
    try {
      // Call Groq API instead of Gemini
      const generatedText = await callGroqAPI(promptText, 0.3, 2048);

      if (!generatedText) {
        throw new Error('No content generated from the API');
      }

      // Log the full response for debugging during development
      console.log('Raw Groq API response:', generatedText);

      // Super enhanced cleaning and parsing with multiple fallback strategies
      let cleanedText = generatedText
        .replace(/```(json|javascript|js)?/g, '') // Remove code block markers with various language indicators
        .replace(/```/g, '')                      // Remove any remaining code block markers
        .replace(/[\n\r\t]/g, ' ')                // Replace newlines and tabs with spaces
        .trim();                                  // Trim whitespace
      
      console.log('Cleaned text:', cleanedText);
      
      // Handle JSON parsing errors with multiple advanced fallback strategies
      let questions;
      try {
        // Strategy 1: Find the most complete JSON array pattern
        const jsonArrayMatch = cleanedText.match(/(\[\s*\{.*\}\s*\])/s);
        if (jsonArrayMatch && jsonArrayMatch[1]) {
          console.log('Found JSON array pattern, extracting...');
          cleanedText = jsonArrayMatch[1];
          
          // Additional repair of common JSON issues
          cleanedText = cleanedText
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
            .replace(/,\s*}/g, '}')                               // Remove trailing commas in objects
            .replace(/,\s*]/g, ']');                              // Remove trailing commas in arrays
        }
        
        // Try to parse the JSON
        console.log('Attempting to parse JSON...');
        try {
          questions = JSON.parse(cleanedText);
          
          // Ensure we have the right structure
          if (!Array.isArray(questions)) {
            console.error('Parsed result is not an array, type:', typeof questions);
            throw new Error('Not a valid array of questions');
          }
          
          console.log(`Successfully parsed ${questions.length} questions as JSON array`);
        } catch (initialParseError) {
          console.error('Initial JSON parsing failed:', initialParseError.message);
          
          // FALLBACK: Try to extract just the content within square brackets and repair it
          const bracketContentMatch = cleanedText.match(/\[(.*)\]/s);
          if (bracketContentMatch && bracketContentMatch[1]) {
            console.log('Attempting to parse bracketed content...');
            // Try to fix incomplete or malformed JSON objects within the array
            let fixedContent = '[' + bracketContentMatch[1]
              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Quote all property names
              .replace(/:\s*'([^']*)'/g, ':"$1"')                  // Replace single quotes with double quotes
              .replace(/:\s*"([^"]*)'/g, ':"$1"')                  // Fix mismatched quotes (open double, close single)
              .replace(/:\s*'([^"]*)"/g, ':"$1"')                  // Fix mismatched quotes (open single, close double)
              .replace(/,(\s*[}\]])/g, '$1')                       // Remove trailing commas
              + ']';
            
            try {
              questions = JSON.parse(fixedContent);
              console.log(`Successfully parsed bracketed content with ${questions.length} questions`);
            } catch (bracketFixError) {
              console.error('Bracket content parsing failed:', bracketFixError.message);
              throw bracketFixError; // Let the outer catch handle it with manual parsing
            }
          } else {
            throw initialParseError; // No bracketed content found, let the next fallback handle it
          }
        }
        
      } catch (parseError) {
        console.error('All automatic JSON parsing failed:', parseError.message);
        console.log('Attempting character-by-character JSON repair...');
        
        // MANUAL PARSING FALLBACK: Extract and repair individual question objects
        try {
          // Look for patterns that resemble question objects
          const objectMatches = cleanedText.match(/\{[^{}]*question[^{}]*options[^{}]*correctAnswer[^{}]*\}/g);
          
          if (objectMatches && objectMatches.length > 0) {
            console.log(`Found ${objectMatches.length} potential question objects, parsing individually...`);
            
            questions = [];
            for (const objStr of objectMatches) {
              try {
                // Advanced JSON repair for individual objects
                let fixedJson = objStr
                  .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure all keys are properly quoted
                  .replace(/:\s*'([^']*)'/g, ':"$1"')                  // Replace single quotes with double quotes for string values
                  .replace(/([^\\])"/g, '$1\\"')                       // Escape unescaped quotes within values
                  .replace(/"\s*:\s*"/g, '":"')                        // Fix spacing in key-value pairs
                  .replace(/"\s*,\s*"/g, '","')                        // Fix spacing in arrays
                  .replace(/,\s*}/g, '}');                             // Remove trailing commas
                
                // Make sure it starts and ends properly
                if (!fixedJson.startsWith('{')) fixedJson = '{' + fixedJson;
                if (!fixedJson.endsWith('}')) fixedJson = fixedJson + '}';
                
                console.log('Repaired individual question object:', fixedJson);
                
                try {
                  const qObj = JSON.parse(fixedJson);
                  questions.push(qObj);
                } catch (e) {
                  console.log(`Failed to parse individual question even after repair: ${e.message}`);
                }
              } catch (e) {
                console.log(`Error processing individual question: ${e.message}`);
              }
            }
            
            if (questions.length === 0) {
              throw new Error('Failed to parse any individual questions');
            }
            
            console.log(`Successfully parsed ${questions.length} individual questions`);
          } else {
            throw new Error('No question objects found in the text');
          }
        } catch (manualParseError) {
          console.error('Manual parsing failed:', manualParseError.message);
          
          // FINAL FALLBACK: Generate default questions when all parsing attempts fail
          console.log('All parsing strategies failed. Generating default questions...');
          
          questions = [];
          for (let i = 0; i < actualNumberOfQuestions; i++) {
            questions.push({
              question: `Question ${i+1} about ${course.name}`,
              options: [
                `A. Option A for question ${i+1}`,
                `B. Option B for question ${i+1}`,
                `C. Option C for question ${i+1}`,
                `D. Option D for question ${i+1}`
              ],
              correctAnswer: "A" // Default to A
            });
          }
          console.log('Generated default questions as last resort');
        }
      }
      
      // Format and validate each question with extra safeguards
      console.log('Formatting and validating questions...');
      const formattedQuestions = [];
      
      // Process each question individually to avoid failing the entire batch
      if (Array.isArray(questions)) {
        for (let i = 0; i < Math.min(questions.length, actualNumberOfQuestions); i++) {
          try {
            const q = questions[i];
            
            // Skip invalid questions
            if (!q || typeof q !== 'object') {
              console.warn(`Skipping invalid question at index ${i}:`, q);
              continue;
            }
            
            // Ensure question text exists
            const questionText = q.question?.trim() || `Question ${i + 1}`;
            
            // Process options with defensive programming
            let options = [];
            if (Array.isArray(q.options) && q.options.length > 0) {
              // Process existing options
              options = q.options
                .filter(opt => opt && typeof opt === 'string')
                .map(opt => opt.trim());
            }
            
            // Ensure we have exactly 4 options
            while (options.length < 4) {
              options.push(`Option ${String.fromCharCode(65 + options.length)}`);
            }
            options = options.slice(0, 4); // Limit to 4 options
            
            // Ensure each option starts with the correct letter prefix (A., B., etc.)
            options = options.map((opt, idx) => {
              const prefix = String.fromCharCode(65 + idx) + '. ';
              if (opt.startsWith(prefix) || opt.startsWith(String.fromCharCode(65 + idx) + '.')) {
                return opt;
              } else if (opt.match(/^[A-D][\.\)]\s/)) {
                // Option already has a letter prefix but might be in a different format
                return prefix + opt.replace(/^[A-D][\.\)]\s/, '');
              } else {
                return prefix + opt;
              }
            });
            
            // Process correctAnswer with multiple fallback strategies
            let correctAnswer = null;
            
            if (q.correctAnswer) {
              // Parse and normalize the correctAnswer
              let parsedAnswer = q.correctAnswer.toString().trim().toUpperCase();
              
              // Handle various formats (A, A., A:, "A", etc.)
              if (parsedAnswer.match(/^["']?([A-D])["']?[.):]?$/)) {
                parsedAnswer = parsedAnswer.match(/([A-D])/)[1];
              }
              
              // Validate that it's a single letter from A-D
              if (/^[A-D]$/.test(parsedAnswer)) {
                correctAnswer = parsedAnswer;
              }
            }
            
            // If no valid correctAnswer, use deterministic selection based on index
            if (!correctAnswer) {
              // Use a deterministic selection to distribute answers
              const possibleAnswers = ['A', 'B', 'C', 'D'];
              const answerIndex = i % 4; // Simple rotation
              correctAnswer = possibleAnswers[answerIndex];
              console.warn(`Assigned deterministic answer ${correctAnswer} for question: "${questionText.substring(0, 30)}..."`);
            }
            
            // Add the processed question to our results
            formattedQuestions.push({
              id: i + 1,
              question: questionText,
              options: options,
              correctAnswer: correctAnswer,
              timePerQuestion: Number(timePerQuestion) || 30
            });
            
            console.log(`Successfully processed question ${i + 1}`);
          } catch (formatError) {
            console.error(`Error formatting question ${i + 1}:`, formatError.message);
            // Continue processing other questions
          }
        }
      }
      
      // Ensure we have at least one question
      if (formattedQuestions.length === 0) {
        console.error('No valid questions could be formatted');
        
        // Return default questions as absolute last resort
        for (let i = 0; i < actualNumberOfQuestions; i++) {
          formattedQuestions.push({
            id: i + 1,
            question: `Question ${i+1} about ${course.name}`,
            options: [
              `A. Option A for question ${i+1}`,
              `B. Option B for question ${i+1}`,
              `C. Option C for question ${i+1}`,
              `D. Option D for question ${i+1}`
            ],
            correctAnswer: "A", // Default to A
            timePerQuestion: Number(timePerQuestion) || 30
          });
        }
        console.log('Added default questions due to formatting failures');
      }

      // Perform final validation and return results
      console.log(`Quiz generation completed in ${Date.now() - startTime}ms with ${formattedQuestions.length} questions`);
      return res.json(formattedQuestions);
      
    } catch (error) {
      console.error('Quiz Generation Error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Failed to generate quiz',
          error: error.message || 'An unexpected error occurred during quiz generation'
        });
      }
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating quiz',
        error: error.message || 'An unexpected error occurred'
      });
    }
  }
});

// Dashboard endpoint
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get user's quiz attempts
    const quizAttempts = await Quiz.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(5)
      .populate('courseId', 'name');

    // Get user's course progress
    const courseProgress = await Course.aggregate([
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'courseId',
          as: 'quizzes'
        }
      },
      {
        $project: {
          courseName: '$name',
          quizzesTaken: { $size: '$quizzes' },
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$quizzes' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $sum: '$quizzes.score' },
                      { $sum: '$quizzes.totalQuestions' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          },
          progress: {
            $cond: {
              if: { $gt: [{ $size: '$quizzes' }, 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$quizzes' }, 10] }, // Assuming 10 quizzes per course
                  100
                ]
              },
              else: 0
            }
          }
        }
      }
    ]);

    // Get user's AI usage
    const aiUsage = await AIUsage.findOne({ userId: req.user.id }) || {
      tokensUsed: 0,
      conversationCount: 0,
      lastUsed: null
    };

    // Get user's achievements
    const achievements = await Achievement.find({ userId: req.user.id });

    // Format quiz attempts
    const recentQuizzes = quizAttempts.map(quiz => ({
      courseId: quiz.courseId._id,
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      date: quiz.date,
      difficulty: quiz.difficulty
    }));

    res.json({
      recentQuizzes,
      courseProgress: courseProgress.map(course => ({
        courseId: course._id,
        courseName: course.courseName,
        progress: Math.round(course.progress),
        quizzesTaken: course.quizzesTaken,
        averageScore: Math.round(course.averageScore * 10) / 10
      })),
      aiUsage: {
        tokensUsed: aiUsage.tokensUsed,
        lastUsed: aiUsage.lastUsed,
        conversationCount: aiUsage.conversationCount
      },
      achievements: achievements.map(achievement => ({
        id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earned: achievement.earned,
        earnedDate: achievement.earnedDate
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Quiz History endpoint
app.get('/api/quiz/history', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching quiz history for user:', req.user.id);
    
    // Get quiz history with populated course names
    const quizHistory = await Quiz.find({ userId: req.user.id })
      .populate('courseId', 'name')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    console.log('Found quiz history entries:', quizHistory.length);

    // Format the quiz history
    const formattedHistory = quizHistory.map(quiz => ({
      id: quiz._id.toString(),
      courseId: quiz.courseId._id.toString(),
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      difficulty: quiz.difficulty,
      date: quiz.date,
      timeSpent: quiz.timeSpent,
      percentageScore: (quiz.score / quiz.totalQuestions) * 100
    }));

    console.log('Formatted quiz history:', formattedHistory);
    res.json(formattedHistory);
  } catch (error) {
    console.error('Error in /api/quiz/history:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz history',
      error: error.message 
    });
  }
});

// Save quiz result endpoint
app.post('/api/quiz/save-result', authenticateToken, async (req, res) => {
  try {
    console.log('Saving quiz result, request received at:', new Date().toISOString());
    
    const {
      courseId,
      questions,
      score,
      totalQuestions,
      difficulty,
      timeSpent,
      timePerQuestion
    } = req.body;

    console.log('Quiz save payload courseId:', courseId);
    console.log('Quiz save request user ID:', req.user.id);

    // Enhanced validation for required fields
    if (!courseId) {
      console.error('Missing courseId in save-result request');
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Course ID is required'
      });
    }

    if (!questions || !Array.isArray(questions)) {
      console.error('Missing or invalid questions array in save-result request');
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Questions array is required'
      });
    }

    if (score === undefined || totalQuestions === undefined || !difficulty) {
      console.error('Missing quiz metadata in save-result request');
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Please provide all required quiz data'
      });
    }

    // Verify course exists before creating quiz record
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        console.error(`Course with ID ${courseId} not found`);
        return res.status(404).json({
          message: 'Course not found',
          error: `No course found with ID: ${courseId}`
        });
      }
      console.log(`Found course: ${course.name} (${course._id})`);
    } catch (courseError) {
      console.error('Error finding course:', courseError);
      return res.status(500).json({
        message: 'Error validating course',
        error: courseError.message
      });
    }

    // Create new quiz with more defensive approach
    console.log('Creating new quiz record');
    const quiz = new Quiz({
      userId: req.user.id,
      courseId: courseId, // We know this exists now
      score: Number(score),
      totalQuestions: Number(totalQuestions),
      difficulty: difficulty,
      questions: questions.map(q => ({
        question: q.question || 'Unknown question',
        correctAnswer: q.correctAnswer || 'A',
        userAnswer: q.userAnswer || q.answer || null,
        isCorrect: q.isCorrect || q.correct || false,
        timeSpent: Number(timePerQuestion) || 0
      })),
      timeSpent: Number(timeSpent) || 0,
      date: new Date()
    });

    console.log('Saving quiz to database');
    await quiz.save();
    console.log('Quiz saved successfully with ID:', quiz._id);

    // Get updated quiz history with explicit error handling
    let updatedHistory = [];
    let formattedHistory = [];
    
    try {
      console.log('Fetching updated quiz history');
      updatedHistory = await Quiz.find({ userId: req.user.id })
        .populate('courseId', 'name')
        .sort({ date: -1 })
        .limit(10)
        .lean();
      
      console.log(`Found ${updatedHistory.length} history entries`);
      
      // Use safer mapping with null checks
      formattedHistory = updatedHistory.map(quizEntry => {
        // Handle potentially null courseId
        const courseName = quizEntry.courseId ? quizEntry.courseId.name : 'Unknown Course';
        const courseIdValue = quizEntry.courseId ? quizEntry.courseId._id : null;
        
        return {
          id: quizEntry._id,
          courseId: courseIdValue,
          courseName: courseName,
          score: quizEntry.score,
          totalQuestions: quizEntry.totalQuestions,
          difficulty: quizEntry.difficulty,
          date: quizEntry.date,
          timeSpent: quizEntry.timeSpent || 0,
          percentageScore: quizEntry.score && quizEntry.totalQuestions ? 
            (quizEntry.score / quizEntry.totalQuestions) * 100 : 0
        };
      });
    } catch (historyError) {
      console.error('Error fetching quiz history:', historyError);
      // Continue without history rather than failing the entire request
      formattedHistory = [];
    }

    console.log('Sending successful response');
    res.json({
      message: 'Quiz saved successfully',
      quiz: formattedHistory[0] || {
        id: quiz._id,
        score: score,
        totalQuestions: totalQuestions,
        difficulty: difficulty
      },
      history: formattedHistory
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    // More specific error message based on the error type
    let errorMessage = 'Error saving quiz';
    let details = error.message || 'An unexpected error occurred';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Quiz data validation failed';
      details = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format';
      details = `Invalid ${error.path}: ${error.value}`;
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to calculate improvement from previous attempt
function calculateImprovement(currentQuiz, allQuizzes) {
  // Find the previous quiz for the same course
  const previousQuiz = allQuizzes.find(q => 
    q.courseId._id.toString() === currentQuiz.courseId._id.toString() &&
    q.date < currentQuiz.date
  );

  if (!previousQuiz) return null;

  const currentPercentage = (currentQuiz.score / currentQuiz.totalQuestions) * 100;
  const previousPercentage = (previousQuiz.score / previousQuiz.totalQuestions) * 100;

  return Math.round(currentPercentage - previousPercentage);
}

// Quiz history endpoints
app.get('/api/quiz-history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify that the requesting user matches the userId parameter
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to quiz history' });
    }

    // Use the existing mongoose connection instead of creating a new one
    const quizHistory = await Quiz.find({ userId })
      .sort({ date: -1 })
      .lean();

    // Calculate total quizzes
    const totalQuizzes = await Quiz.countDocuments({ userId });

    // Calculate statistics
    const stats = await Quiz.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageScore: {
            $avg: { $multiply: [{ $divide: ['$score', '$totalQuestions'] }, 100] }
          },
          totalQuizzes: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const formattedHistory = quizHistory.map(quiz => ({
      ...quiz,
      scorePercentage: Math.round((quiz.score / quiz.totalQuestions) * 100)
    }));

    res.json({
      history: formattedHistory,
      totalQuizzes,
      stats: stats[0] || { averageScore: 0, totalQuizzes: 0 }
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz history',
      details: error.message 
    });
  }
});

// Quiz statistics endpoint
app.get('/api/quiz/stats', async (req, res) => {
  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db('test');
    const quizzes = db.collection('quizzes');
    
    // Use MongoDB aggregation to calculate statistics
    const stats = await quizzes.aggregate([
      {
        $facet: {
          totalQuizzes: [
            { $count: 'count' }
          ],
          averageScore: [
            {
              $group: {
                _id: null,
                averageScore: {
                  $avg: {
                    $multiply: [
                      { $divide: ['$score', '$totalQuestions'] },
                      100
                    ]
                  }
                }
              }
            }
          ],
          latestQuiz: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            {
              $project: {
                latestScore: {
                  $multiply: [
                    { $divide: ['$score', '$totalQuestions'] },
                    100
                  ]
                }
              }
            }
          ]
        }
      }
    ]).toArray();

    console.log('MongoDB aggregation result:', stats[0]); // Debug log

    const result = {
      totalQuizzes: stats[0].totalQuizzes[0]?.count || 0,
      averageScore: Math.round(stats[0].averageScore[0]?.averageScore || 0),
      latestScore: Math.round(stats[0].latestQuiz[0]?.latestScore || 0)
    };

    console.log('Final calculated stats:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/quiz/stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz statistics',
      details: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Update AI assist endpoint to use Groq API
app.post('/api/ai/assist', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const lastMessage = messages[messages.length - 1];
    console.log('Processing message:', lastMessage.content.substring(0, 100));

    // Check if the message is asking about AI identity
    const identityQuestionPattern = /which ai|what ai|are you groq|who are you/i;
    if (identityQuestionPattern.test(lastMessage.content)) {
      console.log('Identity question detected, providing custom response');
      return res.json({ 
        message: "Hey there! 👋\n\nI'm Epsilora AI, your educational assistant! I'm here to help you learn and grow. How can I assist you today? 😊"
      });
    }

    // Enhanced prompt to encourage more interactive and colorful responses
    const enhancedPrompt = `
You are an engaging and helpful AI assistant for an educational platform. Please provide a response that is:
1. Well-formatted with markdown
2. Uses emojis where appropriate
3. Includes colorful formatting (using markdown)
4. Structures information in an easy-to-read way
5. Uses bullet points, numbered lists, or tables when relevant
6. Highlights important information with bold or italics
7. Uses code blocks with syntax highlighting when showing code

Here's the user's message: ${lastMessage.content}

Remember to:
- Use **bold** for emphasis
- Add relevant emojis
- Structure your response with clear headings
- Use \`code\` formatting for technical terms
- Include examples in \`\`\`language\n code blocks \`\`\` when relevant
`;

    try {
      // Call Groq API instead of Gemini
      const text = await callGroqAPI(enhancedPrompt, 0.7, 2048);
      
      console.log('Responding with text of length:', text.length);
      res.json({ message: text });
    } catch (aiError) {
      console.error('Error generating content with Groq:', aiError);
      return res.status(500).json({ 
        error: 'Failed to generate content', 
        details: aiError.toString(),
        suggestion: 'The AI service may be experiencing issues or the request format is invalid'
      });
    }
  } catch (error) {
    console.error('Error in AI assist endpoint:', error);
    res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

// Update models listing endpoint to use Groq API
app.get('/api/list-models', async (req, res) => {
  console.log('Attempting to list available models...');
  
  // Get origin from the request
  const origin = req.headers.origin;
  
  // Only set CORS headers if origin is valid
  if (origin) {
    const allowedOrigins = [
      'https://epsilora.vercel.app',
      'https://epsilora-chaman-ss-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173'
    ];
    
    // Check if origin is allowed or matches pattern
    if (allowedOrigins.includes(origin) || 
        /^https:\/\/epsilora-.*-chaman-ss-projects\.vercel\.app$/.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  try {
    // Return available Groq models
    return res.json({ 
      version: 'v1', 
      models: [
        {
          name: "gemma2-9b-it",
          displayName: "Gemma 2 9B Instruction Tuned",
          description: "Groq's gemma2-9b-it model"
        }
      ],
      message: 'Using Groq API with gemma2-9b-it model'
    });
  } catch (error) {
    console.error('General error listing models:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      message: 'Unexpected error while listing models'
    });
  }
});

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      details: err.message
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({ 
      message: 'Database error',
      details: 'There was an issue connecting to the database'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong on the server',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Error handling middleware
app.use(errorHandler);

app.use('/api/progress', progressRoutes);

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless deployment
export default app;

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    // Update to use Groq instead of Gemini
    groqApi: GROQ_API_KEY ? 'configured' : 'not configured'
  };
  
  res.status(200).json(health);
});

// Root endpoint for basic verification
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Epsilora Backend API is running',
    timestamp: new Date().toISOString()
  });
});
