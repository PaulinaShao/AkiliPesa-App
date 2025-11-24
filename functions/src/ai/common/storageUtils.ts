// functions/src/ai/common/storageUtils.ts

import { admin } from "../../firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Saves a base64 string into Cloud Storage and returns a public URL.
 */
export async function saveBase64ToStorage(
  base64: string,
  contentType: string,
  folder: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const id = uuidv4();
  const path = `${folder}/${id}`;

  const buffer = Buffer.from(base64, "base64");
  const file = bucket.file(path);

  await file.save(buffer, {
    contentType,
    public: true,
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
