import { useState, useMemo } from "react";
import { Habit } from "../data/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";

interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (name: string, category?: string, time?: string, icon?: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const CAT_THEME: Record<string, { color: string, bg: string, border: string }> = {
  "Mindfulness": { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  "Fitness": { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  "Learning": { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  "Health": { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  "Digital": { color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  "Wellness": { color: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
  "Productivity": { color: "#eab308", bg: "#fefce8", border: "#fef08a" },
  "Other": { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};

const getTheme = (cat?: string) => CAT_THEME[cat || "Other"] || CAT_THEME["Other"];

export default function HabitsPage({ habits, onToggle, onAdd, onDelete }: Props) {
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", category: "Mindfulness", time: "Morning", icon: "🧘‍♀️" });

  const today = new Date().toISOString().split("T")[0];
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateString = new Date().toLocaleDateString('en-US', dateOptions);

  // Stats calculation
  const total = habits.length;
  const doneTodayCount = habits.filter(h => h.done).length;
  const progressPercent = total > 0 ? Math.round((doneTodayCount / total) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  
  let perfectDays = 0;
  if (total > 0 && habits[0]?.history) {
    for (let i = 0; i < habits[0].history.length; i++) {
      const d = habits[0].history[i].date;
      const allDone = habits.every(h => h.history.find(hi => hi.date === d)?.done);
      if (allDone) perfectDays++;
    }
  }

  const avgMonthlyRate = total > 0 ? Math.round(habits.reduce((acc, h) => acc + (h.weeklyRate || 0), 0) / total) : 0;

  const catProgress = useMemo(() => {
    const counts: Record<string, { total: number, done: number }> = {};
    habits.forEach(h => {
      const cat = h.category || "Other";
      if (!counts[cat]) counts[cat] = { total: 0, done: 0 };
      counts[cat].total++;
      if (h.done) counts[cat].done++;
    });
    return Object.entries(counts).map(([name, stats]) => ({ name, ...stats }));
  }, [habits]);

  const trendData = useMemo(() => {
    if (!habits.length || !habits[0].history) return [];
    return habits[0].history.map((_, i) => {
      const date = habits[0].history[i].date;
      const doneCount = habits.filter(h => h.history.find(hi => hi.date === date)?.done).length;
      return { date, label: new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" }), value: doneCount };
    }).reverse();
  }, [habits]);

  const streakData = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 7).map(h => ({
    name: h.name, icon: h.icon, streak: h.streak, color: getTheme(h.category).color
  }));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    onAdd(newHabit.name.trim(), newHabit.category, newHabit.time, newHabit.icon);
    setIsModalOpen(false);
    setNewHabit({ name: "", category: "Mindfulness", time: "Morning", icon: "🧘‍♀️" });
  };

  const filteredHabits = filter === "All" ? habits : habits.filter(h => h.category === filter);

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-gray-900">
      
      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-none mb-2">Habits</h1>
          <p className="text-[15px] text-gray-500">{dateString}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#111] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors flex items-center gap-2"
        >
          <span>+</span> New Habit
        </button>
      </header>

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] p-8 flex flex-col md:flex-row gap-8 items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {/* Circular Progress */}
        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0 md:w-1/3">
          <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="44" fill="none" stroke="url(#progressLight)" strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressLight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute text-center flex flex-col items-center">
            <span className="text-[34px] font-bold tracking-tight text-gray-900 leading-none">{progressPercent}%</span>
            <span className="text-[11px] font-medium text-gray-400 mt-1.5">{doneTodayCount} of {total} done</span>
          </div>
        </div>

        {/* 2x2 Grid */}
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔥</span>
              <span className="text-[22px] font-bold text-orange-500 leading-none">{bestStreak}d</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Best Streak</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl text-gray-400">◎</span>
              <span className="text-[22px] font-bold text-blue-500 leading-none">{total}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Habits</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl text-yellow-400">⭐</span>
              <span className="text-[22px] font-bold text-purple-600 leading-none">{perfectDays}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Perfect Days</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl text-green-500">📈</span>
              <span className="text-[22px] font-bold text-emerald-500 leading-none">{avgMonthlyRate}%</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly Rate</div>
          </div>
        </div>
      </div>

      {/* Category Progress Card */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <h3 className="text-[15px] font-bold text-gray-900 mb-6">Category Progress</h3>
        <div className="space-y-4">
          {catProgress.map(c => {
            const theme = getTheme(c.name);
            const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
            return (
              <div key={c.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-medium" style={{ color: theme.color }}>{c.name}</span>
                  <span className="text-[12px] text-gray-500">{c.done}/{c.total}</span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%`, backgroundColor: theme.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Middle Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend */}
        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-[15px] font-bold text-gray-900 mb-1">14-Day Trend</h3>
          <p className="text-[13px] text-gray-400 mb-6">Habits completed per day</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
                <defs>
                  <linearGradient id="trendLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  cursor={{ stroke: '#e5e7eb' }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#trendLightGrad)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Board */}
        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-[15px] font-bold text-gray-900 mb-1">Streak Board</h3>
          <p className="text-[13px] text-gray-400 mb-6">Current streaks by habit</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -10 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis dataKey="icon" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 14 }} width={30} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Bar dataKey="streak" radius={[0, 4, 4, 0]}>
                  {streakData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] w-full overflow-hidden">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">28-Day Heatmap</h3>
        <p className="text-[13px] text-gray-400 mb-6">Daily habit completion per habit</p>
        
        <div className="overflow-x-auto pb-4">
          <div className="min-w-max">
            {habits.map(h => {
              const theme = getTheme(h.category);
              return (
                <div key={h.id} className="flex items-center gap-3 mb-2.5">
                  <div className="w-40 flex items-center gap-2 text-[13px] font-medium text-gray-600 truncate flex-shrink-0">
                    <span className="text-base">{h.icon}</span> <span className="truncate">{h.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {h.heatmapHistory && h.heatmapHistory.map((day, i) => {
                      const isToday = i === h.heatmapHistory!.length - 1;
                      return (
                        <div 
                          key={day.date} 
                          title={day.date}
                          className={`w-[14px] h-[14px] flex-shrink-0 rounded-[4px] border transition-colors ${
                            day.done 
                              ? `border-transparent`
                              : isToday ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-100'
                          }`}
                          style={day.done ? { backgroundColor: theme.color } : {}}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 border-t border-gray-100 pt-4 text-[11px] font-medium text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[3px] bg-[#8b5cf6]" /> Completed</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[3px] bg-gray-100" /> Missed</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[3px] border border-gray-300 bg-white" /> Today outlined</div>
        </div>
      </div>

      {/* Today's Habits Section */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <h3 className="text-[16px] font-bold text-gray-900 mb-4">Today's Habits</h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter("All")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${filter === "All" ? "bg-[#111] text-white border-[#111]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            All
          </button>
          {Array.from(new Set(habits.map(h => h.category || "Other"))).map(cat => {
            const theme = getTheme(cat);
            return (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border`}
                style={filter === cat ? { backgroundColor: 'transparent', color: theme.color, borderColor: theme.color } : { color: theme.color, borderColor: theme.border, backgroundColor: 'transparent' }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="space-y-0">
          {filteredHabits.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-gray-400">No habits found.</div>
          ) : (
            filteredHabits.map((h, i) => {
              const theme = getTheme(h.category);
              const isLast = i === filteredHabits.length - 1;
              return (
                <div key={h.id} className={`group flex items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {h.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[15px] font-medium text-gray-900">{h.name}</h4>
                        <span 
                          className="px-2 py-[2px] rounded text-[11px] font-medium"
                          style={{ color: theme.color }}
                        >
                          {h.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 ml-1">
                          {h.time === "Morning" ? "🌅" : h.time === "Evening" ? "🌙" : "⏱️"} {h.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-medium text-orange-500 flex items-center gap-1">
                          🔥 {h.streak}d streak
                        </span>
                        <div className="flex items-center gap-[3px]">
                          {h.history?.slice(0, 7).reverse().map((day, idx) => {
                            const isCurrentDay = idx === 6;
                            return (
                              <div 
                                key={idx} 
                                className={`w-[8px] h-[8px] flex-shrink-0 rounded-full border ${day.done ? 'border-transparent' : isCurrentDay ? 'border-gray-300' : 'border-gray-200'}`}
                                style={day.done ? { backgroundColor: theme.color } : {}}
                              />
                            )
                          })}
                          <span className="text-[11px] text-gray-400 ml-1">7d</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onDelete(h.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-gray-500 rounded-lg transition-all"
                      title="Delete Habit"
                    >
                      <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => onToggle(h.id)}
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all"
                      style={h.done ? { backgroundColor: theme.color, borderColor: theme.color } : { backgroundColor: '#f3f4f6' }}
                    >
                      <svg className={`w-5 h-5 transition-transform duration-300 ${h.done ? 'text-white scale-100' : 'text-transparent scale-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">New Habit</h3>
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Habit Name</label>
                <input 
                  type="text" 
                  value={newHabit.name}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. Read 10 pages"
                  autoFocus
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newHabit.category}
                    onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {Object.keys(CAT_THEME).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Time</label>
                  <select 
                    value={newHabit.time}
                    onChange={e => setNewHabit({...newHabit, time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Icon</label>
                <input 
                  type="text" 
                  value={newHabit.icon}
                  onChange={e => setNewHabit({...newHabit, icon: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[22px] text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="🧘‍♀️"
                  maxLength={5}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-[#111] hover:bg-black text-white text-[14px] font-medium rounded-xl shadow-md transition-transform active:scale-95"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
