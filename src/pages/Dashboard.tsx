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
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e8522a" }}>value : {fmtFull(payload[0].value)}</div>
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
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
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

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Visualize your spending trends and category breakdowns.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total spent</span>
            <span className="stat-icon">🧾</span>
          </div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-sub">{expenses.length} entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average / entry</span>
            <span className="stat-icon" style={{ color: "#e8522a", fontSize: "0.8rem", fontWeight: 700 }}>↗</span>
          </div>
          <div className="stat-value">{fmt(avgEntry)}</div>
          <div className="stat-sub">Across all categories</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Categories</span>
            <span className="stat-icon">⊞</span>
          </div>
          <div className="stat-value">{activeCats}</div>
          <div className="stat-sub">With activity</div>
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

      <div className="chart-row">
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#111", letterSpacing: "-0.01em" }}>Spending trend</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2, marginBottom: "1.25rem" }}>Daily total over time</div>
          <div style={{ height: 220, minHeight: 220, overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#f97316" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke="url(#spendGrad)" strokeWidth={2} fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: "#f43f5e", strokeWidth: 0 }} />
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

      {barData.length > 0 && (
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
      )}
    </div>
  );
}
