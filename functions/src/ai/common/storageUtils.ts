import { storage } from "../../firebase/index.js";
import { v4 as uuidv4 } from "uuid";

export async function saveBase64ToStorage(
  base64: string,
  contentType: string,
  folder: string
): Promise<string> {
  const bucket = storage.bucket();
  const id = uuidv4();
  const path = `${folder}/${id}`;

  const buffer = Buffer.from(base64, "base64");
  const file = bucket.file(path);

  await file.save(buffer, { contentType, public: true });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
