
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";

const { storage } = initializeFirebase();

export const uploadFile = async (path: string, file: File) => {
  if (!file) return null;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};
