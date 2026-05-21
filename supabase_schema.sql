-- Create players table
CREATE TABLE players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  avatar TEXT NOT NULL,
  win_rate INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  smash_power INTEGER DEFAULT 0,
  agility_rating INTEGER DEFAULT 0,
  stamina INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create matches table
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  team_alpha JSONB NOT NULL,
  team_omega JSONB NOT NULL,
  referee JSONB,
  outcome TEXT NOT NULL CHECK (outcome IN ('ALPHA', 'OMEGA', 'DRAW')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert mock data for players
INSERT INTO players (id, name, rank, avatar, win_rate, points, matches, smash_power, agility_rating, stamina)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Chen Long', '01', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop', 92, 14250, 126, 98, 95, 99),
  ('22222222-2222-2222-2222-222222222222', 'Rizal', '02', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', 88, 13800, 54, 88, 92, 85),
  ('33333333-3333-3333-3333-333333333333', 'Dimas', '03', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', 85, 13150, 53, 85, 90, 80),
  ('44444444-4444-4444-4444-444444444444', 'Andi', '04', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', 68, 2450, 45, 75, 80, 70),
  ('55555555-5555-5555-5555-555555555555', 'Alex Strike', 'Neo', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 72, 9200, 80, 90, 85, 80);

-- Enable Row Level Security (RLS) but allow anonymous read/write for now
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public update access to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to players" ON players FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to matches" ON matches FOR INSERT WITH CHECK (true);
