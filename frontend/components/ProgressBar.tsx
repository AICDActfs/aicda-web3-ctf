'use client';

import React from 'react';

interface ProgressBarProps {
  score: number;
  total: number;
}

export default function ProgressBar({ score, total }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((score / total) * 100));

  return (
    <div className="w-full bg-cyber-card border border-cyber-border rounded-lg p-4">
      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-gray-300 font-semibold tracking-wide">
          OPERATION PROGRESS
        </span>
        <span className="text-cyber-green font-bold">
          {score} / {total} PTS ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-cyber-border/50">
        <div
          className="h-full bg-gradient-to-r from-india-saffron via-cyber-green to-cyber-cyan transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
