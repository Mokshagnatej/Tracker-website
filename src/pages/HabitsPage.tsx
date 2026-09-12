import { useState, useMemo } from "react";
import { Habit } from "../data/mockData";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts";

/* ── props ── */
interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (name: string, category?: string, time?: string, icon?: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  todayMood?: string | null;
  onUpdateMood?: (mood: string) => void;
}

/* ── category colours ── */
const CAT: Record<string, { color: string; bg: string; border: string }> = {
  Mindfulness:  { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  Fitness:      { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  Learning:     { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  Health:       { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  Digital:      { color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  Wellness:     { color: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
  Productivity: { color: "#eab308", bg: "#fefce8", border: "#fef08a" },
  Other:        { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};
const ct = (c?: string) => CAT[c || "Other"] || CAT.Other;

/* ── shared card style ── */
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  padding: 24,
};

/* ════════════════════════════════════════════ */
export default function HabitsPage({ habits, onToggle, onAdd, onDelete }: Props) {
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Mindfulness", time: "Morning", icon: "🧘‍♀️" });

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  /* ── stats ── */
  const total = habits.length;
  const doneCount = habits.filter((h) => h.done).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const bestStreak = total ? Math.max(...habits.map((h) => h.streak)) : 0;

  let perfectDays = 0;
  if (total && habits[0]?.history?.length) {
    habits[0].history.forEach((entry) => {
      if (habits.every((h) => h.history?.find((hi) => hi.date === entry.date)?.done)) perfectDays++;
    });
  }

  const monthlyRate = total ? Math.round(habits.reduce((a, h) => a + (h.weeklyRate || 0), 0) / total) : 0;

  /* ── derived data ── */
  const catProgress = useMemo(() => {
    const m: Record<string, { t: number; d: number }> = {};
    habits.forEach((h) => {
      const c = h.category || "Other";
      if (!m[c]) m[c] = { t: 0, d: 0 };
      m[c].t++;
      if (h.done) m[c].d++;
    });
    return Object.entries(m).map(([name, v]) => ({ name, ...v }));
  }, [habits]);

  const trendData = useMemo(() => {
    if (!habits.length || !habits[0]?.history?.length) return [];
    return habits[0].history
      .map((_, i) => {
        const date = habits[0].history[i].date;
        const v = habits.filter((h) => h.history?.find((hi) => hi.date === date)?.done).length;
        return { date, label: new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" }), value: v };
      })
      .reverse();
  }, [habits]);

  const streakData = useMemo(
    () =>
      [...habits]
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 8)
        .map((h) => ({ name: h.name, icon: h.icon || "◈", streak: h.streak, color: ct(h.category).color })),
    [habits],
  );

  const filtered = filter === "All" ? habits : habits.filter((h) => h.category === filter);
  const categories = useMemo(() => Array.from(new Set(habits.map((h) => h.category || "Other"))), [habits]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form.name.trim(), form.category, form.time, form.icon);
    setModal(false);
    setForm({ name: "", category: "Mindfulness", time: "Morning", icon: "🧘‍♀️" });
  };

  /* ═══════════════  RENDER  ═══════════════ */
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#111" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Habits</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: "4px 0 0" }}>{dateStr}</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          + New Habit
        </button>
      </div>

      {/* ── TOP ROW: Circle + 2×2 stats ── */}
      <div style={{ ...card, display: "flex", gap: 32, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {/* circle */}
        <div style={{ position: "relative", width: 170, height: 170, flexShrink: 0 }}>
          <svg width="170" height="170" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="9" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="url(#pg)" strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset .8s ease" }}
            />
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>{pct}%</span>
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{doneCount} of {total} done</span>
          </div>
        </div>

        {/* 2×2 grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, minWidth: 280 }}>
          {[
            { icon: "🔥", value: `${bestStreak}d`, label: "BEST STREAK", color: "#f97316", bg: "#fff7ed" },
            { icon: "◎", value: `${total}`, label: "ACTIVE HABITS", color: "#3b82f6", bg: "#eff6ff" },
            { icon: "⭐", value: `${perfectDays}`, label: "PERFECT DAYS", color: "#8b5cf6", bg: "#f5f3ff" },
            { icon: "📈", value: `${monthlyRate}%`, label: "MONTHLY RATE", color: "#10b981", bg: "#ecfdf5" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: s.color, opacity: 0.6, letterSpacing: "0.08em", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORY PROGRESS ── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Category Progress</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {catProgress.map((c) => {
            const th = ct(c.name);
            const p = c.t ? (c.d / c.t) * 100 : 0;
            return (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: th.color, background: th.bg, padding: "3px 10px", borderRadius: 6, border: `1px solid ${th.border}` }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{c.d}/{c.t}</span>
                </div>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p}%`, background: `linear-gradient(90deg, ${th.color}, ${th.color}cc)`, borderRadius: 99, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* 14-Day Trend */}
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>14-Day Trend</h3>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>Habits completed per day</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.08)", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#tg)" dot={false} activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Board */}
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Streak Board</h3>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>Current streaks by habit</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis dataKey="icon" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 15 }} width={28} />
                <RechartsTooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.08)", fontSize: 12 }} />
                <Bar dataKey="streak" radius={[0, 4, 4, 0]}>
                  {streakData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 28-DAY HEATMAP ── */}
      <div style={{ ...card, marginBottom: 20, overflowX: "auto" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>28-Day Heatmap</h3>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>Daily habit completion per habit</p>
        <div style={{ minWidth: "max-content" }}>
          {habits.map((h) => {
            const th = ct(h.category);
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 140, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#4b5563", flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  <span style={{ fontSize: 15 }}>{h.icon}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(h.heatmapHistory || []).map((day, i) => {
                    const isToday = i === (h.heatmapHistory?.length || 0) - 1;
                    return (
                      <div
                        key={day.date}
                        title={day.date}
                        style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          background: day.done ? th.color : isToday ? "#fff" : "#f3f4f6",
                          border: isToday && !day.done ? "1.5px solid #d1d5db" : "1.5px solid transparent",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {/* legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6", fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#8b5cf6", display: "inline-block" }} /> Completed</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#f3f4f6", display: "inline-block" }} /> Missed</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#fff", border: "1.5px solid #d1d5db", display: "inline-block" }} /> Future</span>
          <span style={{ marginLeft: "auto", color: "#bbb" }}>Today outlined · Color = completed</span>
        </div>
      </div>

      {/* ── TODAY'S HABITS ── */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Today's Habits</h3>

        {/* filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <Pill active={filter === "All"} color="#111" onClick={() => setFilter("All")}>All</Pill>
          {categories.map((c) => (
            <Pill key={c} active={filter === c} color={ct(c).color} onClick={() => setFilter(c)}>{c}</Pill>
          ))}
        </div>

        {/* list */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#d1d5db", fontSize: 14 }}>No habits found.</div>
        ) : (
          filtered.map((h, i) => {
            const th = ct(h.category);
            return (
              <div
                key={h.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                {/* left */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: th.bg, border: `1px solid ${th.border}` }}>
                    {h.icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{h.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: th.color, background: th.bg, padding: "2px 8px", borderRadius: 4, border: `1px solid ${th.border}` }}>{h.category}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
                        {h.time === "Morning" ? "🌅" : h.time === "Evening" ? "🌙" : "⏱️"} {h.time}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#f97316", display: "flex", alignItems: "center", gap: 3 }}>
                        🔥 {h.streak}d streak
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {(h.history || []).slice(0, 7).reverse().map((d, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: d.done ? th.color : "transparent",
                              border: d.done ? "none" : idx === 6 ? "1.5px solid #d1d5db" : "1.5px solid #e5e7eb",
                            }}
                          />
                        ))}
                        <span style={{ fontSize: 11, color: "#d1d5db", marginLeft: 3 }}>7d</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* right */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => onDelete(h.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }}
                    title="Delete"
                  >✕</button>
                  <button
                    onClick={() => onToggle(h.id)}
                    style={{
                      width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: h.done ? th.color : "#f3f4f6",
                      transition: "background .2s",
                    }}
                  >
                    {h.done && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 32, width: 380, maxWidth: "90vw" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>New Habit</h3>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label>
                <div style={labelSt}>HABIT NAME</div>
                <input
                  type="text" required autoFocus
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Read 10 pages"
                  style={inputSt}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <div style={labelSt}>CATEGORY</div>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputSt}>
                    {Object.keys(CAT).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  <div style={labelSt}>TIME</div>
                  <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={inputSt}>
                    <option>Morning</option><option>Evening</option><option>Anytime</option>
                  </select>
                </label>
              </div>
              <label>
                <div style={labelSt}>ICON</div>
                <input
                  type="text" maxLength={5}
                  value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{ ...inputSt, textAlign: "center", fontSize: 22 }}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModal(false)} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 500, color: "#9ca3af", cursor: "pointer", padding: "10px 16px" }}>Cancel</button>
                <button type="submit" style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── tiny helpers ── */
function Pill({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer",
        border: active ? `1.5px solid ${color}` : "1.5px solid #e5e7eb",
        background: active && color === "#111" ? "#111" : "transparent",
        color: active && color === "#111" ? "#fff" : active ? color : "#6b7280",
        transition: "all .15s",
      } as React.CSSProperties}
    >{children}</button>
  );
}

const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 6 };
const inputSt: React.CSSProperties = {
  width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "12px 14px", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
  outline: "none",
};
