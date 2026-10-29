import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

if (!firebaseConfig.projectId) {
  console.error('Error: VITE_FIREBASE_PROJECT_ID not set in .env file.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const initialPlayers = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Chen Long",
    rank: "01",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
    win_rate: 92,
    points: 14250,
    matches: 126,
    smash_power: 98,
    agility_rating: 95,
    stamina: 99,
    role: "USER"
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Rizal",
    rank: "02",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    win_rate: 88,
    points: 13800,
    matches: 54,
    smash_power: 88,
    agility_rating: 92,
    stamina: 85,
    role: "USER"
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Dimas",
    rank: "03",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    win_rate: 85,
    points: 13150,
    matches: 53,
    smash_power: 85,
    agility_rating: 90,
    stamina: 80,
    role: "USER"
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Andi",
    rank: "04",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    win_rate: 68,
    points: 2450,
    matches: 45,
    smash_power: 75,
    agility_rating: 80,
    stamina: 70,
    role: "USER"
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Alex Strike",
    rank: "Neo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    win_rate: 72,
    points: 9200,
    matches: 80,
    smash_power: 90,
    agility_rating: 85,
    stamina: 80,
    role: "USER"
  }
];

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || 'farisrajaardana@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Tengsaw080203';

  console.log(`Authenticating as ${adminEmail} for seeding...`);
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('Authenticated successfully.');

  console.log('Seeding initial players to Firestore...');
  for (const player of initialPlayers) {
    const { id, ...data } = player;
    await setDoc(doc(db, 'players', id), {
      ...data,
      created_at: new Date().toISOString()
    }, { merge: true });
    console.log(`Seeded player: ${player.name}`);
  }

  console.log('Seeding league settings...');
  await setDoc(doc(db, 'league_settings', '1'), {
    id: 1,
    current_season: 'Season 1',
    created_at: new Date().toISOString()
  }, { merge: true });

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
