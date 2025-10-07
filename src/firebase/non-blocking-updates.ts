
'use client';

import { collection, addDoc, Firestore } from 'firebase/firestore';

/**
 * Adds a document to a specified collection without blocking.
 * Errors are logged to the console.
 * @param firestore The Firestore instance.
 * @param collectionPath The path to the collection.
 * @param data The data to add.
 */
export function addDocumentNonBlocking(
  firestore: Firestore,
  collectionPath: string,
  data: object
) {
  addDoc(collection(firestore, collectionPath), data).catch(error => {
    console.error(`Error adding document to ${collectionPath}:`, error);
  });
}
