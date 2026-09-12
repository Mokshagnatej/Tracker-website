import { useState, useCallback, useEffect } from "react";
import { Transaction, Habit, CATEGORIES, CAT_DOT } from "./data/mockData";
import Dashboard from "./pages/Dashboard";
import AllEntries from "./pages/AllEntries";
import HabitsPage from "./pages/HabitsPage";
import ToastContainer, { ToastMessage } from "./components/Toast";

type Page = "dashboard" | "entries" | "habits";

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const todayStr = () => new Date().toISOString().split("T")[0];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [metadata, setMetadata] = useState<{ categories: {id: string, name: string}[], accounts: {id: string, name: string}[] }>({ categories: [], accounts: [] });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [todayPageId, setTodayPageId] = useState<string | null>(null);

  const showToast = useCallback((text: string, type?: "success" | "error") => {
    setToasts((t) => [...t, { id: Date.now().toString(), text, type }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((m) => m.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txnRes, habRes, metaRes] = await Promise.all([
        fetch('/api/expenses').catch(() => null),
        fetch('/api/habits').catch(() => null),
        fetch('/api/metadata').catch(() => null)
      ]);

      if (metaRes && metaRes.ok && txnRes && txnRes.ok) {
        const meta = await metaRes.json();
        const txns = await txnRes.json();
        const adaptedTxns = Array.isArray(txns) ? txns.map((t: any) => ({
          ...t,
          category: meta.categories.find((c: any) => c.id === t.categoryId)?.name || "Other",
          account: meta.accounts.find((a: any) => a.id === t.accountId)?.name || "Cash",
        })) : [];
        setTransactions(adaptedTxns);
        setMetadata(meta);
      }

      if (habRes && habRes.ok) {
        const data = await habRes.json();
        const habs = Array.isArray(data) ? data : data.habits || [];
        setHabits(habs);
        if (!Array.isArray(data)) {
          setTodayMood(data.mood || null);
          setTodayPageId(data.todayPageId || null);
        }
      }
    } catch (e) {
      showToast('Failed to load data from Notion', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (t: Transaction) => {
    const catId = metadata.categories.find(c => c.name === t.category)?.id;
    const accId = metadata.accounts.find(a => a.name === t.account)?.id;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, categoryId: catId, accountId: accId })
      });
      if (res.ok) {
        const newTxn = await res.json();
        const adaptedNewTxn = {
          ...newTxn,
          category: metadata.categories.find((c: any) => c.id === newTxn.categoryId)?.name || t.category || "Other",
          account: metadata.accounts.find((a: any) => a.id === newTxn.accountId)?.name || t.account || "Cash",
        };
        setTransactions(prev => [adaptedNewTxn, ...prev]);
        showToast('Expense recorded', 'success');
      } else throw new Error();
    } catch (e) { showToast('Failed to record expense', 'error'); }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions((p) => p.filter((t) => t.id !== id));
        showToast('Expense removed', 'success');
      } else throw new Error();
    } catch (e) { showToast('Failed to remove expense', 'error'); }
  };

  // Habits Operations
  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || !habit.pageId) return showToast('Cannot update habit (no pageId)', 'error');
    const today = todayStr();
    const wasDone = habit.history.find(h => h.date === today)?.done || false;
    const newDone = !wasDone;
    setHabits((prev) => prev.map((h) => h.id === id ? { 
      ...h, 
      history: h.history.map(hi => hi.date === today ? { ...hi, done: newDone } : hi),
      heatmapHistory: h.heatmapHistory?.map(hi => hi.date === today ? { ...hi, done: newDone } : hi),
      done: newDone,
      streak: newDone ? h.streak + 1 : Math.max(0, h.streak - 1) 
    } : h));
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone, pageId: habit.pageId })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      showToast('Failed to update habit', 'error');
      setHabits((prev) => prev.map((h) => h.id === id ? { 
        ...h, 
        history: h.history.map(hi => hi.date === today ? { ...hi, done: wasDone } : hi),
        heatmapHistory: h.heatmapHistory?.map(hi => hi.date === today ? { ...hi, done: wasDone } : hi),
        done: wasDone,
        streak: wasDone ? h.streak + 1 : Math.max(0, h.streak - 1) 
      } : h));
    }
  };

  const addHabit = async (name: string, category?: string, time?: string, icon?: string) => {
    const trimmed = name.trim();
    const temp: Habit = { id: trimmed, name: trimmed, streak: 0, pageId: habits.length && habits[0].pageId ? habits[0].pageId : undefined, history: [], heatmapHistory: [], weeklyRate: 0, category: category || 'Other', time: time || 'Anytime', icon: icon || '◈' };
    setHabits(p => [temp, ...p]);
    try {
      const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed, category, time, icon }) });
      if (res.ok) { showToast('Habit added', 'success'); setTimeout(fetchData, 2500); } else throw new Error();
    } catch (e) { showToast('Failed to add habit', 'error'); setHabits(p => p.filter(h => h.id !== trimmed)); }
  };

  const deleteHabit = async (id: string) => {
    const prevHabs = [...habits];
    setHabits(p => p.filter(h => h.id !== id));
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) { showToast('Habit deleted', 'success'); setTimeout(fetchData, 2500); } else throw new Error();
    } catch (e) { showToast('Failed to delete habit', 'error'); setHabits(prevHabs); }
  };

  const updateMood = async (mood: string) => {
    if (!todayPageId) return showToast('Cannot update mood (no pageId)', 'error');
    const oldMood = todayMood;
    setTodayMood(mood);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: todayPageId, mood })
      });
      if (res.ok) { showToast('Mood updated', 'success'); } else throw new Error();
    } catch (e) {
      showToast('Failed to update mood', 'error');
      setTodayMood(oldMood);
    }
  };

  const expenses = transactions.filter((t) => t.type === "Expense");
  const catCounts: Record<string, number> = {};
  const catTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const totalTracked = expenses.reduce((s, t) => s + t.amount, 0);

  const filteredTransactions = activeCat === "all" ? transactions : transactions.filter((t) => t.category === activeCat);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">💳</div>
          <div>
            <div className="brand-name">Moksha Tracker</div>
            <div className="brand-sub">Personal workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
            <span style={{ fontSize: "0.8rem" }}>▦</span> Dashboard
          </button>
          <button className={`nav-item ${page === "entries" ? "active" : ""}`} onClick={() => setPage("entries")}>
            <span style={{ fontSize: "0.8rem" }}>☰</span> All Entries
          </button>
          <button className={`nav-item ${page === "habits" ? "active" : ""}`} onClick={() => setPage("habits")}>
            <span style={{ fontSize: "0.8rem" }}>◎</span> Habits
          </button>
        </nav>

        <div className="sidebar-section-label">
          <span>Categories</span>
          <button onClick={() => setPage("entries")}>+</button>
        </div>

        <div className="cat-list">
          <div className={`cat-item ${activeCat === "all" ? "active" : ""}`} onClick={() => setActiveCat("all")}>
            <span className="cat-name" style={{ fontWeight: activeCat === "all" ? 600 : 400 }}>All categories</span>
          </div>
          {metadata ? metadata.categories.filter((c) => catCounts[c.name]).map((cat) => (
            <div key={cat.id} className={`cat-item ${activeCat === cat.name ? "active" : ""}`} onClick={() => setActiveCat(cat.name)}>
              <span className="cat-dot" style={{ background: CAT_DOT[cat.name] || "#94a3b8" }} />
              <span className="cat-name">{cat.name}</span>
              <span className="cat-count">{catCounts[cat.name]}</span>
            </div>
          )) : CATEGORIES.filter((c) => catCounts[c]).map((cat) => (
            <div key={cat} className={`cat-item ${activeCat === cat ? "active" : ""}`} onClick={() => setActiveCat(cat)}>
              <span className="cat-dot" style={{ background: CAT_DOT[cat] || "#94a3b8" }} />
              <span className="cat-name">{cat}</span>
              <span className="cat-count">{catCounts[cat]}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="lbl">Total tracked</div>
          <div className="total">{fmt(totalTracked)}</div>
        </div>
      </aside>

      <main className="main-area">
        {loading && transactions.length === 0 && habits.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-4)" }}>Syncing with Notion...</div>
        ) : page === "dashboard" ? (
          <Dashboard transactions={filteredTransactions} catTotals={catTotals} catCounts={catCounts} />
        ) : page === "entries" ? (
          <AllEntries transactions={filteredTransactions} onAdd={addTransaction} onDelete={deleteTransaction} showToast={showToast} activeCat={activeCat} metadata={metadata} />
        ) : (
          <HabitsPage habits={habits} onToggle={toggleHabit} onAdd={addHabit} onDelete={deleteHabit} showToast={showToast} todayMood={todayMood} onUpdateMood={updateMood} />
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`bnav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
          <span>▦</span><div className="bnav-label">Dash</div>
        </button>
        <button className={`bnav-item ${page === "entries" ? "active" : ""}`} onClick={() => setPage("entries")}>
          <span>☰</span><div className="bnav-label">Entries</div>
        </button>
        <button className={`bnav-item ${page === "habits" ? "active" : ""}`} onClick={() => setPage("habits")}>
          <span>◎</span><div className="bnav-label">Habits</div>
        </button>
      </nav>

      <ToastContainer messages={toasts} onRemove={removeToast} />
    </div>
  );
}
