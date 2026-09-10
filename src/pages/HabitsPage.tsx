import { useState, useEffect } from "react";
import { Habit } from "../data/mockData";

interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  todayMood?: string | null;
  onUpdateMood?: (mood: string) => void;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const MOODS = [
  { name: "Awesome", emoji: "🤩", color: "text-emerald-400" },
  { name: "Good", emoji: "😊", color: "text-cyan-400" },
  { name: "Okay", emoji: "😐", color: "text-amber-400" },
  { name: "Bad", emoji: "😔", color: "text-rose-400" },
];

export default function HabitsPage({ habits, onToggle, onAdd, onDelete, showToast, todayMood, onUpdateMood }: Props) {
  const [newName, setNewName] = useState("");
  const today = todayStr();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
  };

  const doneTodayCount = habits.filter((h) => h.history[today]).length;
  const total = habits.length;
  const progress = total > 0 ? (doneTodayCount / total) * 100 : 0;
  
  // Format date nicely
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-widest">{dateString}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Habits.
            </h1>
            
            <div className="mt-8 flex items-center gap-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                    strokeLinecap="round"
                    className="text-cyan-400 transition-all duration-1000 ease-out drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  />
                </svg>
                <span className="absolute text-sm font-bold">{doneTodayCount}/{total}</span>
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Daily Progress</p>
                <p className="text-xl font-medium text-white">{Math.round(progress)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-2 flex gap-1 shadow-2xl">
            {MOODS.map(m => {
              const isActive = todayMood === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => onUpdateMood && onUpdateMood(m.name)}
                  className={`relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 group outline-none ${
                    isActive ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <span className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'grayscale-[50%] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'}`}>
                    {m.emoji}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* New Habit Input - Sleek Command Palette Style */}
        <form onSubmit={handleAdd} className="relative mb-12 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input 
            className="w-full bg-[#121214] border border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-lg text-sm sm:text-base"
            type="text" 
            placeholder="Log a new habit... e.g. Read 10 pages" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            required 
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 px-4 py-2 rounded-xl transition-colors border border-zinc-700">
              Add
            </button>
          </div>
        </form>

        {/* Habits List */}
        <div className="flex flex-col gap-3">
          {habits.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-[#121214]/50">
              <p className="text-zinc-500">No habits tracked yet.</p>
            </div>
          ) : (
            habits.map((h) => {
              const done = !!h.history[today];
              const isHot = h.streak >= 3;
              
              return (
                <div 
                  key={h.id} 
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                    done 
                      ? 'bg-cyan-950/10 border-cyan-500/20 shadow-[0_4px_20px_rgba(34,211,238,0.03)]' 
                      : 'bg-[#121214] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onToggle(h.id)}
                      className={`relative flex-shrink-0 w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090b] focus:ring-cyan-500 ${
                        done 
                          ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                          : 'border-zinc-600 hover:border-cyan-400 bg-transparent'
                      }`}
                    >
                      <svg 
                        className={`w-3.5 h-3.5 text-zinc-950 transition-transform duration-300 ${done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    
                    <h3 className={`text-base sm:text-lg font-medium tracking-tight transition-colors duration-300 ${done ? 'text-zinc-300' : 'text-zinc-100'}`}>
                      {h.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pl-10 sm:pl-0">
                    
                    {/* Mini Heatmap */}
                    <div className="flex items-end gap-1.5 h-8">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const dStr = d.toISOString().split("T")[0];
                        const isDone = h.history[dStr];
                        const isToday = dStr === today;
                        
                        return (
                          <div key={dStr} className="relative group/day h-full flex items-end">
                            <div 
                              className={`w-1.5 rounded-full transition-all duration-300 ${
                                isDone 
                                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.3)] h-full' 
                                  : 'bg-zinc-800 h-1/3'
                              } ${isToday && !isDone ? 'ring-1 ring-cyan-500/50' : ''}`}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover/day:opacity-100 pointer-events-none whitespace-nowrap transition-opacity border border-zinc-700">
                              {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Streak & Actions */}
                    <div className="flex items-center gap-4 w-24 justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-mono font-medium ${isHot ? 'text-orange-400' : 'text-zinc-500'}`}>
                          {h.streak}
                        </span>
                        <span className={`text-sm ${isHot ? 'opacity-100 drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]' : 'opacity-40 grayscale'}`}>
                          🔥
                        </span>
                      </div>
                      
                      <button
                        onClick={() => onDelete(h.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all rounded-md focus:opacity-100"
                        title="Delete Habit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
