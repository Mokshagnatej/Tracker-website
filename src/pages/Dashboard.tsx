import { useMemo, useState } from "react";
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

type TrendMode = "expense" | "income" | "net";

function getDailyData(txns: Transaction[], days = 30) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const date = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const expense = txns.filter((t) => t.date === date && t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    const income = txns.filter((t) => t.date === date && t.type === "Income").reduce((s, t) => s + t.amount, 0);
    return { date, label, expense, income, net: income - expense };
  });
}

const ChartTip = ({ active, payload, label, mode }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  if (val === 0 && mode === "expense") return null;
  const color = mode === "income" ? "#16a34a" : mode === "net" ? (val >= 0 ? "#16a34a" : "#dc2626") : "#e8522a";
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.6rem 0.9rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, color }}>{fmtFull(Math.abs(val))}</div>
    </div>
  );
};

const BarTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e3", borderRadius: 8, padding: "0.55rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#111" }}>{fmtFull(payload[0].value)}</div>
    </div>
  );
};

export default function Dashboard({ transactions, catTotals }: Props) {
  const [trendMode, setTrendMode] = useState<TrendMode>("expense");
  const [catSort, setCatSort] = useState<"amount" | "count">("amount");

  const expenses = transactions.filter((t) => t.type === "Expense");
  const incomes = transactions.filter((t) => t.type === "Income");
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;
  const avgEntry = expenses.length > 0 ? totalSpent / expenses.length : 0;

  const sortedCats = useMemo(() => {
    const entries = Object.entries(catTotals);
    return catSort === "amount"
      ? entries.sort((a, b) => b[1] - a[1])
      : entries.sort((a, b) => {
          const ca = transactions.filter((t) => t.category === a[0]).length;
          const cb = transactions.filter((t) => t.category === b[0]).length;
          return cb - ca;
        });
  }, [catTotals, catSort, transactions]);

  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const activeCats = sortedCats.length;

  const dailyData = useMemo(() => getDailyData(transactions, 30), [transactions]);

  const donutData = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ name: cat, value: val, color: CAT_COLOR[cat] || "#94a3b8" }));

  const barData = sortedCats.map(([cat, val]) => ({
    name: cat.length > 9 ? cat.slice(0, 8) + "…" : cat,
    fullName: cat,
    value: val,
    color: CAT_COLOR[cat] || "#94a3b8",
  }));

  const recentTxns = useMemo(
    () => [...transactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 7),
    [transactions]
  );

  const trendKey = trendMode === "expense" ? "expense" : trendMode === "income" ? "income" : "net";
  const trendColor = trendMode === "income" ? "#16a34a" : trendMode === "net" ? "#2563eb" : "#e8522a";
  const trendGradId = `trendGrad-${trendMode}`;

  const thisWeekSpend = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return expenses.filter((t) => t.date >= cutoff.toISOString().split("T")[0]).reduce((s, t) => s + t.amount, 0);
  }, [expenses]);
  const lastWeekSpend = useMemo(() => {
    const from = new Date(); from.setDate(from.getDate() - 14);
    const to = new Date(); to.setDate(to.getDate() - 7);
    return expenses.filter((t) => t.date >= from.toISOString().split("T")[0] && t.date < to.toISOString().split("T")[0]).reduce((s, t) => s + t.amount, 0);
  }, [expenses]);
  const weekDelta = lastWeekSpend > 0 ? Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h1>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{transactions.length} total transactions</div>
      </div>
      <p className="page-sub">Spending trends, category breakdown, and recent activity.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Total spent</span><span className="stat-icon">🧾</span></div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-sub">
            {weekDelta !== 0 ? <span style={{ color: weekDelta > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{weekDelta > 0 ? "↑" : "↓"}{Math.abs(weekDelta)}% vs last week</span> : `${expenses.length} entries`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Total income</span><span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a" }}>↑</span></div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{fmt(totalIncome)}</div>
          <div className="stat-sub">{incomes.length} income entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Net balance</span><span className="stat-icon">⊜</span></div>
          <div className="stat-value" style={{ color: netBalance >= 0 ? "#16a34a" : "#dc2626" }}>{netBalance >= 0 ? "+" : "−"}{fmt(Math.abs(netBalance))}</div>
          <div className="stat-sub">Savings: <span style={{ fontWeight: 600, color: savingsRate >= 20 ? "#16a34a" : savingsRate >= 0 ? "#d97706" : "#dc2626" }}>{savingsRate}%</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Avg per entry</span><span className="stat-icon">◈</span></div>
          <div className="stat-value">{fmt(avgEntry)}</div>
          <div className="stat-sub">{topCat ? `Top: ${topCat[0]}` : "No data"}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div><div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111" }}>Monthly Summary</div><div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>Income vs. Expenses</div></div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[{label:"Income",value:totalIncome,color:"#16a34a",icon:"📥"},{label:"Expenses",value:totalSpent,color:"#dc2626",icon:"📤"},{label:"Net",value:Math.abs(netBalance),color:netBalance>=0?"#16a34a":"#dc2626",icon:netBalance>=0?"✶":"▾"}].map(({label,value,color,icon})=>(
              <div key={label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.07em" }}>{icon} {label}</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color, letterSpacing: "-0.03em" }}>{fmt(value)}</div>
              </div>
            ))}
          </div>
        </div>
        {(totalIncome+totalSpent)>0&&(
          <div style={{ marginTop: "1rem" }}>
            <div style={{ height: 8, borderRadius: 99, background: "#f0f0ee", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${Math.min(100,(totalIncome/(totalIncome+totalSpent))*100)}%`, background: "#16a34a", transition: "width 0.7s ease" }}/>
              <div style={{ flex: 1, background: "#fca5a5" }}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: "0.68rem", color: "#9ca3af" }}>
              <span>Income {Math.round((totalIncome/(totalIncome+totalSpent))*100)}%</span>
              <span>Spend {Math.round((totalSpent/(totalIncome+totalSpent))*100)}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="chart-row" style={{ marginBottom: "1.1rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
            <div><div style={{ fontWeight: 600, fontSize: "1rem", color: "#111" }}>Spending trend</div><div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>30-day daily view</div></div>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["expense","income","net"] as TrendMode[]).map((m)=>(
                <button key={m} onClick={()=>setTrendMode(m)} style={{ padding:"0.28rem 0.65rem",borderRadius:99,fontSize:"0.72rem",fontWeight:500,border:trendMode===m?"none":"1px solid #e6e6e3",background:trendMode===m?(m==="income"?"#f0fdf4":m==="net"?"#eff6ff":"#fff5f5"):"transparent",color:trendMode===m?(m==="income"?"#16a34a":m==="net"?"#2563eb":"#e8522a"):"#9ca3af",cursor:"pointer" }}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 210, minHeight: 210 }}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={dailyData} margin={{ top:4,right:0,bottom:0,left:-8 }}>
                <defs><linearGradient id={trendGradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={trendColor} stopOpacity={0.18}/><stop offset="100%" stopColor={trendColor} stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false} interval={5}/>
                <YAxis tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v)=>v===0?"0":`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={(p:any)=><ChartTip {...p} mode={trendMode}/>} cursor={{stroke:"rgba(0,0,0,0.06)",strokeWidth:1}}/>
                <Area type="monotone" dataKey={trendKey} stroke={trendColor} strokeWidth={2} fill={`url(#${trendGradId})`} dot={false} activeDot={{r:5,fill:trendColor,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ display:"flex",flexDirection:"column" }}>
          <div style={{ fontWeight:600,fontSize:"1rem",color:"#111" }}>Category split</div>
          <div style={{ fontSize:"0.75rem",color:"#9ca3af",marginTop:2,marginBottom:"0.75rem" }}>Share of total expenses</div>
          {donutData.length>0?(
            <>
              <div style={{ height:180,minHeight:180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" strokeWidth={2} stroke="#fff" paddingAngle={2}>
                      {donutData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip content={({active,payload}:any)=>{
                      if(!active||!payload?.length)return null;
                      const d=payload[0].payload;
                      const pct=totalSpent>0?Math.round((d.value/totalSpent)*100):0;
                      return <div style={{background:"#fff",border:"1px solid #e6e6e3",borderRadius:8,padding:"0.5rem 0.85rem",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",fontSize:"0.8rem"}}><div style={{fontWeight:600,color:"#111"}}>{d.name}</div><div style={{color:"#6b7280",marginTop:2}}>{fmtFull(d.value)} · {pct}%</div></div>;
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop:"auto" }}>
                {donutData.slice(0,5).map(item=>(
                  <div key={item.name} className="legend-item">
                    <span className="legend-dot" style={{background:item.color}}/>
                    <span className="legend-name">{CAT_ICON[item.name]} {item.name.length>13?item.name.slice(0,11)+"…":item.name}</span>
                    <span className="legend-val">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:"0.875rem"}}>No expense data</div>
          )}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 320px",gap:"1.1rem",marginBottom:"1.1rem" }}>
        {barData.length>0&&(
          <div className="card">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.1rem" }}>
              <div><div style={{fontWeight:600,fontSize:"0.95rem",color:"#111"}}>Spend by category</div><div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>Total per category</div></div>
              <div style={{ display:"flex",gap:"0.25rem" }}>
                {(["amount","count"] as const).map(s=>(
                  <button key={s} onClick={()=>setCatSort(s)} style={{padding:"0.25rem 0.6rem",borderRadius:99,fontSize:"0.7rem",fontWeight:500,border:catSort===s?"none":"1px solid #e6e6e3",background:catSort===s?"#111":"transparent",color:catSort===s?"#fff":"#9ca3af",cursor:"pointer"}}>{s==="amount"?"By ₹":"By count"}</button>
                ))}
              </div>
            </div>
            <div style={{ height:230,minHeight:230 }}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={barData} margin={{top:4,right:8,bottom:0,left:-8}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0ee" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v===0?"0":`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<BarTip/>} cursor={{fill:"rgba(0,0,0,0.025)"}}/>
                  <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={56}>{barData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className="card" style={{ padding:0,overflow:"hidden" }}>
          <div style={{ padding:"0.9rem 1.25rem",borderBottom:"1px solid #f0f0ee",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div><div style={{fontWeight:600,fontSize:"0.9rem",color:"#111"}}>Recent Activity</div><div style={{fontSize:"0.7rem",color:"#9ca3af",marginTop:1}}>Latest transactions</div></div>
          </div>
          <ul style={{ listStyle:"none",margin:0,padding:0 }}>
            {recentTxns.map((t,i)=>{
              const isIncome=t.type==="Income";
              const color=CAT_COLOR[t.category]||"#94a3b8";
              return (
                <li key={t.id} style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.65rem 1.25rem",borderBottom:i<recentTxns.length-1?"1px solid #f7f7f5":"none",transition:"background 0.12s"}}
                  onMouseOver={e=>(e.currentTarget.style.background="#fafafa")} onMouseOut={e=>(e.currentTarget.style.background="")}>
                  <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem"}}>{CAT_ICON[t.category]||"◈"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"0.8rem",fontWeight:500,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                    <div style={{fontSize:"0.68rem",color:"#9ca3af"}}>{t.date} · {t.account}</div>
                  </div>
                  <div style={{fontSize:"0.8rem",fontWeight:600,color:isIncome?"#16a34a":"#dc2626",flexShrink:0}}>{isIncome?"+":"−"}{fmt(t.amount)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {sortedCats.length>0&&(
        <div className="card">
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem" }}>
            <div><div style={{fontWeight:600,fontSize:"0.95rem",color:"#111"}}>Category Breakdown</div><div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>{activeCats} categories · avg {fmt(avgEntry)}/entry</div></div>
            <div style={{ display:"flex",gap:"0.25rem" }}>
              {(["amount","count"] as const).map(s=>(
                <button key={s} onClick={()=>setCatSort(s)} style={{padding:"0.25rem 0.6rem",borderRadius:99,fontSize:"0.7rem",border:catSort===s?"none":"1px solid #e6e6e3",background:catSort===s?"#111":"transparent",color:catSort===s?"#fff":"#9ca3af",cursor:"pointer"}}>{s==="amount"?"By ₹":"By count"}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.65rem" }}>
            {sortedCats.map(([cat,val])=>{
              const pct=totalSpent>0?Math.round((val/totalSpent)*100):0;
              const color=CAT_COLOR[cat]||"#94a3b8";
              const count=transactions.filter(t=>t.category===cat).length;
              return (
                <div key={cat}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.28rem"}}>
                    <span style={{fontSize:"0.82rem"}}>{CAT_ICON[cat]}</span>
                    <span style={{flex:1,fontSize:"0.82rem",color:"#374151",fontWeight:500}}>{cat}</span>
                    <span style={{fontSize:"0.72rem",color:"#9ca3af"}}>{count}x</span>
                    <span style={{fontSize:"0.8rem",fontWeight:600,color:"#111",minWidth:60,textAlign:"right"}}>{fmt(val)}</span>
                    <span style={{fontSize:"0.7rem",color:"#9ca3af",minWidth:28,textAlign:"right"}}>{pct}%</span>
                  </div>
                  <div className="pbar-track"><div className="pbar-fill" style={{width:`${pct}%`,background:color}}/></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
