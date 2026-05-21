/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { 
  Radio, 
  BarChart3, 
  Flag, 
  User, 
  Bell, 
  Settings, 
  Trophy, 
  AlertTriangle, 
  Scale, 
  Shuffle, 
  UserPlus,
  Filter, 
  Search, 
  ChevronDown, 
  Home, 
  TrendingUp, 
  CircleUser,
  X,
  History,
  Activity,
  Zap,
  Edit2,
  RefreshCw,
  Coffee,
  Trash2
} from 'lucide-react';
import { PLAYERS, Player, Match } from './types.ts';
import './i18n';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';
import PlayerModal from './PlayerModal';
import { Session } from '@supabase/supabase-js';
import AuthScreen from './AuthScreen';
import SettingsModal from './SettingsModal';


type Screen = 'Rankings' | 'Match Center' | 'Team Shuffle' | 'Tournament';

function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative group/tooltip inline-block w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 5 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 5 }}
            className="absolute left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-container-highest/90 backdrop-blur-md border border-primary/20 rounded-lg text-[9px] font-display text-primary-container uppercase tracking-[0.2em] whitespace-nowrap z-[100] shadow-2xl pointer-events-none hidden md:block"
          >
            {content}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-surface-container-highest/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en');
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeScreen, setActiveScreen] = useState<Screen>('Rankings');
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentSeason, setCurrentSeason] = useState<string>(() => {
    return localStorage.getItem('pb_current_season') || 'Season 1';
  });

  const updateCurrentSeason = (season: string) => {
    setCurrentSeason(season);
    localStorage.setItem('pb_current_season', season);
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (session && players.length > 0) {
      const profile = players.find(p => p.user_id === session.user.id);
      setCurrentUser(profile || null);
    } else {
      setCurrentUser(null);
    }
  }, [session, players]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activePool, setActivePool] = useState<(Player & { selected: boolean })[]>([]);
  const [shuffledResult, setShuffledResult] = useState<{
    teamAlpha: Player[];
    teamOmega: Player[];
    referee: Player | null;
  } | null>(null);

  const [activeMatch, setActiveMatch] = useState<{
    teamAlpha: Player[];
    teamOmega: Player[];
    referee: Player | null;
  } | null>(null);

  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | 'NEW' | null>(null);
  const [matchNumber, setMatchNumber] = useState<number>(() => {
    const saved = localStorage.getItem('pb_match_number');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [lastMatchPlayerIds, setLastMatchPlayerIds] = useState<Set<string>>(new Set());
  const [restingPlayerIds, setRestingPlayerIds] = useState<Set<string>>(new Set());
  const [leagueLogo, setLeagueLogo] = useState<string>(() => {
    return localStorage.getItem('pb_league_logo') || '/logo.jpg';
  });
  const [notifications, setNotifications] = useState<{id: string; type: string; title: string; desc: string; time: string}[]>([]);

  const handleSavePlayer = async (data: any) => {
    const isAdmin = currentUser?.role === 'ADMIN';

    if (!isAdmin) {
      if (editingPlayer && editingPlayer !== 'NEW') {
        await supabase.from('players').update({
          name: data.name,
          avatar: data.avatar
        }).eq('id', editingPlayer.id);

        await supabase.from('stat_requests').insert({
          player_id: editingPlayer.id,
          matches: data.matches,
          win_rate: data.winRate,
          points: data.points,
          smash_power: data.smashPower,
          agility_rating: data.agilityRating,
          stamina: data.stamina
        });
        
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, name: data.name, avatar: data.avatar } : p));
        alert('Profil diperbarui! Perubahan statistik telah diajukan dan menunggu persetujuan Admin.');
      }
      setEditingPlayer(null);
      return;
    }

    if (editingPlayer === 'NEW') {
      const { data: newData } = await supabase.from('players').insert({
        name: data.name,
        avatar: data.avatar,
        rank: 'Neo',
        win_rate: data.winRate,
        points: data.points,
        matches: data.matches,
        smash_power: data.smashPower,
        agility_rating: data.agilityRating,
        stamina: data.stamina
      }).select().single();
      
      if (newData) {
        const newPlayer: Player = {
          id: newData.id,
          name: newData.name,
          rank: newData.rank,
          avatar: newData.avatar,
          winRate: newData.win_rate,
          points: newData.points,
          matches: newData.matches,
          smashPower: newData.smash_power,
          agilityRating: newData.agility_rating,
          stamina: newData.stamina
        };
        const updatedPlayers = [...players, newPlayer].sort((a, b) => b.points - a.points);
        const rankedPlayers = updatedPlayers.map((p, i) => ({
          ...p,
          rank: String(i + 1).padStart(2, '0')
        }));
        setPlayers(rankedPlayers);
        setActivePool(rankedPlayers.map(p => ({ ...p, selected: true })));
      }
    } else if (editingPlayer) {
      await supabase.from('players').update({
        name: data.name,
        avatar: data.avatar,
        win_rate: data.winRate,
        points: data.points,
        matches: data.matches,
        smash_power: data.smashPower,
        agility_rating: data.agilityRating,
        stamina: data.stamina
      }).eq('id', editingPlayer.id);
      
      const updatedPlayers = players.map(p => p.id === editingPlayer.id ? { 
        ...p, 
        name: data.name, 
        avatar: data.avatar,
        winRate: data.winRate,
        points: data.points,
        matches: data.matches,
        smashPower: data.smashPower,
        agilityRating: data.agilityRating,
        stamina: data.stamina
      } : p).sort((a, b) => b.points - a.points);
      
      const rankedPlayers = updatedPlayers.map((p, i) => ({
        ...p,
        rank: String(i + 1).padStart(2, '0')
      }));

      setPlayers(rankedPlayers);
      setActivePool(rankedPlayers.map(p => ({ ...p, selected: true })));
    }
    setEditingPlayer(null);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      const [{ data: pData }, { data: mData }, { data: sData }] = await Promise.all([
        supabase.from('players').select('*').order('points', { ascending: false }),
        supabase.from('matches').select('*').order('date', { ascending: false }),
        supabase.from('league_settings').select('current_season').eq('id', 1).single()
      ]);
      
      if (sData?.current_season) {
        updateCurrentSeason(sData.current_season);
      }

      if (pData) {
        const formattedPlayers = pData.map((p, i) => ({
          id: p.id,
          user_id: p.user_id,
          role: p.role,
          name: p.name,
          rank: String(i + 1).padStart(2, '0'),
          avatar: p.avatar,
          winRate: p.win_rate,
          points: p.points,
          matches: p.matches,
          smashPower: p.smash_power,
          agilityRating: p.agility_rating,
          stamina: p.stamina
        }));
        setPlayers(formattedPlayers);
        setActivePool(formattedPlayers.map(p => ({ ...p, selected: true })));
      }

      if (mData) {
        const formattedMatches = mData.map(m => ({
          id: m.id,
          date: m.date,
          teamAlpha: m.team_alpha,
          teamOmega: m.team_omega,
          referee: m.referee,
          outcome: m.outcome
        }));
        setMatchHistory(formattedMatches);
      }
    };
    fetchData();
  }, []);
  
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'ALPHA' | 'OMEGA' | 'DRAW'>('ALL');
  const [historySort, setHistorySort] = useState<'DATE_DESC' | 'DATE_ASC'>('DATE_DESC');
  const [historySearch, setHistorySearch] = useState('');
  
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [tournamentInfo, setTournamentInfo] = useState<{
    round: 'SEMIS' | 'FINALS' | 'COMPLETE';
    matches: {
      id: string;
      player1: Player;
      player2: Player;
      winner: Player | null;
    }[];
  } | null>(null);

  const startTournament = () => {
    if (players.length < 4) {
      alert('Dibutuhkan minimal 4 pemain terdaftar untuk memulai turnamen!');
      return;
    }
    // Top 4 players
    const top4 = [...players].sort((a, b) => b.points - a.points).slice(0, 4);
    setTournamentInfo({
      round: 'SEMIS',
      matches: [
        { id: 'semi1', player1: top4[0], player2: top4[3], winner: null },
        { id: 'semi2', player1: top4[1], player2: top4[2], winner: null }
      ]
    });
    setActiveScreen('Tournament');
  };

  const handleTournamentWin = (matchId: string, winner: Player) => {
    if (!tournamentInfo) return;
    const updatedMatches = tournamentInfo.matches.map(m => m.id === matchId ? { ...m, winner } : m);
    
    setTournamentInfo({ ...tournamentInfo, matches: updatedMatches });

    // Check progressions
    if (tournamentInfo.round === 'SEMIS') {
      const semi1 = updatedMatches.find(m => m.id === 'semi1');
      const semi2 = updatedMatches.find(m => m.id === 'semi2');
      if (semi1?.winner && semi2?.winner) {
        setTimeout(() => {
          setTournamentInfo({
            round: 'FINALS',
            matches: [
              ...updatedMatches,
              { id: 'final', player1: semi1.winner!, player2: semi2.winner!, winner: null }
            ]
          });
        }, 1000);
      }
    } else if (tournamentInfo.round === 'FINALS') {
      const finalMatch = updatedMatches.find(m => m.id === 'final');
      if (finalMatch?.winner) {
         setTimeout(() => {
           setTournamentInfo({
             round: 'COMPLETE',
             matches: updatedMatches
           });
           
           // Reward finals winner
           const newPlayers = players.map(p => {
             if (p.id === finalMatch.winner!.id) {
               return { ...p, points: p.points + 500, matches: p.matches + 1 };
             }
             return p;
           });
           // Re-sort and rank
           const sortedPlayers = [...newPlayers].sort((a, b) => b.points - a.points);
           const rankedPlayers = sortedPlayers.map((p, i) => ({
             ...p,
             rank: String(i + 1).padStart(2, '0')
           }));
           setPlayers(rankedPlayers);
         }, 1000);
      }
    }
  };
  
  const handleShuffle = () => {
    setIsShuffling(true);
    setRetryCount(0);
    setShuffledResult(null);

    const selectedPlayers = activePool.filter(p => p.selected && !restingPlayerIds.has(p.id));
    
    // Prioritize players who did NOT play in the last match
    const freshPlayers = selectedPlayers.filter(p => !lastMatchPlayerIds.has(p.id));
    const recentPlayers = selectedPlayers.filter(p => lastMatchPlayerIds.has(p.id));
    
    // If not enough fresh players, fill with recent players
    let poolToUse = freshPlayers.length >= 4 ? freshPlayers : selectedPlayers;
    
    if (poolToUse.length < 4) {
       setIsShuffling(false);
       return;
    }

    // Simulate AI processing delay for UI
    setTimeout(() => {
      // 1. Pick 4 random players from the pool
      const shuffledPool = [...poolToUse].sort(() => Math.random() - 0.5);
      const corePlayers = shuffledPool.slice(0, 4);
      
      // Helper function to calculate a player's power based on points and win rate
      const getPower = (p1: Player, p2: Player) => {
         return (p1.points + p2.points) + ((p1.winRate + p2.winRate) * 5);
      };
      
      // 2. Generate the 3 possible team combinations for 4 players (A, B, C, D)
      const A = corePlayers[0];
      const B = corePlayers[1];
      const C = corePlayers[2];
      const D = corePlayers[3];

      const scenarios = [
        { teamAlpha: [A, B], teamOmega: [C, D] },
        { teamAlpha: [A, C], teamOmega: [B, D] },
        { teamAlpha: [A, D], teamOmega: [B, C] }
      ];

      // 3. Find the most balanced combination
      let bestScenario = scenarios[0];
      let minDiff = Infinity;

      for (const scenario of scenarios) {
        const powerAlpha = getPower(scenario.teamAlpha[0], scenario.teamAlpha[1]);
        const powerOmega = getPower(scenario.teamOmega[0], scenario.teamOmega[1]);
        const diff = Math.abs(powerAlpha - powerOmega);
        
        if (diff < minDiff) {
          minDiff = diff;
          bestScenario = scenario;
        }
      }

      // 4. Select a referee from the remaining players
      const usedIds = new Set([...bestScenario.teamAlpha, ...bestScenario.teamOmega].map(p => p.id));
      let referee = selectedPlayers.find(p => !usedIds.has(p.id)) || null;
      
      if (!referee) {
        const unselected = activePool.filter(p => !p.selected);
        if (unselected.length > 0) {
          referee = unselected[Math.floor(Math.random() * unselected.length)];
        }
      }

      setShuffledResult({ 
        teamAlpha: bestScenario.teamAlpha, 
        teamOmega: bestScenario.teamOmega, 
        referee 
      });
      setIsShuffling(false);
    }, 2000);
  };

  const handleConfirmMatch = async (winningTeam: 'ALPHA' | 'OMEGA' | 'DRAW') => {
    if (!activeMatch) return;

    let updatedPlayersList = [...players];
    const playersToUpdate = [];

    const updatedPlayers = players.map(p => {
      const isAlpha = activeMatch.teamAlpha.some(ap => ap.id === p.id);
      const isOmega = activeMatch.teamOmega.some(op => op.id === p.id);

      if (isAlpha || isOmega) {
        let win = false;
        if (winningTeam === 'ALPHA' && isAlpha) win = true;
        if (winningTeam === 'OMEGA' && isOmega) win = true;
        
        const newMatches = p.matches + 1;
        // Points: Win=2, Draw=1, Loss=0
        const pointsEarned = win ? 2 : (winningTeam === 'DRAW' ? 1 : 0);
        const newPoints = p.points + pointsEarned;
        // Recalculate win rate
        const newWinRate = Math.round(((p.winRate * p.matches) + (win ? 100 : 0)) / newMatches);

        const updatedPlayer = {
          ...p,
          matches: newMatches,
          points: newPoints,
          winRate: newWinRate
        };
        playersToUpdate.push(updatedPlayer);
        return updatedPlayer;
      }
      return p;
    });

    // Update players in Supabase
    for (const p of playersToUpdate) {
      await supabase.from('players').update({
        points: p.points,
        matches: p.matches,
        win_rate: p.winRate
      }).eq('id', p.id);
    }

    // Insert match to Supabase
    const { data: matchData } = await supabase.from('matches').insert({
      team_alpha: activeMatch.teamAlpha,
      team_omega: activeMatch.teamOmega,
      referee: activeMatch.referee,
      outcome: winningTeam
    }).select().single();

    if (matchData) {
      const newMatch: Match = {
        id: matchData.id,
        date: matchData.date,
        teamAlpha: matchData.team_alpha,
        teamOmega: matchData.team_omega,
        referee: matchData.referee,
        outcome: matchData.outcome as any
      };
      setMatchHistory(prev => [newMatch, ...prev]);
    }

    // Sort by points to update rank
    const sortedPlayers = [...updatedPlayers].sort((a, b) => b.points - a.points);
    const rankedPlayers = sortedPlayers.map((p, i) => ({
      ...p,
      rank: String(i + 1).padStart(2, '0')
    }));

    setPlayers(rankedPlayers);
    setActivePool(rankedPlayers.map(p => ({ ...p, selected: true })));
    // Track who just played for rotation logic
    const justPlayedIds = new Set([
      ...activeMatch.teamAlpha.map(p => p.id),
      ...activeMatch.teamOmega.map(p => p.id)
    ]);
    setLastMatchPlayerIds(justPlayedIds);
    const newMatchNum = matchNumber + 1;
    setMatchNumber(newMatchNum);
    localStorage.setItem('pb_match_number', String(newMatchNum));
    setActiveMatch(null);

    // Add notification
    const winnerTeam = winningTeam === 'ALPHA' ? 'Team A' : winningTeam === 'OMEGA' ? 'Team B' : 'Seri';
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'match',
      title: `Match #${matchNumber} Selesai`,
      desc: winningTeam === 'DRAW' ? 'Pertandingan berakhir seri!' : `${winnerTeam} menang!`,
      time: 'Baru saja'
    }, ...prev]);
  };

  const handleResetMatch = () => {
    if (window.confirm('Reset Match? Match akan kembali ke Match #1. Data poin tidak berubah.')) {
      setActiveMatch(null);
      setLastMatchPlayerIds(new Set());
      setMatchNumber(1);
      localStorage.setItem('pb_match_number', '1');
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'system',
        title: 'Match Reset',
        desc: 'Semua match telah direset ke Match #1.',
        time: 'Baru saja'
      }, ...prev]);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('Yakin ingin menghapus riwayat match ini? Poin pemain tidak akan berubah, hanya riwayat yang dihapus.')) {
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) {
        alert('Gagal menghapus di database: ' + error.message);
      } else {
        setMatchHistory(prev => prev.filter(m => m.id !== matchId));
      }
    }
  };

  const handleDeleteAllHistory = async () => {
    if (window.confirm('Yakin ingin menghapus SEMUA riwayat match? Tindakan ini tidak dapat dibatalkan.')) {
      const { error } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        alert('Gagal menghapus semua data di database: ' + error.message);
      } else {
        setMatchHistory([]);
        setNotifications(prev => [{
          id: Date.now().toString(),
          type: 'system',
          title: 'History Cleared',
          desc: 'Semua riwayat pertandingan telah dihapus oleh Admin.',
          time: 'Baru saja'
        }, ...prev]);
      }
    }
  };

  const getScreenDescription = (name: Screen) => {
    switch (name) {
      case 'Rankings': return t('rankings_desc');
      case 'Match Center': return t('match_center_desc');
      case 'Team Shuffle': return t('team_shuffle_desc');
      default: return '';
    }
  };

  const filteredMatchHistory = matchHistory
    .filter(m => {
      if (historyFilter !== 'ALL' && m.outcome !== historyFilter) return false;
      if (historySearch) {
        const query = historySearch.toLowerCase();
        const names = [...m.teamAlpha, ...m.teamOmega].map(p => p.name.toLowerCase());
        if (!names.some(name => name.includes(query))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return historySort === 'DATE_DESC' ? dateB - dateA : dateA - dateB;
    });

  const renderSidebarItem = (name: Screen, Icon: any) => {
    const isActive = activeScreen === name;
    return (
      <Tooltip content={getScreenDescription(name)}>
        <button
          onClick={() => setActiveScreen(name)}
          className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 w-full text-left group relative overflow-hidden
            ${isActive 
              ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(0,245,255,0.05)]' 
              : 'text-on-surface-variant border border-transparent hover:border-white/5 hover:bg-white/[0.02] hover:text-on-surface'}`}
        >
          {isActive && (
            <motion.div 
              layoutId="active-indicator"
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,245,255,0.8)]"
            />
          )}
          <Icon size={20} className={isActive ? 'text-primary' : 'opacity-50 group-hover:opacity-100 transition-opacity'} />
          <span className="font-display text-[11px] uppercase tracking-[0.2em] font-medium">{name}</span>
        </button>
      </Tooltip>
    );
  };

  if (!session) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:pl-64">
      <div className="bg-trail" />
      {/* Top Bar */}
      <header className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-surface/60 backdrop-blur-2xl border-b border-white/5 h-20 flex items-center justify-between px-3 sm:px-6 md:px-12">
        <div className="flex md:hidden items-center gap-2 sm:gap-4 shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-surface-container flex items-center justify-center border border-white/10 shadow-lg group overflow-hidden">
            {leagueLogo ? (
              <img src={leagueLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <Trophy size={18} className="text-primary-container drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]" />
            )}
          </div>
          <div className="hidden min-[380px]:block">
            <h1 className="font-display text-[11px] sm:text-sm font-black tracking-tighter text-on-surface uppercase leading-tight max-w-[100px] sm:max-w-none truncate">
              {t('app_title')}
            </h1>
            <p className="text-[7px] sm:text-[8px] font-mono text-primary/40 uppercase tracking-[0.2em] font-bold mt-1">Professional League</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
           <div className="px-3 py-1 bg-surface-container rounded-lg border border-white/5 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#cbf231]" />
             <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{t('live_server_active')}</span>
           </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
          <button 
            onClick={toggleLanguage} 
            className="px-3 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl border border-white/10 bg-surface-container font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all font-bold shadow-lg"
          >
            {i18n.language === 'en' ? 'ID' : 'EN'}
          </button>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Tooltip content={t('live_alerts')}>
              <button 
                onClick={() => setIsAlertsOpen(true)}
                className="p-2 md:p-3 text-on-surface-variant hover:text-primary transition-all active:scale-95 hover:bg-primary/10 hover:border-primary/20 border border-transparent rounded-xl md:rounded-2xl bg-surface-container shadow-lg"
              >
                <div className="relative">
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-surface flex items-center justify-center font-mono text-[6px] font-black text-on-secondary animate-pulse">
                        {notifications.length}
                      </div>
                    </>
                  )}
                </div>
              </button>
            </Tooltip>
            
            {currentUser?.role === 'ADMIN' && (
              <Tooltip content="Admin Dashboard & Settings">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 md:p-3 text-on-surface-variant hover:text-primary transition-all active:scale-95 hover:bg-primary/10 hover:border-primary/20 border border-transparent rounded-xl md:rounded-2xl bg-surface-container shadow-lg"
                >
                  <Settings size={18} className="md:w-5 md:h-5" />
                </button>
              </Tooltip>
            )}
          </div>

          <div className="w-px h-6 md:h-8 bg-white/5 mx-0 sm:mx-1 md:mx-2" />
          
          <div className="flex items-center gap-2 md:gap-4 group cursor-pointer relative shrink-0" onClick={async () => {
              if (window.confirm('Are you sure you want to log out?')) {
                await supabase.auth.signOut();
                setSession(null);
                setCurrentUser(null);
              }
            }}>
            <div className="text-right hidden sm:block">
              <div className="font-display text-[11px] uppercase tracking-widest text-on-surface font-bold group-hover:text-primary transition-colors">{currentUser?.name || 'USER'}</div>
              <div className="text-[9px] font-mono text-primary/40 uppercase tracking-widest font-bold mt-0.5">{currentUser?.role === 'ADMIN' ? 'Administrator' : 'Player'}</div>
            </div>
            <div className="relative shrink-0">
              <img 
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                alt="Profile" 
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl border-2 border-white/10 shadow-2xl transition-all duration-500 group-hover:border-primary/50 group-hover:scale-105 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-secondary rounded-lg border-2 border-surface flex items-center justify-center font-mono text-[7px] md:text-[8px] font-black text-on-secondary">
                {currentUser?.role === 'ADMIN' ? '*' : (currentUser?.rank || '-')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 hidden w-64 md:flex flex-col bg-surface/80 backdrop-blur-3xl border-r border-white/5 z-50">
        <div className="p-8 pb-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center border border-white/10 shadow-2xl relative group cursor-pointer overflow-hidden"
              onClick={() => {
                if (currentUser?.role === 'ADMIN') {
                  const url = window.prompt('Masukkan URL logo baru (kosongkan untuk kembali ke default):');
                  if (url !== null) {
                    setLeagueLogo(url);
                    localStorage.setItem('pb_league_logo', url);
                  }
                }
              }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              {leagueLogo ? (
                <img src={leagueLogo} alt="Logo" className="w-full h-full object-cover rounded-3xl relative z-10" />
              ) : (
                <Trophy className="text-primary-container relative z-10 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]" size={40} />
              )}
              {currentUser?.role === 'ADMIN' && (
                <div className="absolute inset-0 bg-surface/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Edit2 size={16} className="text-primary" />
                </div>
              )}
            </motion.div>
            <div>
              <h2 className="font-display text-2xl font-bold text-on-surface tracking-tighter uppercase leading-none">
                {t('app_title')}
              </h2>
              <p className="text-[10px] text-primary/60 font-mono mt-2 uppercase tracking-[0.25em] font-medium">
                {t('badminton_league')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="px-5 mb-4 mt-2">
            <div className="text-[10px] text-on-surface-variant font-display opacity-30 uppercase tracking-[0.3em]">{t('league_control')}</div>
          </div>
          {renderSidebarItem('Rankings', BarChart3)}
          {renderSidebarItem('Match Center', Flag)}
          {currentUser?.role === 'ADMIN' && renderSidebarItem('Team Shuffle', Shuffle)}
        </div>

        {currentUser?.role === 'ADMIN' && (
          <div className="p-6 border-t border-white/5">
            <button 
              onClick={startTournament}
              className="w-full relative group overflow-hidden bg-secondary text-on-secondary-container py-4 rounded-2xl font-mono text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(203,242,49,0.3)] hover:shadow-[0_0_40px_rgba(203,242,49,0.5)] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                <Trophy size={16} />
                {t('start_tournament')}
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-28 pb-32 md:pb-12 px-6 md:px-12 max-w-container-max mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {activeScreen === 'Tournament' && (
            <motion.div
              key="tournament"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="font-display text-4xl md:text-7xl uppercase tracking-[0.1em]">
                  <span className="text-primary-container text-glow-primary">{t('season')}</span> {t('tournament')}
                </h2>
                <p className="text-on-surface-variant/60 max-w-xl mx-auto italic uppercase text-[10px] tracking-[0.3em] font-display">
                  Single elimination brackets
                </p>
              </div>

              {!tournamentInfo ? (
                <div className="glass-panel p-12 text-center rounded-3xl border border-primary/20">
                    <h3 className="font-display text-xl uppercase tracking-[0.2em] text-primary-container">{t('tournament_setup')}</h3>
                    <p className="mt-4 text-on-surface/60 font-sans max-w-lg mx-auto">
                       Select top 4 active players to generate a knockout bracket. Matches will be logged automatically.
                    </p>
                    <button 
                      onClick={startTournament}
                      className="mt-8 px-10 py-4 bg-primary text-on-primary rounded-2xl font-mono uppercase tracking-[0.3em] font-black hover:shadow-[0_0_40px_rgba(0,245,255,0.4)] hover:bg-primary/90 transition-all shadow-2xl active:scale-95">
                       {t('initialize_bracket')}
                    </button>
                </div>
              ) : (
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-primary/20">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                     <div>
                       <h3 className="font-display text-2xl uppercase tracking-[0.2em] text-primary-container text-glow-primary">{t('bracket')} {tournamentInfo.round}</h3>
                       <p className="text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mt-2">{t('active_encounters')}</p>
                     </div>
                     {tournamentInfo.round === 'COMPLETE' && (
                       <div className="px-4 py-2 mt-4 md:mt-0 bg-secondary/10 border border-secondary/30 text-secondary font-display text-xs uppercase tracking-widest rounded-lg">
                         Tournament Concluded
                       </div>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                     {tournamentInfo.matches.map((match, i) => (
                       <div key={match.id} className={`bg-surface-container-high/40 border ${match.winner ? 'border-primary/20' : 'border-outline/20'} p-6 rounded-2xl relative ${i === 2 ? 'md:col-span-2 max-w-lg mx-auto w-full border-primary-container/50 shadow-[0_0_30px_rgba(0,245,255,0.1)]' : ''}`}>
                          {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface px-3 font-display text-[10px] text-primary-container tracking-widest uppercase">{t('grand_final')}</div>}
                          {!match.winner && tournamentInfo.round !== 'COMPLETE' && (
                             <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 bg-surface/80 backdrop-blur-sm transition-all rounded-2xl">
                               <span className="font-display text-xs text-primary tracking-widest uppercase">{t('select_winner')}</span>
                             </div>
                          )}
                          <div className="space-y-4 relative z-20 pointer-events-none">
                             {[match.player1, match.player2].map((p, pIdx) => (
                               <div key={p.id} className={`flex items-center gap-4 p-3 rounded-xl border ${match.winner?.id === p.id ? 'border-secondary/50 bg-secondary/10 shadow-[0_0_15px_rgba(203,242,49,0.1)]' : match.winner ? 'opacity-30 border-primary/5 grayscale' : 'border-primary/10 bg-surface/30'}`}>
                                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                                  <span className="font-display text-sm tracking-widest uppercase flex-1 text-on-surface">{p.name}</span>
                                  {match.winner?.id === p.id && <Trophy size={16} className="text-secondary" />}
                               </div>
                             ))}
                          </div>
                          
                          {/* Invisible overlay buttons to select winner */}
                          {!match.winner && tournamentInfo.round !== 'COMPLETE' && (
                            <div className="absolute inset-0 z-30 flex flex-col">
                               <button onClick={() => handleTournamentWin(match.id, match.player1)} className="flex-1 hover:bg-white/5 rounded-t-2xl transition-colors" />
                               <div className="h-4" />
                               <button onClick={() => handleTournamentWin(match.id, match.player2)} className="flex-1 hover:bg-white/5 rounded-b-2xl transition-colors" />
                            </div>
                          )}
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeScreen === 'Match Center' && (
            <motion.div
              key="match-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-16"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                  <h2 className="font-display text-5xl md:text-8xl text-on-surface font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">
                    {t('resolution_title')}
                  </h2>
                  <p className="text-on-surface-variant/40 font-mono text-xs uppercase tracking-[0.4em] font-bold">{t('precision_outcome')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-5 py-2 rounded-2xl bg-surface-container border border-primary/20 flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-primary/60">Match</span>
                    <span className="font-display text-xl font-black text-primary-container" style={{textShadow: '0 0 10px rgba(0,245,255,0.8)'}}>#{matchNumber}</span>
                  </div>
                  {currentUser?.role === 'ADMIN' && (
                    <button onClick={handleResetMatch} className="px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest text-error hover:bg-error/10 border border-error/20 hover:border-error/40 transition-all flex items-center gap-2">
                      <RefreshCw size={12} /> Reset Match
                    </button>
                  )}
                </div>
              </div>

              {/* Active Match Slot */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-secondary/50 via-primary-container/50 to-secondary/50 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="glass-panel rounded-[3.5rem] p-8 md:p-16 relative overflow-hidden border-white/5">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
                   
                   <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 items-center relative z-10">
                    {/* Team A */}
                    <div className="space-y-10">
                       <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-[0_0_20px_rgba(203,242,49,0.2)]">
                            <span className="font-display text-2xl font-black text-secondary uppercase drop-shadow-[0_0_10px_rgba(203,242,49,0.5)]">A</span>
                         </div>
                         <div>
                            <h3 className="font-display text-2xl text-on-surface tracking-widest uppercase font-bold">{t('team_alpha')}</h3>
                            <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-[0.3em] font-bold">Home Team</p>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-6">
                         {(activeMatch?.teamAlpha || [players[4], players[3]]).filter(Boolean).map((p, idx) => (
                           <div key={idx} className="flex items-center gap-6 p-6 bg-surface-container/40 rounded-[2rem] border border-white/5 hover:border-secondary/30 transition-all group/item shadow-xl">
                             <img src={p.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-white/10 group-hover/item:border-secondary/50 transition-all shadow-2xl" alt="" />
                             <div className="flex-1">
                                <div className="text-on-surface font-display text-lg uppercase tracking-wider font-extrabold group-hover/item:text-secondary transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-[10px] font-mono text-on-surface-variant/40 mt-1 uppercase tracking-widest font-bold">Elite Player</div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>

                    {/* VS Center */}
                    <div className="flex flex-col items-center gap-8 py-10 lg:py-0">
                      <div className="relative">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-x-[-40px] inset-y-[-40px] border border-primary/10 rounded-full border-dashed" 
                        />
                        <div className="w-28 h-28 rounded-full bg-surface-container border-2 border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.8)] z-10 relative">
                          <span className="font-display text-4xl text-primary-container italic font-black drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]">VS</span>
                        </div>
                      </div>
                      
                      {activeMatch?.referee && (
                        <div className="flex flex-col items-center">
                          <div className="px-4 py-1.5 bg-surface-container-high rounded-full border border-white/10 flex items-center gap-2 mb-4">
                            <Scale size={14} className="text-primary/60" />
                            <span className="text-[9px] font-mono text-primary/60 uppercase tracking-[0.2em] font-bold">{t('referee')}</span>
                          </div>
                          <img src={activeMatch.referee.avatar} className="w-16 h-16 rounded-2xl border-2 border-white/10 object-cover shadow-2xl transition-transform hover:scale-110" alt="" />
                          <div className="font-display text-sm text-on-surface mt-3 uppercase tracking-widest font-bold">{activeMatch.referee.name}</div>
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="space-y-10">
                       <div className="flex items-center gap-6 justify-end">
                         <div className="text-right">
                            <h3 className="font-display text-2xl text-on-surface tracking-widest uppercase font-bold">{t('team_omega')}</h3>
                            <p className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] font-bold">Away Team</p>
                         </div>
                         <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(0,245,255,0.2)]">
                            <span className="font-display text-2xl font-black text-primary-container uppercase drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">B</span>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-6">
                         {(activeMatch?.teamOmega || [players[1], players[2]]).filter(Boolean).map((p, idx) => (
                           <div key={idx} className="flex items-center gap-6 p-6 bg-surface-container/40 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all group/item shadow-xl flex-row-reverse">
                             <img src={p.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-white/10 group-hover/item:border-primary/50 transition-all shadow-2xl" alt="" />
                             <div className="flex-1 text-right">
                                <div className="text-on-surface font-display text-lg uppercase tracking-wider font-extrabold group-hover/item:text-primary transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-[10px] font-mono text-on-surface-variant/40 mt-1 uppercase tracking-widest font-bold">Top Seed</div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                   </div>

                   {/* Quick Result Selector */}
                   <div className="mt-20 pt-16 border-t border-white/5 relative z-10">
                      <div className="text-center mb-10">
                         <div className="inline-block px-6 py-2 bg-white/5 rounded-full border border-white/5 font-mono text-[10px] uppercase tracking-[0.4em] text-on-surface-variant font-bold">
                            {t('declare_result')}
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <ResultButton 
                          label={t('alpha_win')}
                          Icon={Trophy} 
                          color="secondary" 
                          onClick={() => handleConfirmMatch('ALPHA')}
                        />
                        <ResultButton 
                          label={t('draw')}
                          Icon={Scale} 
                          color="neutral" 
                          onClick={() => handleConfirmMatch('DRAW')}
                        />
                        <ResultButton 
                          label={t('omega_win')}
                          Icon={Trophy} 
                          color="primary" 
                          onClick={() => handleConfirmMatch('OMEGA')}
                        />
                      </div>
                   </div>
                </div>
              </div>

              {/* Match History */}
              <div className="glass-panel rounded-3xl p-8 overflow-hidden space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl md:text-2xl uppercase tracking-[0.2em] text-on-surface">{t('match_history')}</h3>
                      {currentUser?.role === 'ADMIN' && matchHistory.length > 0 && (
                        <button 
                          onClick={handleDeleteAllHistory}
                          className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-error hover:bg-error/10 border border-error/20 hover:border-error/40 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                          title="Hapus Semua Riwayat"
                        >
                          <Trash2 size={12} /> Clear All
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60 font-sans tracking-wide uppercase">{t('archived_logs')}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-colors" size={14} />
                      <input 
                        type="text" 
                        placeholder={t('search_player')} 
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="bg-surface-container/50 border border-primary/10 rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:border-primary/50 transition-all w-40 font-display text-[10px] tracking-widest placeholder:opacity-40"
                      />
                    </div>
                    {/* Filter by outcome */}
                    <div className="relative border border-primary/10 rounded-lg bg-surface-container/50 focus-within:border-primary/50 transition-all px-3 py-2 flex items-center gap-2">
                       <Filter size={14} className="text-primary/40" />
                       <select 
                         value={historyFilter} 
                         onChange={(e) => setHistoryFilter(e.target.value as any)}
                         className="bg-transparent border-none focus:outline-none font-display text-[10px] tracking-widest uppercase cursor-pointer"
                       >
                         <option value="ALL">{t('all_outcomes')}</option>
                         <option value="ALPHA">{t('alpha_win')}</option>
                         <option value="OMEGA">{t('omega_win')}</option>
                         <option value="DRAW">{t('draw')}</option>
                       </select>
                    </div>
                    {/* Sort by date */}
                    <div className="relative border border-primary/10 rounded-lg bg-surface-container/50 focus-within:border-primary/50 transition-all px-3 py-2 flex items-center gap-2">
                       <Activity size={14} className="text-primary/40" />
                       <select 
                         value={historySort} 
                         onChange={(e) => setHistorySort(e.target.value as any)}
                         className="bg-transparent border-none focus:outline-none font-display text-[10px] tracking-widest uppercase cursor-pointer"
                       >
                         <option value="DATE_DESC">{t('newest_first')}</option>
                         <option value="DATE_ASC">{t('oldest_first')}</option>
                       </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredMatchHistory.map((match, index) => (
                    <motion.div 
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 md:p-5 rounded-2xl bg-surface-container/30 border border-primary/5 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-between"
                    >
                      <div className="flex flex-col gap-1 min-w-32 w-full md:w-auto text-center md:text-left">
                        <div className="font-display text-[10px] tracking-widest uppercase text-on-surface-variant/50">
                          {new Date(match.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {match.referee && (
                          <div className="font-display text-[8px] tracking-[0.2em] uppercase text-primary/60 flex items-center justify-center md:justify-start gap-1">
                             <Scale size={10} /> Ref: {match.referee.name}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-stretch md:items-center gap-2 md:gap-4 w-full">
                         {/* Alpha */}
                         <div className={`p-3 md:p-4 rounded-xl flex items-center gap-2 md:gap-4 justify-between md:justify-end bg-surface/50 border ${match.outcome === 'ALPHA' ? 'border-secondary/30 shadow-[0_0_15px_rgba(203,242,49,0.1)]' : 'border-primary/5'}`}>
                            <div className="flex -space-x-2 md:-space-x-3 order-2 md:order-1">
                              {match.teamAlpha.map(p => (
                                p && <img key={p.id} src={p.avatar} alt={p.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-surface/50 object-cover shadow-sm bg-surface-container" />
                              ))}
                            </div>
                            <div className="flex flex-col items-start md:items-end order-1 md:order-2">
                              <span className="font-display text-[9px] md:text-[10px] tracking-widest text-on-surface uppercase font-bold">{match.teamAlpha[0]?.name} &</span>
                              <span className="font-display text-[9px] md:text-[10px] tracking-widest text-on-surface uppercase font-bold">{match.teamAlpha[1]?.name || 'TBD'}</span>
                            </div>
                            {match.outcome === 'ALPHA' && <Trophy size={14} className="text-secondary order-3" />}
                         </div>
                         
                         <div className="font-display text-[10px] md:text-xs italic opacity-40 px-2 tracking-[0.2em] text-center my-1 md:my-0">VS</div>

                         {/* Omega */}
                         <div className={`p-3 md:p-4 rounded-xl flex items-center gap-2 md:gap-4 justify-between md:justify-start bg-surface/50 border ${match.outcome === 'OMEGA' ? 'border-primary-container/30 shadow-[0_0_15px_rgba(0,245,255,0.1)]' : 'border-primary/5'}`}>
                            {match.outcome === 'OMEGA' && <Trophy size={14} className="text-primary-container" />}
                            <div className="flex flex-col items-start">
                              <span className="font-display text-[9px] md:text-[10px] tracking-widest text-on-surface uppercase font-bold">{match.teamOmega[0]?.name} &</span>
                              <span className="font-display text-[9px] md:text-[10px] tracking-widest text-on-surface uppercase font-bold">{match.teamOmega[1]?.name || 'TBD'}</span>
                            </div>
                            <div className="flex -space-x-2 md:-space-x-3">
                              {match.teamOmega.map(p => (
                                p && <img key={p.id} src={p.avatar} alt={p.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-surface/50 object-cover shadow-sm bg-surface-container" />
                              ))}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center min-w-24 justify-end gap-3">
                        <span className={`font-display text-[10px] px-3 py-1 rounded tracking-[0.2em] border uppercase ${
                          match.outcome === 'ALPHA' ? 'text-secondary border-secondary/30 bg-secondary/5' : 
                          match.outcome === 'OMEGA' ? 'text-primary-container border-primary-container/30 bg-primary-container/5' : 
                          'text-on-surface border-outline/30 bg-surface'
                        }`}>
                          {match.outcome === 'DRAW' ? t('draw') : match.outcome === 'ALPHA' ? t('alpha_win') : t('omega_win')}
                        </span>
                        {currentUser?.role === 'ADMIN' && (
                          <button 
                            onClick={() => handleDeleteMatch(match.id)}
                            className="p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20"
                            title="Hapus Match"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredMatchHistory.length === 0 && (
                    <div className="py-12 text-center text-on-surface-variant/50 font-display text-sm tracking-widest uppercase border border-dashed border-primary/10 rounded-2xl">
                      No match records found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeScreen === 'Rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 md:space-y-16 relative"
            >
              {/* Fixed Season Badge - Top Right */}
              <div className="absolute top-0 right-0 md:top-4 z-20 flex items-center justify-center scale-[0.6] md:scale-100 origin-top-right">
                {/* Orbiting shuttlecock */}
                <div className="absolute w-44 h-44 animate-[spin_4s_linear_infinite] pointer-events-none">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 0 8px rgba(0,245,255,1))'}}>
                      <circle cx="12" cy="18" r="4" fill="rgba(0,245,255,0.25)" stroke="#00f5ff" strokeWidth="1.5"/>
                      <line x1="9" y1="15" x2="6" y2="4" stroke="#00f5ff" strokeWidth="1.3" strokeLinecap="round"/>
                      <line x1="12" y1="14" x2="12" y2="2" stroke="#00f5ff" strokeWidth="1.3" strokeLinecap="round"/>
                      <line x1="15" y1="15" x2="18" y2="4" stroke="#00f5ff" strokeWidth="1.3" strokeLinecap="round"/>
                      <line x1="6" y1="4" x2="12" y2="2" stroke="#00f5ff" strokeWidth="1.3" strokeLinecap="round"/>
                      <line x1="18" y1="4" x2="12" y2="2" stroke="#00f5ff" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                {/* Outer glow ring */}
                <div className="w-36 h-36 rounded-full border border-primary/30 absolute pointer-events-none animate-[spin_10s_linear_infinite_reverse]" 
                  style={{boxShadow: '0 0 20px rgba(0,245,255,0.2), inset 0 0 20px rgba(0,245,255,0.05)'}} />
                {/* Inner dashed ring */}
                <div className="w-32 h-32 rounded-full border border-dashed border-primary/15 absolute pointer-events-none animate-[spin_6s_linear_infinite]" />
                {/* Center badge */}
                <div className="relative z-10 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-surface-container"
                  style={{
                    border: '2px solid rgba(0,245,255,0.5)',
                    boxShadow: '0 0 40px rgba(0,245,255,0.3), 0 0 80px rgba(0,245,255,0.1), inset 0 0 30px rgba(0,245,255,0.07)'
                  }}>
                  <span className="font-display text-[9px] uppercase tracking-[0.3em] text-primary/50 font-bold">Current</span>
                  <span className="font-display text-sm uppercase tracking-wide text-primary-container font-black leading-tight text-center px-1" 
                    style={{textShadow: '0 0 15px rgba(0,245,255,1), 0 0 30px rgba(0,245,255,0.5)'}}>
                    {currentSeason}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <div className="space-y-4 max-w-[70%] sm:max-w-none relative z-30">
                  <h2 className="font-display text-5xl sm:text-6xl md:text-9xl text-on-surface font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">
                    {t('global')} <span className="text-primary-container text-glow-primary" style={{textShadow: '0 0 20px rgba(0,245,255,0.8), 0 0 60px rgba(0,245,255,0.4), 0 0 120px rgba(0,245,255,0.2)'}}>{t('rankings')}</span>
                  </h2>
                  <p className="text-on-surface-variant/40 font-mono text-xs uppercase tracking-[0.4em] font-bold">{t('performance_metrics')}</p>
                </div>
                <div className="flex items-center gap-4">
                  {currentUser?.role === 'ADMIN' && (
                    <button onClick={() => setEditingPlayer('NEW')} className="px-5 py-3 bg-secondary text-on-secondary-container rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(203,242,49,0.3)] hover:shadow-[0_0_30px_rgba(203,242,49,0.5)] transition-all flex items-center gap-2 active:scale-95 shrink-0">
                      <UserPlus size={14} /> Add Player
                    </button>
                  )}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary-container transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder={t('search_player')} 
                      className="bg-surface-container border border-white/5 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary-container/40 transition-all w-48 font-display text-[11px] tracking-widest placeholder:opacity-30 shadow-2xl"
                    />
                  </div>
                </div>
              </div>

               {/* Podium Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-end pt-10">
                <div className="order-2 lg:order-1 scale-95 opacity-80 hover:opacity-100 transition-all duration-300">{players[1] && <RankingCard player={players[1]} rank="02" />}</div>
                <div className="order-1 lg:order-2">{players[0] && <RankingCard player={players[0]} rank="01" isMVP />}</div>
                <div className="order-3 lg:order-3 scale-90 opacity-60 hover:opacity-100 transition-all duration-300">{players[2] && <RankingCard player={players[2]} rank="03" />}</div>
              </div>

              {/* Detailed Leaderboard */}
              <div className="glass-panel rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.4)]">
                <div className="px-10 py-10 bg-surface-container/30 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none" />
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-[0.2em] text-on-surface font-bold leading-none">{t('full_leaderboard')}</h3>
                    <p className="text-[10px] font-mono text-primary/40 mt-2 uppercase tracking-widest font-bold">Roster Manifest V.2.4</p>
                  </div>
                  <button className="p-4 bg-surface-container rounded-2xl border border-white/5 text-on-surface-variant hover:text-primary hover:border-primary/30 hover:bg-white/10 transition-all shadow-lg active:scale-95">
                    <Filter size={20} />
                  </button>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-on-surface-variant/30 font-mono text-[10px] uppercase tracking-[0.4em] border-b border-white/5 font-bold">
                        <th className="px-10 py-8">{t('rank')}</th>
                        <th className="px-10 py-8">{t('athlete_profile')}</th>
                        <th className="px-10 py-8">{t('statistics')}</th>
                        <th className="px-10 py-8">{t('rating')}</th>
                        <th className="px-10 py-8 text-right font-bold">{t('points')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {players.map((p, i) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={p.id} 
                          onClick={() => setSelectedPlayer(p)}
                          className="hover:bg-white/[0.02] transition-all group cursor-pointer relative"
                        >
                          <td className="px-10 py-10 font-mono text-xl text-on-surface-variant/20 group-hover:text-primary/40 transition-colors font-black italic">
                            #{String(i + 1).padStart(2, '0')}
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex items-center gap-6">
                              <div className="relative shrink-0">
                                <img src={p.avatar} className="w-14 h-14 rounded-2xl border border-white/10 object-cover group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500" alt="" />
                                {i < 3 && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-secondary text-on-secondary-container flex items-center justify-center border-2 border-surface"><Trophy size={10} /></div>}
                              </div>
                              <div>
                                <span className="block font-display text-base tracking-widest text-on-surface group-hover:text-primary transition-colors uppercase font-bold">{p.name}</span>
                                <span className="text-[10px] text-on-surface-variant/40 font-mono tracking-widest uppercase font-bold mt-0.5 block">{t('elite_division')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-primary font-mono text-xs font-bold">{p.matches} <span className="text-on-surface-variant/20 uppercase tracking-[0.2em] font-medium ml-1">{t('mts')}</span></span>
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(dot => <div key={dot} className={`w-2 h-1 rounded-full ${dot <= (p.winRate/20) ? 'bg-secondary' : 'bg-white/5'}`} />)}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex items-center gap-6">
                              <span className="text-sm font-black font-mono text-on-surface-variant/80 italic w-12">{p.winRate}%</span>
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${p.winRate}%` }}
                                  transition={{ duration: 1, delay: i * 0.05 }}
                                  className="h-full bg-primary-container shadow-[0_0_15px_#00f5ff]" 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-10 text-right font-mono text-3xl text-primary font-black tracking-tighter drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                            <div className="flex items-center justify-end gap-6">
                              <span>{p.points.toLocaleString()}</span>
                              {(currentUser?.role === 'ADMIN' || currentUser?.user_id === p.user_id) && (
                                <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(p); }} className="p-2 bg-surface-container rounded-lg border border-white/5 hover:border-secondary/50 hover:text-secondary transition-all text-on-surface-variant opacity-0 group-hover:opacity-100">
                                  <Edit2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-primary/5">
                  {players.map((p, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="p-5 flex items-center justify-between group active:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-display text-lg text-primary/20 w-6 tracking-tighter">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="relative">
                          <img src={p.avatar} className="w-12 h-12 rounded-xl border border-primary/10 object-cover" alt="" />
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-background ${i < 3 ? 'bg-secondary' : 'bg-primary/20'}`} />
                        </div>
                        <div>
                          <div className="font-display text-xs tracking-wider text-on-surface uppercase font-bold">{p.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-[8px] text-on-surface-variant/40 font-display uppercase tracking-widest">{p.matches} MTS</div>
                            <div className="w-1 h-1 rounded-full bg-primary/20" />
                            <div className="text-[8px] text-primary/60 font-display uppercase tracking-widest font-bold">{p.winRate}% WR</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl text-primary-container text-glow-primary tracking-tighter">
                          {p.points.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-on-surface-variant/30 font-display uppercase tracking-[0.2em] font-bold">{t('pts_short')}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeScreen === 'Team Shuffle' && (
            <motion.div
              key="shuffle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-16"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                  <h2 className="font-display text-5xl md:text-8xl text-on-surface font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">
                    {t('team')} <span className="text-primary-container text-glow-primary">{t('shuffle')}</span>
                  </h2>
                  <p className="text-on-surface-variant/40 font-mono text-xs uppercase tracking-[0.4em] font-bold">{t('algorithmic_matchmaking_active')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[700px] items-stretch">
                {/* Left: Active Pool */}
                <div className="lg:col-span-4 glass-panel rounded-[2.5rem] p-6 lg:p-8 flex flex-col relative border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] pointer-events-none" />
                  <div className="flex justify-between items-center mb-8 pb-5 border-b border-white/5 relative z-10">
                    <div>
                      <h3 className="font-display text-lg text-on-surface tracking-wider font-bold uppercase leading-none">
                        {t('active_roster')}
                      </h3>
                      <p className="text-[9px] font-mono text-primary/40 mt-1 uppercase tracking-widest font-bold">Selection Pool</p>
                    </div>
                    <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 text-[10px] font-mono text-primary-container font-black tracking-widest">{activePool.filter(p => p.selected).length} ACTIVE</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-on-surface">
                    {activePool.map((p, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={p.id} 
                        className={`flex items-center gap-2 p-2 md:p-3 rounded-2xl transition-all group border ${
                          restingPlayerIds.has(p.id)
                            ? 'bg-yellow-500/5 border-yellow-500/20 opacity-60'
                            : lastMatchPlayerIds.has(p.id)
                            ? 'bg-orange-500/5 border-orange-500/20'
                            : p.selected ? 'bg-primary/5 border-primary/20 shadow-lg'
                            : 'bg-surface-container-high/40 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <img src={p.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover border border-white/10 shadow-lg" alt="" />
                            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface ${p.selected ? 'bg-secondary' : 'bg-on-surface-variant/20'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`font-display text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors truncate ${p.selected ? 'text-on-surface' : 'text-on-surface-variant/40'}`} title={p.name}>{p.name}</div>
                            <div className="text-[7px] md:text-[8px] font-mono text-on-surface-variant/30 tracking-[0.15em] uppercase mt-0.5 font-bold flex items-center gap-1">
                              LVL: {p.rank}
                              {restingPlayerIds.has(p.id) && <span className="text-yellow-400">• REST</span>}
                              {!restingPlayerIds.has(p.id) && lastMatchPlayerIds.has(p.id) && <span className="text-orange-400">• BARU MAIN</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const newPool = [...activePool];
                            newPool[idx].selected = !newPool[idx].selected;
                            setActivePool(newPool);
                          }}
                          className={`shrink-0 w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-all duration-500 border outline-none group cursor-pointer overflow-hidden
                            ${p.selected 
                              ? 'bg-secondary/20 border-secondary/50 shadow-[0_0_15px_rgba(203,242,49,0.2)]' 
                              : 'bg-surface/50 border-white/10 hover:bg-surface-container hover:border-white/20'
                            }`}
                        >
                          <div className={`absolute inset-0 transition-opacity duration-500 ${p.selected ? 'opacity-100' : 'opacity-0'} bg-gradient-to-r from-transparent to-secondary/20`} />
                          <div 
                            className={`absolute top-[3px] md:top-[3px] w-4 h-4 md:w-5 md:h-5 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center
                              ${p.selected 
                                ? 'bg-secondary translate-x-[26px] md:translate-x-[30px] shadow-[0_0_10px_rgba(203,242,49,0.5)]' 
                                : 'bg-on-surface-variant/50 translate-x-[3px] group-hover:bg-on-surface-variant/70'
                              }`} 
                          >
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${p.selected ? 'bg-surface shadow-inner scale-100' : 'bg-surface/50 scale-0 group-hover:scale-50'}`} />
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setRestingPlayerIds(prev => {
                              const next = new Set(prev);
                              if (next.has(p.id)) next.delete(p.id);
                              else next.add(p.id);
                              return next;
                            });
                          }}
                          className={`shrink-0 p-1.5 rounded-lg transition-all border ${
                            restingPlayerIds.has(p.id) 
                              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' 
                              : 'bg-transparent border-transparent text-on-surface-variant/30 hover:text-yellow-400/60 hover:border-yellow-500/20'
                          }`}
                          title="Rest / Istirahat"
                        >
                          <Coffee size={14} />
                        </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Center: Logic Engine */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-8 lg:py-0 scale-90 md:scale-100">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden sm:overflow-visible">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] border border-primary/10 rounded-full border-dashed" 
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="w-[240px] h-[240px] md:w-[400px] md:h-[400px] border border-secondary/10 rounded-full border-dashed" 
                    />
                  </div>

                  <div className="relative group z-10 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                    <div className="absolute inset-x-[-20px] inset-y-[-20px] border border-white/10 rounded-full border-dashed animate-spin-slow opacity-20" />
                    <motion.button 
                      onClick={handleShuffle}
                      disabled={isShuffling || activePool.filter(p => p.selected).length < 4}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 100px rgba(0,245,255,0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      className="relative z-10 w-56 h-56 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center bg-surface-container border-2 border-primary-container/30 transition-all duration-700 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                      {isShuffling && <ShufflingParticles />}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 via-transparent to-transparent opacity-50" />
                      
                      <motion.div
                        animate={isShuffling ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="relative z-10 mb-6 drop-shadow-[0_0_20px_rgba(0,245,255,0.5)]"
                      >
                        <Shuffle size={80} className="text-primary-container" />
                      </motion.div>
                      
                      <div className="relative z-10 text-center">
                        <span className="font-mono text-[11px] tracking-[0.5em] text-on-surface-variant font-black uppercase block h-4">
                          {activePool.filter(p => p.selected).length < 4 ? 'MIN 4 REQUIRED' : isShuffling ? (retryCount > 0 ? `RETRYING ${retryCount}/3` : 'OPTIMIZING') : '\u00A0'}
                        </span>
                        <h4 className="font-display text-3xl text-primary-container tracking-tighter mt-2 uppercase font-black">{t('match_long')}</h4>
                      </div>
                    </motion.button>
                  </div>
                </div>

                 {/* Right: Output */}
                <div className="lg:col-span-4 flex flex-col gap-8 justify-center h-full">
                  <TeamOutcomeCard 
                    teamName="A" 
                    color="secondary" 
                    isShuffling={isShuffling} 
                    players={shuffledResult?.teamAlpha || [players[0], players[3]].filter(Boolean)} 
                  />
                  
                  <div className="flex items-center justify-center relative py-6">
                    <div className="w-full h-px bg-white/5 absolute" />
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center relative z-20 font-display italic text-xl tracking-widest text-on-surface-variant/40 border-white/10 shadow-2xl">VS</div>
                  </div>
                  
                  <TeamOutcomeCard 
                    teamName="B" 
                    color="primary" 
                    isShuffling={isShuffling} 
                    players={shuffledResult?.teamOmega || [players[1], players[2]].filter(Boolean)} 
                  />

                  <AnimatePresence>
                    {(shuffledResult?.referee || isShuffling) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-[2rem] bg-surface-container/40 border border-white/5 flex items-center justify-between shadow-2xl relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="w-12 h-12 bg-secondary/10 rounded-2xl text-secondary flex items-center justify-center border border-secondary/20 shadow-lg">
                             <Scale size={24} />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-on-surface-variant/40 uppercase tracking-[0.3em] font-bold">{t('referee')}</div>
                            <div className={`font-display text-lg uppercase tracking-wider text-on-surface font-black leading-none mt-1.5 ${isShuffling ? 'animate-pulse opacity-20' : ''}`}>
                              {isShuffling ? 'ASSIGNING...' : shuffledResult?.referee?.name}
                            </div>
                          </div>
                        </div>
                        {!isShuffling && shuffledResult?.referee && (
                          <img src={shuffledResult.referee.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-500" alt="" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isShuffling && shuffledResult && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveMatch(shuffledResult);
                        setActiveScreen('Match Center');
                      }}
                      className="mt-4 py-5 bg-secondary text-on-secondary-container rounded-[2rem] font-display text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(203,242,49,0.3)] hover:shadow-[0_0_60px_rgba(203,242,49,0.5)] transition-all border border-secondary-container active:scale-95"
                    >
                      {t('init_resolution_protocol')}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {editingPlayer && <PlayerModal player={editingPlayer} isAdmin={currentUser?.role === 'ADMIN'} onClose={() => setEditingPlayer(null)} onSave={handleSavePlayer} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} currentSeason={currentSeason} />}

      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetailsModal 
            player={selectedPlayer} 
            onClose={() => setSelectedPlayer(null)} 
            allMatches={matchHistory}
            isAdmin={currentUser?.role === 'ADMIN'}
            onDeleteMatch={handleDeleteMatch}
            currentSeason={currentSeason}
          />
        )}
        
        {isAlertsOpen && <AlertsModal onClose={() => setIsAlertsOpen(false)} notifications={notifications} />}
        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-around items-center py-4 bg-surface-container/60 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl">
        <MobileNavItem 
          icon={Flag} 
          label={t('match')} 
          active={activeScreen === 'Match Center'} 
          onClick={() => setActiveScreen('Match Center')} 
        />
        <MobileNavItem 
          icon={TrendingUp} 
          label={t('rankings')} 
          active={activeScreen === 'Rankings'} 
          onClick={() => setActiveScreen('Rankings')} 
        />
        <MobileNavItem 
          icon={Shuffle} 
          label={t('team_shuffle')} 
          active={activeScreen === 'Team Shuffle'} 
          onClick={() => setActiveScreen('Team Shuffle')} 
        />
        <MobileNavItem 
          icon={Trophy} 
          label={t('tournament')} 
          active={activeScreen === 'Tournament'} 
          onClick={startTournament} 
        />
      </nav>
    </div>
  );
}


function ResultButton({ label, Icon, color, onClick }: { label: string, Icon: any, color: 'primary' | 'secondary' | 'neutral', onClick?: () => void }) {
  const styles = {
    primary: 'border-white/5 text-primary-container bg-primary/5 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(0,245,255,0.2)] hover:bg-primary/10',
    secondary: 'border-white/5 text-secondary bg-secondary/5 hover:border-secondary/50 hover:shadow-[0_0_40px_rgba(203,242,49,0.2)] hover:bg-secondary/10',
    neutral: 'border-white/5 text-on-surface-variant bg-white/5 hover:border-white/20 hover:bg-white/10'
  };

  return (
    <button 
      onClick={onClick}
      className={`py-12 px-8 rounded-[2rem] border flex flex-col items-center justify-center gap-6 transition-all duration-500 group relative overflow-hidden active:scale-95 ${styles[color]}`}
    >
      <div className={`absolute top-0 inset-x-0 h-1 transition-all duration-700 opacity-20 group-hover:opacity-100
        ${color === 'secondary' ? 'bg-secondary shadow-[0_0_15px_#cbf231]' : color === 'primary' ? 'bg-primary shadow-[0_0_15px_#00f5ff]' : 'bg-white/20'}`} 
      />
      <Icon size={40} className="group-hover:scale-125 transition-transform duration-500 group-hover:-rotate-6" />
      <span className="font-mono text-[11px] font-black tracking-[0.4em] uppercase">{label}</span>
    </button>
  );
}

function RankingCard({ player, rank, isMVP }: { player: Player, rank: string, isMVP?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`glass-panel rounded-[2.5rem] p-8 md:p-10 space-y-8 relative overflow-hidden group border-opacity-30 hover:-translate-y-4 transition-all duration-500
      ${isMVP ? 'bg-secondary/5 border-secondary/50 shadow-[0_0_60px_rgba(203,242,49,0.1)] pt-16 md:pt-20 z-10' : 'bg-surface/60 hover:border-primary/40'}`}>
      
      <div className={`absolute top-0 right-0 px-8 py-3 font-display text-[12px] font-bold tracking-[0.4em] uppercase bg-surface-container-highest/80 backdrop-blur-md border-l border-b border-white/5
        ${isMVP ? 'text-secondary' : 'text-primary/60'}`}>
        {t('rank')} {rank}
      </div>

      {isMVP && (
        <div className="absolute top-8 left-8 flex items-center justify-center">
           <Trophy size={32} className="text-secondary text-glow-secondary animate-float" />
        </div>
      )}

      <div className="flex flex-col items-center text-center space-y-8 relative z-10">
        <div className="relative group/avatar">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="relative"
          >
            <img 
              src={player.avatar} 
              className={`w-36 h-36 rounded-[3rem] object-cover border-4 shadow-2xl transition-all duration-700
                ${isMVP ? 'border-secondary shadow-secondary/5' : 'border-white/10 group-hover:border-primary/50'}`} 
              alt="" 
            />
            {isMVP && <div className="absolute inset-0 rounded-[3rem] border-2 border-secondary/50 animate-ping-slow scale-110 pointer-events-none" />}
          </motion.div>
          <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 glass-panel border-2 rounded-2xl px-6 py-2 font-display text-2xl font-black shadow-2xl
            ${isMVP ? 'border-secondary text-secondary text-glow-secondary' : 'border-primary/40 text-primary-container shadow-primary/10'}`}>
            #{parseInt(rank)}
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <h4 className={`font-display text-3xl font-extrabold uppercase tracking-tight transition-all group-hover:tracking-wider
            ${isMVP ? 'text-secondary text-glow-secondary' : 'text-on-surface'}`}>
            {player.name}
          </h4>
          <p className="font-mono text-[10px] text-primary/40 tracking-[0.5em] font-bold uppercase">
             PRO LEAGUE DIV 1
          </p>
        </div>
      </div>

      <div className="space-y-6 pt-10 relative z-10">
        <div className="absolute inset-x-0 h-px bg-white/5 -top-2" />
        <DetailedStat label="Smash Precision" value={player.smashPower} isMVP={isMVP} />
        <DetailedStat label="Arena Coverage" value={player.agilityRating} isMVP={isMVP} />
        <DetailedStat label="Core Stamina" value={player.stamina || 88} isMVP={isMVP} />
        
        <div className="pt-6 text-center">
            <span className={`font-mono text-4xl font-black italic tracking-tighter ${isMVP ? 'text-secondary text-glow-secondary' : 'text-primary-container'}`}>
              {player.points.toLocaleString()}
            </span>
            <span className="text-[10px] font-display text-on-surface-variant opacity-30 ml-2 tracking-widest">{t('pts_short')}</span>
        </div>
      </div>
    </div>
  );
}

function DetailedStat({ label, value, isMVP }: { label: string, value: number, isMVP?: boolean }) {
  const brandColor = isMVP ? 'bg-secondary' : 'bg-primary-container';
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant opacity-60 font-medium">{label}</span>
        <span className={`font-mono text-xs font-bold ${isMVP ? 'text-secondary' : 'text-primary'}`}>{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${brandColor} shadow-[0_0_10px_currentColor]`}
        />
      </div>
    </div>
  );
}
function TeamOutcomeCard({ teamName, color, isShuffling, players }: { teamName: string, color: 'primary' | 'secondary', isShuffling: boolean, players: Player[] }) {
  const brandColor = color === 'secondary' ? 'text-secondary' : 'text-primary-container';
  const borderColor = color === 'secondary' ? 'border-secondary/30' : 'border-primary/30';
  const glowShadow = color === 'secondary' ? 'shadow-[0_0_40px_rgba(203,242,49,0.1)]' : 'shadow-[0_0_40px_rgba(0,245,255,0.1)]';
  
  return (
    <div className={`glass-panel border-2 ${borderColor} rounded-[2.5rem] p-8 relative overflow-hidden ${glowShadow} group transition-all duration-700`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-${color === 'secondary' ? 'secondary' : 'primary-container'} opacity-20`} />
      
      {isShuffling && (
        <motion.div 
          initial={{ top: -100 }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-${color === 'secondary' ? 'secondary' : 'primary-container'}/10 to-transparent pointer-events-none z-20`} 
        />
      )}

      <div className="flex justify-between items-center mb-8 relative z-10">
        <h3 className={`font-display text-2xl font-black italic tracking-tighter ${brandColor}`}>TEAM {teamName}</h3>
        <span className={`font-mono text-[9px] font-black ${brandColor} px-3 py-1 bg-white/5 rounded-lg border ${borderColor} uppercase tracking-widest`}>
          {isShuffling ? 'SEARCHING...' : `TEAM RATING: ${Math.floor(Math.random() * 20) + 80}.4`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 relative z-10">
        {players.map((p, i) => (
          <div key={i} className="flex flex-col items-center bg-white/5 p-4 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all shadow-xl">
            <div className={`w-20 h-20 rounded-[1.5rem] border-2 ${borderColor} overflow-hidden mb-4 relative shadow-2xl transition-transform group-hover:scale-105 duration-500`}>
              <img src={p.avatar} className={`w-full h-full object-cover ${isShuffling ? 'blur-md grayscale' : ''} transition-all duration-500`} alt="" />
              {isShuffling && (
                <motion.div 
                   animate={{ opacity: [0.1, 0.4, 0.1] }}
                   transition={{ repeat: Infinity, duration: 0.3 }}
                   className={`absolute inset-0 bg-${color === 'secondary' ? 'secondary' : 'primary-container'}/20`}
                />
              )}
            </div>
            <span className={`font-mono text-[10px] text-on-surface text-center truncate w-full uppercase font-black tracking-widest ${isShuffling ? 'opacity-20 animate-pulse' : ''}`}>
              {isShuffling ? 'LOADING...' : p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, rank, isMVP, color }: { player: Player, rank: string, isMVP?: boolean, color: 'primary' | 'secondary' }) {
  const { t } = useTranslation();
  const brandColor = color === 'secondary' ? 'text-secondary' : 'text-primary-container';
  const glowClass = color === 'secondary' ? 'text-glow-secondary' : 'text-glow-primary';
  const borderColor = color === 'secondary' ? 'border-secondary/50' : 'border-primary/30';
  
  return (
    <div className={`glass-panel rounded-2xl p-6 space-y-6 relative overflow-hidden transition-all duration-500 hover:-translate-y-2
      ${isMVP ? 'h-[440px] border-secondary/50 shadow-[0_0_30px_rgba(203,242,49,0.15)] bg-secondary/5 z-20' : 'h-[380px]'}`}>
      <div className={`absolute top-0 right-0 px-4 py-1 font-display text-[10px] tracking-widest border-l border-b ${borderColor}
        ${color === 'secondary' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary-container'}`}>
        {t('rank')} {rank}
      </div>
      
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          {isMVP && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-secondary text-glow-secondary animate-bounce">
              <Trophy size={32} />
            </div>
          )}
          <img 
            src={player.avatar} 
            alt={player.name}
            className={`w-24 h-24 rounded-full border-2 ${color === 'secondary' ? 'border-secondary shadow-[0_0_20px_rgba(203,242,49,0.4)]' : 'border-primary-container shadow-[0_0_15px_rgba(0,245,255,0.3)]'} object-cover`}
          />
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface border rounded-full w-10 h-10 flex items-center justify-center font-display font-bold text-lg
            ${color === 'secondary' ? 'border-secondary text-secondary shadow-[0_0_10px_rgba(203,242,49,0.3)]' : 'border-primary-container text-primary-container shadow-[0_0_10px_rgba(0,245,255,0.2)]'}`}>
            {parseInt(rank)}
          </div>
        </div>
        
        <div className="pt-2">
          <h4 className={`font-display text-xl uppercase tracking-wider ${brandColor} ${glowClass}`}>{player.name}</h4>
          <p className="font-display text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
            W/L: {player.matches - 10}/{10}
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <StatBar label="Smash Power" value={player.smashPower} color={color} />
        <StatBar label="Agility Rating" value={player.agilityRating} color={color} />
        {player.stamina && <StatBar label="Stamina" value={player.stamina} color={color} />}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string, value: number, color: 'primary' | 'secondary' }) {
  const brandColor = color === 'secondary' ? 'bg-secondary' : 'bg-primary-container';
  const glowShadow = color === 'secondary' ? 'shadow-[0_0_12px_rgba(203,242,49,0.5)]' : 'shadow-[0_0_12px_rgba(0,245,255,0.5)]';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.3em] text-on-surface-variant font-bold">
        <span>{label}</span>
        <span className={color === 'secondary' ? 'text-secondary' : 'text-primary'}>{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${brandColor} ${glowShadow} transition-all duration-1000`} 
        />
      </div>
    </div>
  );
}

function PlayerDetailsModal({ 
  player, 
  onClose,
  allMatches,
  isAdmin,
  onDeleteMatch,
  currentSeason
}: { 
  player: Player, 
  onClose: () => void,
  allMatches: Match[],
  isAdmin: boolean,
  onDeleteMatch: (id: string) => void,
  currentSeason: string
}) {
  const { t } = useTranslation();

  const getDivision = (wins: number) => {
    if (wins === 0) return 'Beginner Division';
    if (wins < 5) return 'Intermediate Division';
    if (wins < 15) return 'Advanced Division';
    if (wins < 30) return 'Pro Division';
    return 'Elite Division';
  };
  const wins = Math.round(player.matches * (player.winRate / 100));
  const division = getDivision(wins);

  const playerMatches = allMatches.filter(m => 
    m.teamAlpha.some(p => p.id === player.id) || 
    m.teamOmega.some(p => p.id === player.id)
  ).map(m => {
    const isAlpha = m.teamAlpha.some(p => p.id === player.id);
    const opponents = isAlpha ? m.teamOmega : m.teamAlpha;
    const opponentNames = opponents.map(p => p.name).join(' & ');
    
    let result = 'DRAW';
    if (m.outcome === 'ALPHA') result = isAlpha ? 'WIN' : 'LOSS';
    if (m.outcome === 'OMEGA') result = isAlpha ? 'LOSS' : 'WIN';
    
    return {
      id: m.id,
      date: new Date(m.date).toLocaleDateString(),
      opponent: opponentNames,
      score: '-', // Score is not tracked in DB
      result: result
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 backdrop-blur-3xl bg-black/80"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="w-full max-w-5xl max-h-[90vh] glass-panel rounded-[3rem] overflow-hidden flex flex-col relative border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        {/* Header Decoration */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-[4rem] blur-xl opacity-20 group-hover:opacity-60 transition-opacity" />
              <img src={player.avatar} className="w-40 h-40 md:w-56 md:h-56 rounded-[3.5rem] object-cover border-4 border-white/10 shadow-2xl relative z-10" alt="" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-6 py-2 rounded-2xl font-display text-xl font-black shadow-[0_10px_30px_rgba(203,242,49,0.4)] z-20 whitespace-nowrap">
                RANK #{player.rank}
              </div>
            </div>
            <div className="text-center md:text-left space-y-4">
              <h2 className="font-display text-4xl md:text-7xl text-on-surface font-black uppercase tracking-tighter text-glow-primary leading-none">
                {player.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <span className="px-3 py-1 bg-surface-container rounded-full border border-primary/20 text-on-surface-variant font-mono text-[9px] uppercase tracking-widest font-bold">
                  {division}
                </span>
                <span className="text-[10px] font-mono text-secondary font-black uppercase tracking-[0.4em]">
                   {currentSeason} ACTIVE
                </span>
              </div>
              <p className="text-on-surface-variant/40 font-mono text-[9px] uppercase tracking-[0.4em] font-bold">South Jakarta Region</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-white/5 rounded-full border border-white/5 text-on-surface-variant hover:text-primary hover:bg-white/10 transition-all active:scale-90"
          >
            <X size={32} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 pt-0 space-y-16 custom-scrollbar relative z-10 text-on-surface">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox label="Total Matches" value={player.matches} icon={Activity} />
            <StatBox label="Win Rate" value={`${player.winRate}%`} icon={TrendingUp} />
            <StatBox label="Season Points" value={player.points.toLocaleString()} icon={Trophy} />
            <StatBox label="Winning Streak" value="5 WIN" icon={Zap} color="secondary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Technical Skills */}
            <div className="space-y-10 group">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-display text-lg tracking-[0.5em] uppercase text-on-surface font-black italic">
                   PLAYER STATISTICS
                </h3>
                <div className="w-12 h-0.5 bg-primary/40 group-hover:w-24 transition-all duration-700" />
              </div>
              <div className="space-y-8 text-on-surface">
                <DetailedStat label="Smash Power" value={player.smashPower} />
                <DetailedStat label="Court Coverage" value={player.agilityRating} />
                <DetailedStat label="Stamina" value={player.stamina || 85} />
                <DetailedStat label="Reaction Speed" value={92} />
              </div>
            </div>

            {/* Match History */}
            <div className="space-y-10 group">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-display text-lg tracking-[0.5em] uppercase text-on-surface font-black italic flex items-center gap-4">
                   <History size={20} className="text-primary/60" /> MATCH HISTORY
                </h3>
              </div>
              <div className="space-y-4">
                {playerMatches.map((m, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex justify-between items-center group/log hover:border-primary/20 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono text-xs font-black shadow-lg ${m.result === 'WIN' ? 'bg-secondary/10 text-secondary border border-secondary/20' : m.result === 'LOSS' ? 'bg-error/10 text-error border border-error/20' : 'bg-surface-variant text-on-surface border-outline'}`}>
                          {m.result[0]}
                       </div>
                       <div>
                         <div className="font-mono text-[10px] text-on-surface-variant/30 uppercase tracking-widest font-bold mb-1.5">{m.date}</div>
                         <div className="font-display text-base text-on-surface font-black uppercase tracking-wider group-hover/log:text-primary transition-colors">vs {m.opponent}</div>
                         <div className="text-[10px] font-mono text-on-surface-variant/40 mt-1 uppercase font-bold tracking-widest">{m.score}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-mono text-sm font-black tracking-[0.2em] italic ${m.result === 'WIN' ? 'text-secondary text-glow-secondary' : m.result === 'LOSS' ? 'text-error' : 'text-on-surface'}`}>
                        {m.result}
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => onDeleteMatch(m.id)}
                          className="p-2 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-transparent hover:border-red-500/30"
                          title="Hapus Match"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {playerMatches.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant font-mono text-xs uppercase tracking-widest">
                    Belum ada riwayat pertandingan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-10 bg-white/5 border-t border-white/5 flex justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          <button className="relative z-10 px-12 py-4 bg-primary/10 border border-primary/20 rounded-full text-primary font-mono text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-on-primary transition-all duration-500 shadow-2xl active:scale-95">
            FULL CAREER STATS
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBox({ label, value, icon: Icon, color = 'primary' }: { label: string, value: string | number, icon: any, color?: 'primary' | 'secondary' }) {
  const textColor = color === 'secondary' ? 'text-secondary' : 'text-primary-container';
  return (
    <div className="bg-surface-container-high/40 border border-primary/5 p-5 rounded-2xl flex flex-col items-center text-center">
      <div className={`p-2 bg-primary/10 rounded-lg mb-3 ${color === 'secondary' ? 'text-secondary' : 'text-primary'}`}>
        <Icon size={18} />
      </div>
      <div className={`font-display text-xl font-black ${textColor} tracking-tight`}>{value}</div>
      <div className="text-[8px] font-display text-on-surface-variant/40 uppercase tracking-[0.2em] mt-1">{label}</div>
    </div>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-all ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
    >
      <div className={`${active ? 'bg-primary-container text-on-primary-container p-2 rounded-full shadow-[0_0_15px_#00f5ff]' : 'text-on-surface-variant'}`}>
        <Icon size={20} />
      </div>
      <span className="text-[8px] font-display uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ShufflingParticles() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 1 
          }}
          animate={{ 
            x: (Math.random() - 0.5) * 400, 
            y: (Math.random() - 0.5) * 400, 
            scale: [0, 1, 0.5, 0], 
            opacity: [1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: Math.random() * 1.5,
            ease: "easeOut"
          }}
          className="absolute left-1/2 top-1/2 w-1 h-1 bg-primary-container shadow-[0_0_8px_#00f5ff] rounded-full"
        />
      ))}
    </div>
  );
}

function AlertsModal({ onClose, notifications }: { onClose: () => void, notifications: {id: string; type: string; title: string; desc: string; time: string}[] }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-container-highest/80 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-container-high/50">
          <div className="flex items-center gap-3">
            <Bell className="text-primary-container" size={20} />
            <h2 className="font-display text-lg uppercase tracking-widest text-on-surface">{t('live_alerts')}</h2>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[9px] font-mono font-bold rounded-full">{notifications.length}</span>
            )}
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-on-surface transition-colors border border-white/5 active:scale-90">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/40 font-mono text-xs uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
              Belum ada notifikasi
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-2xl flex gap-4 items-start border ${
                n.type === 'match' ? 'bg-secondary/5 border-secondary/10' :
                n.type === 'system' ? 'bg-primary/5 border-primary/10' :
                'bg-surface/30 border-outline/10'
              }`}>
                <div className={`p-2 rounded-lg shrink-0 mt-1 ${
                  n.type === 'match' ? 'bg-secondary/20 text-secondary' :
                  n.type === 'system' ? 'bg-primary-container/20 text-primary-container' :
                  'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {n.type === 'match' ? <Flag size={16} /> : n.type === 'system' ? <Zap size={16} /> : <Trophy size={16} />}
                </div>
                <div>
                  <div className="font-display text-xs tracking-widest text-on-surface uppercase mb-1">{n.title}</div>
                  <p className="text-[10px] text-on-surface-variant/80 font-sans leading-relaxed">{n.desc}</p>
                  <span className={`text-[8px] uppercase tracking-[0.2em] mt-2 block ${
                    n.type === 'match' ? 'text-secondary/40' : 'text-primary/40'
                  }`}>{n.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
