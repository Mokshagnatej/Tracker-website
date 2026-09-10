import { useState } from "react";
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
  { name: "Awesome", emoji: "🤩", color: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  { name: "Good", emoji: "😊", color: "bg-blue-100 text-blue-700 ring-blue-200" },
  { name: "Okay", emoji: "😐", color: "bg-amber-100 text-amber-700 ring-amber-200" },
  { name: "Bad", emoji: "😔", color: "bg-rose-100 text-rose-700 ring-rose-200" },
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
    <div className="flex flex-col max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-10">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 px-8 py-12 sm:px-12 sm:py-16 shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-40">
           <svg className="w-96 h-96 text-indigo-500 animate-[spin_20s_linear_infinite]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
             <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.6,-46.2C91.4,-33.3,98.1,-16.7,98.3,0.1C98.5,16.9,92.3,33.8,82.4,46.9C72.5,60,59,69.4,44.4,76.6C29.8,83.8,14.9,88.8,0.4,88.1C-14.1,87.4,-28.2,81,-40.7,73.2C-53.2,65.4,-64.1,56.1,-72.6,44.2C-81.1,32.3,-87.3,16.1,-88.2,-0.5C-89.1,-17.1,-84.7,-34.2,-75.7,-48.5C-66.7,-62.8,-53.1,-74.3,-38.3,-81.1C-23.5,-87.9,-11.7,-90,2.3,-94C16.3,-98,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
           </svg>
        </div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 opacity-30">
           <svg className="w-80 h-80 text-fuchsia-500 animate-[spin_15s_linear_infinite_reverse]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
             <path fill="currentColor" d="M39.9,-65.7C54.1,-58.5,69.6,-53.2,79.5,-41.6C89.4,-30,93.7,-12,91.8,5.1C89.9,22.2,81.8,38.4,70.5,51C59.2,63.6,44.7,72.6,28.8,78.2C12.9,83.8,-4.4,86,-20.9,81.9C-37.4,77.8,-53.1,67.4,-63.3,53.2C-73.5,39,-78.2,21,-78.8,3.5C-79.4,-14,-75.9,-31,-66.1,-43.3C-56.3,-55.6,-40.2,-63.2,-25.9,-69.3C-11.6,-75.4,0.9,-80,13.6,-78C26.3,-76,38,-67.4,39.9,-65.7Z" transform="translate(100 100)" />
           </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="w-full lg:w-1/2">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
              Own Your Day.
            </h1>
            <p className="text-lg text-indigo-100/90 font-medium mb-8">
              Consistency is the key to mastery. You've conquered <span className="text-white font-bold">{doneTodayCount}</span> of <span className="text-white font-bold">{total}</span> habits today.
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-indigo-100">
                <span>Daily Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full bg-gray-800/50 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest mb-6 text-center lg:text-left">
              How are you feeling?
            </h3>
            <div className="flex gap-4 justify-center">
              {MOODS.map(m => {
                const isActive = todayMood === m.name;
                return (
                  <button
                    key={m.name}
                    onClick={() => onUpdateMood && onUpdateMood(m.name)}
                    className="group flex flex-col items-center gap-2 focus:outline-none"
                  >
                    <div className={`w-14 h-14 flex items-center justify-center text-3xl rounded-full transition-all duration-300 transform ${
                      isActive 
                        ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 -translate-y-2' 
                        : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                    }`}>
                      {m.emoji}
                    </div>
                    <span className={`text-xs font-semibold transition-all ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-8">
        
        {/* Add Habit Input */}
        <form onSubmit={handleAdd} className="relative max-w-2xl mx-auto w-full group mt-4">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <input 
            className="block w-full rounded-full border-0 py-5 pl-14 pr-36 text-gray-900 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-base transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline-none" 
            type="text" 
            placeholder="E.g., Meditate for 10 minutes..." 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            required 
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <button type="submit" className="rounded-full bg-gray-900 hover:bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-2">
              Add Habit
            </button>
          </div>
        </form>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {habits.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No habits tracked yet</p>
              <p className="text-sm">Start your journey by adding a habit above.</p>
            </div>
          ) : (
            habits.map((h) => {
              const done = !!h.history[today];
              const isHot = h.streak >= 3;
              
              return (
                <div 
                  key={h.id} 
                  className={`group relative bg-white rounded-3xl p-6 transition-all duration-300 border ${
                    done 
                      ? 'border-indigo-100 shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)]' 
                      : 'border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => onToggle(h.id)}
                      className={`mt-1 relative flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-300 ease-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        done 
                          ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200 scale-110' 
                          : 'border-gray-300 bg-transparent hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      <svg 
                        className={`w-5 h-5 text-white transition-transform duration-300 ${done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className={`text-lg font-bold truncate transition-colors duration-300 ${done ? 'text-gray-400' : 'text-gray-900'}`}>
                        {h.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {isHot ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600 ring-1 ring-inset ring-orange-600/20">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-4 4c-1.913 0-3.52-1.398-3.91-3.182-.093-.429.44-.643.814-.413a4.043 4.043 0 001.601.564c.303.038.531-.24.51-.544a5.975 5.975 0 011.315-4.192.447.447 0 01.431-.16A4.001 4.001 0 0114 12z" clipRule="evenodd" />
                            </svg>
                            {h.streak} Day Streak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            ⭐ {h.streak} Day Streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(h.id)}
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-full focus:opacity-100"
                    title="Delete Habit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  {/* Heatmap Row */}
                  <div className="mt-6 flex items-center justify-between gap-1.5 pl-12">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      const dStr = d.toISOString().split("T")[0];
                      const isDone = h.history[dStr];
                      const isToday = dStr === today;
                      
                      return (
                        <div key={dStr} className="relative group/day flex-1 flex flex-col items-center gap-1">
                          <div 
                            className={`w-full h-2 rounded-full transition-all duration-300 ${
                              isDone 
                                ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                                : 'bg-gray-100'
                            } ${isToday && !isDone ? 'ring-2 ring-indigo-200 ring-offset-1' : ''}`}
                          />
                          <div className="opacity-0 group-hover/day:opacity-100 absolute -bottom-6 text-[10px] font-bold text-gray-500 transition-opacity whitespace-nowrap">
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
    </div>
  );
}
