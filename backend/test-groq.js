import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

// Function to call Groq API
const callGroqAPI = async (prompt, temperature = 0.7, maxTokens = 100) => {
  try {
    console.log('Calling Groq API with prompt:', prompt);
    
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

// Test the API
const testGroqAPI = async () => {
  console.log('===== Testing Groq API =====');
  console.log(`Using API Key: ${GROQ_API_KEY.substring(0, 10)}...`);
  
  try {
    const response = await callGroqAPI('Hello, what is your name?');
    console.log('API Response:', response);
    console.log('\n✅ Test SUCCESSFUL! The Groq API is working correctly.');
  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
  }
};

// Run the test
testGroqAPI(); 