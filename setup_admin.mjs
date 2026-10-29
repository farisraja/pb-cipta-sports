import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xnpdbwvsjugdzlxjmaer.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucGRid3ZzanVnZHpseGptYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjY3NDksImV4cCI6MjA5NDg0Mjc0OX0.yHuNTHcLtVTXrbpUQ2CryYUHPFXfCmDDA9i46t1lrck';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
  console.log('Registering/Login admin account...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'farisrajaardana@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Tengsaw080203';
  const adminName = process.env.ADMIN_NAME || 'farisraja';

  let { data: authData, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError || !authData.user) {
    console.log('SignUp returned null or error, trying SignIn...');
    const loginResult = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    authData = loginResult.data;
    authError = loginResult.error;
  }

  if (authError) {
    console.error('Error with Auth:', authError.message);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user ID returned.');
    return;
  }

  console.log('User ID:', userId);

  // Check if player profile already exists
  const { data: existingPlayer } = await supabase.from('players').select('*').eq('user_id', userId).single();
  
  if (existingPlayer) {
    console.log('Admin profile already exists, skipping insert.');
    return;
  }

  // Insert into players table with ADMIN role
  const { error: dbError } = await supabase.from('players').insert({
    user_id: userId,
    name: adminName,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    rank: 'ADMIN',
    role: 'ADMIN',
    win_rate: 0,
    points: 0,
    matches: 0,
    smash_power: 99,
    agility_rating: 99,
    stamina: 99
  });

  if (dbError) {
    console.error('Error creating admin player profile:', dbError.message);
  } else {
    console.log('Successfully created admin profile!');
  }
}

setupAdmin();
