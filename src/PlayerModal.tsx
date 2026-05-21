import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, Image, Save, Trophy, Activity, Zap, Shield } from 'lucide-react';
import { Player } from './types';
import { useTranslation } from 'react-i18next';

interface PlayerModalProps {
  player: Player | 'NEW' | null;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function PlayerModal({ player, isAdmin, onClose, onSave }: PlayerModalProps) {
  const { t } = useTranslation();
  const isNew = player === 'NEW';
  
  const [name, setName] = useState(player && player !== 'NEW' ? player.name : '');
  const [avatar, setAvatar] = useState(player && player !== 'NEW' ? player.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop');
  
  const [matches, setMatches] = useState(player && player !== 'NEW' ? player.matches : 0);
  const [winRate, setWinRate] = useState(player && player !== 'NEW' ? player.winRate : 0);
  const [points, setPoints] = useState(player && player !== 'NEW' ? player.points : 0);
  const [smashPower, setSmashPower] = useState(player && player !== 'NEW' ? player.smashPower : 70);
  const [agilityRating, setAgilityRating] = useState(player && player !== 'NEW' ? player.agilityRating : 70);
  const [stamina, setStamina] = useState(player && player !== 'NEW' ? player.stamina : 70);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !avatar.trim()) return;
    
    setIsSaving(true);
    await onSave({ 
      name, avatar, 
      matches: Number(matches), 
      winRate: Number(winRate), 
      points: Number(points),
      smashPower: Number(smashPower),
      agilityRating: Number(agilityRating),
      stamina: Number(stamina)
    });
    setIsSaving(false);
  };

  if (!player) return null;

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
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-container-high/50 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display text-xl uppercase tracking-widest text-on-surface text-glow-primary">
              {isNew ? 'Tambah Pemain' : 'Ubah Data Pemain'}
            </h2>
            <p className="text-[10px] font-sans text-on-surface-variant/60 tracking-wider mt-1">
              {isNew ? 'Daftarkan atlet baru ke dalam liga' : 'Ubah profil dan statistik atlet'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-on-surface-variant transition-colors border border-white/5 relative z-10 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col gap-4 items-center shrink-0 w-full md:w-auto">
              <img src={avatar} alt="Avatar Preview" className="w-32 h-32 rounded-3xl border-2 border-primary/30 object-cover shadow-2xl" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }} />
            </div>

            <div className="space-y-4 flex-1 w-full">
              <div className="space-y-1.5">
                <label className="font-display text-[10px] uppercase tracking-widest text-primary/80 flex items-center gap-2">
                  <User size={12} /> Nama Pemain
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama..."
                  required
                  className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3 font-display tracking-wider text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-display text-[10px] uppercase tracking-widest text-primary/80 flex items-center gap-2">
                  <Image size={12} /> URL Avatar
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3 font-display tracking-wider text-on-surface focus:outline-none focus:border-primary/50 transition-all text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display text-xs text-secondary tracking-[0.2em] uppercase font-bold">Statistik Performa</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-secondary/20 to-transparent" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                  <Activity size={10} /> Matches
                </label>
                <input type="number" min="0" value={matches} onChange={(e) => setMatches(e.target.value)} className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-2.5 font-mono text-on-surface focus:outline-none focus:border-secondary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                  <Trophy size={10} /> Win Rate (%)
                </label>
                <input type="number" min="0" max="100" value={winRate} onChange={(e) => setWinRate(e.target.value)} className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-2.5 font-mono text-on-surface focus:outline-none focus:border-secondary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-secondary flex items-center gap-1.5 font-bold">
                  <Trophy size={10} /> Points
                </label>
                <input type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full bg-surface-container-high/50 border border-secondary/30 rounded-xl px-4 py-2.5 font-mono text-secondary focus:outline-none focus:border-secondary transition-all font-black shadow-[0_0_10px_rgba(203,242,49,0.1)]" />
              </div>

              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5 mt-2">
                  <Zap size={10} className="text-primary" /> Smash Power
                </label>
                <input type="number" min="0" max="100" value={smashPower} onChange={(e) => setSmashPower(e.target.value)} className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-2.5 font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5 mt-2">
                  <Activity size={10} className="text-primary" /> Agility
                </label>
                <input type="number" min="0" max="100" value={agilityRating} onChange={(e) => setAgilityRating(e.target.value)} className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-2.5 font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5 mt-2">
                  <Shield size={10} className="text-primary" /> Stamina
                </label>
                <input type="number" min="0" max="100" value={stamina} onChange={(e) => setStamina(e.target.value)} className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-2.5 font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 flex justify-between items-center border-t border-primary/10 mt-6 relative z-20 bg-surface-container">
            <div>
              {!isNew && isAdmin && (
                <button type="button" onClick={async () => {
                  if (window.confirm('Apakah Anda yakin ingin menghapus pemain ini?')) {
                    // @ts-ignore
                    await import('./lib/supabase').then(m => m.supabase.from('players').delete().eq('id', player.id));
                    window.location.reload();
                  }
                }} className="px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                  Hapus Pemain
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all active:scale-95">
                Batal
              </button>
              <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-2xl bg-primary text-on-primary text-[10px] font-mono uppercase tracking-[0.2em] font-black shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95">
                {isSaving ? 'Menyimpan...' : <><Save size={14} /> {isAdmin ? 'Simpan Data' : 'Simpan Profil & Ajukan Update Stat'}</>}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
