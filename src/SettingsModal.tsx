import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Trash2, Check, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Player } from './types';

interface SettingsModalProps {
  onClose: () => void;
  currentSeason: string;
}

export default function SettingsModal({ onClose, currentSeason }: SettingsModalProps) {
  const [seasonName, setSeasonName] = useState(currentSeason);
  const [isSavingSeason, setIsSavingSeason] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [statRequests, setStatRequests] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const [{ data: reqData }, { data: pData }] = await Promise.all([
      supabase.from('stat_requests').select('*').eq('status', 'PENDING').order('created_at', { ascending: false }),
      supabase.from('players').select('*')
    ]);
    if (reqData) setStatRequests(reqData);
    if (pData) setPlayers(pData);
  };

  const handleSaveSeason = async () => {
    setIsSavingSeason(true);
    // Always save to localStorage as primary
    localStorage.setItem('pb_current_season', seasonName);
    // Try to save to DB (may fail due to RLS, that's OK)
    await supabase.from('league_settings').upsert({ id: 1, current_season: seasonName });
    setIsSavingSeason(false);
    window.location.reload();
  };

  const handleResetSeason = async () => {
    if (window.confirm('PERINGATAN: Ini akan mereset poin, match, dan win rate SEMUA pemain menjadi 0. Smash power, agility, dan stamina tidak akan berubah. Lanjutkan?')) {
      setIsResetting(true);
      await supabase.from('players').update({ points: 0, matches: 0, win_rate: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
      setIsResetting(false);
      window.location.reload();
    }
  };

  const handleApproveRequest = async (req: any) => {
    // Update player
    await supabase.from('players').update({
      matches: req.matches,
      win_rate: req.win_rate,
      points: req.points,
      smash_power: req.smash_power,
      agility_rating: req.agility_rating,
      stamina: req.stamina
    }).eq('id', req.player_id);

    // Update request
    await supabase.from('stat_requests').update({ status: 'APPROVED' }).eq('id', req.id);
    
    // Remove from UI
    setStatRequests(prev => prev.filter(r => r.id !== req.id));
    alert('Statistik disetujui!');
    window.location.reload(); // Refresh to update main screen
  };

  const handleRejectRequest = async (reqId: string) => {
    if (window.confirm('Tolak pengajuan update statistik ini?')) {
      await supabase.from('stat_requests').update({ status: 'REJECTED' }).eq('id', reqId);
      setStatRequests(prev => prev.filter(r => r.id !== reqId));
    }
  };

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
        className="w-full max-w-2xl bg-surface-container rounded-3xl border border-primary/20 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-container-high/50 shrink-0">
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-on-surface text-glow-primary">
              Admin Dashboard
            </h2>
            <p className="text-[10px] font-sans text-on-surface-variant/60 tracking-wider mt-1">
              Manajemen liga dan persetujuan pemain
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-on-surface-variant transition-colors border border-white/5 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Season Management */}
          <div className="space-y-4">
            <h3 className="font-display text-xs text-secondary tracking-[0.2em] uppercase font-bold border-b border-white/5 pb-2">Season Control</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="font-display text-[10px] uppercase tracking-widest text-primary/80">Nama Season</label>
                <input
                  type="text"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3 font-display tracking-wider text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <button onClick={handleSaveSeason} disabled={isSavingSeason} className="px-6 py-3 rounded-2xl bg-secondary text-on-secondary-container font-mono text-[10px] uppercase tracking-widest font-black active:scale-95 transition-all">
                {isSavingSeason ? 'Saving...' : 'Ubah Nama'}
              </button>
            </div>
            <div>
              <button onClick={handleResetSeason} disabled={isResetting} className="px-6 py-3 rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white font-mono text-[10px] uppercase tracking-widest font-black active:scale-95 transition-all w-full flex items-center justify-center gap-2">
                <RefreshCw size={14} />
                {isResetting ? 'Mereset...' : 'Reset Poin & Mulai Season Baru'}
              </button>
              <p className="text-xs text-on-surface-variant/40 mt-2">Tombol ini akan menghapus semua Point, Win Rate, dan Matches ke 0. Statistik performa (Smash, dll) tetap utuh.</p>
            </div>
          </div>

          {/* Stat Update Requests */}
          <div className="space-y-4">
            <h3 className="font-display text-xs text-primary-container tracking-[0.2em] uppercase font-bold border-b border-white/5 pb-2">Pending Stat Requests</h3>
            
            {statRequests.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant/40 font-mono text-xs uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                Tidak ada pengajuan update statistik
              </div>
            ) : (
              <div className="space-y-4">
                {statRequests.map(req => {
                  const player = players.find(p => p.id === req.player_id);
                  if (!player) return null;
                  
                  return (
                    <div key={req.id} className="p-4 bg-surface-container-high/30 border border-white/5 rounded-2xl flex flex-col gap-4">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <img src={player.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-display text-xs uppercase tracking-widest text-on-surface font-bold">{player.name}</p>
                          <p className="text-[10px] font-mono text-primary/60">Mengajukan perubahan statistik</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-surface/30 rounded text-center">
                          <p className="text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Points</p>
                          <p className="text-secondary font-mono text-xs font-bold">{player.points} <span className="opacity-40">➔</span> {req.points}</p>
                        </div>
                        <div className="p-2 bg-surface/30 rounded text-center">
                          <p className="text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Matches</p>
                          <p className="text-on-surface font-mono text-xs">{player.matches} <span className="opacity-40">➔</span> {req.matches}</p>
                        </div>
                        <div className="p-2 bg-surface/30 rounded text-center">
                          <p className="text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Win Rate</p>
                          <p className="text-on-surface font-mono text-xs">{player.winRate || player.win_rate || 0}% <span className="opacity-40">➔</span> {req.win_rate}%</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => handleRejectRequest(req.id)} className="px-4 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest text-error hover:bg-error/10 border border-transparent hover:border-error/20 transition-all flex items-center gap-1">
                          <X size={12} /> Tolak
                        </button>
                        <button onClick={() => handleApproveRequest(req)} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[9px] font-mono uppercase tracking-widest font-black shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] transition-all flex items-center gap-1">
                          <Check size={12} /> Setujui Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
