'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Award,
  RefreshCw,
  Download,
  Trash2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface LeaderboardEntry {
  student_id: string;
  score: number;
  flags_count: number;
  last_active: string;
}

interface SubmissionLog {
  student_id: string;
  challenge_slug: string;
  verified_at: string;
  flag_hash: string;
  ip_hash: string;
}

interface AdminStats {
  total_students: number;
  total_submissions: number;
  per_challenge_solves: Record<string, number>;
  leaderboard: LeaderboardEntry[];
  recent_submissions: SubmissionLog[];
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aicda-web3-api.onrender.com';

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/stats`, {
        headers: { 'X-Admin-Key': token },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setAuthenticated(true);
      } else if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem('aicda_admin_token');
        setAuthError('Session expired or invalid admin token.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('aicda_admin_token');
    if (savedToken) {
      setAdminToken(savedToken);
      fetchStats(savedToken);
    }
  }, []);

  // 5-second Auto Refresh Polling
  useEffect(() => {
    if (!authenticated || !autoRefresh || !adminToken) return;
    const interval = setInterval(() => {
      fetchStats(adminToken);
    }, 5000);
    return () => clearInterval(interval);
  }, [authenticated, autoRefresh, adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('aicda_admin_token', data.token);
        setAdminToken(data.token);
        setAuthenticated(true);
        fetchStats(data.token);
      } else {
        setAuthError(data.message || 'Incorrect Administrator Password.');
      }
    } catch (e) {
      setAuthError('Failed to communicate with CTF Backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetStudent = async (studentId: string) => {
    if (!confirm(`Are you sure you want to reset all flags and score for student ${studentId}?`)) {
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/reset-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminToken,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        fetchStats(adminToken);
      }
    } catch (e) {
      alert('Failed to reset student.');
    }
  };

  const handleResetAll = async () => {
    const confirmText = prompt('CRITICAL WARNING: This will permanently wipe ALL students and submissions.\nType "PERMANENTLY_RESET_ALL_CTF" to confirm:');
    if (confirmText !== 'PERMANENTLY_RESET_ALL_CTF') return;

    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/reset-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminToken,
        },
        body: JSON.stringify({ confirmation: 'PERMANENTLY_RESET_ALL_CTF' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.receipt) {
        alert('All CTF submissions and student data have been wiped clean. Receipt: ' + data.receipt);
        fetchStats(adminToken);
      }
    } catch (e) {
      alert('Failed to reset CTF database.');
    }
  };

  const handleExportCSV = () => {
    window.open(`${apiUrl}/api/v1/admin/export-csv?auth=${encodeURIComponent(adminToken)}`, '_blank');
  };

  // If Not Authenticated -> Show Password Screen
  if (!authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-cyber-card border border-cyber-green rounded-2xl p-6 sm:p-8 backdrop-blur shadow-[0_0_40px_rgba(0,255,65,0.15)]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl border border-cyber-green/40 bg-black/60 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-cyber-green" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wider">
              ADMIN COMMAND CENTER
            </h2>
            <p className="text-xs text-cyber-green mt-1">
              AICDA OPERATION MONITORING & SCORING SYSTEM
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                Administrator Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter Admin Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black/80 border border-cyber-border focus:border-cyber-green rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg border border-cyber-red bg-cyber-red/20 text-xs text-cyber-red">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyber-green text-black font-bold text-sm hover:bg-cyber-green/90 transition shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/labs" className="text-xs text-gray-500 hover:text-white transition">
              ← Return to Student Labs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-cyber-border bg-cyber-card/80 backdrop-blur px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/labs" className="text-gray-400 hover:text-white transition p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyber-green" />
              <span className="font-bold text-white text-base tracking-wide">
                AICDA ADMIN COMMAND CENTER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition ${
                autoRefresh
                  ? 'border-cyber-green/60 bg-cyber-green/10 text-cyber-green'
                  : 'border-cyber-border bg-black text-gray-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Polling (5s)' : 'Paused'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyber-card border border-cyber-border hover:border-cyber-green text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyber-red/20 border border-cyber-red text-cyber-red hover:bg-cyber-red/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All CTF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-green/10 border border-cyber-green/40 flex items-center justify-center text-cyber-green">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Recruits Joined</p>
              <h3 className="text-2xl font-black text-white">{stats?.total_students || 0}</h3>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Flags Captured</p>
              <h3 className="text-2xl font-black text-white">{stats?.total_submissions || 0}</h3>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-india-saffron/10 border border-india-saffron/40 flex items-center justify-center text-india-saffron">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Flags / Student</p>
              <h3 className="text-2xl font-black text-white">
                {stats?.total_students && stats.total_students > 0
                  ? ((stats?.total_submissions || 0) / stats.total_students).toFixed(1)
                  : '0.0'}
              </h3>
            </div>
          </div>
        </div>

        {/* Challenge Solves Breakdown */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-green" />
            <span>Vulnerability Solve Distribution</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {stats &&
              Object.entries(stats.per_challenge_solves || {}).map(([slug, count]) => (
                <div key={slug} className="p-3 rounded-lg border border-cyber-border/70 bg-black/40 flex items-center justify-between">
                  <span className="font-mono text-gray-300 font-semibold">{slug}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyber-green font-bold">{count} solves</span>
                    <span className="text-gray-500 text-[10px]">
                      ({stats.total_students ? Math.round((count / stats.total_students) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Ranked Leaderboard */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyber-green" />
            <span>Ranked Operative Leaderboard</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-cyber-border">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student Call-sign</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Solves</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {stats?.leaderboard && stats.leaderboard.length > 0 ? (
                  stats.leaderboard.map((student, idx) => (
                    <tr key={student.student_id} className="hover:bg-cyber-green/5 transition">
                      <td className="p-3 font-bold text-white">#{idx + 1}</td>
                      <td className="p-3 font-semibold text-cyber-green">{student.student_id}</td>
                      <td className="p-3 font-bold text-white">{student.score} PTS</td>
                      <td className="p-3 text-gray-300">{student.flags_count} / 10</td>
                      <td className="p-3 text-gray-500 font-mono text-[11px]">{student.last_active}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleResetStudent(student.student_id)}
                          className="px-2 py-1 rounded border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 text-[11px] transition"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No student submissions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions Log (With Hash Anonymization - NO RAW FLAGS) */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyber-cyan" />
            <span>Real-Time Audit Log (Anonymized Hashes Only)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-cyber-border">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Vulnerability Slug</th>
                  <th className="p-3">SHA-256 Flag Hash</th>
                  <th className="p-3">Origin IP Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {stats?.recent_submissions && stats.recent_submissions.length > 0 ? (
                  stats.recent_submissions.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-cyber-green/5 transition">
                      <td className="p-3 text-gray-500 font-mono text-[11px]">{sub.verified_at}</td>
                      <td className="p-3 font-semibold text-white">{sub.student_id}</td>
                      <td className="p-3 text-cyber-green font-mono">{sub.challenge_slug}</td>
                      <td className="p-3 text-gray-400 font-mono text-[11px]">{sub.flag_hash}</td>
                      <td className="p-3 text-gray-500 font-mono text-[11px]">{sub.ip_hash}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Audit log is currently empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
