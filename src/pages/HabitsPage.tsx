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
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Stats calculation
  const total = habits.length;
  const doneTodayCount = habits.filter(h => h.done).length;
  const progressPercent = total > 0 ? Math.round((doneTodayCount / total) * 100) : 0;
  
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  
  // Perfect days (days where all active habits were done)
  // For simplicity, we assume 'active' habits means the current total.
  let perfectDays = 0;
  if (total > 0 && habits[0]?.history) {
    for (let i = 0; i < habits[0].history.length; i++) {
      const d = habits[0].history[i].date;
      const allDone = habits.every(h => h.history.find(hi => hi.date === d)?.done);
      if (allDone) perfectDays++;
    }
  }

  const avgMonthlyRate = total > 0 ? Math.round(habits.reduce((acc, h) => acc + (h.weeklyRate || 0), 0) / total) : 0;

  // Category Progress
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

  // 14-Day Trend Data
  const trendData = useMemo(() => {
    if (!habits.length || !habits[0].history) return [];
    return habits[0].history.map((_, i) => {
      const date = habits[0].history[i].date;
      const doneCount = habits.filter(h => h.history.find(hi => hi.date === date)?.done).length;
      return {
        date,
        label: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: doneCount
      };
    }).reverse();
  }, [habits]);

  // Streak Board Data
  const streakData = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 7).map(h => ({
    name: h.name,
    icon: h.icon,
    streak: h.streak,
    color: getTheme(h.category).color
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-gray-900 pb-20">
      
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[2rem] font-bold tracking-tight text-gray-900 leading-none mb-1">Habits</h1>
          <p className="text-[0.95rem] text-gray-500 font-medium">{dateString}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-md hover:bg-black transition-colors flex items-center gap-2 text-sm"
        >
          <span>+</span> New Habit
        </button>
      </header>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Stats Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-8 items-center">
          {/* Circular Progress */}
          <div className="flex-shrink-0 relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="url(#progressGrad)" strokeWidth="8" 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="block text-3xl font-bold tracking-tight text-gray-900 leading-none">{progressPercent}%</span>
              <span className="block text-xs font-medium text-gray-400 mt-1">{doneTodayCount} of {total} done</span>
            </div>
          </div>

          {/* 2x2 Grid */}
          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
              <div className="text-xl mb-1">🔥</div>
              <div className="text-xl font-bold text-gray-900">{bestStreak}d</div>
              <div className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Best Streak</div>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
              <div className="text-xl mb-1 text-gray-400">◎</div>
              <div className="text-xl font-bold text-blue-600">{total}</div>
              <div className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Active Habits</div>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
              <div className="text-xl mb-1 text-yellow-400">⭐</div>
              <div className="text-xl font-bold text-purple-600">{perfectDays}</div>
              <div className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Perfect Days</div>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
              <div className="text-xl mb-1 text-green-500">📈</div>
              <div className="text-xl font-bold text-emerald-600">{avgMonthlyRate}%</div>
              <div className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Monthly Rate</div>
            </div>
          </div>
        </div>

        {/* Category Progress Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-5">Category Progress</h3>
          <div className="space-y-4">
            {catProgress.map(c => {
              const theme = getTheme(c.name);
              const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span style={{ color: theme.color }}>{c.name}</span>
                    <span className="text-gray-400">{c.done}/{c.total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
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

      </div>

      {/* Middle Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">14-Day Trend</h3>
          <p className="text-xs text-gray-400 mb-6">Habits completed per day</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  cursor={{ stroke: '#e5e7eb' }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, strokeWidth: 2, fill: "#fff", stroke: "#8b5cf6" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Board */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Streak Board</h3>
          <p className="text-xs text-gray-400 mb-4">Current streaks by habit</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -10 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis dataKey="icon" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 14 }} width={30} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                <Bar dataKey="streak" radius={[0, 4, 4, 0]}>
                  {streakData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-1">28-Day Heatmap</h3>
        <p className="text-xs text-gray-400 mb-6">Daily habit completion per habit</p>
        
        <div className="overflow-x-auto pb-2">
          <div className="min-w-max">
            {habits.map(h => {
              const theme = getTheme(h.category);
              return (
                <div key={h.id} className="flex items-center gap-3 mb-2.5">
                  <div className="w-32 flex items-center gap-2 text-xs font-medium text-gray-600 truncate">
                    <span>{h.icon}</span> {h.name}
                  </div>
                  <div className="flex gap-1.5 flex-1">
                    {h.heatmapHistory && [...h.heatmapHistory].reverse().map((day, i) => {
                      const isToday = i === h.heatmapHistory!.length - 1;
                      return (
                        <div 
                          key={day.date} 
                          title={day.date}
                          className={`w-[14px] h-[14px] rounded-[3px] border transition-colors ${
                            day.done 
                              ? `border-transparent`
                              : isToday ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-100/70'
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
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-[10px] font-medium text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-[#8b5cf6]" /> Completed</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100" /> Missed</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] border border-gray-300 bg-white" /> Today outlined</div>
        </div>
      </div>

      {/* Today's Habits Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Today's Habits</h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter("All")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filter === "All" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            All
          </button>
          {Object.keys(CAT_THEME).map(cat => {
            if (cat === "Other" && !habits.some(h => h.category === "Other")) return null;
            const hasHabit = habits.some(h => h.category === cat);
            if (!hasHabit) return null;
            
            const theme = getTheme(cat);
            return (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border`}
                style={filter === cat ? { backgroundColor: theme.color, color: "#fff", borderColor: theme.color } : { color: theme.color, borderColor: theme.border, backgroundColor: 'transparent' }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredHabits.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No habits found.</div>
          ) : (
            filteredHabits.map(h => {
              const theme = getTheme(h.category);
              return (
                <div key={h.id} className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                      {h.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[0.95rem] font-semibold text-gray-900">{h.name}</h4>
                        <span 
                          className="px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider"
                          style={{ color: theme.color, backgroundColor: theme.bg }}
                        >
                          {h.category}
                        </span>
                        <span className="flex items-center gap-1 text-[0.65rem] text-gray-400 font-medium">
                          {h.time === "Morning" ? "🌅" : h.time === "Evening" ? "🌙" : "⏱️"} {h.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-orange-500 flex items-center gap-1">
                          🔥 {h.streak}d streak
                        </span>
                        <div className="flex items-center gap-1">
                          {h.history?.slice(0, 7).reverse().map((day, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-1.5 rounded-full border ${day.done ? 'border-transparent' : 'border-gray-300'}`}
                              style={day.done ? { backgroundColor: theme.color } : {}}
                            />
                          ))}
                          <span className="text-[0.65rem] text-gray-400 font-medium ml-1">7d</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onDelete(h.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Habit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => onToggle(h.id)}
                      className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md"
                      style={h.done ? { backgroundColor: theme.color, borderColor: theme.color } : { borderColor: '#e5e7eb', backgroundColor: '#fff' }}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Habit</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Habit Name</label>
                <input 
                  type="text" 
                  value={newHabit.name}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. Read 10 pages"
                  autoFocus
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select 
                    value={newHabit.category}
                    onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {Object.keys(CAT_THEME).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                  <select 
                    value={newHabit.time}
                    onChange={e => setNewHabit({...newHabit, time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emoji Icon</label>
                <input 
                  type="text" 
                  value={newHabit.icon}
                  onChange={e => setNewHabit({...newHabit, icon: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xl text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="🧘‍♀️"
                  maxLength={5}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
