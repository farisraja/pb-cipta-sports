import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Error: Firebase config missing in .env file.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'farisrajaardana@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Tengsaw080203';
  const adminName = process.env.ADMIN_NAME || 'farisraja';

  console.log(`Setting up Admin: ${adminEmail}...`);

  let user = null;
  try {
    const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    user = cred.user;
    console.log('Admin user created in Firebase Auth.');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists in Auth, signing in...');
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      user = cred.user;
    } else {
      console.error('Auth error:', err.message);
      return;
    }
  }

  if (!user) {
    console.error('No user found/created.');
    return;
  }

  // Create or update admin player profile in Firestore
  console.log(`Creating/updating player profile with role ADMIN for UID: ${user.uid}...`);
  await setDoc(doc(db, 'players', user.uid), {
    user_id: user.uid,
    name: adminName,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    rank: 'ADMIN',
    role: 'ADMIN',
    win_rate: 0,
    points: 0,
    matches: 0,
    smash_power: 99,
    agility_rating: 99,
    stamina: 99,
    created_at: new Date().toISOString()
  }, { merge: true });

  console.log('Admin profile successfully configured in Firestore!');
  process.exit(0);
}

setupAdmin().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
