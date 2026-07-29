import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Assistant endpoint for schedule queries or LINE announcements
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY ยังไม่ได้กำหนดใน Secrets/Environment',
        });
      }

      const { prompt, contextData, mode } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      let systemInstruction = `คุณคือผู้ช่วยจัดการตารางกะงานพนักงานของร้านค้า (BSM, PIA, MSC) 
ตอบเป็นภาษาไทยอย่างสุภาพ กระชับ ถูกต้องตามข้อมูลตารางงานที่ส่งให้`;

      if (mode === 'line_draft') {
        systemInstruction += `\nหน้าที่ของคุณคือร่างข้อความสรุปตารางกะสำหรับส่งในกลุ่ม LINE พนักงาน ใช้ emoji ตกแต่งให้อ่านง่าย เป็นระเบียบ ชัดเจน`;
      } else if (mode === 'swap_draft') {
        systemInstruction += `\nหน้าที่ของคุณคือเขียนข้อความขอสลับกะหรือแจ้งเปลี่ยนกะอย่างเป็นทางการสำหรับสื่อสารภายในทีม`;
      }

      const fullPrompt = `${systemInstruction}\n\nข้อมูลบริบทตารางงาน:\n${JSON.stringify(contextData, null, 2)}\n\nคำขอของผู้ใช้: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล AI' });
    }
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
