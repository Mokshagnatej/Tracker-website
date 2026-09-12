export type TransactionType = "Income" | "Expense";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  date: string;
}

export interface HabitHistory {
  date: string;
  done: boolean;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: HabitHistory[];
  heatmapHistory?: HabitHistory[];
  pageId?: string;
  weeklyRate?: number;
  category?: string;
  time?: string;
  icon?: string;
  done?: boolean;
}

export interface Task extends Habit {}

const today = new Date();
const dateStr = (offset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
};

export const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Salary",
  "Freelance",
  "Rent",
  "Other",
];

export const ACCOUNTS = ["HDFC", "SBI", "Paytm", "Cash", "GPay"];

export const CAT_DOT: Record<string, string> = {
  "Food & Dining":    "#f43f5e", // Rose
  "Transport":        "#0ea5e9", // Sky
  "Shopping":         "#8b5cf6", // Violet
  "Bills & Utilities":"#f59e0b", // Amber
  "Entertainment":    "#ec4899", // Pink
  "Health":           "#10b981", // Emerald
  "Salary":           "#22c55e", // Green
  "Freelance":        "#6366f1", // Indigo
  "Rent":             "#a855f7", // Purple
  "Other":            "#94a3b8", // Slate
};

export const CAT_COLOR = CAT_DOT;

export const CAT_ICON: Record<string, string> = {
  "Food & Dining":    "🍜",
  "Transport":        "🚇",
  "Shopping":         "🛍",
  "Bills & Utilities":"💡",
  "Entertainment":    "🎦",
  "Health":           "🩺",
  "Salary":           "💼",
  "Freelance":        "💻",
  "Rent":             "🏠",
  "Other":            "◈",
};

export const initialTransactions: Transaction[] = [
  { id: "1",  name: "Monthly Salary",    amount: 85000, type: "Income",  category: "Salary",           account: "HDFC",  date: dateStr(0)  },
  { id: "2",  name: "Zomato dinner",     amount: 680,   type: "Expense", category: "Food & Dining",    account: "GPay",  date: dateStr(1)  },
  { id: "3",  name: "Metro pass",        amount: 500,   type: "Expense", category: "Transport",        account: "Paytm", date: dateStr(1)  },
  { id: "4",  name: "Gym membership",    amount: 2500,  type: "Expense", category: "Health",           account: "HDFC",  date: dateStr(2)  },
  { id: "5",  name: "Freelance project", amount: 25000, type: "Income",  category: "Freelance",        account: "SBI",   date: dateStr(3)  },
  { id: "6",  name: "Electricity bill",  amount: 1840,  type: "Expense", category: "Bills & Utilities", account: "HDFC", date: dateStr(4)  },
  { id: "7",  name: "Amazon order",      amount: 3200,  type: "Expense", category: "Shopping",         account: "HDFC",  date: dateStr(5)  },
  { id: "8",  name: "Movie tickets",     amount: 760,   type: "Expense", category: "Entertainment",    account: "GPay",  date: dateStr(6)  },
  { id: "9",  name: "Coffee + lunch",    amount: 420,   type: "Expense", category: "Food & Dining",    account: "Cash",  date: dateStr(7)  },
  { id: "10", name: "Uber rides",        amount: 940,   type: "Expense", category: "Transport",        account: "Paytm", date: dateStr(8)  },
  { id: "11", name: "Netflix + Spotify", amount: 1099,  type: "Expense", category: "Entertainment",    account: "HDFC",  date: dateStr(9)  },
  { id: "12", name: "Rent",              amount: 18000, type: "Expense", category: "Rent",             account: "HDFC",  date: dateStr(10) },
  { id: "13", name: "Swiggy lunch",      amount: 340,   type: "Expense", category: "Food & Dining",    account: "GPay",  date: dateStr(12) },
  { id: "14", name: "Consulting income", amount: 12000, type: "Income",  category: "Freelance",        account: "SBI",   date: dateStr(15) },
  { id: "15", name: "Mobile recharge",   amount: 599,   type: "Expense", category: "Bills & Utilities", account: "Paytm",date: dateStr(18) },
  { id: "16", name: "New clothes",       amount: 2800,  type: "Expense", category: "Shopping",         account: "HDFC",  date: dateStr(20) },
  { id: "17", name: "Doctor visit",      amount: 800,   type: "Expense", category: "Health",           account: "Cash",  date: dateStr(22) },
  { id: "18", name: "Flipkart order",    amount: 1450,  type: "Expense", category: "Shopping",         account: "HDFC",  date: dateStr(24) },
  { id: "19", name: "Swiggy dinner",     amount: 520,   type: "Expense", category: "Food & Dining",    account: "GPay",  date: dateStr(25) },
  { id: "20", name: "Bus pass",          amount: 280,   type: "Expense", category: "Transport",        account: "Cash",  date: dateStr(27) },
];

const buildHistory = (streak: number, doneToday: boolean): Record<string, boolean> => {
  const h: Record<string, boolean> = {};
  for (let i = 0; i < 14; i++) h[dateStr(i)] = i === 0 ? doneToday : i <= streak;
  return h;
};

export const initialHabits: Habit[] = [
  { id: "h1", name: "Meditate 10 min", streak: 12, history: buildHistory(12, true) },
  { id: "h2", name: "Read 30 pages",   streak: 7,  history: buildHistory(7,  false) },
  { id: "h3", name: "Morning run",     streak: 5,  history: buildHistory(5,  true) },
  { id: "h4", name: "Cold shower",     streak: 3,  history: buildHistory(3,  false) },
  { id: "h5", name: "No social media", streak: 9,  history: buildHistory(9,  true) },
  { id: "h6", name: "Journaling",      streak: 2,  history: buildHistory(2,  false) },
];
