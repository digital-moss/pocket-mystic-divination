import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit for base64 photo transfers
app.use(express.json({ limit: '25mb' }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// AI Vision Card Analyzer endpoint
app.post('/api/analyze-card', async (req, res) => {
  try {
    const { image, index } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image base64 data required' });
    }

    const ai = getAi();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Strip data prefix if present (e.g., data:image/jpeg;base64,...)
    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].replace('data:', '') : 'image/jpeg';

    const prompt = `Analyze this oracle / tarot / divination card image.
Return a clean JSON object with:
- "name": Concise Title or Archetype of the card (e.g., "The Star", "Othala", "Ace of Chalices", "Serpent of Wisdom")
- "keywords": An array of 4 to 6 concise, powerful word associations (e.g. ["Hope", "Healing", "Renewal", "Faith"])
- "meaningUpright": 1-2 sentence inspiring divination interpretation
- "meaningReversed": 1-2 sentence shadow or reflective warning
- "element": Corresponding element ("Fire", "Water", "Air", "Earth", "Spirit", or "Ether")

Return ONLY valid JSON matching this schema:
{
  "name": string,
  "keywords": string[],
  "meaningUpright": string,
  "meaningReversed": string,
  "element": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg'
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return res.status(500).json({ error: 'Empty AI response' });
    }

    const parsed = JSON.parse(responseText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/analyze-card:', error);
    return res.status(500).json({ error: error?.message || 'Failed to analyze card' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pocket Oracle server listening on port ${PORT}`);
  });
}

startServer();
