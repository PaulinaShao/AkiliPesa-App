import express from 'express';
import * as admin from 'firebase-admin';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import puppeteer from 'puppeteer-core';

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const PROJECT_ID = process.env.GCLOUD_PROJECT! || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID
});
const db = getFirestore();

const app = express();

/**
 * Join a channel and start listening for /ai_audio_queue for that channel.
 * We open a headless page that loads a tiny HTML with Agora SDK and an Audio element.
 */
app.get('/join/:channelName', async (req, res) => {
  const { channelName } = req.params;
  if (!channelName) return res.status(400).send('channelName required');

  // Launch headless Chrome
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();

  // Serve minimal HTML in-memory
  const html = `
<!doctype html><html><body>
<audio id="tts" autoplay></audio>
<script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js"></script>
<script>
const appId = "${AGORA_APP_ID}";
const channel = "${channelName}";
let client, micTrack;
window.joinAgora = async function(token) {
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(appId, channel, token, null);
  // Create a silent mic; we'll switch its source to our AudioContext destination
  micTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([micTrack]);
  return true;
}
window.playTTS = async function(url) {
  const audio = document.getElementById('tts');
  audio.src = url;
  await audio.play().catch(()=>{});
  return true;
}
</script>
</body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  // Get bot token from your callable (or pre-generate)
  // For demo, we run without token (APP Certificate off) – but production should use token.
  await page.exposeFunction('logNode', (msg: string) => console.log('[PAGE]', msg));

  // If you require a token, generate it in Functions & fetch here.
  await page.evaluate('joinAgora(null)');

  // Subscribe to queue for this channel
  const unsub = db.collection('ai_audio_queue')
    .where('channelName','==', channelName)
    .where('status','==','pending')
    .orderBy('createdAt','asc')
    .onSnapshot(async (snap) => {
      for (const doc of snap.docs) {
        const { url } = doc.data() as any;
        await page.evaluate(\`playTTS(\${JSON.stringify(url)})\`);
        await doc.ref.update({ status: 'played', playedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    });

  res.json({ ok: true, message: \`Bot joined \${channelName}\` });
});

app.get('/', (_, res) => res.send('Akili Bot OK'));
app.listen(process.env.PORT || 8080, () => console.log('Akili Bot listening…'));
