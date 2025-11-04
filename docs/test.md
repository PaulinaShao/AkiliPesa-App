# How to Test Backend Functions

This document provides instructions for manually triggering backend Cloud Functions for testing purposes directly from your browser's developer console. The necessary test wrapper functions are located in `src/firebase/testFlows.ts`.

## Steps to Call a Test Function

1.  **Navigate** to your running application in your web browser (e.g., `http://localhost:3000`).
2.  **Open** the Developer Console.
    *   **Windows/Linux**: `F12` or `Ctrl+Shift+I`
    *   **Mac**: `Cmd+Option+I`
3.  **Copy and paste** the command for the function you want to test into the console.
4.  **Press Enter** to execute the command.
5.  **Check the console** for success (✅) or error (❌) messages.

---

## Available Test Functions

### `testSeedDemo()`

Adds a single sample video post to the `posts` collection in Firestore. This is useful for populating the video feed when it's empty.

**Console Command:**

```javascript
await import('./firebase/testFlows.ts').then(module => module.testSeedDemo());
```

After running, refresh the home page to see the new video.
