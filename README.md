# ✨ Epsilora-Groq ✨

> AI-Powered Learning Platform with Groq Integration

---

## 📌 Problem Statement

**Problem Statement: Transforming Educational Experiences with AI**

Addressing the challenge of making online learning more interactive, personalized, and effective through AI-powered course management.

---

## 🎯 Objective

Epsilora-Groq is an intelligent learning management system powered by Groq's AI that helps users organize, track, and optimize their online learning journey. This platform integrates Groq's `gemma2-9b-it` model to transform passive online courses into interactive, personalized learning experiences with automated course analysis, smart quiz generation, and AI-powered assistance.

---

## 🧠 Approach

### Our Approach:  
- We chose this problem because online learning often lacks engagement and personalization
- Key challenges addressed include automated content extraction, intelligent quiz generation, and progress tracking
- We pivoted from using a different LLM to Groq's model for better performance and response times

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB, JWT
- **AI Integration**: Groq API (gemma2-9b-it model)
- **Deployment**: Vercel, Environment Variables

### Sponsor Technologies Used:
- ✅ **Groq:** Integrated Groq's gemma2-9b-it model for all AI functionalities including course analysis, quiz generation, and AI assistance

<div align="center">
  <img src="https://raw.githubusercontent.com/danielcranney/readme-generator/main/public/icons/skills/react-colored.svg" width="50" height="50" alt="React" />
  <img src="https://raw.githubusercontent.com/danielcranney/readme-generator/main/public/icons/skills/typescript-colored.svg" width="50" height="50" alt="TypeScript" />
  <img src="https://raw.githubusercontent.com/danielcranney/readme-generator/main/public/icons/skills/nodejs-colored.svg" width="50" height="50" alt="NodeJS" />
  <img src="https://raw.githubusercontent.com/danielcranney/readme-generator/main/public/icons/skills/mongodb-colored.svg" width="50" height="50" alt="MongoDB" />
  <img src="https://raw.githubusercontent.com/danielcranney/readme-generator/main/public/icons/skills/tailwindcss-colored.svg" width="50" height="50" alt="TailwindCSS" />
</div>

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🧠 AI Course Analysis</h3>
      <p>Automatically extracts course details from any URL using Groq's powerful AI, including learning objectives, skills, and milestones.</p>
    </td>
    <td width="50%">
      <h3>📊 Visual Progress Tracking</h3>
      <p>Interactive dashboards show your progress across all courses with beautiful visualizations.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📝 Smart Quiz Generation</h3>
      <p>Auto-generates quizzes from your course content using Groq's gemma2-9b-it model with adaptive difficulty levels.</p>
    </td>
    <td width="50%">
      <h3>🤖 AI Learning Assistant</h3>
      <p>24/7 AI helper powered by Groq answers questions about your courses and explains difficult concepts.</p>
    </td>
  </tr>
</table>

<details>
  <summary><b>🔍 Course Extraction with Groq AI</b> - Import any online course with one click</summary>
  <ul>
    <li>Paste any course URL and let Groq AI analyze it</li>
    <li>Automatically extracts course name, provider, duration, and pace</li>
    <li>Identifies learning objectives, prerequisites, and key skills</li>
    <li>Creates smart milestones with realistic deadlines</li>
  </ul>
</details>

<details>
  <summary><b>📈 Progress Analytics</b> - Track your learning journey</summary>
  <ul>
    <li>Visual dashboards show completion rates across all courses</li>
    <li>Track milestone achievements and learning patterns</li>
    <li>Identify knowledge gaps and strengths</li>
    <li>Receive personalized recommendations for improvement</li>
  </ul>
</details>

<details>
  <summary><b>🧩 Groq-Powered Quiz System</b> - Reinforce your knowledge</summary>
  <ul>
    <li>AI-generated quizzes based on course content using gemma2-9b-it model</li>
    <li>Adaptive difficulty levels that grow with your skills</li>
    <li>Immediate feedback and explanations</li>
    <li>Spaced repetition for maximum retention</li>
  </ul>
</details>

<details>
  <summary><b>💬 Groq AI Assistant</b> - Your 24/7 learning companion</summary>
  <ul>
    <li>Ask questions about any course concept</li>
    <li>Get explanations tailored to your learning style</li>
    <li>Request study summaries and key points</li>
    <li>Help with planning your learning schedule</li>
  </ul>
</details>

---

## 📽️ Demo & Deliverables

- **Demo Video Link:** [Demo Video](https://youtu.be/example)
- **Pitch Deck Link:** [Pitch Deck](https://docs.google.com/presentation/d/example)

---

## ✅ Tasks & Bonus Checklist

- ✅ **All members of the team completed the mandatory task - Followed at least 2 of our social channels and filled the form**
- ✅ **All members of the team completed Bonus Task 1 - Sharing of Badges and filled the form**
- ✅ **All members of the team completed Bonus Task 2 - Signing up for Sprint.dev and filled the form**

---

## 🧪 How to Run the Project

### Requirements:
- Node.js (LTS version)
- MongoDB account
- Groq API key

### Local Setup:
```bash
# Clone the repository
git clone https://github.com/chaman2003/epsilora-groq.git

# Install dependencies
cd epsilora-groq
npm install

cd backend
npm install

# Set up environment variables
# Create a .env file in the root directory
# Add the following:
# GROQ_API_KEY=your_groq_api_key
# MONGODB_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret

# Start development server
# In the root directory
npm run dev

# In the backend directory (in a separate terminal)
cd backend
npm run dev

# Open in browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Testing the Installation:

After setting up the environment, you can run the API check tool to verify that everything is working correctly:

```bash
cd backend
node api-check.js
```

This will check:
- MongoDB connection
- Groq API integration

### Environment Variables:

For local development, create a `.env` file with the following variables:

```env
# Frontend (.env in root directory)
VITE_API_URL=http://localhost:3001
VITE_GROQ_API_KEY=your_groq_api_key

# Backend (.env in backend directory)
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

---

## 🔌 Groq API Integration

Epsilora-Groq uses the Groq API exclusively for all AI functions. The integration is done with the gemma2-9b-it model, which provides excellent performance for educational use cases.

### Endpoints that use Groq AI:

| Endpoint | Purpose | AI Model |
|----------|---------|----------|
| `/api/ai/assist` | AI assistant for answering questions | gemma2-9b-it |
| `/api/quiz/generate` | Generate quizzes from course content | gemma2-9b-it |
| `/api/courses` | Extract course information from URLs | gemma2-9b-it |

### Example Groq API call:

```javascript
const callGroqAPI = async (prompt, temperature = 0.7, maxTokens = 2048) => {
  try {
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
```

---

## 📱 How It Works

<div class="workflow" align="center">
  <table>
    <tr>
      <td align="center">⬇️</td>
      <td align="center">⬇️</td>
      <td align="center">⬇️</td>
      <td align="center">⬇️</td>
    </tr>
    <tr>
      <td align="center"><b>Add Course URL</b></td>
      <td align="center"><b>Groq AI Analysis</b></td>
      <td align="center"><b>Learning Path</b></td>
      <td align="center"><b>Track Progress</b></td>
    </tr>
  </table>
</div>

1. **Enter Course URL** - Paste any course URL from popular platforms
2. **Groq AI Extracts Information** - Our AI analyzes and structures the course content
3. **Customize Your Path** - Adjust milestones and schedule to fit your needs
4. **Track Your Progress** - Monitor your learning journey with visual analytics
5. **Take Smart Quizzes** - Test your knowledge with AI-generated assessments
6. **Get AI Assistance** - Ask questions and get personalized help anytime

---

## 🧬 Future Scope

- **Mobile Application**: Develop a native mobile app for iOS and Android
- **Offline Access**: Implement offline mode for studying without internet connection
- **Multi-Language Support**: Translate content and interface to multiple languages
- **Advanced Analytics**: Deeper insights into learning patterns and retention
- **Collaborative Learning**: Add features for group study and peer assessments

---

## 📎 Resources / Credits

- [Groq API Documentation](https://console.groq.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Node.js](https://nodejs.org)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🏁 Final Words

We are excited to present Epsilora-Groq as our contribution to transforming online learning experiences. Our team faced significant challenges integrating the Groq API for quiz generation and course analysis, but the results have been worth the effort. We believe this platform demonstrates the potential of AI to make education more engaging, personalized, and effective.

---

<div align="center">
  <p>
    <b>Ready to transform your learning journey with Groq AI?</b><br/>
    Star ⭐ this repo and watch for updates!
  </p>
  
  [![Star this repo](https://img.shields.io/github/stars/chaman2003/epsilora-groq?style=social)](https://github.com/chaman2003/epsilora-groq/)
</div>


