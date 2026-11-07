'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

export interface Challenge {
  slug: string;
  id: number;
  title: string;
  category: string;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  synopsis: string;
}

interface LabCardProps {
  challenge: Challenge;
  isSolved: boolean;
  onOpenModal: (slug: string, title: string) => void;
}

export default function LabCard({ challenge, isSolved, onOpenModal }: LabCardProps) {
  const diffColors = {
    EASY: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10',
    MEDIUM: 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10',
    HARD: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10',
  };

  return (
    <div
      className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 ${
        isSolved
          ? 'bg-cyber-card/90 border-cyber-green shadow-[0_0_20px_rgba(0,255,65,0.15)]'
          : 'bg-cyber-card/40 border-cyber-border hover:border-cyber-green/60 hover:shadow-[0_0_15px_rgba(0,255,65,0.1)]'
      }`}
    >
      {/* Top Badge Row */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-cyber-border px-2 py-0.5 rounded bg-black/40">
            {challenge.category}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffColors[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            <span className="text-xs font-bold text-cyber-green border border-cyber-green/30 bg-cyber-green/10 px-2 py-0.5 rounded">
              +{challenge.points} PTS
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyber-green transition tracking-wide">
          {challenge.id}. {challenge.title}
        </h3>

        {/* Synopsis */}
        <p className="text-xs text-gray-400 mb-4 line-clamp-3 leading-relaxed">
          {challenge.synopsis}
        </p>
      </div>

      {/* Action Row */}
      <div className="pt-3 border-t border-cyber-border/60 flex items-center justify-between gap-2 flex-wrap">
        {isSolved ? (
          <div className="flex items-center gap-1.5 text-xs text-cyber-green font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>✓ PWNED</span>
          </div>
        ) : (
          <button
            onClick={() => onOpenModal(challenge.slug, challenge.title)}
            className="text-xs text-cyber-cyan hover:underline font-semibold"
          >
            Submit Flag
          </button>
        )}

        <Link
          href={`/labs/${challenge.slug}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
            isSolved
              ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/40 hover:bg-cyber-green/30'
              : 'bg-cyber-green text-black hover:bg-cyber-green/90 shadow-[0_0_10px_rgba(0,255,65,0.4)]'
          }`}
        >
          <span>{isSolved ? 'Review Lab' : 'Infiltrate'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
