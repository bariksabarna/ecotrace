import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json({ limit: '10kb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../dist')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are EcoBot, an India-specific carbon footprint advisor.
You help users understand and reduce their daily carbon footprint using data accurate for India.
Key facts: India's grid emission factor is 0.716 kg CO₂/kWh (CEA 2023). 
The average Indian emits about 1.9 tonnes CO₂/month. 
Common Indian transport: CNG auto, metro, state buses, two-wheelers.
Be concise (2–4 sentences), practical, encouraging, and India-specific.
When listing tips, give max 5 bullet points.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Sanitize
    const lastMessage = String(messages.at(-1)?.content ?? '').slice(0, 500);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content).slice(0, 500) }]
    }));
    
    const chat = model.startChat({ 
      systemInstruction: SYSTEM_PROMPT,
      history 
    });
    
    const contextStr = context 
      ? `[User context: today = ${context.todayTotal ?? '?'} kg CO₂, highest category = ${context.topCategory ?? '?'}]\n`
      : '';
    
    const result = await chat.sendMessage(contextStr + lastMessage);
    res.json({ text: result.response.text() });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: 'AI service temporarily unavailable. Try again in a moment.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`EcoTrace server running on :${PORT}`));
