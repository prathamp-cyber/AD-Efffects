import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBY3I9t19_WU8NjI06ayaC6vukOudQ7gIk",
  authDomain: "ad-efffects.firebaseapp.com",
  projectId: "ad-efffects",
  storageBucket: "ad-efffects.firebasestorage.app",
  messagingSenderId: "599566372721",
  appId: "1:599566372721:web:e9cfd33873321cd777f0d0",
  measurementId: "G-WMY6KWC435"
};

// Initialize Firebase app (avoiding duplicate initialization on hot reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Transforms a Google Drive file ID into a working direct image URL.
 * If the provided value is already a full URL or relative path, it is returned as-is.
 * 
 * @param idOrUrl Google Drive file ID or standard URL
 * @returns Direct image URL string
 */
export function getGoogleDriveUrl(idOrUrl: string): string {
  if (!idOrUrl) return '';
  const trimmed = idOrUrl.trim();
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `https://lh3.googleusercontent.com/d/${trimmed}`;
}

export { app, db };
