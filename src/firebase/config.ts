import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDPxIWcpis5-LEa5zT7qtb5bckim4KbeRA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "dental-flow-9535e.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "dental-flow-9535e",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "dental-flow-9535e.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "948463726482",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:948463726482:web:dee327e9836a67f2a9db4b",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-R7YH1R8GLB",
};

// Debug: Log configuration
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase only if no apps exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

console.log('Firebase initialized successfully');

export default app;