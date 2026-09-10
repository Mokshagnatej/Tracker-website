import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { Habit } from "../data/mockData";

interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

type Filter = "all" | "done" | "pending";

const todayStr = () => new Date().toISOString().split("T")[0];
const dateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
};
const dayLabel = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("en-IN", { weekday: "short" });
};

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "0.5rem 0.8rem", borderRadius: "var(--r-sm)" }}>
      <div className="label" style={{ marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontSize: "0.8rem", color: "var(--gold)" }}>{payload[0].value} done</div>
    </div>
  );
};

function Ring({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 48, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,252,240,0.06)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#ringG)" strokeWidth="8"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <defs>
          <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span className="display" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>{pct}%</span>
        <span className="label" style={{ fontSize: "0.55rem" }}>{done}/{total}</span>
      </div>
    </div>
  );
}

export default function HabitsPage({ habits, onToggle, onAdd, onDelete, showToast }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [newName, setNewName] = useState("");
  const today = todayStr();

  const doneToday = habits.filter((h) => h.history[today]).length;
  const total = habits.length;
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak));
  const rate = total > 0 ? Math.round((doneToday / total) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === "done")    return habits.filter((h) =>  h.history[today]);
    if (filter === "pending") return habits.filter((h) => !h.history[today]);
    return habits;
  }, [habits, filter, today]);

  const weeklyData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = dateStr(6 - i);
      return { day: dayLabel(6 - i), done: habits.filter((h) => h.history[d]).length };
    }),
    [habits]
  );

  const streakData = useMemo(() =>
    habits.map((h) => ({
      name: h.name.length > 14 ? h.name.slice(0, 12) + "…" : h.name,
      streak: h.streak || 0,
      doneToday: !!h.history[today],
    })),
    [habits, today]
  );

  const heatDates = useMemo(() => Array.from({ length: 14 }, (_, i) => dateStr(13 - i)), []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    showToast(`"${newName.trim()}" added`);
    setNewName("");
  };

  const s = (v: string | number) => String(v);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div className="card" style={{ padding: "1.75rem 1.5rem 1.5rem" }}>
        <div className="label" style={{ marginBottom: "1.25rem" }}>Today's Progress</div>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <Ring pct={rate} done={doneToday} total={total} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", flex: 1, minWidth: 160 }}>
            {[
              { l: "Best Streak",  v: `${bestStreak}d`, em: "🔥", c: "var(--amber)" },
              { l: "Habits Total", v: s(total),         em: "◎",  c: "var(--gold)" },
              { l: "Done Today",   v: s(doneToday),     em: "✓",  c: "var(--green)" },
              { l: "Pending",      v: s(total-doneToday), em: "○", c: "var(--text-2)" },
            ].map(({ l, v, em, c }) => (
              <div key={l} className="card-flat" style={{ padding: "0.75rem 0.9rem" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.2rem" }}>{em}</div>
                <div className="mono" style={{ fontSize: "1.25rem", fontWeight: 500, color: c, letterSpacing: "-0.04em", lineHeight: 1 }}>{v}</div>
                <div className="label" style={{ fontSize: "0.55rem", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "0.5px solid var(--border-2)" }}>
          <div className="pdot" />
          <span className="label" style={{ fontSize: "0.58rem" }}>Synced · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <div className="card" style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
        <div className="label" style={{ marginBottom: "0.75rem" }}>7-Day Completion</div>
        <div style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#ec4899" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,252,240,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,252,240,0.22)", fontSize: 10, fontFamily: "var(--ff-mono)" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, total || 1]} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(236,72,153,0.2)", strokeWidth: 1 }} />
              <Line type="monotone" dataKey="done" stroke="url(#trendFill)" strokeWidth={3} dot={{ fill: "#ec4899", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#f43f5e", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {streakData.length > 0 && (
        <div className="card" style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div className="label">Streak Lengths</div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[{ c: "var(--green)", l: "Done today" }, { c: "var(--gold)", l: "Active" }, { c: "rgba(255,252,240,0.15)", l: "Inactive" }].map(({ c, l }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span className="label" style={{ fontSize: "0.55rem" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="vertical" barSize={10} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "rgba(255,252,240,0.2)", fontSize: 9, fontFamily: "var(--ff-mono)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,252,240,0.4)", fontSize: 10, fontFamily: "var(--ff-body)" }} axisLine={false} tickLine={false} width={88} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="card" style={{ padding: "0.45rem 0.75rem", borderRadius: "var(--r-sm)" }}>
                        <div className="label" style={{ marginBottom: 2 }}>{d.name}</div>
                        <div className="mono" style={{ fontSize: "0.8rem", color: "var(--gold)" }}>{d.streak}d streak</div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(255,252,240,0.02)" }}
                />
                <Bar dataKey="streak" radius={[0, 4, 4, 0]} background={{ fill: "rgba(255,252,240,0.025)", radius: 4 }}>
                  {streakData.map((e, i) => (
                    <Cell key={i} fill={e.doneToday ? "#4ade80" : e.streak > 0 ? "#c9a96e" : "rgba(255,252,240,0.12)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "1.25rem 1.5rem", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "1rem" }}>
          <div className="label">14-Day Heatmap</div>
          <div className="label" style={{ fontSize: "0.55rem", color: "var(--text-4)" }}>past two weeks</div>
        </div>
        <div style={{ minWidth: 480 }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px repeat(14,1fr)", gap: 3, marginBottom: 6 }}>
            <div />
            {heatDates.map((d, i) => {
              const dt = new Date(d);
              const isToday = d === today;
              return (
                <div key={i} style={{ textAlign: "center", fontSize: "0.55rem", fontFamily: "var(--ff-mono)", color: isToday ? "var(--gold)" : "rgba(255,252,240,0.2)", fontWeight: isToday ? 600 : 400, lineHeight: 1.3 }}>
                  {dt.toLocaleDateString("en-IN", { weekday: "narrow" })}<br />{dt.getDate()}
                </div>
              );
            })}
          </div>
          {habits.map((h) => (
            <div key={h.id} style={{ display: "grid", gridTemplateColumns: "100px repeat(14,1fr)", gap: 3, marginBottom: 3, alignItems: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 6 }} title={h.name}>{h.name}</div>
              {heatDates.map((d, di) => {
                const done = h.history[d];
                const isFuture = d > today;
                const isToday = d === today;
                return (
                  <div
                    key={di}
                    className="hcell"
                    title={`${h.name} · ${d} · ${isFuture ? "—" : done ? "✓" : "✗"}`}
                    style={{
                      background: isFuture ? "rgba(255,252,240,0.03)" : done ? "rgba(74,222,128,0.65)" : "rgba(248,113,113,0.18)",
                      boxShadow: (done && !isFuture) ? "0 0 5px rgba(74,222,128,0.2)" : undefined,
                      outline: isToday ? "1px solid rgba(201,169,110,0.7)" : undefined,
                      outlineOffset: isToday ? 1 : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "0.5px solid var(--border-2)" }}>
            {[
              { c: "rgba(74,222,128,0.65)",  l: "Done" },
              { c: "rgba(248,113,113,0.18)", l: "Missed" },
              { c: "rgba(255,252,240,0.03)", l: "No data" },
            ].map(({ c, l }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
                <span className="label" style={{ fontSize: "0.55rem" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
        <div className="label" style={{ marginBottom: "0.85rem" }}>New Habit</div>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.6rem" }}>
          <input className="input" style={{ flex: 1 }} type="text" placeholder="e.g. Read 30 pages" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <button type="submit" className="btn btn-gold" style={{ flexShrink: 0 }}>Add →</button>
        </form>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "0.5px solid var(--border-2)" }}>
          <div className="label">Today's Habits</div>
          <div className="chips">
            {(["all", "done", "pending"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "active" : ""}`} style={{ textTransform: "capitalize" }}>{f}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-4)", fontStyle: "italic", fontSize: "0.85rem" }}>
            {filter === "done" ? "Nothing completed yet." : filter === "pending" ? "All done — excellent work." : "Add your first habit."}
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filtered.map((h, i) => {
              const done = !!h.history[today];
              const isHot = h.streak >= 5;
              const weekDots = Array.from({ length: 7 }, (_, j) => {
                const d = dateStr(6 - j);
                return { hit: !!h.history[d], isToday: d === today };
              });
              return (
                <li
                  key={h.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 1.5rem", borderBottom: i < filtered.length - 1 ? "0.5px solid rgba(255,252,240,0.04)" : "none", transition: "background 0.15s", opacity: done ? 0.7 : 1 }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,252,240,0.018)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: done ? "var(--green)" : "rgba(255,252,240,0.1)", boxShadow: done ? "0 0 8px var(--green)" : undefined, transition: "all 0.3s" }} />
                  <input type="checkbox" className="hcheck" checked={done} onChange={() => { onToggle(h.id); showToast(done ? "Unchecked" : "✓ Marked complete"); }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.3, color: done ? "var(--text-3)" : "var(--text)", textDecoration: done ? "line-through" : undefined, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", marginTop: 2, color: isHot ? "var(--amber)" : "var(--text-4)", fontFamily: "var(--ff-mono)" }}>
                      {isHot ? "🔥" : "◎"} {h.streak}d
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {weekDots.map((dot, di) => (
                        <div key={di} style={{ width: 7, height: 7, borderRadius: 2, background: dot.hit ? "rgba(74,222,128,0.7)" : "rgba(255,252,240,0.07)", outline: dot.isToday ? "1px solid rgba(201,169,110,0.7)" : undefined, outlineOffset: 1, transition: "background 0.2s" }} />
                      ))}
                    </div>
                    <span className="label" style={{ fontSize: "0.5rem" }}>7d</span>
                  </div>
                  <button
                    onClick={() => onDelete(h.id)}
                    title="Delete Habit"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--red)",
                      opacity: 0.6,
                      cursor: "pointer",
                      padding: "4px",
                      marginLeft: "0.5rem",
                      fontSize: "0.9rem"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = "0.6")}
                  >
                    🗑️
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
