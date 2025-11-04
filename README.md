
# AkiliPesaAI Backend

This directory contains the Firebase backend for the AkiliPesa Create/AI platform. It includes Cloud Functions for AI orchestration, Firestore/Storage rules, and configuration.

## 🚀 Deployment

To deploy the backend, run the following command from the root of the project:

```bash
npm --prefix functions run deploy
```

This will build the TypeScript functions and deploy Functions, Firestore rules, and Storage rules.

## 🤫 Environment Setup & Secrets

This project requires several secret API keys to interact with third-party AI vendors.

### Required Secrets:
- `OPENAI_API_KEY`
- `RUNPOD_API_KEY`
- `RUNWAYML_API_KEY`
- `KAIBER_API_KEY`
- `SYNTHESIA_API_KEY`
- `DEEPMOTION_API_KEY`
- `UDIO_API_KEY`
- `SUNO_API_KEY`
- `ELEVENLABS_API_KEY`
- `PI_API_KEY`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
- `ZEGOCLOUD_API_KEY`
- `WEATHER_API_KEY`

### How to Set Secrets:

Use the Firebase CLI to set each secret. Run these commands from your terminal:

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set RUNPOD_API_KEY
# ... and so on for all other keys

# For Agora secrets, use lowercase in the secret name
firebase functions:secrets:set AGORA_APP_ID
firebase functions:secrets:set AGORA_APP_CERTIFICATE
```

After setting the secrets, you will be prompted to enter the secret value.

## 🔌 Frontend Integration

### Calling the AI Router

Use the Firebase Functions `httpsCallable` method to interact with the main `aiRouter` function.

```typescript
// Example in a Next.js component
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const aiRouter = httpsCallable(functions, 'aiRouter');

async function handleCreateRequest() {
  try {
    const result = await aiRouter({
      uid: "USER_ID", // The authenticated user's ID
      requestType: "image",
      input: "A vibrant, futuristic city skyline at sunset",
      options: { style: "cinematic" }
    });
    console.log("AI Request successful:", result.data);
    // result.data contains { status, vendor_used, output_url, ... }
  } catch (error) {
    console.error("AI Request failed:", error);
  }
}
```

### Streaming UI Updates

To show real-time progress for long-running jobs, listen to the `ai_requests` document for the corresponding `request_id` returned by the `aiRouter`.

```typescript
// Example using the useDoc hook
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

function RequestStatus({ requestId }) {
  const firestore = useFirestore();
  const requestRef = useMemoFirebase(() => doc(firestore, 'ai_requests', requestId), [requestId, firestore]);
  const { data: request, isLoading } = useDoc(requestRef);

  if (isLoading) return <p>Loading request status...</p>;

  return (
    <div>
      <p>Status: {request?.status}</p>
      {request?.status === 'success' && <img src={request.output_url} alt="AI Output" />}
    </div>
  );
}
```

This comprehensive scaffolding sets up the entire backend as specified, ready for the detailed business logic and vendor integrations to be implemented.
