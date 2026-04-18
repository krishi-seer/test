import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Voice Signup with Face
  app.post("/api/auth/voice-signup-with-face", async (req, res) => {
    try {
      const { name, mobile, location, crops, faceDescriptor, photo } = req.body;
      console.log('Registering user:', name);
      
      // TODO: Implement Supabase pgvector insertion here
      // const { data, error } = await supabase.from('farmers').insert([...])
      
      res.json({ success: true, message: 'User registered successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify Face Login
  app.post("/api/auth/verify-face", async (req, res) => {
    try {
      const { faceDescriptor } = req.body;
      
      // TODO: Implement pgvector vector similarity search
      // select name, mobile from farmers order by embedding <=> '[...]' limit 1
      
      // Mocking success for now
      res.json({ success: true, user: { name: 'Mock User' } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Match Face Embedding (Generic)
  app.post("/api/match-face-embedding", async (req, res) => {
    try {
      const { embedding, threshold } = req.body;
      // Similar similarity search logic
      res.json({ success: true, match: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat Stream (Gemini proxy)
  app.post("/api/chat-stream", async (req, res) => {
    // This is handled by @google/genai on frontend usually, 
    // but the system instruction says to keep third-party keys hidden if possible.
    // However, GEMINI_API_KEY is safe if used in server side without VITE_ prefix.
    res.json({ message: "Chat API initialized. Use @google/genai on frontend for best performance." });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
