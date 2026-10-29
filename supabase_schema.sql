-- ==============================================================================
-- PB.CIPTA BADMINTON LEAGUE - DATABASE SCHEMA UPGRADE
-- Database: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Players Table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'USER',
  name TEXT NOT NULL,
  rank TEXT DEFAULT 'Neo',
  avatar TEXT NOT NULL,
  win_rate INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  smash_power INTEGER DEFAULT 70,
  agility_rating INTEGER DEFAULT 70,
  stamina INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if table already existed previously
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='user_id') THEN
    ALTER TABLE players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='role') THEN
    ALTER TABLE players ADD COLUMN role TEXT DEFAULT 'USER';
  END IF;
END $$;

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  team_alpha JSONB NOT NULL,
  team_omega JSONB NOT NULL,
  referee JSONB,
  outcome TEXT NOT NULL CHECK (outcome IN ('ALPHA', 'OMEGA', 'DRAW')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. League Settings Table
CREATE TABLE IF NOT EXISTS league_settings (
  id INT PRIMARY KEY,
  current_season TEXT NOT NULL DEFAULT 'Season 1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Default Season Row
INSERT INTO league_settings (id, current_season)
VALUES (1, 'Season 1')
ON CONFLICT (id) DO NOTHING;

-- 5. Stat Requests Table (Pengajuan update statistik oleh pemain ke admin)
CREATE TABLE IF NOT EXISTS stat_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  matches INTEGER DEFAULT 0,
  win_rate INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  smash_power INTEGER DEFAULT 0,
  agility_rating INTEGER DEFAULT 0,
  stamina INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies if needed to avoid duplicate policy errors
DROP POLICY IF EXISTS "Allow public read access to players" ON players;
DROP POLICY IF EXISTS "Allow public update access to players" ON players;
DROP POLICY IF EXISTS "Allow public insert access to players" ON players;
DROP POLICY IF EXISTS "Allow public delete access to players" ON players;

DROP POLICY IF EXISTS "Allow public read access to matches" ON matches;
DROP POLICY IF EXISTS "Allow public insert access to matches" ON matches;
DROP POLICY IF EXISTS "Allow public delete access to matches" ON matches;

DROP POLICY IF EXISTS "Allow public read access to league_settings" ON league_settings;
DROP POLICY IF EXISTS "Allow public update access to league_settings" ON league_settings;
DROP POLICY IF EXISTS "Allow public insert access to league_settings" ON league_settings;

DROP POLICY IF EXISTS "Allow public read access to stat_requests" ON stat_requests;
DROP POLICY IF EXISTS "Allow public insert access to stat_requests" ON stat_requests;
DROP POLICY IF EXISTS "Allow public update access to stat_requests" ON stat_requests;
DROP POLICY IF EXISTS "Allow public delete access to stat_requests" ON stat_requests;

-- 7. RLS Policies
-- Players: Public read, insert & update access
CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to players" ON players FOR DELETE USING (true);

-- Matches: Public read, insert & delete access
CREATE POLICY "Allow public read access to matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to matches" ON matches FOR DELETE USING (true);

-- League Settings: Public read & write
CREATE POLICY "Allow public read access to league_settings" ON league_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update access to league_settings" ON league_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to league_settings" ON league_settings FOR INSERT WITH CHECK (true);

-- Stat Requests: Public read & write
CREATE POLICY "Allow public read access to stat_requests" ON stat_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to stat_requests" ON stat_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to stat_requests" ON stat_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to stat_requests" ON stat_requests FOR DELETE USING (true);

-- 8. Seed Mock Players
INSERT INTO players (id, name, rank, avatar, win_rate, points, matches, smash_power, agility_rating, stamina, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Chen Long', '01', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop', 92, 14250, 126, 98, 95, 99, 'USER'),
  ('22222222-2222-2222-2222-222222222222', 'Rizal', '02', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', 88, 13800, 54, 88, 92, 85, 'USER'),
  ('33333333-3333-3333-3333-333333333333', 'Dimas', '03', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', 85, 13150, 53, 85, 90, 80, 'USER'),
  ('44444444-4444-4444-4444-444444444444', 'Andi', '04', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', 68, 2450, 45, 75, 80, 70, 'USER'),
  ('55555555-5555-5555-5555-555555555555', 'Alex Strike', 'Neo', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 72, 9200, 80, 90, 85, 80, 'USER')
ON CONFLICT (id) DO NOTHING;
