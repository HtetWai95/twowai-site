import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your Firebase project config from the Firebase Console
// https://console.firebase.google.com → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Vision API key for OCR (optional — enables receipt scanning)
// Get one at https://console.cloud.google.com → APIs → Cloud Vision API
export const VISION_API_KEY = 'YOUR_GOOGLE_VISION_API_KEY';

export default app;
