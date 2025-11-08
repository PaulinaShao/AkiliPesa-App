import { httpsCallable } from "firebase/functions";
import { initializeFirebase } from "@/firebase";
// This file is for DEVELOPMENT and TESTING only.
// It allows you to trigger backend functions directly from your browser's developer console.
const { functions } = initializeFirebase();
/**
 * Calls the seeddemo Cloud Function to add a sample post to the Firestore 'posts' collection.
 */
export async function testSeedDemo() {
    console.log("🚀 Calling seeddemo function...");
    const seedDemoCallable = httpsCallable(functions, 'seeddemo');
    try {
        const result = await seedDemoCallable();
        console.log("✅ seeddemo function successful:", result.data);
        alert("Sample video post has been added to your feed! Please refresh the page to see it.");
    }
    catch (error) {
        console.error("❌ Error calling seeddemo function:", error);
        alert("There was an error seeding the demo data. Check the console for details.");
    }
}
// To use this in your browser console:
// 1. Navigate to your application in the browser.
// 2. Open the Developer Console (F12 or Ctrl+Shift+I).
// 3. Type the following and press Enter:
//    await import('./firebase/testFlows.ts').then(module => module.testSeedDemo());
// 4. Refresh your app's home page.
//# sourceMappingURL=testFlows.js.map