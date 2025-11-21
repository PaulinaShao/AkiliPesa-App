/**
 * Bootstraps all required Firestore collections
 * Run once: node scripts/bootstrapFirestore.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function bootstrap() {
  console.log("🚀 Bootstrapping AkiliPesa Firestore Structure...");

  const collections = [
    "wallets",
    "subscriptions",
    "transactions",
    "agentEarnings",
    "payoutRequests",
    "revenueReports",
    "orders",
    "escrow",
    "products",
    "notifications",
    "feed",
    "posts",
    "comments",
    "likes",
    "callRooms",
    "callSessions",
    "callLogs",
    "ai_requests",
    "ai_limits",
    "analyticsEvents",
    "agentProfiles",
    "agentAvailability",
    "agentPricing",
    "users"
  ];

  for (const col of collections) {
    const ref = db.collection(col).doc("_bootstrap_test");
    await ref.set({
      createdAt: admin.firestore.Timestamp.now(),
      note: "Structure init"
    });
    console.log(`✅ Created collection: ${col}`);
  }

  console.log("🔥 Firestore bootstrap complete.");
  process.exit();
}

bootstrap();
