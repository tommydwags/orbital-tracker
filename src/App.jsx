/* --- MOBILE PWA SETUP INSTRUCTIONS ---
  To make this look like a native app on iPhone (remove address bar, custom icon):
  
  1. Create an 'index.html' file.
  2. Paste this meta block into the <head>:
     <meta name="apple-mobile-web-app-capable" content="yes">
     <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
     <link rel="apple-touch-icon" href="YOUR_ICON_URL.png">
     <title>Orbital: Video Game Tracker</title>
  
  3. Deploy to GitHub Pages or Vercel.
  4. Open in Safari -> Share -> "Add to Home Screen".
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Book, Library, Plus, ChevronRight, ChevronLeft, PlayCircle, CheckCircle2, 
  Circle, Clock, X, Trophy, Star, Edit2, Trash2, Activity, BookOpen, RotateCcw, 
  Search, Monitor, Gamepad2, Smartphone, Tv, Settings, Image as ImageIcon, 
  Timer, StopCircle, ListTodo, AlertTriangle, Glasses, Joystick, Cloud, Loader2,
  PauseCircle, Play, Tag, Download, PieChart, Flame, Award, Globe, ExternalLink, Dices
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  setDoc
} from "firebase/firestore";

// --- CONSTANTS ---

const STATUS_COLORS = {
  backlog: 'bg-slate-800 text-slate-400 border-slate-700',
  playing: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  completed: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
  shelved: 'bg-stone-900/50 text-stone-500 border-stone-800'
};

const PLATFORMS = [
  { value: 'PC', label: 'PC' },
  { value: 'Xbox', label: 'Xbox' },
  { value: 'PlayStation', label: 'PlayStation' },
  { value: 'Switch', label: 'Nintendo Switch' },
  { value: 'Mobile', label: 'Mobile / Tablet' },
  { value: 'VR', label: 'VR Headset' },
  { value: 'Retro', label: 'Retro Console' },
  { value: 'Generic', label: 'Other' }
];

const SESSION_TAGS = [
    'Quest', 'Explore', 'Combat', 'Story', 'Build', 'Grind', 
    'Ranked', 'Casual', 'PVP', 'Co-op', 'Event', 'Idle'
];

const TAG_COLORS = {
  Quest: 'bg-amber-900/30 text-amber-400 border-amber-800',
  Explore: 'bg-sky-900/30 text-sky-400 border-sky-800',
  Combat: 'bg-red-900/30 text-red-400 border-red-800',
  Story: 'bg-purple-900/30 text-purple-400 border-purple-800',
  Build: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
  Grind: 'bg-slate-800 text-slate-400 border-slate-700',
  Ranked: 'bg-violet-900/30 text-violet-400 border-violet-800',
  Casual: 'bg-teal-900/30 text-teal-400 border-teal-800',
  PVP: 'bg-rose-900/30 text-rose-400 border-rose-800',
  'Co-op': 'bg-blue-900/30 text-blue-400 border-blue-800',
  Event: 'bg-pink-900/30 text-pink-400 border-pink-800',
  Idle: 'bg-slate-800 text-slate-500 border-slate-700'
};

const TAG_CHART_COLORS = {
  Quest: 'bg-amber-500',
  Explore: 'bg-sky-500',
  Combat: 'bg-red-500',
  Story: 'bg-purple-500',
  Build: 'bg-emerald-500',
  Grind: 'bg-slate-500',
  Ranked: 'bg-violet-500',
  Casual: 'bg-teal-500',
  PVP: 'bg-rose-500',
  'Co-op': 'bg-blue-500',
  Event: 'bg-pink-500',
  Idle: 'bg-slate-600'
};

const TAG_TEXT_COLORS = {
  Quest: 'text-amber-400',
  Explore: 'text-sky-400',
  Combat: 'text-red-400',
  Story: 'text-purple-400',
  Build: 'text-emerald-400',
  Grind: 'text-slate-400',
  Ranked: 'text-violet-400',
  Casual: 'text-teal-400',
  PVP: 'text-rose-400',
  'Co-op': 'text-blue-400',
  Event: 'text-pink-400',
  Idle: 'text-slate-500'
};

// --- UTILS ---

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getPlatformIcon = (platform) => {
  const p = (platform || '').toLowerCase();
  if (p.includes('pc') || p.includes('steam')) return <Monitor size={12} />;
  if (p.includes('xbox')) return <Gamepad2 size={12} />;
  if (p.includes('playstation') || p.includes('ps')) return <Gamepad2 size={12} />;
  if (p.includes('switch') || p.includes('nintendo')) return <Smartphone size={12} />; 
  if (p.includes('mobile') || p.includes('ios') || p.includes('android')) return <Smartphone size={12} />;
  if (p.includes('vr') || p.includes('oculus') || p.includes('quest')) return <Glasses size={12} />;
  if (p.includes('retro')) return <Joystick size={12} />;
  return <Tv size={12} />;
};

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyC7ijlnAsQwrzSOowjDZ36uAysFI8l8EWQ",
  authDomain: "orbital-video-game-track-6d843.firebaseapp.com",
  projectId: "orbital-video-game-track-6d843",
  storageBucket: "orbital-video-game-track-6d843.firebasestorage.app",
  messagingSenderId: "82673473462",
  appId: "1:82673473462:web:9e9cf11d2b3e982c889317",
  measurementId: "G-70VXPENBZE"
};

const appId = 'orbit-app'; 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- SUB-COMPONENTS ---

const ActiveSessionBar = ({ session, gameTitle, elapsedTime, onPause, onResume, onStop }) => {
  if (!session) return null;
  const isPaused = session.status === 'paused';

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] p-3 flex justify-between items-center shadow-lg animate-in slide-in-from-top duration-300 ${isPaused ? 'bg-amber-600' : 'bg-indigo-600'} text-white safe-area-pt`}>
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-full ${isPaused ? 'bg-white/20' : 'animate-pulse bg-white/20'}`}>
          <Timer size={16} />
        </div>
        <div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{isPaused ? 'Session Paused' : 'Session Active'}</div>
          <div className="text-sm font-bold leading-none truncate max-w-[120px] sm:max-w-[200px]">{gameTitle || 'Loading...'}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-mono text-lg font-bold tabular-nums">{formatTimer(elapsedTime)}</div>
        {isPaused ? (
           <button onClick={onResume} className="bg-white text-amber-600 p-2 rounded-full hover:scale-105 transition-transform shadow-sm"><Play size={20} fill="currentColor" /></button>
        ) : (
           <button onClick={onPause} className="bg-white/20 text-white p-2 rounded-full hover:scale-105 transition-transform shadow-sm"><PauseCircle size={20} /></button>
        )}
        <button onClick={onStop} className={`p-2 rounded-full hover:scale-105 transition-transform shadow-sm ${isPaused ? 'bg-white/20 text-white' : 'bg-white text-indigo-600'}`}>
            <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-current rounded-sm"></div>
            </div>
        </button>
      </div>
    </div>
  );
};

const CalendarWidget = ({ logs, date, onDateChange, onDayClick }) => {
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay(); 
  
  const playedDays = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const d = new Date(log.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(log);
      }
    });
    return map;
  }, [logs, currentMonth, currentYear]);

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onDateChange(-1)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={16} /></button>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => onDateChange(1)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-[10px] text-slate-600 font-bold mb-1">{d}</div>)}
        {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const hasLogs = playedDays[day];
          return (
            <button key={day} onClick={() => hasLogs && onDayClick(new Date(currentYear, currentMonth, day), playedDays[day])} disabled={!hasLogs} className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all relative ${hasLogs ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-md hover:scale-110 cursor-pointer' : 'bg-slate-800/50 text-slate-600 cursor-default'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const NavBar = ({ view, setView, onAdd }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-2 pb-6 flex justify-between items-center z-50 px-6 safe-area-pb">
    <button onClick={() => setView('overview')} className={`flex flex-col items-center gap-1 transition-colors active:scale-95 ${view === 'overview' ? 'text-indigo-400' : 'text-slate-500'}`}><Activity size={24} /><span className="text-[10px] font-bold uppercase tracking-wide">Overview</span></button>
    <button onClick={() => setView('journal')} className={`flex flex-col items-center gap-1 transition-colors active:scale-95 ${view === 'journal' ? 'text-indigo-400' : 'text-slate-500'}`}><BookOpen size={24} /><span className="text-[10px] font-bold uppercase tracking-wide">Journal</span></button>
    <button onClick={onAdd} className="bg-indigo-600 p-3 rounded-full shadow-xl shadow-indigo-500/40 text-white border-4 border-slate-950 hover:scale-105 active:scale-95 transition-transform -mt-6"><Plus size={28} /></button>
    <button onClick={() => setView('library')} className={`flex flex-col items-center gap-1 transition-colors active:scale-95 ${view === 'library' ? 'text-indigo-400' : 'text-slate-500'}`}><Library size={24} /><span className="text-[10px] font-bold uppercase tracking-wide">Library</span></button>
  </div>
);

// --- VIEW COMPONENTS ---

const OverviewView = ({ games, logs, stats, calendarDate, setCalendarDate, onDayClick, setView, setActiveGameId, onOpenSettings }) => {
  const playingGames = games.filter(g => g.status === 'playing');

  // Calculate Tag Stats for Breakdown
  const tagStats = useMemo(() => {
    const stats = {};
    logs.forEach(l => {
        if(l.tags) {
            l.tags.forEach(t => {
                stats[t] = (stats[t] || 0) + 1;
            });
        }
    });
    return Object.entries(stats).sort((a,b) => b[1] - a[1]);
  }, [logs]);

  // Calculate Fun Stats
  const funStats = useMemo(() => {
     let longestSession = 0;
     logs.forEach(l => { if(l.durationMinutes > longestSession) longestSession = l.durationMinutes });
     
     const platforms = {};
     games.forEach(g => { platforms[g.platform] = (platforms[g.platform] || 0) + 1 });
     const topPlatform = Object.entries(platforms).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';

     return { longestSession, topPlatform };
  }, [logs, games]);

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="pt-16 pb-6 px-6 bg-gradient-to-b from-slate-900 to-slate-950 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Orbital</h1>
            <div className="flex items-center gap-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Video Game Tracker</p>
                <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>
        </div>
        <button onClick={onOpenSettings} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button>
      </header>

      {/* Main Stats Grid */}
      <section className="px-6 mb-6 grid grid-cols-2 gap-3">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={10} /> Total Playtime</div><div className="text-2xl font-black text-white">{stats.totalHours}<span className="text-sm font-medium text-slate-500 ml-1">hrs</span></div></div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Trophy size={10} /> Games Completed</div><div className="text-2xl font-black text-emerald-400">{stats.completedGames}</div></div>
        
        {/* Fun Stats Row */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Flame size={10} /> Longest Session</div>
            <div className="text-lg font-bold text-slate-200">{formatDuration(funStats.longestSession)}</div>
        </div>
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Award size={10} /> Top Platform</div>
             <div className="text-lg font-bold text-slate-200 truncate">{funStats.topPlatform}</div>
        </div>
      </section>

      {/* Playstyle Breakdown (Moved here) */}
      {tagStats.length > 0 && (
        <section className="px-6 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-bold text-slate-500"><PieChart size={12} /> Playstyle Breakdown</div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-950 mb-3">
                    {tagStats.map(([tag, count]) => {
                        const total = tagStats.reduce((a,b) => a + b[1], 0);
                        const width = (count / total) * 100;
                        const colorClass = TAG_CHART_COLORS[tag] || 'bg-slate-500';
                        return <div key={tag} style={{ width: `${width}%` }} className={colorClass} title={`${tag}: ${count}`} />;
                    })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {tagStats.slice(0, 6).map(([tag, count]) => {
                        const total = tagStats.reduce((a,b) => a + b[1], 0);
                        const percent = Math.round((count / total) * 100);
                        const textClass = TAG_TEXT_COLORS[tag] || 'text-slate-400';
                        return (
                            <div key={tag} className={`text-[10px] font-bold ${textClass} flex items-center gap-1.5`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${TAG_CHART_COLORS[tag]}`}></div>
                                {tag} {percent}%
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
      )}

      {playingGames.length > 0 && (
        <section className="px-6 mb-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Currently Playing</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {playingGames.map(game => (
              <div key={game.id} onClick={() => { setActiveGameId(game.id); setView('game-detail'); }} className="flex-shrink-0 w-40 h-56 bg-slate-800 rounded-xl border border-slate-700 relative overflow-hidden group active:scale-95 transition-all shadow-lg cursor-pointer">
                {game.coverUrl ? <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : <div className={`w-full h-full bg-slate-800 flex items-center justify-center`}><Gamepad2 size={32} className="text-slate-600"/></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 flex flex-col justify-end"><h3 className="font-bold text-white leading-tight line-clamp-2 text-sm">{game.title}</h3></div>
                {game.completedDate && <div className="absolute top-2 right-2 text-yellow-500 bg-black/50 p-1.5 rounded-full backdrop-blur-sm"><Trophy size={12} /></div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Calendar moved to bottom */}
      <section className="px-6 mb-8">
        <CalendarWidget logs={logs} date={calendarDate} onDateChange={(delta) => { const newDate = new Date(calendarDate); newDate.setMonth(newDate.getMonth() + delta); setCalendarDate(newDate); }} onDayClick={onDayClick} />
      </section>

    </div>
  );
};

const JournalView = ({ logs, games, onEdit, onDelete, setView, setActiveGameId }) => {
  const [tagFilter, setTagFilter] = useState('All');
  
  const sortedLogs = useMemo(() => {
      let filtered = logs;
      if (tagFilter !== 'All') {
          filtered = logs.filter(l => l.tags && l.tags.includes(tagFilter));
      }
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, tagFilter]);

  const tagStats = useMemo(() => {
      const stats = {};
      logs.forEach(l => {
          if(l.tags) {
              l.tags.forEach(t => {
                  stats[t] = (stats[t] || 0) + 1;
              });
          }
      });
      return Object.entries(stats).sort((a,b) => b[1] - a[1]);
  }, [logs]);

  return (
    <div className="pb-24 min-h-screen bg-slate-950 animate-in fade-in duration-300">
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md pt-16 pb-4 px-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4"><h1 className="text-2xl font-black text-white">Journal</h1><div className="text-slate-500 text-xs font-mono">{sortedLogs.length} ENTRIES</div></div>
        
        {tagStats.length > 0 && (
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold text-slate-500"><PieChart size={12} /> Playstyle Breakdown</div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                    {tagStats.map(([tag, count]) => {
                        const total = tagStats.reduce((a,b) => a + b[1], 0);
                        const width = (count / total) * 100;
                        const colorClass = TAG_CHART_COLORS[tag] || 'bg-slate-500';
                        return <div key={tag} style={{ width: `${width}%` }} className={colorClass} title={`${tag}: ${count}`} />;
                    })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {tagStats.slice(0, 4).map(([tag, count]) => {
                        const total = tagStats.reduce((a,b) => a + b[1], 0);
                        const percent = Math.round((count / total) * 100);
                        const textClass = TAG_TEXT_COLORS[tag] || 'text-slate-400';
                        return (
                            <div key={tag} className={`text-[10px] font-bold ${textClass} flex items-center gap-1`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${TAG_CHART_COLORS[tag]}`}></div>
                                {tag} {percent}%
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setTagFilter('All')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${tagFilter === 'All' ? 'bg-white text-black' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>All</button>
            {SESSION_TAGS.map(tag => (
                <button key={tag} onClick={() => setTagFilter(tag)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${tagFilter === tag ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>{tag}</button>
            ))}
        </div>
      </header>
      <div className="p-6">
         <div className="space-y-6 border-l-2 border-slate-800 ml-2 pl-6 relative">
          {sortedLogs.length === 0 ? <div className="text-slate-600 text-sm italic py-4">No entries found.</div> : sortedLogs.map(log => {
              const game = games.find(g => g.id === log.gameId);
              if (!game) return null;
              return (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-900"></div>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span onClick={() => { setActiveGameId(game.id); setView('game-detail'); }} className="text-indigo-400 font-bold text-sm hover:underline cursor-pointer">{game.title}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-2">{log.durationMinutes > 0 && <span className="flex items-center gap-1 text-slate-400 bg-slate-800 px-1.5 rounded"><Clock size={10} /> {formatDuration(log.durationMinutes)}</span>}{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 relative">
                    <div className="flex gap-1 flex-wrap mb-2">
                        {log.tags && log.tags.map(t => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[t] || TAG_COLORS.Idle}`}>{t}</span>)}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{log.content}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button type="button" onClick={() => onEdit(log)} className="p-1 bg-slate-700 rounded text-slate-300 hover:text-white"><Edit2 size={12} /></button>
                        <button type="button" onClick={() => onDelete(log.id)} className="p-1 bg-slate-700 rounded text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

const LibraryView = ({ games, logs, setView, setActiveGameId, search, setSearch, sort, setSort, filter, setFilter }) => {
  const getMinutes = useCallback((id) => logs.filter(l => l.gameId === id).reduce((acc, l) => acc + (l.durationMinutes || 0), 0), [logs]);
  const filtered = useMemo(() => {
    return games.filter(g => {
        if (filter !== 'all' && g.status !== filter) return false;
        if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }).sort((a, b) => {
        if (sort === 'alpha') return a.title.localeCompare(b.title);
        if (sort === 'time') return getMinutes(b.id) - getMinutes(a.id);
        if (sort === 'rating') return b.rating - a.rating;
        return new Date(b.addedDate) - new Date(a.addedDate);
      });
  }, [games, filter, search, sort, getMinutes]);

  const pickRandom = () => {
      const candidates = games.filter(g => g.status === 'backlog' || g.status === 'playing');
      if (candidates.length === 0) return; 
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setActiveGameId(random.id);
      setView('game-detail');
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-950 animate-in fade-in duration-300">
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md pt-16 pb-4 px-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4"><h1 className="text-2xl font-black text-white">Library</h1><div className="flex items-center gap-3"><button onClick={pickRandom} className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg" title="Pick a random game"><Dices size={20} /></button><div className="text-slate-500 text-xs font-mono">{filtered.length} GAMES</div></div></div>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-500" size={14} /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" /></div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors"><option value="lastAdded">Recent</option><option value="alpha">A-Z</option><option value="time">Time Played</option><option value="rating">Rating</option></select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['all', 'playing', 'backlog', 'completed', 'shelved'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-white text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{f}</button>)}</div>
      </header>
      <div className="p-4 grid grid-cols-1 gap-3">
        {filtered.map(game => {
          const totalTime = formatDuration(getMinutes(game.id));
          const mCount = game.milestones ? game.milestones.length : 0;
          const mDone = game.milestones ? game.milestones.filter(m => m.completed).length : 0;
          return (
            <div key={game.id} onClick={() => { setActiveGameId(game.id); setView('game-detail'); }} className="bg-slate-900 rounded-xl border border-slate-800 flex overflow-hidden h-24 active:bg-slate-800 transition-colors cursor-pointer relative group">
              <div className="w-16 h-full bg-slate-800 flex-shrink-0 relative">{game.coverUrl ? <img src={game.coverUrl} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={20}/></div>}</div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div><h3 className="font-bold text-slate-200 line-clamp-1">{game.title}</h3><div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">{getPlatformIcon(game.platform)} {game.platform}</div></div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${STATUS_COLORS[game.status] || STATUS_COLORS.backlog}`}>{game.status}</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800"><Clock size={10} /> {totalTime}</div>
                  {game.rating > 0 && <div className="flex items-center gap-0.5 text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50"><Star size={10} fill="currentColor"/> <span className="text-[10px] font-bold">{game.rating}</span></div>}
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-white"><ChevronRight size={20}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GameDetailView = ({ activeGame, logs, activeSession, setView, setShowEditGameModal, updateGame, handleStartSession, handlePauseSession, handleResumeSession, handleStopSession, setEditingLog, setShowLogModal, deleteGame, onDeleteLog, requestConfirm }) => {
  if (!activeGame) return null;
  const totalTime = formatDuration(logs.filter(l => l.gameId === activeGame.id).reduce((acc,l) => acc + (l.durationMinutes||0), 0));
  const milestones = activeGame.milestones || [];
  const activeLogs = logs.filter(l => l.gameId === activeGame.id).sort((a,b) => new Date(b.date) - new Date(a.date));

  const MilestonesSection = () => {
      const [newM, setNewM] = useState('');
      return (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-2 mb-3"><ListTodo size={16} /> Milestones</h3>
              <div className="space-y-2 mb-3">
                  {milestones.map(m => (
                      <div key={m.id} className="flex items-start gap-2 group">
                          <button onClick={() => updateGame(activeGame.id, { milestones: milestones.map(x => x.id === m.id ? { ...x, completed: !x.completed } : x) })} className={`mt-0.5 ${m.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}>{m.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>
                          <span className={`flex-1 text-sm ${m.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{m.text}</span>
                          <button onClick={() => updateGame(activeGame.id, { milestones: milestones.filter(x => x.id !== m.id) })} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
              <div className="flex gap-2"><input value={newM} onChange={e => setNewM(e.target.value)} placeholder="Add milestone..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" /><button onClick={() => { if(newM.trim()) { updateGame(activeGame.id, { milestones: [...milestones, { id: crypto.randomUUID(), text: newM, completed: false }] }); setNewM(''); } }} className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-500"><Plus size={16}/></button></div>
          </div>
      );
  };

  const handleFinishClick = () => {
      requestConfirm("Mark this game as completed?", () => {
          updateGame(activeGame.id, { status: 'completed', completedDate: activeGame.completedDate || new Date().toISOString() });
      });
  };

  // Timer Controls
  let timerControls;
  if (activeSession?.gameId === activeGame.id) {
      const isPaused = activeSession.status === 'paused';
      timerControls = (
          <>
            <button onClick={isPaused ? handleResumeSession : handlePauseSession} className={`flex-1 ${isPaused ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all`}>
               {isPaused ? <><Play size={18} fill="currentColor" /> Resume</> : <><PauseCircle size={18} /> Pause</>}
            </button>
            <button onClick={() => handleStopSession()} className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
               <div className="w-4 h-4 bg-red-500 rounded-sm"></div> End Session
            </button>
          </>
      );
  } else {
      timerControls = (
          <button onClick={() => handleStartSession(activeGame.id)} className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
             <PlayCircle size={20} /> Start Session
          </button>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 animate-in slide-in-from-right duration-300">
      <div className="relative h-64 w-full">
         {activeGame.coverUrl ? <div className="absolute inset-0"><img src={activeGame.coverUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div></div> : <div className={`absolute inset-0 bg-indigo-950`}></div>}
        <button onClick={() => setView('library')} className="absolute top-12 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-10 hover:bg-black/50"><ChevronRight className="rotate-180" size={24} /></button>
        <button onClick={() => setShowEditGameModal(true)} className="absolute top-12 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-10 hover:bg-black/50"><Edit2 size={20} /></button>
        <div className="absolute bottom-0 left-0 right-0 p-6">
           <div className="flex gap-4 items-end">
              <div className="w-24 h-32 rounded-lg bg-slate-800 shadow-2xl border border-slate-700 overflow-hidden flex-shrink-0 hidden sm:block">{activeGame.coverUrl && <img src={activeGame.coverUrl} className="w-full h-full object-cover"/>}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold bg-black/50 backdrop-blur-md px-2 py-1 rounded text-slate-300 flex items-center gap-1">{getPlatformIcon(activeGame.platform)} {activeGame.platform}</span><button className={`text-[10px] px-2 py-1 rounded border uppercase font-bold tracking-wider hover:brightness-110 ${STATUS_COLORS[activeGame.status] || STATUS_COLORS.backlog}`}>{activeGame.status}</button></div>
                <h1 className="text-2xl font-black text-white leading-tight mb-2 shadow-black drop-shadow-lg">{activeGame.title}</h1>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-indigo-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1"><Clock size={12} /> {totalTime}</span>
                    {activeGame.rating > 0 && <div className="flex items-center gap-0.5 text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50"><Star size={10} fill="currentColor"/> <span className="text-[10px] font-bold">{activeGame.rating}</span></div>}
                    {activeGame.linkUrl && (
                        <a href={activeGame.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-950/30 px-2 py-1 rounded border border-sky-900/50 hover:bg-sky-900/50 transition-colors">
                            <Globe size={12} /> Guide
                        </a>
                    )}
                </div>
              </div>
           </div>
        </div>
      </div>
      <div className="mt-6 px-6">
        <div className="grid grid-cols-2 gap-3 mb-8">
          {timerControls}
          
          <button onClick={() => { setEditingLog({ isAutoLog: false }); setShowLogModal(true); }} className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Book size={18} /> Manual Log</button>
          
          {activeGame.status === 'completed' ? (
             <button onClick={() => updateGame(activeGame.id, { status: 'playing' })} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-900 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><RotateCcw size={18} /> Replay</button>
          ) : (
             <button onClick={handleFinishClick} className="flex-1 border border-emerald-500/50 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {activeGame.completedDate ? 'Finish Run' : 'Finish'}</button>
          )}
        </div>
        <MilestonesSection />
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2"><Star size={16} /> Rating & Review</h3><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => updateGame(activeGame.id, { rating: star })} className={`${star <= activeGame.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} hover:scale-110 transition-transform`}><Star size={20} fill={star <= activeGame.rating ? "currentColor" : "none"} /></button>))}</div></div>
            <textarea placeholder="Write your review..." value={activeGame.review || ''} onChange={(e) => updateGame(activeGame.id, { review: e.target.value })} className="w-full bg-slate-950/50 text-slate-300 text-sm p-3 rounded-lg border border-slate-800 outline-none focus:border-indigo-500/50 min-h-[80px]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Journal ({activeLogs.length})</h2>
          <div className="space-y-4">
            {activeLogs.length === 0 ? <div className="text-center py-8 text-slate-600"><p className="mb-2">No entries yet.</p></div> : activeLogs.map(log => (
              <div key={log.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 group">
                <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="text-xs font-mono text-indigo-400">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>{log.durationMinutes > 0 && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1"><Clock size={10} /> {formatDuration(log.durationMinutes)}</span>}</div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button type="button" onClick={() => { setEditingLog(log); setShowLogModal(true); }} className="text-slate-500 hover:text-white"><Edit2 size={14}/></button><button type="button" onClick={() => onDeleteLog(log.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={14}/></button></div></div>
                <div className="flex gap-1 flex-wrap mb-2">
                    {log.tags && log.tags.map(t => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[t] || TAG_COLORS.Idle}`}>{t}</span>)}
                </div>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{log.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State
  const [view, setView] = useState('overview'); 
  const [activeGameId, setActiveGameId] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [selectedDateLogs, setSelectedDateLogs] = useState(null); 
  
  const [games, setGames] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [libSearch, setLibSearch] = useState('');
  const [libSort, setLibSort] = useState('lastAdded'); 
  const [libFilter, setLibFilter] = useState('all'); 

// Auth
useEffect(() => {
  // We just want simple anonymous login for your personal app
  signInAnonymously(auth);

  const unsubscribe = onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

  // Sync
  useEffect(() => {
    if (!user) return;
    const qGames = collection(db, 'artifacts', appId, 'users', user.uid, 'games');
    const qLogs = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    const docSession = doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'active_session');

    const u1 = onSnapshot(qGames, s => setGames(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(qLogs, s => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(docSession, s => {
        if (s.exists()) {
            const data = s.data();
            setActiveSession(data);
            const now = Date.now();
            let total = data.accumulatedTime || 0;
            if (data.status === 'running' && data.startTime) {
                total += (now - data.startTime) / 1000;
            }
            setElapsedTime(Math.floor(total));
        } else {
            setActiveSession(null);
            setElapsedTime(0);
        }
    });

    return () => { u1(); u2(); u3(); };
  }, [user]);

  // Timer Tick
  useEffect(() => {
    let interval;
    if (activeSession && activeSession.status === 'running' && activeSession.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const currentSegment = (now - activeSession.startTime) / 1000;
        setElapsedTime(Math.floor((activeSession.accumulatedTime || 0) + currentSegment));
      }, 1000);
    } 
    return () => clearInterval(interval);
  }, [activeSession]);

  const activeGame = activeGameId ? games.find(g => g.id === activeGameId) : null;
  
  const stats = useMemo(() => {
    const totalMinutes = logs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const completedGames = games.filter(g => g.status === 'completed' || g.completedDate).length;
    return { totalHours: Math.round(totalMinutes / 60), completedGames };
  }, [logs, games]);

  const requestConfirm = (message, onConfirm) => {
      setConfirmModal({ message, onConfirm });
  };

  // Actions
  const addGame = async (e) => {
    e.preventDefault();
    if(!user) return;
    const t = e.target;
    const newGame = { 
      title: t.title.value, 
      platform: t.platform.value || 'PC', 
      coverUrl: t.coverUrl.value || '', 
      linkUrl: t.linkUrl.value || '',
      status: t.status.value || 'backlog', 
      rating: 0, 
      addedDate: new Date().toISOString(), 
      milestones: [] 
    };
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'games'), newGame);
    setShowAddModal(false);
  };

  const updateGame = async (id, updates) => {
    if(!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'games', id), updates);
  };

  const deleteGame = async (id) => {
    if(!user) return;
    requestConfirm("Delete this game and all its data?", async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'games', id));
        setShowEditGameModal(false);
        setActiveGameId(null);
        if (activeSession?.gameId === id) handleStopSession(true); 
        setView('library');
    });
  };

  const deleteLog = async (id) => {
    if(!user) return;
    requestConfirm("Delete this log entry?", async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', id));
        if(selectedDateLogs) setSelectedDateLogs(null);
    });
  };

  const handleStartSession = async (id) => {
    if(!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'active_session'), { 
        gameId: id, 
        startTime: Date.now(),
        accumulatedTime: 0,
        status: 'running'
    });
  };

  const handlePauseSession = async () => {
      if(!user || !activeSession) return;
      const now = Date.now();
      const currentSegment = (now - activeSession.startTime) / 1000;
      const newAccumulated = (activeSession.accumulatedTime || 0) + currentSegment;
      
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'active_session'), {
          status: 'paused',
          startTime: null,
          accumulatedTime: newAccumulated
      });
      setElapsedTime(Math.floor(newAccumulated));
  };

  const handleResumeSession = async () => {
      if(!user || !activeSession) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'active_session'), {
          status: 'running',
          startTime: Date.now()
      });
  };

  const handleStopSession = async (force = false) => {
    const isForce = force === true;
    if(!user || (!activeSession && !isForce)) return;
    
    if (!isForce && activeSession) {
        let finalSeconds = activeSession.accumulatedTime || 0;
        if (activeSession.status === 'running' && activeSession.startTime) {
            finalSeconds += (Date.now() - activeSession.startTime) / 1000;
        }
        const mins = Math.max(0, Math.floor(finalSeconds / 60));

        setEditingLog({ isAutoLog: true, gameId: activeSession.gameId, durationMinutes: mins, date: new Date().toISOString(), content: '', tags: [] });
        setActiveGameId(activeSession.gameId);
        setShowLogModal(true);
    }
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'active_session'));
  };

  const saveLog = async (e) => {
    e.preventDefault();
    if(!user) return;
    const fd = new FormData(e.target);
    const mins = (parseInt(fd.get('hours'))||0)*60 + (parseInt(fd.get('minutes'))||0);
    const content = fd.get('content');
    const targetGameId = fd.get('gameId') || editingLog?.gameId || activeGameId;

    if(!content && mins === 0) return;

    // We rely on the LogEntryModal's internal state handling for tags, but this function is kept for structure if needed.
    // The actual submit logic is inside the LogEntryModal component below.
  };

  // Re-implemented Modal for self-contained submit
  const LogEntryModal = () => {
    const getDateString = (isoString) => {
      const date = new Date(isoString);
      const pad = (num) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    
    const [selectedTags, setSelectedTags] = useState(editingLog?.tags || []);
    const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const initialHours = editingLog ? Math.floor(editingLog.durationMinutes / 60) : 0;
    const initialMinutes = editingLog ? editingLog.durationMinutes % 60 : 0;
    const initialDate = editingLog?.date ? getDateString(editingLog.date) : getDateString(new Date().toISOString());
    const isEdit = editingLog && editingLog.id;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wide">{isEdit ? 'Edit Entry' : 'New Entry'}</h2>
          <form onSubmit={async (e) => {
              e.preventDefault();
              if(!user) return;
              const fd = new FormData(e.target);
              const mins = (parseInt(fd.get('hours'))||0)*60 + (parseInt(fd.get('minutes'))||0);
              const content = fd.get('content');
              const targetGameId = fd.get('gameId') || editingLog?.gameId || activeGameId;

              if(!content && mins === 0) return;

              const logData = {
                  gameId: targetGameId,
                  date: fd.get('date'), 
                  content, 
                  durationMinutes: mins,
                  tags: selectedTags
              };

              if(isEdit) { 
                 await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), logData);
              } else {
                 await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), logData);
              }
              setShowLogModal(false);
          }}>
            <div className="mb-4">
               <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Game</label>
               <div className="relative">
                  <select name="gameId" defaultValue={editingLog?.gameId || activeGameId} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-500 appearance-none">
                      {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={14} /></div>
               </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Date</label><input type="datetime-local" name="date" defaultValue={initialDate} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-500" /></div>
              <div className="w-1/3 flex gap-2">
                 <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Hrs</label><input type="number" name="hours" min="0" defaultValue={initialHours} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm text-center outline-none focus:border-indigo-500" /></div>
                 <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Mins</label><input type="number" name="minutes" min="0" max="59" defaultValue={initialMinutes} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm text-center outline-none focus:border-indigo-500" /></div>
              </div>
            </div>
            
            <div className="mb-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Session Tags</label>
                <div className="flex flex-wrap gap-2">
                    {SESSION_TAGS.map(t => (
                        <button key={t} type="button" onClick={() => toggleTag(t)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedTags.includes(t) ? TAG_COLORS[t] : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <textarea name="content" autoFocus={!editingLog?.isAutoLog} defaultValue={editingLog?.content || ''} placeholder="Session notes..." className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500 mb-4 resize-none" />
            <div className="flex gap-3"><button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl font-bold">Save</button></div>
          </form>
        </div>
      </div>
    );
  };

  const ConfirmationModal = () => {
      if (!confirmModal) return null;
      return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl text-center">
                  <div className="w-12 h-12 bg-indigo-900/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
                  <h3 className="text-lg font-bold text-white mb-2">Confirm Action</h3>
                  <p className="text-slate-400 text-sm mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-800 rounded-xl">Cancel</button>
                      <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500">Confirm</button>
                  </div>
              </div>
          </div>
      );
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-indigo-500"><Loader2 className="animate-spin" size={48}/></div>;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-indigo-500 selection:text-white safe-area-pb">
      <ActiveSessionBar session={activeSession} gameTitle={games.find(g => g.id === activeSession?.gameId)?.title} elapsedTime={elapsedTime} onPause={handlePauseSession} onResume={handleResumeSession} onStop={() => handleStopSession()} />
      
      {view === 'overview' && <OverviewView games={games} logs={logs} stats={stats} calendarDate={calendarDate} setCalendarDate={setCalendarDate} onDayClick={(date, logs) => setSelectedDateLogs({ date, logs })} setView={setView} setActiveGameId={setActiveGameId} onOpenSettings={() => setShowSettingsModal(true)} user={user} />}
      
      {view === 'journal' && <JournalView logs={logs} games={games} onEdit={(log) => { setEditingLog(log); setActiveGameId(log.gameId); setShowLogModal(true); }} onDelete={deleteLog} setView={setView} setActiveGameId={setActiveGameId} />}
      
      {view === 'library' && <LibraryView games={games} logs={logs} setView={setView} setActiveGameId={setActiveGameId} search={libSearch} setSearch={setLibSearch} sort={libSort} setSort={setLibSort} filter={libFilter} setFilter={setLibFilter} />}
      
      {view === 'game-detail' && <GameDetailView activeGame={activeGame} logs={logs} activeSession={activeSession} setView={setView} setShowEditGameModal={setShowEditGameModal} updateGame={updateGame} handleStartSession={handleStartSession} handlePauseSession={handlePauseSession} handleResumeSession={handleResumeSession} handleStopSession={handleStopSession} setEditingLog={setEditingLog} setShowLogModal={setShowLogModal} deleteGame={deleteGame} onDeleteLog={deleteLog} requestConfirm={requestConfirm} />}
      
      {/* NavBar is now outside of view conditions to be persistent */}
      <NavBar view={view} setView={setView} onAdd={() => setShowAddModal(true)} />

      {/* MODALS */}
      <ConfirmationModal />
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">Add to Library</h2>
            <form onSubmit={addGame} className="space-y-4">
              <input name="title" autoFocus placeholder="Game Title..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500" required />
              <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                      <select name="platform" defaultValue="PC" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500 appearance-none">
                          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={16} /></div>
                  </div>
                  <div className="relative">
                      <select name="status" defaultValue="backlog" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500 appearance-none">
                          <option value="backlog">Backlog</option>
                          <option value="playing">Playing</option>
                          <option value="completed">Completed</option>
                          <option value="shelved">Shelved</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={16} /></div>
                  </div>
              </div>
              <div className="flex gap-2">
                 <input name="coverUrl" placeholder="Cover Art URL..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500" />
                 <button type="button" onClick={() => {
                    const title = (document.querySelector('input[name="title"]')).value;
                    if(title) window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(title + " box art")}`, '_blank');
                 }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 rounded-xl flex items-center justify-center transition-colors"><Search size={20}/></button>
              </div>
              <div className="flex gap-2">
                 <input name="linkUrl" placeholder="Wiki / Guide URL (Optional)..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500" />
                 <button type="button" onClick={() => {
                    const title = (document.querySelector('input[name="title"]')).value;
                    if(title) window.open(`https://www.google.com/search?q=${encodeURIComponent(title + " wiki")}`, '_blank');
                 }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 rounded-xl flex items-center justify-center transition-colors"><Search size={20}/></button>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button><button type="submit" className="flex-1 bg-white text-black rounded-xl font-bold py-3">Add Game</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditGameModal && activeGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-black text-white">Edit Details</h2><button type="button" onClick={() => deleteGame(activeGame.id)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12}/> Delete</button></div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const fd = new FormData(e.target);
               const updates = { title: fd.get('title'), platform: fd.get('platform'), status: fd.get('status'), coverUrl: fd.get('coverUrl'), linkUrl: fd.get('linkUrl') };
               if(updates.status === 'completed' && activeGame.status !== 'completed') updates.completedDate = new Date().toISOString();
               updateGame(activeGame.id, updates);
               setShowEditGameModal(false);
            }} className="space-y-4">
               <div><label className="text-[10px] font-bold text-slate-500">Title</label><input name="title" defaultValue={activeGame.title} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500" /></div>
               <div className="grid grid-cols-2 gap-3">
                   <div><label className="text-[10px] font-bold text-slate-500">Platform</label><div className="relative"><select name="platform" defaultValue={activeGame.platform} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 appearance-none">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={14} /></div></div></div>
                   <div><label className="text-[10px] font-bold text-slate-500">Status</label><div className="relative"><select name="status" defaultValue={activeGame.status} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 appearance-none"><option value="backlog">Backlog</option><option value="playing">Playing</option><option value="completed">Completed</option><option value="shelved">Shelved</option></select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={14} /></div></div></div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500">Cover URL</label>
                  <div className="flex gap-2">
                      <input name="coverUrl" defaultValue={activeGame.coverUrl} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500" />
                      <button type="button" onClick={() => {
                        const title = (document.querySelector('input[name="title"]')).value;
                        if(title) window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(title + " box art")}`, '_blank');
                     }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 rounded-xl flex items-center justify-center transition-colors"><Search size={18}/></button>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500">Wiki / Guide URL</label>
                  <div className="flex gap-2">
                      <input name="linkUrl" defaultValue={activeGame.linkUrl} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500" />
                      <button type="button" onClick={() => {
                         const title = (document.querySelector('input[name="title"]')).value;
                         if(title) window.open(`https://www.google.com/search?q=${encodeURIComponent(title + " wiki")}`, '_blank');
                      }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 rounded-xl flex items-center justify-center transition-colors"><Search size={18}/></button>
                  </div>
               </div>
               <div className="flex gap-3 mt-4"><button type="button" onClick={() => setShowEditGameModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl font-bold">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {showLogModal && <LogEntryModal />}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-white">Settings</h2><button onClick={() => setShowSettingsModal(false)}><X size={20} className="text-slate-500 hover:text-white" /></button></div>
            <div className="space-y-3">
               <div className="w-full bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                  <Cloud size={24} />
                  <div>
                    <div className="font-bold text-sm">Cloud Sync Active</div>
                    <div className="text-[10px] opacity-75">Your data is safe on Firestore</div>
                  </div>
               </div>
               
               <button onClick={() => {
                  const data = { games, logs };
                   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = `orbit_backup_${new Date().toISOString().slice(0,10)}.json`;
                   a.click();
               }} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl flex items-center justify-between group"><div className="flex items-center gap-3"><Download size={20} className="text-indigo-400" /><div className="text-left"><div className="font-bold">Download Data</div><div className="text-[10px] text-slate-500">Save JSON backup</div></div></div></button>

               <button onClick={() => { requestConfirm("Permanently delete ALL data?", async () => { /* Nuke logic placeholder */ }); }} className="w-full bg-red-900/30 border border-red-900/50 hover:bg-red-900/50 text-red-400 p-3 rounded-lg flex items-center gap-2 justify-center text-xs mt-6"><AlertTriangle size={14} /> Nuke Account Data</button>
            </div>
            <div className="mt-6 text-center text-xs text-slate-600">Orbital v14.1 (Final)</div>
          </div>
        </div>
      )}

      {selectedDateLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white uppercase tracking-wide">{selectedDateLogs.date.toLocaleDateString()}</h2><button onClick={() => setSelectedDateLogs(null)} className="text-slate-500 hover:text-white"><X size={20} /></button></div>
            <div className="overflow-y-auto space-y-3 pr-2">
              {selectedDateLogs.logs.map(log => {
                 const game = games.find(g => g.id === log.gameId);
                 return (
                  <div key={log.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-baseline mb-1"><span className="font-bold text-indigo-400 text-sm">{game?.title}</span><span className="text-[10px] text-slate-500">{formatDuration(log.durationMinutes)}</span></div>
                    <div className="flex gap-1 flex-wrap mb-2">
                        {log.tags && log.tags.map(t => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[t] || TAG_COLORS.Idle}`}>{t}</span>)}
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{log.content}</p>
                    <div className="flex gap-2 justify-end mt-2"><button type="button" onClick={() => { setEditingLog(log); setShowLogModal(true); }} className="text-slate-500 text-xs hover:text-white">Edit</button><button type="button" onClick={() => deleteLog(log.id)} className="text-slate-500 text-xs hover:text-red-500">Delete</button></div>
                  </div>
                 );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}