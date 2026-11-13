'use client';

import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface FlagSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeSlug: string;
  challengeTitle: string;
  onSuccess: (slug: string) => void;
}

export default function FlagSubmitModal({
  isOpen,
  onClose,
  challengeSlug,
  challengeTitle,
  onSuccess,
}: FlagSubmitModalProps) {
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setLoading(true);
    setMessage(null);

    const studentId = localStorage.getItem('aicda_student_id') || 'anonymous_operative';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aicda-web3-api.onrender.com';

    try {
      const res = await fetch(`${apiUrl}/api/v1/flags/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          challenge_slug: challengeSlug,
          flag: flag.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message || 'Flag Verified! +100 PTS', type: 'success' });
        onSuccess(challengeSlug);
        setTimeout(() => {
          onClose();
          setFlag('');
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Incorrect flag string.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network connection failed. Verify API is running.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-green rounded-xl p-6 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyber-green" />
            <span className="text-white font-bold text-sm">SUBMIT FLAG</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Submitting captured flag for:{' '}
          <span className="text-white font-semibold">{challengeTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-gray-400 uppercase tracking-wider mb-1">
              Flag Format: crypto&#123;...&#125;
            </label>
            <input
              type="text"
              required
              placeholder="crypto{...}"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="w-full bg-black/80 border border-cyber-border focus:border-cyber-green rounded-lg px-3 py-2 text-sm text-cyber-green font-mono focus:outline-none"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-cyber-green/10 border border-cyber-green text-cyber-green'
                  : 'bg-cyber-red/10 border border-cyber-red text-cyber-red'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold bg-cyber-green text-black rounded hover:bg-cyber-green/90 disabled:opacity-50 shadow-[0_0_10px_rgba(0,255,65,0.4)]"
            >
              {loading ? 'Verifying...' : 'Verify Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
