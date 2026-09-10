import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { Transaction, CAT_COLOR, CAT_ICON } from "../data/mockData";

interface Props {
  transactions: Transaction[];
  catTotals: Record<string, number>;
  catCounts: Record<string, number>;
}

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtFull = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function get30DayData(txns: Transaction[]) {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const value = txns
      .filter((t) => t.date === date && t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    return { date, label, value };
  });
}

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length || payload[0].value === 0) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.6rem 0.9rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e8522a" }}>{fmtFull(payload[0].value)}</div>
    </div>
  );
};

const BarTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.55rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111" }}>{fmtFull(payload[0].value)}</div>
    </div>
  );
};

export default function Dashboard({ transactions, catTotals }: Props) {
  const expenses = transactions.filter((t) => t.type === "Expense");
  const income = transactions.filter((t) => t.type === "Income");
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalSpent;
  const avgEntry = expenses.length > 0 ? totalSpent / expenses.length : 0;
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const activeCats = sortedCats.length;
  const topCat = sortedCats[0];

  const chartData = useMemo(() => get30DayData(transactions), [transactions]);

  const donutData = sortedCats.map(([cat, val]) => ({
    name: cat, value: val, color: CAT_COLOR[cat] || "#94a3b8",
  }));

  const barData = sortedCats.map(([cat, val]) => ({
    name: cat, value: val, color: CAT_COLOR[cat] || "#94a3b8",
  }));

  const recentTxns = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [transactions]
  );

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Spending trends, category breakdown, and recent activity.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total spent</span>
            <span className="stat-icon">🧾</span>
          </div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-sub">{expenses.length} expense entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total income</span>
            <span className="stat-icon" style={{ color: "#16a34a", fontSize: "0.8rem", fontWeight: 700 }}>↑</span>
          </div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{fmt(totalIncome)}</div>
          <div className="stat-sub">{income.length} income entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Net balance</span>
            <span className="stat-icon">⊜</span>
          </div>
          <div className="stat-value" style={{ color: netBalance >= 0 ? "#16a34a" : "#dc2626" }}>
            {netBalance >= 0 ? "+" : "−"}{fmt(Math.abs(netBalance))}
          </div>
          <div className="stat-sub">
            Savings rate:{" "}
            <span style={{ fontWeight: 600, color: savingsRate >= 20 ? "#16a34a" : savingsRate >= 0 ? "#d97706" : "#dc2626" }}>
              {savingsRate}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Top category</span>
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            {topCat ? <><span>{CAT_ICON[topCat[0]]}</span> {fmt(topCat[1])}</> : "—"}
          </div>
          <div className="stat-sub">{topCat ? topCat[0] : "No data"}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.2rem" }}>Monthly Summary</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Income vs. Expenses</div>
          </div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { label: "Income", value: totalIncome, color: "#16a34a", icon: "📥" },
              { label: "Expenses", value: totalSpent, color: "#dc2626", icon: "📤" },
              { label: "Net", value: Math.abs(netBalance), color: netBalance >= 0 ? "#16a34a" : "#dc2626", icon: netBalance >= 0 ? "✶" : "▾" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{icon} {label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color, letterSpacing: "-0.025em" }}>{fmt(value)}</div>
              </div>
            ))}
          </div>
        </div>
        {(totalIncome + totalSpent) > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ height: 8, borderRadius: 99, background: "#f0f0ee", overflow: "hidden", display: "flex" }}>
              <div style={{
                width: `${totalIncome > 0 ? Math.min(100, (totalIncome / (totalIncome + totalSpent)) * 100) : 0}%`,
                background: "#16a34a", transition: "width 0.6s ease",
              }} />
              <div style={{ flex: 1, background: "#dc262630" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.68rem", color: "#9ca3af" }}>
              <span>Income {totalIncome > 0 ? Math.round((totalIncome / (totalIncome + totalSpent)) * 100) : 0}%</span>
              <span>Spend {totalSpent > 0 ? Math.round((totalSpent / (totalIncome + totalSpent)) * 100) : 0}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="chart-row">
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#111", letterSpacing: "-0.01em" }}>Spending trend</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2, marginBottom: "1.25rem" }}>Daily total over 30 days</div>
          <div style={{ height: 220, minHeight: 220, overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8522a" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#e8522a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke="#e8522a" strokeWidth={2} fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: "#e8522a", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#111", letterSpacing: "-0.01em" }}>Category breakdown</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2, marginBottom: "0.75rem" }}>Share of total spend</div>
          {donutData.length > 0 ? (
            <>
              <div style={{ height: 190, minHeight: 190, overflow: "hidden" }}>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="value" strokeWidth={2} stroke="#fff" paddingAngle={2}>
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.5rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "0.8rem" }}>
                            <div style={{ fontWeight: 600, color: "#111" }}>{d.name}</div>
                            <div style={{ color: "#6b7280", marginTop: 2 }}>{fmtFull(d.value)}</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                {donutData.slice(0, 5).map((item) => (
                  <div key={item.name} className="legend-item">
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-name">{CAT_ICON[item.name]} {item.name.length > 13 ? item.name.slice(0, 11) + "…" : item.name}</span>
                    <span className="legend-val">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
              No expense data
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.1rem", marginBottom: "1.1rem" }}>
        {barData.length > 0 ? (
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "#111", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>Spend by category</div>
            <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "1.25rem" }}>Total amount per category</div>
            <div style={{ height: 240, minHeight: 240, overflow: "hidden" }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.length > 9 ? v.slice(0, 8) + "…" : v} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<BarTip />} cursor={{ fill: "rgba(0,0,0,0.025)" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : <div />}

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0f0ee" }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111" }}>Recent Activity</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>Last 6 transactions</div>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {recentTxns.map((t, i) => {
              const isIncome = t.type === "Income";
              const color = CAT_COLOR[t.category] || "#94a3b8";
              return (
                <li key={t.id} style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.7rem 1.25rem",
                  borderBottom: i < recentTxns.length - 1 ? "1px solid #f0f0ee" : "none",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.9rem",
                  }}>
                    {CAT_ICON[t.category] || "◈"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{t.date}</div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: isIncome ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                    {isIncome ? "+" : "−"}{fmt(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {sortedCats.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.25rem" }}>Category Breakdown</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>
            {activeCats} active categories · avg {fmt(avgEntry)}/entry
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {sortedCats.map(([cat, val]) => {
              const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
              const color = CAT_COLOR[cat] || "#94a3b8";
              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem" }}>{CAT_ICON[cat]}</span>
                    <span style={{ flex: 1, fontSize: "0.82rem", color: "#6b7280" }}>{cat}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111" }}>{fmt(val)}</span>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", minWidth: 30, textAlign: "right" }}>{pct}%</span>
                  </div>
                  <div className="pbar-track">
                    <div className="pbar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
