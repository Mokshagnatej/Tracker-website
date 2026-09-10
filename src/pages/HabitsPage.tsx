import { useState, useMemo } from "react";
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
  { name: "Awesome", emoji: "🤩", color: "from-green-400 to-emerald-500" },
  { name: "Good", emoji: "😊", color: "from-blue-400 to-cyan-500" },
  { name: "Okay", emoji: "😐", color: "from-yellow-400 to-amber-500" },
  { name: "Bad", emoji: "😔", color: "from-red-400 to-rose-500" },
];

export default function HabitsPage({ habits, onToggle, onAdd, onDelete, showToast, todayMood, onUpdateMood }: Props) {
  const [newName, setNewName] = useState("");
  const today = todayStr();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
  };

  const doneTodayCount = habits.filter((h) => h.history[today]).length;
  const total = habits.length;
  const progress = total > 0 ? (doneTodayCount / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Hero / Mood Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Daily Habits</h1>
            <p className="text-white/80 text-sm">
              You've completed {doneTodayCount} out of {total} habits today.
            </p>
            <div className="mt-4 w-full bg-white/20 rounded-full h-2 max-w-xs overflow-hidden backdrop-blur-sm">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 w-full md:w-auto shadow-lg">
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 text-center md:text-left">
              How are you feeling today?
            </div>
            <div className="flex gap-3 justify-center md:justify-start">
              {MOODS.map(m => {
                const isActive = todayMood === m.name;
                return (
                  <button
                    key={m.name}
                    onClick={() => onUpdateMood && onUpdateMood(m.name)}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 transform ${isActive ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center text-2xl rounded-full bg-gradient-to-br ${isActive ? m.color + ' shadow-lg shadow-black/20' : 'from-white/20 to-white/10'}`}>
                      {m.emoji}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Habit Input */}
      <form onSubmit={handleAdd} className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
        <input 
          className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-gray-700 placeholder-gray-400" 
          type="text" 
          placeholder="What new habit do you want to start? e.g., Read 10 pages" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)} 
          required 
        />
        <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          Add Habit
        </button>
      </form>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            You don't have any habits yet. Start tracking today!
          </div>
        ) : (
          habits.map((h) => {
            const done = !!h.history[today];
            const isHot = h.streak >= 3;
            return (
              <div 
                key={h.id} 
                className={`relative group overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${done ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100'}`}
              >
                {/* Background glow if done */}
                {done && (
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-400 opacity-10 rounded-full blur-2xl"></div>
                )}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div 
                    onClick={() => onToggle(h.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${done ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/20' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    {done && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(h.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer bg-white p-1 rounded-md shadow-sm border border-gray-100"
                    title="Delete Habit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative z-10 cursor-pointer" onClick={() => onToggle(h.id)}>
                  <h3 className={`font-semibold text-lg mb-1 truncate transition-colors ${done ? 'text-gray-800' : 'text-gray-900'}`}>
                    {h.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <div className={`px-2 py-0.5 rounded-full ${isHot ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isHot ? '🔥' : '⭐'} {h.streak} day streak
                    </div>
                  </div>
                </div>
                
                {/* Mini Heatmap */}
                <div className="mt-5 flex gap-1 justify-between relative z-10">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dStr = d.toISOString().split("T")[0];
                    const isDone = h.history[dStr];
                    const isToday = dStr === today;
                    return (
                      <div 
                        key={dStr} 
                        className={`h-6 flex-1 rounded-sm transition-colors relative group/day ${isDone ? 'bg-green-400' : 'bg-gray-100'} ${isToday && !isDone ? 'ring-2 ring-gray-200' : ''}`}
                      >
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/day:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-20">
                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
