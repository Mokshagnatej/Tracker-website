import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import {
  Habit, HABIT_CATEGORIES, HABIT_CAT_COLOR, HABIT_CAT_BG, dateStr,
} from "../data/mockData";

interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (h: Omit<Habit, "id" | "streak" | "history">) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const today = dateStr(0);

const TIME_LABEL: Record<string, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌙 Evening",
  anytime: "🕐 Anytime",
};

function Ring({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 68, stroke = 10, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
      <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f0f0ee" strokeWidth={stroke} />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#111", lineHeight: 1 }}>
          {pct}%
        </div>
        <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 4, fontWeight: 500 }}>
          {done} of {total} done
        </div>
      </div>
    </div>
  );
}

const AreaTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.55rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#7c3aed" }}>{payload[0].value} habits</div>
    </div>
  );
};

const BarTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.55rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 2 }}>{d.fullName}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: HABIT_CAT_COLOR[d.category] || "#111" }}>
        {d.streak}d streak
      </div>
    </div>
  );
};

export default function HabitsPage({ habits, onToggle, onAdd, onDelete, showToast }: Props) {
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("Mindfulness");
  const [newIcon, setNewIcon] = useState("⭐");
  const [newTime, setNewTime] = useState<Habit["timeOfDay"]>("morning");
  const [newDesc, setNewDesc] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const doneToday = useMemo(() => habits.filter((h) => h.history[today]).length, [habits]);
  const total = habits.length;
  const rate = total > 0 ? Math.round((doneToday / total) * 100) : 0;
  const bestStreak = useMemo(() => Math.max(0, ...habits.map((h) => h.streak)), [habits]);

  const perfectDays = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 30; i++) {
      const d = dateStr(i);
      if (habits.length > 0 && habits.every((h) => h.history[d])) count++;
    }
    return count;
  }, [habits]);

  const monthlyRate = useMemo(() => {
    if (!habits.length) return 0;
    let done = 0, possible = 0;
    for (let i = 0; i < 30; i++) {
      const d = dateStr(i);
      habits.forEach((h) => { possible++; if (h.history[d]) done++; });
    }
    return possible > 0 ? Math.round((done / possible) * 100) : 0;
  }, [habits]);

  const filtered = useMemo(
    () => catFilter === "all" ? habits : habits.filter((h) => h.category === catFilter),
    [habits, catFilter]
  );

  const weeklyData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = dateStr(13 - i);
        return {
          day: new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          done: habits.filter((h) => h.history[d]).length,
        };
      }),
    [habits]
  );

  const streakData = useMemo(
    () =>
      [...habits]
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 8)
        .map((h) => ({
          name: h.name.length > 12 ? h.name.slice(0, 10) + "…" : h.name,
          fullName: h.name,
          streak: h.streak,
          category: h.category,
          icon: h.icon,
          doneToday: !!h.history[today],
        })),
    [habits]
  );

  const heatDates = useMemo(() => Array.from({ length: 28 }, (_, i) => dateStr(27 - i)), []);
  const heatWeeks = useMemo(() => {
    const weeks: string[][] = [];
    for (let i = 0; i < heatDates.length; i += 7) weeks.push(heatDates.slice(i, i + 7));
    return weeks;
  }, [heatDates]);

  const catCompletionData = useMemo(
    () =>
      HABIT_CATEGORIES.map((cat) => {
        const ch = habits.filter((h) => h.category === cat);
        if (!ch.length) return null;
        const done = ch.filter((h) => h.history[today]).length;
        return { cat, done, total: ch.length, pct: Math.round((done / ch.length) * 100) };
      }).filter(Boolean) as { cat: string; done: number; total: number; pct: number }[],
    [habits]
  );

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;
      onAdd({ name: newName.trim(), icon: newIcon, category: newCat, timeOfDay: newTime, description: newDesc });
      showToast(`"${newName.trim()}" added`);
      setNewName(""); setNewIcon("⭐"); setNewCat("Mindfulness"); setNewTime("morning"); setNewDesc("");
      setShowForm(false);
    },
    [newName, newIcon, newCat, newTime, newDesc, onAdd, showToast]
  );

  const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>{dateLabel}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)} style={{ marginTop: "0.35rem" }}>
          {showForm ? "✕ Cancel" : "+ New Habit"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "1rem" }}>New Habit</div>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "0.65rem" }}>
              <input className="input" value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🌟" style={{ textAlign: "center", fontSize: "1.2rem" }} maxLength={2} />
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Habit name…" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <select className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                {HABIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={newTime} onChange={(e) => setNewTime(e.target.value as Habit["timeOfDay"])}>
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌙 Evening</option>
                <option value="anytime">🕐 Anytime</option>
              </select>
            </div>
            <input className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)…" />
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Add Habit →
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          <Ring pct={rate} done={doneToday} total={total} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", flex: 1, minWidth: 200 }}>
            {[
              { label: "Best Streak", value: `${bestStreak}d`, icon: "🔥", color: "#d97706" },
              { label: "Active Habits", value: String(total), icon: "◎", color: "#2563eb" },
              { label: "Perfect Days", value: String(perfectDays), icon: "⭐", color: "#7c3aed" },
              { label: "Monthly Rate", value: `${monthlyRate}%`, icon: "📈", color: "#059669" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: "#fafafa", border: "1px solid #f0f0ee", borderRadius: 12, padding: "0.85rem 1rem" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.3rem" }}>{icon}</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 700, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {catCompletionData.length > 0 && (
        <div className="card" style={{ marginBottom: "1.1rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "1rem", color: "#111" }}>Category Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {catCompletionData.map(({ cat, done, total: ct, pct }) => (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{
                    display: "inline-block", padding: "0.1rem 0.55rem", borderRadius: 99,
                    fontSize: "0.72rem", fontWeight: 600,
                    background: HABIT_CAT_BG[cat], color: HABIT_CAT_COLOR[cat],
                  }}>{cat}</span>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{done}/{ct}</span>
                </div>
                <div className="pbar-track">
                  <div className="pbar-fill" style={{ width: `${pct}%`, background: HABIT_CAT_COLOR[cat] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.1rem", padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid #f0f0ee", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111" }}>{"Today's Habits"}</div>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            <button onClick={() => setCatFilter("all")} className={`chip${catFilter === "all" ? " active" : ""}`}>All</button>
            {HABIT_CATEGORIES.filter((c) => habits.some((h) => h.category === c)).map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`chip${catFilter === cat ? " active" : ""}`}
                style={catFilter === cat ? {} : { borderColor: HABIT_CAT_COLOR[cat] + "40", color: HABIT_CAT_COLOR[cat] }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
            No habits in this category.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filtered.map((h, i) => {
              const done = !!h.history[today];
              const isExpanded = expandedId === h.id;
              const weekDots = Array.from({ length: 7 }, (_, j) => ({
                hit: !!h.history[dateStr(6 - j)],
                isToday: dateStr(6 - j) === today,
              }));
              const catColor = HABIT_CAT_COLOR[h.category] || "#6b7280";
              const catBg = HABIT_CAT_BG[h.category] || "#f8fafc";

              return (
                <li key={h.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0f0ee" : "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "0.9rem 1.5rem",
                    background: done ? "#fafafa" : "#fff",
                    transition: "background 0.15s",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: done ? catBg : "#f5f5f3",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.2rem", transition: "background 0.2s",
                    }}>{h.icon}</div>

                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : h.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.875rem", fontWeight: 600,
                          color: done ? "#9ca3af" : "#111",
                          textDecoration: done ? "line-through" : "none",
                        }}>{h.name}</span>
                        <span style={{
                          padding: "0.1rem 0.5rem", borderRadius: 99,
                          fontSize: "0.68rem", fontWeight: 600,
                          background: catBg, color: catColor,
                        }}>{h.category}</span>
                        <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{TIME_LABEL[h.timeOfDay]}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
                        <span style={{ fontSize: "0.75rem", color: h.streak >= 7 ? "#d97706" : "#9ca3af" }}>
                          {h.streak >= 7 ? "🔥" : "◎"} {h.streak}d streak
                        </span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {weekDots.map((dot, di) => (
                            <div key={di} style={{
                              width: 8, height: 8, borderRadius: 3,
                              background: dot.hit ? (dot.isToday ? catColor : catColor + "99") : "#e5e7eb",
                              outline: dot.isToday ? `2px solid ${catColor}` : "none",
                              outlineOffset: 1,
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "0.68rem", color: "#d1d5db" }}>7d</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => { onDelete(h.id); showToast("Habit removed", "error"); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#e5e7eb", fontSize: "0.8rem", padding: "4px",
                          borderRadius: 6, transition: "color 0.15s, background 0.15s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = "#e5e7eb"; e.currentTarget.style.background = "none"; }}
                        title="Remove"
                      >✕</button>
                      <button
                        onClick={() => { onToggle(h.id); showToast(done ? "Unmarked" : `✓ ${h.name}`); }}
                        style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          border: `2px solid ${done ? catColor : "#e5e7eb"}`,
                          background: done ? catColor : "#fff",
                          cursor: "pointer", transition: "all 0.2s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", color: done ? "#fff" : "transparent",
                          boxShadow: done ? `0 2px 8px ${catColor}40` : "none",
                        }}
                      >✓</button>
                    </div>
                  </div>

                  {isExpanded && h.description && (
                    <div style={{
                      padding: "0.65rem 1.5rem 0.85rem 4.5rem",
                      background: "#fafafa", fontSize: "0.8rem", color: "#6b7280",
                      borderTop: "1px solid #f0f0ee",
                    }}>
                      {h.description}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem", marginBottom: "1.1rem" }}>
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.25rem" }}>14-Day Trend</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>Habits completed per day</div>
          <div style={{ height: 160, minHeight: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<AreaTip />} cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="done" stroke="#7c3aed" strokeWidth={2}
                  fill="url(#habitGrad)" dot={false}
                  activeDot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.25rem" }}>Streak Board</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>Current streaks by habit</div>
          <div style={{ height: 160, minHeight: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={streakData} layout="vertical" barSize={8} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="icon" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<BarTip />} cursor={{ fill: "rgba(0,0,0,0.025)" }} />
                <Bar dataKey="streak" radius={[0, 4, 4, 0]} background={{ fill: "#f5f5f3", radius: 4 }}>
                  {streakData.map((e, i) => (
                    <Cell key={i} fill={e.doneToday ? HABIT_CAT_COLOR[e.category] : HABIT_CAT_COLOR[e.category] + "55"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.25rem" }}>28-Day Heatmap</div>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1.25rem" }}>Daily habit completion per habit</div>
        <div style={{ minWidth: 520 }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px repeat(4, 1fr)", gap: 4, marginBottom: 4 }}>
            <div />
            {heatWeeks.map((week, wi) => (
              <div key={wi} style={{ textAlign: "center", fontSize: "0.65rem", color: "#9ca3af", fontWeight: 500 }}>
                {new Date(week[0]).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
            ))}
          </div>

          {habits.map((h) => {
            const catColor = HABIT_CAT_COLOR[h.category] || "#7c3aed";
            return (
              <div key={h.id} style={{ display: "grid", gridTemplateColumns: "100px repeat(4, 1fr)", gap: 4, marginBottom: 4, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingRight: 8 }}>
                  <span style={{ fontSize: "0.85rem" }}>{h.icon}</span>
                  <span style={{ fontSize: "0.72rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.name}
                  </span>
                </div>
                {heatWeeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", gap: 3 }}>
                    {week.map((d, di) => {
                      const isDone = h.history[d];
                      const isFuture = d > today;
                      const isToday = d === today;
                      return (
                        <div key={di}
                          title={`${h.name} · ${d} · ${isFuture ? "future" : isDone ? "done ✓" : "missed"}`}
                          style={{
                            flex: 1, height: 20, borderRadius: 4,
                            background: isFuture ? "#f5f5f3" : isDone ? catColor : `${catColor}20`,
                            opacity: isFuture ? 0.4 : 1,
                            outline: isToday ? `2px solid ${catColor}` : "none",
                            outlineOffset: 1,
                            transition: "transform 0.15s",
                            cursor: "default",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #f0f0ee", flexWrap: "wrap" }}>
            {[
              { label: "Completed", color: "#7c3aed" },
              { label: "Missed", color: "#7c3aed20" },
              { label: "Future", color: "#f5f5f3" },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid #e5e7eb" }} />
                <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#9ca3af" }}>
              Today outlined · Color = completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
