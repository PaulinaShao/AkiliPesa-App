
import puppeteer from "puppeteer";

export async function runBotAndPlayTTS(url: string) {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();

    // Navigate to client page
    await page.goto("https://your-client-app-url.com");

    // Inject a JS function into the page to play TTS audio
    await page.exposeFunction("playTTS", async (audioUrl: string) => {
      const audio = new Audio(audioUrl);
      await audio.play();
    });

    // Execute playTTS in the browser
    await page.evaluate(
      (audioUrl) => {
        // playTTS is already exposed to the browser context
        // @ts-ignore
        (window as any).playTTS(audioUrl);
      },
      url
    );

    console.log("TTS playback triggered successfully.");

  } catch (error) {
    console.error("Bot TTS error:", error);

  } finally {
    await browser.close();
  }
}
