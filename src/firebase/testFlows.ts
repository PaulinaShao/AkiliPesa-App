import { auth, db, functions } from "./clientApp";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

// 🔹 Test signup → triggers onusercreate
export async function testSignup() {
  const user = await createUserWithEmailAndPassword(auth, "test@example.com", "password123");
  console.log("User signed up:", user.user.uid);
}

// 🔹 Create post → triggers onpostcreate
export async function testCreatePost() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    console.error("User must be signed in to create a post.");
    return;
  }
  await addDoc(collection(db, "posts"), {
    authorId: uid,
    caption: "My first test post!",
    createdAt: serverTimestamp(),
  });
  console.log("Post created");
}

// 🔹 Order update → triggers onorderupdate
export async function testOrderUpdate() {
  await setDoc(doc(db, "orders", "order123"), {
    productId: "prod001",
    sellerId: "seller001",
    amount: 1000,
    quantity: 1,
    status: "paid",
  });
  console.log("Order updated");
}

// 🔹 Callable function → seeddemo
export async function testSeedDemo() {
  if (!auth.currentUser) {
    console.error("User must be signed in to run seedDemo.");
    return;
  }
  const seedDemo = httpsCallable(functions, "seeddemo");
  const result = await seedDemo({});
  console.log("SeedDemo result:", result.data);
}
