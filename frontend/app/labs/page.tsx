'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import LabCard, { Challenge } from '@/components/LabCard';
import FlagSubmitModal from '@/components/FlagSubmitModal';
import { Shield, RotateCcw, AlertCircle, Layers } from 'lucide-react';

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    slug: 'reentrancy',
    title: 'Smart Contract Reentrancy Attack',
    category: 'Smart Contracts',
    points: 100,
    difficulty: 'HARD',
    synopsis: 'Exploit a vulnerable EtherBank contract that triggers external call fallback before updating internal balance state to drain 10 ETH.',
  },
  {
    id: 2,
    slug: 'access-control',
    title: 'Access Control Failure (Missing onlyOwner)',
    category: 'Smart Contracts',
    points: 100,
    difficulty: 'EASY',
    synopsis: 'Identify an unprivileged governance mint function missing authorization modifiers to mint 1,000,000 unauthorized tokens.',
  },
  {
    id: 3,
    slug: 'delegatecall-collision',
    title: 'Delegatecall Storage Slot Collision',
    category: 'Smart Contracts',
    points: 100,
    difficulty: 'HARD',
    synopsis: 'Exploit storage layout mismatch between Proxy (Slot 0=owner) and Library (Slot 0=operatorCandidate) to hijack proxy contract ownership.',
  },
  {
    id: 4,
    slug: 'weak-randomness',
    title: 'Weak On-Chain Randomness & Block Prediction',
    category: 'DeFi & Wallets',
    points: 100,
    difficulty: 'MEDIUM',
    synopsis: 'Predict deterministic pseudo-random lottery rolls generated via keccak256(prev_blockhash:timestamp) to win the jackpot.',
  },
  {
    id: 5,
    slug: 'signature-malleability',
    title: 'ECDSA Signature Malleability Replay',
    category: 'DeFi & Wallets',
    points: 100,
    difficulty: 'HARD',
    synopsis: 'Compute malleable secp256k1 signature (s\' = n - s) on a gasless voucher to execute an unauthorized second withdrawal, draining 100 ETH.',
  },
  {
    id: 6,
    slug: 'frontend-key-leak',
    title: 'Frontend Mnemonic & Private Key Leakage',
    category: 'Web3 dApp',
    points: 100,
    difficulty: 'EASY',
    synopsis: 'Audit client-side dApp assets (/dapp-config.js) to recover an exposed 12-word seed phrase deriving to the vault governance operator.',
  },
  {
    id: 7,
    slug: 'exchange-hot-wallet',
    title: 'Exchange Hot Wallet API Credentials Leak',
    category: 'Exchange API',
    points: 100,
    difficulty: 'MEDIUM',
    synopsis: 'Exploit an unauthenticated internal exchange metrics endpoint exposing hot wallet private keys to execute unauthorized reserve drainage.',
  },
  {
    id: 8,
    slug: 'p2p-eclipse',
    title: 'P2P Sybil & Eclipse Isolation Attack',
    category: 'Protocol & P2P',
    points: 100,
    difficulty: 'MEDIUM',
    synopsis: 'Saturate a validator node peer table with 50 Sybil peer connections (rate-limit exempt) to isolate the target node from honest network consensus.',
  },
  {
    id: 9,
    slug: 'permit2-phishing',
    title: 'Permit2 Spender Phishing Analysis',
    category: 'Social Engineering',
    points: 100,
    difficulty: 'EASY',
    synopsis: 'Inspect a simulated Uniswap Permit2 EIP-712 offline authorization payload to extract and report the embedded malicious drainer address.',
  },
  {
    id: 10,
    slug: 'cross-chain-replay',
    title: 'Cross-Chain Replay & Nonce Reuse',
    category: 'DeFi & Wallets',
    points: 100,
    difficulty: 'HARD',
    synopsis: 'Replay an Ethereum Mainnet bridge withdrawal voucher on Binance Smart Chain due to missing chainId binding in the message signature hash.',
  },
];

export default function LabsPage() {
  const [studentId, setStudentId] = useState('');
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<{ slug: string; title: string }>({ slug: '', title: '' });
  const [loading, setLoading] = useState(true);

  const fetchProgress = async (sid: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      const res = await fetch(`${apiUrl}/api/v1/student/progress?student_id=${encodeURIComponent(sid)}`);
      if (res.ok) {
        const data = await res.json();
        const solved = data.solved_challenges || [];
        setSolvedChallenges(solved);
        setScore(data.score || 0);
        localStorage.setItem('aicda_solved_slugs', JSON.stringify(solved));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sid = localStorage.getItem('aicda_student_id') || '';
    if (!sid) {
      window.location.href = '/';
      return;
    }
    setStudentId(sid);
    const cached = JSON.parse(localStorage.getItem('aicda_solved_slugs') || '[]');
    if (cached.length > 0) {
      setSolvedChallenges(cached);
      setScore(cached.length * 100);
    }
    fetchProgress(sid);
  }, []);

  const handleResetMyFlags = async () => {
    if (!confirm('Are you sure you want to reset all your captured flags? Your score will return to 0.')) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      const res = await fetch(`${apiUrl}/api/v1/student/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        setSolvedChallenges([]);
        setScore(0);
        localStorage.removeItem('aicda_solved_slugs');
      }
    } catch (e) {
      alert('Failed to reset progress. Check backend connection.');
    }
  };

  const categories = ['ALL', 'Smart Contracts', 'DeFi & Wallets', 'Web3 dApp', 'Exchange API', 'Protocol & P2P', 'Social Engineering'];

  const filteredChallenges = activeCategory === 'ALL'
    ? CHALLENGES
    : CHALLENGES.filter((c) => c.category === activeCategory);

  const handleOpenModal = (slug: string, title: string) => {
    setSelectedChallenge({ slug, title });
    setModalOpen(true);
  };

  const handleSolveSuccess = (slug: string) => {
    if (!solvedChallenges.includes(slug)) {
      const updated = [...solvedChallenges, slug];
      setSolvedChallenges(updated);
      setScore(updated.length * 100);
      localStorage.setItem('aicda_solved_slugs', JSON.stringify(updated));
    }
  };

  return (
    <>
      <Header score={score} solvedCount={solvedChallenges.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cyber-card border border-cyber-border rounded-xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">OPERATIVE CALL-SIGN:</span>
              <span className="text-white font-bold text-sm tracking-wide text-glow">
                {studentId}
              </span>
            </div>
            <p className="text-xs text-cyber-green mt-0.5">
              TARGET: 10 VULNERABILITIES • 100 PTS PER FLAG • TOTAL: 1000 PTS
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetMyFlags}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 transition"
              title="Reset current student progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset My Progress</span>
            </button>
          </div>
        </div>

        {/* Operation Progress Bar */}
        <ProgressBar score={score} total={1000} />

        {/* Filter Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <Layers className="w-4 h-4 text-gray-500 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-semibold ${
                activeCategory === cat
                  ? 'bg-cyber-green text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                  : 'bg-cyber-card border border-cyber-border text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((challenge) => (
            <LabCard
              key={challenge.slug}
              challenge={challenge}
              isSolved={solvedChallenges.includes(challenge.slug)}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      </main>

      <FlagSubmitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        challengeSlug={selectedChallenge.slug}
        challengeTitle={selectedChallenge.title}
        onSuccess={handleSolveSuccess}
      />
    </>
  );
}
