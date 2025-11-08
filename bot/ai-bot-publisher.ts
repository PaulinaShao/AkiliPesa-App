import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import puppeteer from 'puppeteer';

const PORT = Number(process.env.BOT_PORT || 3311);
const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_BOT_HTML = path.join(process.cwd(), 'bot', 'bot-page.html');

if (!AGORA_APP_ID) {
  console.error('Missing AGORA_APP_ID in env');
  process.exit(1);
}

const app = express();
app.use(express.json());

// serve the HTML that hosts the Agora Web SDK
app.get('/bot', (_req, res) => {
  res.sendFile(AGORA_BOT_HTML);
});

// Endpoint your Functions call to ask the bot to join a channel and play a TTS URL
app.post('/join-and-play', async (req, res) => {
  const { token, channelName, botUid, ttsUrl } = req.body as {
    token: string;
    channelName: string;
    botUid?: string;
    ttsUrl: string; // a signed URL to the TTS opus or AAC stream (Storage or CDN)
  };
  if (!token || !channelName || !ttsUrl) {
    return res.status(400).json({ error: 'Missing token|channelName|ttsUrl' });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });

  const page = await browser.newPage();
  const url = `http://127.0.0.1:${PORT}/bot?appid=${encodeURIComponent(AGORA_APP_ID)}&token=${encodeURIComponent(token)}&channel=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(botUid || 'akili-bot')}&tts=${encodeURIComponent(ttsUrl)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Keep the browser open for the duration; return a handle id you can store if needed
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Bot Publisher listening on http://127.0.0.1:${PORT}`);
});
