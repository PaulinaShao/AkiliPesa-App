# Testing Checklist

Use the functions in `src/firebase/testFlows.ts` from your browser's developer console to test the backend functions.

✅ Run `testSignup()` → check Firestore `users/{uid}` for a new profile.

✅ Run `testCreatePost()` → check Firestore `users/{uid}.stats.postsCount` has incremented.

✅ Run `testOrderUpdate()` → check Firestore `payments` collection for a new payment document.

✅ Run `testSeedDemo()` → check Firestore `posts` collection for a new post with a kitten image.

---

**Troubleshooting**

If something fails, check the logs in your Firebase Console under the **Functions** section. Look for logs corresponding to the function that failed (e.g., `onusercreate`, `onpostcreate`).
