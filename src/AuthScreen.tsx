import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Trophy, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useTranslation } from 'react-i18next';

export default function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          // Create initial player profile
          const { error: profileError } = await supabase.from('players').insert({
            user_id: data.user.id,
            name: name,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
            rank: 'Neo',
            role: 'USER',
            win_rate: 0,
            points: 0,
            matches: 0,
            smash_power: 70,
            agility_rating: 70,
            stamina: 70
          });
          if (profileError) throw profileError;
        }
        
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-container to-secondary-container rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(0,245,255,0.2)] mb-6 border border-white/10">
            <Trophy size={32} className="text-on-primary-container" />
          </div>
          <h1 className="font-display text-4xl text-on-surface font-black uppercase tracking-tighter text-glow-primary text-center">
            PB CIPTA
          </h1>
          <p className="font-mono text-[10px] text-primary uppercase tracking-[0.4em] font-bold mt-2">
            Badminton League
          </p>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container/40 backdrop-blur-md" />
          <div className="relative z-10">
            <h2 className="font-display text-2xl uppercase tracking-widest text-on-surface font-bold mb-8">
              {isLogin ? 'Initialize Session' : 'Enlist as Player'}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-error shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-mono text-error/80 uppercase tracking-wider">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="font-display text-[10px] uppercase tracking-widest text-primary/80 flex items-center gap-2">
                    <User size={12} /> Player Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3.5 font-display tracking-wider text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="font-display text-[10px] uppercase tracking-widest text-primary/80 flex items-center gap-2">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3.5 font-display tracking-wider text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-display text-[10px] uppercase tracking-widest text-primary/80 flex items-center gap-2">
                  <Lock size={12} /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-high/50 border border-outline/20 rounded-xl px-4 py-3.5 font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-all tracking-[0.2em]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-4 bg-primary text-on-primary rounded-2xl font-mono text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
              >
                {isLoading ? 'Processing...' : isLogin ? 'Access League' : 'Register Profile'}
                {!isLoading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-mono text-on-surface-variant/60 hover:text-primary transition-colors uppercase tracking-[0.2em] font-bold"
              >
                {isLogin ? "Don't have a profile? Register" : 'Already enlisted? Login'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
