/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  id: string;
  user_id?: string;
  role?: string;
  name: string;
  rank: string;
  avatar: string;
  winRate: number;
  points: number;
  matches: number;
  smashPower: number;
  agilityRating: number;
  stamina?: number;
}

export interface Match {
  id: string;
  date: string;
  teamAlpha: Player[];
  teamOmega: Player[];
  referee: Player | null;
  outcome: 'ALPHA' | 'OMEGA' | 'DRAW';
}


export const PLAYERS: Player[] = [
  {
    id: "1",
    name: "Chen Long",
    rank: "01",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
    winRate: 92,
    points: 14250,
    matches: 126,
    smashPower: 98,
    agilityRating: 95,
    stamina: 99
  },
  {
    id: "2",
    name: "Rizal",
    rank: "02",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    winRate: 88,
    points: 13800,
    matches: 54,
    smashPower: 88,
    agilityRating: 92
  },
  {
    id: "3",
    name: "Dimas",
    rank: "03",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    winRate: 85,
    points: 13150,
    matches: 53,
    smashPower: 85,
    agilityRating: 90
  },
  {
    id: "4",
    name: "Andi",
    rank: "04",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    winRate: 68,
    points: 2450,
    matches: 45,
    smashPower: 75,
    agilityRating: 80
  },
  {
    id: "5",
    name: "Alex Strike",
    rank: "Neo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    winRate: 72,
    points: 9200,
    matches: 80,
    smashPower: 90,
    agilityRating: 85
  }
];
