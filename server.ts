import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OVERRIDES_FILE = path.join(process.cwd(), 'schedule_overrides.json');

function loadOverrides(): Record<string, any> {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const data = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading schedule_overrides.json:', e);
  }
  return {};
}

function saveOverrides(data: Record<string, any>) {
  try {
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing schedule_overrides.json:', e);
  }
}

let currentOverrides = loadOverrides();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Schedule Overrides Persistence API for cross-user sync
  app.get('/api/schedule', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ overrides: currentOverrides });
  });

  app.post('/api/schedule', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { overrides, updatedAssignment, resetAssignmentId } = req.body;
    if (overrides !== undefined) {
      currentOverrides = overrides;
    } else if (updatedAssignment) {
      currentOverrides = {
        ...currentOverrides,
        [updatedAssignment.id]: updatedAssignment,
      };
    } else if (resetAssignmentId) {
      const copy = { ...currentOverrides };
      delete copy[resetAssignmentId];
      currentOverrides = copy;
    }
    saveOverrides(currentOverrides);
    res.json({ success: true, overrides: currentOverrides });
  });

  app.post('/api/schedule/reset', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    currentOverrides = {};
    saveOverrides(currentOverrides);
    res.json({ success: true, overrides: {} });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
