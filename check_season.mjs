import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for setup
const supabase = createClient(
  'https://xnpdbwvsjugdzlxjmaer.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucGRid3ZzanVnZHpseGptYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjY3NDksImV4cCI6MjA5NDg0Mjc0OX0.yHuNTHcLtVTXrbpUQ2CryYUHPFXfCmDDA9i46t1lrck'
);

async function setup() {
  // Login as admin first to have permissions
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'farisrajaardana@gmail.com',
    password: 'Tengsaw080203'
  });
  if (loginErr) { console.error('Login error:', loginErr.message); return; }
  console.log('Logged in as admin');

  // Check if row exists
  const { data: existing } = await supabase.from('league_settings').select('*').eq('id', 1).single();
  console.log('existing:', JSON.stringify(existing));

  if (!existing) {
    const { error } = await supabase.from('league_settings').insert({ id: 1, current_season: 'Season 1' });
    if (error) console.error('Insert error:', error.message);
    else console.log('Created default season: Season 1');
  } else {
    // Update to Season 1
    const { error } = await supabase.from('league_settings').update({ current_season: 'Season 1' }).eq('id', 1);
    if (error) console.error('Update error:', error.message);
    else console.log('Updated season to: Season 1');
  }
}

setup();
