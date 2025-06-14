# Epsilora-Groq Backend

Backend for the Epsilora-Groq AI-powered Learning Platform.

## Environment Setup

The backend requires several environment variables to function properly. 

### Setting Up Environment Variables

1. Copy the `.env.example` file to create a new `.env` file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and replace placeholder values with your actual credentials:
   - **MongoDB URI**: Connect to your MongoDB database
   - **JWT Secret**: Create a strong random string for token security
   - **Groq API Key**: Get your API key from [Groq Console](https://console.groq.com/)

### Required Environment Variables

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/epsilora?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# API Keys
GROQ_API_KEY=your_groq_api_key_here

# Application Settings
MAX_QUESTION_COUNT=50

# CORS Settings
ALLOWED_ORIGINS=https://epsilora-groq.vercel.app,http://localhost:3000,http://localhost:5173
```

## Testing API Keys

Use the `test-groq.js` script to verify that your Groq API key is working correctly:

```bash
node test-groq.js
```

You should see a successful response from the Groq API if your key is configured correctly.
