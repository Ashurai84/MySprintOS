import React from 'react'
import { Award } from 'lucide-react'

interface ProviderLogoProps {
  provider?: string
  url?: string
  className?: string
  size?: number
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  provider = '',
  url = '',
  className = '',
  size = 18
}) => {
  const p = (provider + ' ' + url).toLowerCase()

  // Google / Google Cloud / Google for Education
  if (p.includes('google') || p.includes('educertifications')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label="Google"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
    )
  }

  // Coursera
  if (p.includes('coursera') || p.includes('deeplearning')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#0056D2] shrink-0 ${className}`}
        aria-label="Coursera"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.5c-.8.8-1.9 1.2-3.1 1.2-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c1.2 0 2.3.4 3.1 1.2l-1.4 1.4c-.5-.5-1.1-.7-1.7-.7-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5c.6 0 1.2-.2 1.7-.7l1.4 1.6z" />
      </svg>
    )
  }

  // Microsoft / Azure
  if (p.includes('microsoft') || p.includes('azure')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`shrink-0 ${className}`}
        aria-label="Microsoft"
      >
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
      </svg>
    )
  }

  // AWS (Amazon Web Services)
  if (p.includes('aws') || p.includes('amazon')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-[#FF9900]/15 text-[#FF9900] font-black text-[9px] font-mono border border-[#FF9900]/30 shrink-0 ${className}`}
        title="AWS"
      >
        AWS
      </div>
    )
  }

  // Kaggle
  if (p.includes('kaggle')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-[#20BEFF]/15 text-[#20BEFF] font-bold text-[10px] font-mono border border-[#20BEFF]/30 shrink-0 ${className}`}
        title="Kaggle"
      >
        k
      </div>
    )
  }

  // HackerRank
  if (p.includes('hackerrank')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-[#00EA64]/15 text-[#00EA64] font-bold text-[10px] font-mono border border-[#00EA64]/30 shrink-0 ${className}`}
        title="HackerRank"
      >
        H
      </div>
    )
  }

  // freeCodeCamp
  if (p.includes('freecodecamp')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-amber-500/15 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/30 shrink-0 ${className}`}
        title="freeCodeCamp"
      >
        (f)
      </div>
    )
  }

  // Cisco / Skills for All
  if (p.includes('cisco') || p.includes('skills for all') || p.includes('skillsforall')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-[#049FD9]/15 text-[#049FD9] font-bold text-[8px] font-mono border border-[#049FD9]/30 shrink-0 ${className}`}
        title="Cisco"
      >
        CSC
      </div>
    )
  }

  // NPTEL / IIT
  if (p.includes('nptel') || p.includes('iit')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-emerald-500/15 text-emerald-400 font-bold text-[8px] font-mono border border-emerald-500/30 shrink-0 ${className}`}
        title="NPTEL"
      >
        NPT
      </div>
    )
  }

  // LeetCode / Codeforces
  if (p.includes('leetcode')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-amber-500/15 text-amber-300 font-bold text-[9px] font-mono border border-amber-500/30 shrink-0 ${className}`}
        title="LeetCode"
      >
        LC
      </div>
    )
  }

  if (p.includes('codeforces')) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-rose-500/15 text-rose-300 font-bold text-[9px] font-mono border border-rose-500/30 shrink-0 ${className}`}
        title="Codeforces"
      >
        CF
      </div>
    )
  }

  // Generic platform or neutral icon
  return (
    <div 
      style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 ${className}`}
    >
      <Award className="w-3 h-3 text-slate-400" />
    </div>
  )
}
