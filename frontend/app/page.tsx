'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoinTransition, setShowCoinTransition] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const enteredCode = accessCode.trim().toUpperCase();
    const enteredId = studentId.trim();

    if (!enteredId) {
      setError('Recruit Call-sign / Student ID is required.');
      setLoading(false);
      return;
    }

    if (enteredCode !== 'AICDAWEB3CTF') {
      setError('ACCESS DENIED: Invalid Lab Access Code. Authorization failed.');
      setLoading(false);
      return;
    }

    // Save session in localStorage
    localStorage.setItem('aicda_student_id', enteredId);
    localStorage.setItem('aicda_access_granted', 'true');

    // Pre-warm backend in background (never blocks UI)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      fetch(`${apiUrl}/api/v1/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: enteredCode, student_id: enteredId }),
      }).catch(() => {});
    } catch (err) {}

    // Show spinning Bitcoin transition and navigate directly to labs
    setShowCoinTransition(true);
    setTimeout(() => {
      window.location.href = '/labs';
    }, 1800);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-cyber-card/90 border border-cyber-border rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,65,0.1)]">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl border-2 border-cyber-green/50 bg-black/60 flex items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            <img src="/logo.jpg" alt="AICDA Logo" className="w-full h-full object-contain" />
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-india-saffron"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-india-white"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-india-green"></span>
            <span className="text-xs font-bold text-cyber-green tracking-widest uppercase ml-1">
              ANONYMOUS INDIA CYBER DEFENCE ACADEMY (AICDA)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
            CRYPTOCURRENCY PENETRATION TESTING LAB
          </h1>
          <p className="text-xs text-cyber-cyan font-bold tracking-wider mt-1 uppercase">
            ADVANCED WEB3, SMART CONTRACT &amp; DEFI SECURITY AUDITING RANGE
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            ANONYMOUS INDIA CYBER DEFENCE ACADEMY (AICDA)
          </p>
        </div>

        <div className="mb-6 p-4 rounded-xl border border-cyber-red/50 bg-cyber-red/10 text-xs text-gray-300">
          <div className="flex items-center gap-2 text-cyber-red font-bold text-xs uppercase tracking-wide mb-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>OPERATIONAL DIRECTIVE &amp; ANTI-BOT POLICY</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Welcome to the official <span className="text-white font-semibold">Anonymous India Cyber Defence Academy (AICDA) Cryptocurrency Penetration Testing Lab</span>.
            Automated brute-force scanners (<span className="text-white font-semibold">Burp Suite Active Scanner, FFUF, DirBuster, SQLmap, Gobuster</span>) are <span className="text-cyber-red font-bold">STRICTLY PROHIBITED</span>. Heavy automated bursts will trigger automated IP firewall bans to ensure server stability. Students must execute targeted attacks using <span className="text-cyber-green font-semibold">manual analysis, browser DevTools, curl, and custom Python scripts</span>.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
              Recruit Call-sign / Student ID
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                placeholder="e.g. OP_VIKRAM_77"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-black/80 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
              Lab Access Code
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                placeholder="Enter AICDA Access Code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-black/80 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-cyber-red bg-cyber-red/20 text-xs text-cyber-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyber-green text-black font-bold text-sm tracking-wider uppercase hover:bg-cyber-green/90 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
          >
            {loading ? (
              <span>AUTHENTICATING OPERATIVE...</span>
            ) : (
              <>
                <span>ENTER CRYPTOCURRENCY LAB</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-cyber-border/60 text-center text-[11px] text-gray-500 flex items-center justify-between">
          <span>CLASSIFIED TRAINING RANGE</span>
          <span className="text-cyber-green font-mono">10 RECON &amp; AUDIT CHALLENGES</span>
        </div>
      </div>

      {showCoinTransition && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(#ffcc00_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-600/20 blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col items-center">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes btc-3d-spin {
                0% { transform: perspective(800px) rotateY(0deg); }
                50% { transform: perspective(800px) rotateY(180deg); }
                100% { transform: perspective(800px) rotateY(360deg); }
              }
              .btc-spinner-active {
                display: inline-block;
                animation: btc-3d-spin 1.6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite !important;
                transform-style: preserve-3d;
                -webkit-transform-style: preserve-3d;
                will-change: transform;
              }
            ` }} />

            <div
              className="btc-spinner-active w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center rounded-full overflow-hidden"
              style={{
                clipPath: 'circle(46% at 50% 50%)',
                WebkitClipPath: 'circle(46% at 50% 50%)',
                filter: 'drop-shadow(0 0 35px rgba(255,215,0,0.85))'
              }}
            >
              <img
                src="/bitcoin.png"
                alt="Golden Bitcoin"
                className="w-full h-full object-cover scale-[1.08]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
            </div>

            <div className="mt-8 text-center space-y-2 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-ping" />
                <span className="text-xs font-mono font-bold text-cyber-green tracking-widest uppercase">
                  CRYPTOGRAPHIC HANDSHAKE VERIFIED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wider uppercase text-glow">
                DECRYPTING AICDA WAR ROOM...
              </h2>
              <p className="text-xs font-mono text-gray-400">
                Operative <span className="text-cyber-green font-bold">{studentId}</span> authenticated. Initializing EVM Range...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
