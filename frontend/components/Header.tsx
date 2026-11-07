'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Terminal, Award, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  score?: number;
  solvedCount?: number;
}

export default function Header({ score = 0, solvedCount = 0 }: HeaderProps) {
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    const sid = localStorage.getItem('aicda_student_id') || '';
    setStudentId(sid);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aicda_student_id');
    localStorage.removeItem('aicda_access_granted');
    window.location.href = '/';
  };

  return (
    <header className="relative z-20 border-b border-cyber-border bg-cyber-black/90 backdrop-blur px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Lab Title */}
        <Link href="/labs" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg border border-cyber-green/40 bg-cyber-card flex items-center justify-center overflow-hidden p-1">
            <img src="/logo.jpg" alt="AICDA" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-wider text-sm sm:text-base group-hover:text-cyber-green transition">
                AICDA CRYPTOCURRENCY LAB
              </span>
              <div className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-india-saffron"></span>
                <span className="w-2 h-2 rounded-full bg-india-white"></span>
                <span className="w-2 h-2 rounded-full bg-india-green"></span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 tracking-widest hidden sm:block">
              ANONYMOUS INDIA CYBER DEFENCE ACADEMY
            </p>
          </div>
        </Link>

        {/* Student Session & Target Host & Score Pill */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyber-cyan/40 bg-cyber-cyan/10 text-xs">
            <span className="text-gray-400">TARGET:</span>
            <span className="text-cyber-cyan font-mono font-semibold truncate max-w-[220px]">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}
            </span>
          </div>

          {studentId && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-cyber-border bg-cyber-card text-xs">
              <span className="text-gray-400">OPERATIVE:</span>
              <span className="text-cyber-green font-semibold tracking-wide truncate max-w-[120px]">
                {studentId}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded border border-cyber-green/50 bg-cyber-green/10 text-xs">
            <Award className="w-3.5 h-3.5 text-cyber-green" />
            <span className="text-cyber-green font-bold">
              {score} / 1000 PTS
            </span>
            <span className="text-gray-400 text-[10px]">
              ({solvedCount}/10 SOLVED)
            </span>
          </div>

          <Link
            href="/admin/aicda"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyber-border hover:border-cyber-cyan/50 bg-cyber-card text-xs text-gray-400 hover:text-cyber-cyan transition"
            title="Admin Command Center"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">COMMAND</span>
          </Link>

          {studentId && (
            <button
              onClick={handleLogout}
              className="p-1 rounded text-gray-400 hover:text-cyber-red transition"
              title="Logout / Switch Recruiter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
