import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Transaction, TransactionType } from "../data/mockData";

interface Props {
  transactions: Transaction[];
  categories: string[];
  accounts: string[];
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtFull = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayStr = () => new Date().toISOString().split("T")[0];

const CAT_ICON: Record<string, string> = {
  "Food & Dining": "🍜", Transport: "🚇", Shopping: "🛍", Entertainment: "🎦",
  Health: "💊", Utilities: "⚡", Rent: "🏠", Salary: "💼", Freelance: "💻", Other: "◈",
};
const CAT_COLOR: Record<string, string> = {
  "Food & Dining": "#f97316", Transport: "#06b6d4", Shopping: "#a855f7",
  Entertainment: "#ec4899", Health: "#10b981", Utilities: "#eab308",
  Rent: "#6366f1", Salary: "#22c55e", Freelance: "#3b82f6", Other: "#94a3b8",
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "0.6rem 0.9rem", minWidth: 130, borderRadius: "var(--r-sm)" }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="mono" style={{ fontSize: "0.8rem", color: p.stroke }}>
          {p.name === "income" ? "In" : "Out"} {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

function get30DayData(txns: Transaction[]) {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const dayT = txns.filter((t) => t.date === date);
    return {
      date, label,
      income:  dayT.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0),
      expense: dayT.filter((t) => t.type !== "Income").reduce((s, t) => s + t.amount, 0),
    };
  });
}

type Filter = "all" | "Income" | "Expense";

export default function ExpensesPage({ transactions, categories, accounts, onAdd, onDelete, showToast }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [txType, setTxType] = useState<TransactionType>("Expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [visible, setVisible] = useState(8);
  const [formOpen, setFormOpen] = useState(false);

  const now = new Date();
  const ms = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const me = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const mt = transactions.filter((t) => t.date >= ms && t.date <= me);
  const income  = mt.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
  const expense = mt.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const net     = income - expense;
  const savRate = income > 0 ? Math.round((net / income) * 100) : 0;

  const chartData   = useMemo(() => get30DayData(transactions), [transactions]);
  const filtered    = useMemo(() => filter === "all" ? transactions : transactions.filter((t) => t.type === filter), [transactions, filter]);
  const sliced      = filtered.slice(0, visible);

  const catMap = useMemo(() => {
    const m: Record<string, number> = {};
    mt.filter((t) => t.type === "Expense").forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);
  const catTotal = catMap.reduce((s, [, v]) => s + v, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd({ id: Date.now().toString(), name: name.trim(), amount: parseFloat(amount), type: txType, category: category || "Other", account: account || "Cash", date });
    showToast(`${txType} recorded`);
    setName(""); setAmount(""); setDate(todayStr()); setCategory(""); setAccount(""); setFormOpen(false);
  };

  const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div className="card" style={{ padding: "1.75rem 1.5rem 1.5rem" }}>
        <div className="label">{monthName} · Net Balance</div>
        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div
              className="display"
              style={{ fontSize: "clamp(2.2rem,6vw,3.2rem)", color: net >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}
            >
              {net >= 0 ? "+" : "−"}{fmt(net)}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-3)" }}>
              Savings rate{" "}
              <span style={{ color: savRate >= 20 ? "var(--green)" : "var(--amber)", fontFamily: "var(--ff-mono)" }}>
                {savRate > 0 ? `+${savRate}%` : `${savRate}%`}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {[
              { l: "Income",   v: `+${fmt(income)}`,  c: "var(--green)" },
              { l: "Expenses", v: `−${fmt(expense)}`, c: "var(--red)" },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign: "right" }}>
                <div className="label" style={{ fontSize: "0.58rem" }}>{l}</div>
                <div className="mono" style={{ fontSize: "1.05rem", color: c, letterSpacing: "-0.03em", marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {income > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (expense / income) * 100)}%`,
                  background: expense > income
                    ? "linear-gradient(90deg,var(--red),#dc2626)"
                    : "linear-gradient(90deg,var(--gold),var(--green))",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
              <span className="label" style={{ fontSize: "0.55rem" }}>Spent</span>
              <span className="label mono" style={{ fontSize: "0.55rem" }}>
                {Math.min(100, Math.round((expense / income) * 100))}% of income
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
        <div className="label" style={{ marginBottom: "0.75rem" }}>30-Day Flow</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#4ade80" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#f87171" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,252,240,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,252,240,0.2)", fontSize: 9, fontFamily: "var(--ff-mono)" }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: "rgba(255,252,240,0.2)", fontSize: 9, fontFamily: "var(--ff-mono)" }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(201,169,110,0.15)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="income"  stroke="#4ade80" strokeWidth={1.5} fill="url(#gIn)"  dot={false} />
              <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={1.5} fill="url(#gOut)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "0.5rem", paddingBottom: "0.25rem" }}>
          {[{ c: "#4ade80", l: "Income" }, { c: "#f87171", l: "Expenses" }].map(({ c, l }) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 20, height: 1.5, background: c, borderRadius: 1 }} />
              <span className="label" style={{ fontSize: "0.58rem" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {catMap.length > 0 && (
        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <div className="label" style={{ marginBottom: "1rem" }}>Spending by Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {catMap.map(([cat, amt]) => {
              const pct = catTotal > 0 ? (amt / catTotal) * 100 : 0;
              const color = CAT_COLOR[cat] || "#94a3b8";
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.95rem" }}>{CAT_ICON[cat] || "◈"}</span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-2)", fontWeight: 500 }}>{cat}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="label mono" style={{ fontSize: "0.58rem" }}>{pct.toFixed(0)}%</span>
                      <span className="mono" style={{ fontSize: "0.85rem", color: "var(--text)" }}>{fmt(amt)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color, opacity: 0.75 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <button
          onClick={() => setFormOpen((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.5rem", background: "transparent", border: "none",
            color: "var(--text-2)", cursor: "pointer", transition: "background 0.15s",
            fontFamily: "var(--ff-body)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span
              className="mono"
              style={{
                width: 22, height: 22, borderRadius: "var(--r-xs)",
                background: "var(--gold-dim)", border: "0.5px solid var(--border)",
                color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.9rem", flexShrink: 0,
              }}
            >+</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Record Transaction</span>
          </div>
          <span style={{ color: "var(--text-4)", fontSize: "0.7rem", transform: formOpen ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}>▾</span>
        </button>

        {formOpen && (
          <div style={{ padding: "0 1.5rem 1.5rem", borderTop: "0.5px solid var(--border-2)" }}>
            <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", marginBottom: "1rem" }}>
              {(["Expense", "Income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className="btn"
                  style={{
                    flex: 1, fontSize: "0.82rem", padding: "0.55rem",
                    background: txType === t ? (t === "Expense" ? "var(--red-dim)" : "var(--green-dim)") : "transparent",
                    border: txType === t
                      ? `0.5px solid ${t === "Expense" ? "rgba(248,113,113,0.35)" : "rgba(74,222,128,0.35)"}`
                      : "0.5px solid var(--border-2)",
                    color: txType === t ? (t === "Expense" ? "var(--red)" : "var(--green)") : "var(--text-3)",
                  }}
                >
                  {t === "Expense" ? "📤" : "📥"} {t}
                </button>
              ))}
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input className="input" placeholder={txType === "Income" ? "Income source…" : "What did you spend on?"} value={name} onChange={(e) => setName(e.target.value)} required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input className="input mono" type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01" />
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ colorScheme: "dark" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Category…</option>
                  {categories.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                </select>
                <select className="input" value={account} onChange={(e) => setAccount(e.target.value)}>
                  <option value="">Account…</option>
                  {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button type="submit" className={`btn ${txType === "Income" ? "btn-success" : "btn-danger"}`} style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}>
                {txType === "Expense" ? "Record Expense" : "Record Income"} →
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "0.5px solid var(--border-2)" }}>
          <div className="label">Transactions</div>
          <div className="chips">
            {(["all", "Income", "Expense"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setVisible(8); }} className={`chip ${filter === f ? "active" : ""}`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {sliced.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-4)", fontSize: "0.85rem", fontStyle: "italic" }}>
            No transactions found.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {sliced.map((t, i) => {
              const isIncome = t.type === "Income";
              const color = CAT_COLOR[t.category] || "#94a3b8";
              return (
                <li
                  key={t.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "0.9rem 1.5rem",
                    borderBottom: i < sliced.length - 1 ? "0.5px solid rgba(255,252,240,0.04)" : "none",
                    transition: "background 0.15s", cursor: "default", position: "relative",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,252,240,0.018)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 3, height: 28, borderRadius: 99, background: color, opacity: 0.7, flexShrink: 0 }} />
                  <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", flexShrink: 0, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                    {CAT_ICON[t.category] || "◈"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                      {[t.category, t.account, t.date].map((tag) => (
                        <span key={tag} style={{ fontSize: "0.65rem", color: "var(--text-3)", fontFamily: "var(--ff-mono)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 500, color: isIncome ? "var(--green)" : "var(--red)", letterSpacing: "-0.02em" }}>
                      {isIncome ? "+" : "−"}{fmtFull(t.amount)}
                    </div>
                    <button
                      onClick={() => { onDelete(t.id); showToast("Removed", "error"); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "var(--text-4)", transition: "color 0.15s", fontFamily: "var(--ff-body)", padding: "2px 0", marginTop: 2, opacity: 0 }}
                      onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--red)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.opacity = "0"; }}
                    >remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {filtered.length > visible && (
          <button
            onClick={() => setVisible((v) => v + 8)}
            style={{ width: "100%", padding: "0.85rem", background: "transparent", border: "none", borderTop: "0.5px solid var(--border-2)", color: "var(--text-3)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--ff-body)", transition: "background 0.15s, color 0.15s", letterSpacing: "0.05em" }}
            onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}
          >
            SHOW MORE ↓
          </button>
        )}
      </div>
    </div>
  );
}
