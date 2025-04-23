// API Check Tool for Vercel Deployment
// Tests MongoDB and Groq API connections

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Groq API key
const GROQ_API_KEY = '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';

async function main() {
  console.log('===== API Connection Test =====');
  console.log('Environment:', process.env.NODE_ENV || 'not set');
  console.log('Test started at:', new Date().toISOString());
  console.log('------------------------------');

  // Check MongoDB Connection
  const checkMongoConnection = async () => {
    console.log('\nChecking MongoDB Connection...');
    // Log the MongoDB URI (partially masked)
    console.log('MongoDB URI:', process.env.MONGODB_URI ?
      process.env.MONGODB_URI.substring(0, 20) + '...' :
      'Not set');

    if (!process.env.MONGODB_URI) {
      console.error('❌ MongoDB URI not found in environment variables');
      return false;
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connection successful');
      await mongoose.connection.close();
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      return false;
    }
  };

  // Check Groq API
  const checkGroqAPI = async () => {
    console.log('\nChecking Groq API Key...');

    if (!GROQ_API_KEY) {
      console.error('❌ Groq API Key not found in environment variables');
      return false;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        console.log('✅ Groq API connection successful');
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Groq API response error:', errorData.error?.message || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Groq API request failed:', error.message);
      return false;
    }
  };

  // Run checks
  console.log('Running connection checks...');
  const mongoCheck = await checkMongoConnection();
  const groqCheck = await checkGroqAPI();

  // Final report
  console.log('\n===== Connection Test Results =====');
  console.log('MongoDB:', mongoCheck ? '✅ PASSED' : '❌ FAILED');
  console.log('Groq API:', groqCheck ? '✅ PASSED' : '❌ FAILED');
  
  if (mongoCheck && groqCheck) {
    console.log('\n✅ All connection tests PASSED! Your API is ready to use.');
  } else {
    console.log('\n❌ Some connection tests FAILED. Please check the errors above.');
  }
  
  process.exit(mongoCheck && groqCheck ? 0 : 1);
}

main().catch(error => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
}); 