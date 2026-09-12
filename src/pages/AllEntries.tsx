import { useState, useMemo } from "react";
import { Transaction, TransactionType, CATEGORIES, ACCOUNTS, CAT_COLOR, CAT_ICON } from "../data/mockData";

interface Props {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  activeCat: string;
}

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const todayStr = () => new Date().toISOString().split("T")[0];

type Filter = "all" | "Income" | "Expense";
type SortKey = "date" | "amount" | "name";
type SortDir = "asc" | "desc";

export default function AllEntries({ transactions, onAdd, onDelete, showToast, activeCat }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [txType, setTxType] = useState<TransactionType>("Expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions.filter((t) => filter === "all" || t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.account.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      let v = 0;
      if (sortKey === "date") v = (a.date || "").localeCompare(b.date || "");
      else if (sortKey === "amount") v = a.amount - b.amount;
      else v = (a.name || "").localeCompare(b.name || "");
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [transactions, filter, search, sortKey, sortDir]);

  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0), [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd({ id: Date.now().toString(), name: name.trim(), amount: parseFloat(amount), type: txType, category: category || "Other", account: account || "Cash", date });
    showToast(`${txType} recorded`);
    setName(""); setAmount(""); setDate(todayStr()); setCategory(""); setAccount(""); setFormOpen(false);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span style={{ fontSize: "0.65rem", color: "#374151" }}>{sortDir === "asc" ? "↑" : "↓"}</span>
      : <span style={{ fontSize: "0.65rem", color: "#d1d5db" }}>↕</span>;

  return (
    <div>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.75rem" }}>
        <div>
          <h1 className="page-title">All Entries</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>{activeCat==="all"?"Every transaction in your workspace.":`Filtered by: ${activeCat}`}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setFormOpen(v=>!v)} style={{ marginTop:"0.35rem" }}>{formOpen?"✕ Cancel":"+  New Entry"}</button>
      </div>

      {formOpen&&(
        <div className="card" style={{ marginBottom:"1.25rem" }}>
          <div style={{ fontWeight:600,fontSize:"0.95rem",marginBottom:"1rem" }}>Record Transaction</div>
          <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1rem" }}>
            {(["Expense","Income"] as const).map(t=>(
              <button key={t} type="button" onClick={()=>setTxType(t)} className="btn" style={{flex:1,fontSize:"0.83rem",padding:"0.5rem",background:txType===t?(t==="Expense"?"#fef2f2":"#f0fdf4"):"transparent",border:`1px solid ${txType===t?(t==="Expense"?"#fecaca":"#bbf7d0"):"var(--border)"}`,color:txType===t?(t==="Expense"?"#dc2626":"#16a34a"):"var(--text-2)"}}>{t==="Expense"?"📤":"📥"} {t}</button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:"0.65rem" }}>
            <input className="input" placeholder={txType==="Income"?"Income source…":"What did you spend on?"} value={name} onChange={e=>setName(e.target.value)} required/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem" }}>
              <input className="input" type="number" placeholder="Amount (₹)" value={amount} onChange={e=>setAmount(e.target.value)} required min="0" step="0.01"/>
              <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} required/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem" }}>
              <select className="input" value={category} onChange={e=>setCategory(e.target.value)}><option value="">Category…</option>{CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}</select>
              <select className="input" value={account} onChange={e=>setAccount(e.target.value)}><option value="">Account…</option>{ACCOUNTS.map(a=><option key={a} value={a}>{a}</option>)}</select>
            </div>
            <button type="submit" className={`btn ${txType==="Income"?"btn-success":"btn-danger"}`} style={{width:"100%",justifyContent:"center"}}>{txType==="Expense"?"Record Expense":"Record Income"} →</button>
          </form>
        </div>
      )}

      {filtered.length>0&&(
        <div style={{ display:"flex",gap:"0.75rem",marginBottom:"0.85rem",flexWrap:"wrap" }}>
          {[{label:"Income",value:totalIncome,color:"#16a34a",show:totalIncome>0},{label:"Expenses",value:totalExpense,color:"#dc2626",show:totalExpense>0},{label:"Net",value:totalIncome-totalExpense,color:(totalIncome-totalExpense)>=0?"#16a34a":"#dc2626",show:true}].filter(x=>x.show).map(({label,value,color})=>(
            <div key={label} style={{background:"#fff",border:"1px solid #e6e6e3",borderRadius:10,padding:"0.5rem 0.9rem",display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <span style={{fontSize:"0.72rem",color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
              <span style={{fontSize:"0.88rem",fontWeight:700,color}}>{fmtShort(Math.abs(value))}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.85rem",flexWrap:"wrap" }}>
        <div className="chips">{(["all","Income","Expense"] as const).map(f=>(<button key={f} onClick={()=>setFilter(f)} className={`chip${filter===f?" active":""}`}>{f==="all"?"All":f}</button>))}</div>
        <div style={{ flex:1,minWidth:160,position:"relative" }}>
          <input className="input" placeholder="Search by name, category, account…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:"2rem" }}/>
          <span style={{position:"absolute",left:"0.65rem",top:"50%",transform:"translateY(-50%)",fontSize:"0.8rem",color:"#9ca3af",pointerEvents:"none"}}>🔍</span>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:"0.65rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:"0.75rem"}}>✕</button>}
        </div>
        <span style={{ fontSize:"0.78rem",color:"var(--text-3)",whiteSpace:"nowrap" }}>{filtered.length} entries</span>
      </div>

      <div className="card" style={{ padding:0,overflow:"hidden" }}>
        {filtered.length===0?(
          <div style={{padding:"3rem",textAlign:"center",color:"var(--text-3)",fontSize:"0.875rem"}}>{search?`No results for "${search}"`:'No transactions found.'}</div>
        ):(
          <table className="entries-table">
            <thead>
              <tr>
                <th><button onClick={()=>toggleSort("name")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:"inherit",fontWeight:"inherit",color:"inherit",textTransform:"inherit",letterSpacing:"inherit",padding:0}}>Description <SortIcon k="name"/></button></th>
                <th>Category</th>
                <th>Account</th>
                <th><button onClick={()=>toggleSort("date")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:"inherit",fontWeight:"inherit",color:"inherit",textTransform:"inherit",letterSpacing:"inherit",padding:0}}>Date <SortIcon k="date"/></button></th>
                <th style={{textAlign:"right"}}><button onClick={()=>toggleSort("amount")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:"inherit",fontWeight:"inherit",color:"inherit",textTransform:"inherit",letterSpacing:"inherit",padding:0,marginLeft:"auto"}}>Amount <SortIcon k="amount"/></button></th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t=>{
                const isIncome=t.type==="Income";
                const color=CAT_COLOR[t.category]||"#94a3b8";
                return (
                  <tr key={t.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}><span style={{width:30,height:30,borderRadius:8,flexShrink:0,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem"}}>{CAT_ICON[t.category]||"◈"}</span><div><div>{t.name}</div><div style={{fontSize:"0.7rem",color:"#9ca3af"}}><span style={{display:"inline-block",padding:"0 0.4rem",borderRadius:99,background:isIncome?"#f0fdf4":"#fff5f5",color:isIncome?"#16a34a":"#dc2626",fontWeight:600,fontSize:"0.65rem"}}>{t.type}</span></div></div></div></td>
                    <td><div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}><span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>{t.category}</div></td>
                    <td><span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f5f5f3",borderRadius:6,padding:"0.18rem 0.5rem",fontSize:"0.78rem",fontWeight:500}}>{t.account}</span></td>
                    <td style={{fontFamily:"monospace",fontSize:"0.8rem"}}>{t.date}</td>
                    <td style={{textAlign:"right",fontWeight:600,color:isIncome?"#16a34a":"#dc2626",fontVariantNumeric:"tabular-nums"}}>{isIncome?"+":"−"}{fmt(t.amount)}</td>
                    <td style={{width:40,textAlign:"center"}}><button onClick={()=>{onDelete(t.id);showToast("Removed","error");}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",fontSize:"0.75rem",padding:"2px 4px",borderRadius:4,transition:"color 0.15s, background 0.15s"}} onMouseOver={e=>{e.currentTarget.style.color="#dc2626";e.currentTarget.style.background="#fef2f2";}} onMouseOut={e=>{e.currentTarget.style.color="var(--text-4)";e.currentTarget.style.background="none";}} title="Remove">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length>3&&(
              <tfoot>
                <tr>
                  <td colSpan={4} style={{padding:"0.65rem 1rem",fontSize:"0.75rem",color:"#9ca3af",borderTop:"1px solid #f0f0ee"}}>{filtered.length} transactions shown</td>
                  <td style={{textAlign:"right",padding:"0.65rem 1rem",fontWeight:700,fontSize:"0.82rem",color:(totalIncome-totalExpense)>=0?"#16a34a":"#dc2626",borderTop:"1px solid #f0f0ee"}}>Net: {(totalIncome-totalExpense)>=0?"+":"−"}{fmtShort(Math.abs(totalIncome-totalExpense))}</td>
                  <td style={{borderTop:"1px solid #f0f0ee"}}/>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
