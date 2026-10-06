import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ── Types ── */
interface CourseData {
  code: string;
  name: string;
  total: number;
  held: number;
  p: number;
  a: number;
  pp: number;
  op: number;
  fac: string;
}

interface LogEntry {
  d: string;
  i: number;
  s: "P" | "A" | "";
  w: number;
}

interface BaseEntry {
  total: number;
  held: number;
  p: number;
  a: number;
}

interface SchedItem {
  code: string;
  name: string;
  dow: number;
  s: string;
  e: string;
  frm: string;
  until: number | null;
  n: number;
}

interface UploadResult {
  message: string;
  tone: "ok" | "bad" | "";
}

/* ── Static data ── */
const ORIG_D: CourseData[] = [
  { code: "10210CH104", name: "Environmental Science & Sustainability", total: 45, held: 32, p: 23, a: 3, pp: 72, op: 51, fac: "Dr. Kanniraj A" },
  { code: "10211CS129", name: "Modern Computer Architecture", total: 45, held: 33, p: 27, a: 6, pp: 82, op: 60, fac: "Dr. Barkathulla A. A" },
  { code: "10211CS208", name: "Software Engineering", total: 60, held: 45, p: 35, a: 10, pp: 78, op: 58, fac: "Dr. Amu. D" },
  { code: "10211CS223", name: "Machine Learning Techniques", total: 60, held: 48, p: 39, a: 8, pp: 81, op: 65, fac: "Dr. Godlin Jasil. S.P" },
  { code: "10211CS227", name: "Problem Solving and Testing", total: 75, held: 64, p: 50, a: 13, pp: 78, op: 67, fac: "Dr. Sathyamoorthy. K" },
  { code: "10212CS217", name: "Data Science", total: 60, held: 54, p: 48, a: 4, pp: 89, op: 80, fac: "Dr. Angeline Lydia" },
  { code: "10212CS295", name: "Applied Coding Skills", total: 75, held: 57, p: 46, a: 10, pp: 81, op: 61, fac: "Dr. Kaviarasan. S" },
  { code: "10212CS461", name: "Design & Impl. of Human-Computer Interfaces", total: 12, held: 1, p: 1, a: 0, pp: 100, op: 8, fac: "Gopi. S" },
  { code: "10213GE308", name: "Professional Communication for Engineers", total: 45, held: 32, p: 21, a: 4, pp: 66, op: 47, fac: "Dr. Umanesan. R" },
  { code: "10216GE903", name: "Aptitude Skills - I", total: 30, held: 21, p: 17, a: 4, pp: 81, op: 57, fac: "Dinesh Kumar. R" },
];

const SCHED: SchedItem[] = [
  { code: "10212CS295", name: "Applied Programming Skills", dow: 1, s: "08:45", e: "09:35", frm: "2026-10-26", until: null, n: 1 },
  { code: "10216GE903", name: "Aptitude Skills - I", dow: 3, s: "08:45", e: "10:35", frm: "2026-09-23", until: 1793145600000, n: 2 },
  { code: "10211CS208", name: "Software Engineering", dow: 2, s: "14:45", e: "15:35", frm: "2026-09-22", until: 1793145600000, n: 1 },
  { code: "10210CH104", name: "Environmental Science and Sustainability", dow: 5, s: "15:45", e: "16:35", frm: "2026-09-18", until: 1793145600000, n: 1 },
  { code: "10211CS227", name: "Problem Solving and Testing", dow: 2, s: "10:45", e: "12:35", frm: "2026-09-22", until: 1793145600000, n: 2 },
  { code: "10212CS217", name: "Data Science", dow: 5, s: "08:45", e: "09:35", frm: "2026-09-18", until: 1789756199000, n: 1 },
  { code: "10211CS227", name: "Problem Solving and Testing", dow: 1, s: "10:45", e: "12:35", frm: "2026-09-21", until: 1793145600000, n: 2 },
  { code: "10213GE308", name: "Professional Communication for Engineers", dow: 2, s: "09:45", e: "10:35", frm: "2026-09-22", until: 1793145600000, n: 1 },
  { code: "10213GE308", name: "Professional Communication for Engineers", dow: 5, s: "11:45", e: "12:35", frm: "2026-09-18", until: 1793145600000, n: 1 },
  { code: "10211CS223", name: "Machine Learning Techniques", dow: 5, s: "09:45", e: "10:35", frm: "2026-09-18", until: 1789756199000, n: 1 },
  { code: "10213GE308", name: "Professional Communication for Engineers", dow: 3, s: "14:45", e: "15:35", frm: "2026-09-23", until: 1793145600000, n: 1 },
  { code: "10210CH104", name: "Environmental Science and Sustainability", dow: 3, s: "15:45", e: "16:35", frm: "2026-09-23", until: 1793145600000, n: 1 },
  { code: "10212CS217", name: "Data Science", dow: 1, s: "13:45", e: "14:35", frm: "2026-09-21", until: 1793145600000, n: 1 },
  { code: "10212CS217", name: "Data Science", dow: 5, s: "13:45", e: "15:35", frm: "2026-09-18", until: 1793145600000, n: 2 },
  { code: "MINOR", name: "Minor Project - I", dow: 6, s: "12:45", e: "13:35", frm: "2026-09-19", until: 1793145600000, n: 1 },
  { code: "10211CS129", name: "Modern Computer Architecture", dow: 5, s: "10:45", e: "11:35", frm: "2026-09-18", until: 1793145600000, n: 1 },
  { code: "10212CS217", name: "Data Science", dow: 3, s: "10:45", e: "11:35", frm: "2026-09-23", until: 1793145600000, n: 1 },
  { code: "10211CS129", name: "Modern Computer Architecture", dow: 3, s: "13:45", e: "14:35", frm: "2026-09-23", until: 1793145600000, n: 1 },
  { code: "10211CS223", name: "Machine Learning Techniques", dow: 3, s: "11:45", e: "12:35", frm: "2026-09-23", until: 1793145600000, n: 1 },
  { code: "10212CS295", name: "Applied Programming Skills", dow: 2, s: "13:45", e: "14:35", frm: "2026-09-22", until: 1793145600000, n: 1 },
  { code: "10211CS129", name: "Modern Computer Architecture", dow: 2, s: "08:45", e: "09:35", frm: "2026-09-22", until: 1793145600000, n: 1 },
  { code: "10212CS295", name: "Applied Programming Skills", dow: 1, s: "08:45", e: "09:35", frm: "2026-09-21", until: 1792434599000, n: 1 },
  { code: "10211CS223", name: "Machine Learning Techniques", dow: 1, s: "14:45", e: "16:35", frm: "2026-09-21", until: 1793145600000, n: 2 },
  { code: "10212CS295", name: "Applied Programming Skills", dow: 4, s: "08:45", e: "11:35", frm: "2026-09-17", until: 1789669799000, n: 3 },
  { code: "10210CH104", name: "Environmental Science and Sustainability", dow: 4, s: "15:45", e: "16:35", frm: "2026-09-17", until: 1789669799000, n: 1 },
  { code: "10211CS208", name: "Software Engineering", dow: 4, s: "11:45", e: "12:35", frm: "2026-09-17", until: 1789669799000, n: 1 },
  { code: "10211CS208", name: "Software Engineering", dow: 4, s: "13:45", e: "15:35", frm: "2026-09-17", until: 1789669799000, n: 2 },
  { code: "10212CS295", name: "Applied Programming Skills", dow: 4, s: "08:45", e: "11:35", frm: "2026-09-24", until: 1793145600000, n: 3 },
  { code: "10211CS208", name: "Software Engineering", dow: 4, s: "11:45", e: "12:35", frm: "2026-09-24", until: 1793145600000, n: 1 },
  { code: "10211CS208", name: "Software Engineering", dow: 4, s: "13:45", e: "15:35", frm: "2026-09-24", until: 1793145600000, n: 2 },
  { code: "10210CH104", name: "Environmental Science and Sustainability", dow: 4, s: "15:45", e: "16:35", frm: "2026-09-24", until: 1793145600000, n: 1 },
  { code: "10212CS217", name: "Data Science", dow: 5, s: "08:45", e: "09:35", frm: "2026-09-25", until: 1793145600000, n: 1 },
  { code: "10211CS223", name: "Machine Learning Techniques", dow: 5, s: "09:45", e: "10:35", frm: "2026-09-25", until: 1793145600000, n: 1 },
];

const IDX: Record<string, number> = {};
ORIG_D.forEach((d, i) => { IDX[d.code] = i; });

/* ── Utilities ── */
const ymd = (t: Date) =>
  t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");

const shortName = (name: string) => (name.length > 24 ? name.slice(0, 23) + "…" : name);

const getOcc = (ds: string) => {
  const [y, m, d] = ds.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return SCHED.filter((x) => {
    if (x.dow !== dow || ds < x.frm) return false;
    if (x.until === null) return ds === x.frm;
    const [h, mi] = x.s.split(":").map(Number);
    return Date.UTC(y, m - 1, d, h, mi) - 330 * 60000 <= x.until;
  });
};

async function apiCall(method: string, url: string, body?: any) {
  try {
    const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    console.warn("[attendance sync]", e);
    return null;
  }
}

/* ── Toast component (inline) ── */
function AttToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className="att-toast" style={{ opacity: visible ? 1 : 0 }}>
      {message}
    </div>
  );
}

/* ── SVG Ring ── */
function Ring({ pct, size, color, label }: { pct: number; size: number; color: string; label: string }) {
  const r = size * 0.42;
  const C = 2 * Math.PI * r;
  const o = C * (1 - Math.min(pct, 100) / 100);
  const m = size / 2;
  const sw = size / 11;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={m} cy={m} r={r} fill="none" stroke="rgba(128,128,128,.28)" strokeWidth={sw} />
      <circle
        cx={m} cy={m} r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={o}
        transform={`rotate(-90 ${m} ${m})`}
        className="att-ring-anim"
      />
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize={size / 5}
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}

/* ── Main Component ── */
export default function AttendancePage() {
  const [base, setBase] = useState<BaseEntry[]>(ORIG_D.map((o) => ({ total: o.total, held: o.held, p: o.p, a: o.a })));
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqPct, setReqPct] = useState(75);
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()));
  const [showAll, setShowAll] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [sortKey, setSortKey] = useState<string>("pp");
  const [sortDir, setSortDir] = useState(1);
  const [simCourse, setSimCourse] = useState(0);
  const [simAttend, setSimAttend] = useState(5);
  const [simMiss, setSimMiss] = useState(0);
  const [simResult, setSimResult] = useState("");
  const [bulkMode, setBulkMode] = useState<"attend" | "miss">("attend");
  const [bulkN, setBulkN] = useState(5);
  const [clearLogOnImport, setClearLogOnImport] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadResult>({ message: "", tone: "" });
  const [leaveFrom, setLeaveFrom] = useState(() => { const t = new Date(); t.setDate(t.getDate() + 1); return ymd(t); });
  const [leaveTo, setLeaveTo] = useState(() => { const t = new Date(); t.setDate(t.getDate() + 1); return ymd(t); });
  const [targetPct, setTargetPct] = useState(75);
  const [clrConfirm, setClrConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Compute live course data ──
  const courses = useMemo(() => {
    return ORIG_D.map((orig, i) => {
      const b = base[i];
      let p = b.p, a = b.a, h = b.held;
      log.forEach((l) => {
        if (l.i === i) {
          const w = l.w || 1;
          h += w;
          l.s === "P" ? (p += w) : (a += w);
        }
      });
      return {
        ...orig,
        total: b.total,
        p,
        a,
        held: h,
        pp: h ? Math.round((p / h) * 100) : 0,
        op: b.total ? Math.round((p / b.total) * 100) : 0,
      };
    });
  }, [base, log]);

  // ── Calc skip/need ──
  const calcSkipNeed = useCallback(
    (d: CourseData) => {
      const R = reqPct / 100;
      const pct = d.held ? (d.p / d.held) * 100 : 0;
      let skip = Math.floor(d.p / R - d.held);
      let need = 0;
      if (skip < 0) {
        skip = 0;
        need = Math.ceil((R * d.held - d.p) / (1 - R));
      }
      return { pct, skip, need };
    },
    [reqPct]
  );

  // ── Color helper ──
  const statusColor = useCallback(
    (v: number) => (v >= reqPct ? "#16a34a" : v >= reqPct - 10 ? "#f59e0b" : "#dc2626"),
    [reqPct]
  );

  // ── Toast ──
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // ── Load from server ──
  useEffect(() => {
    (async () => {
      const data = await apiCall("GET", "/api/attendance");
      if (data) {
        if (Array.isArray(data.base) && data.base.length > 0) {
          setBase(
            ORIG_D.map((d, i) => {
              const b = data.base.find((x: any) => x.idx === i);
              return b ? { total: b.total, held: b.held, p: b.present, a: b.absent } : { total: d.total, held: d.held, p: d.p, a: d.a };
            })
          );
        }
        if (Array.isArray(data.log)) {
          setLog(data.log.map((l: any) => ({ d: l.date, i: l.i, s: l.s, w: l.w })));
        }
      } else {
        // fallback to localStorage
        try {
          const sv = JSON.parse(localStorage.getItem("att_v2") || "null");
          if (sv) {
            if (Array.isArray(sv.base) && sv.base.length === ORIG_D.length) setBase(sv.base);
            if (Array.isArray(sv.log)) setLog(sv.log);
          }
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  // ── Save helpers ──
  const saveLocal = useCallback((b: BaseEntry[], l: LogEntry[]) => {
    try { localStorage.setItem("att_v2", JSON.stringify({ base: b, log: l })); } catch {}
  }, []);

  const saveBaseToServer = useCallback(async (newBase: BaseEntry[]) => {
    saveLocal(newBase, log);
    const b = newBase.map((b, i) => ({ idx: i, total: b.total, held: b.held, present: b.p, absent: b.a }));
    await apiCall("PUT", "/api/attendance/base", { base: b });
  }, [log, saveLocal]);

  const saveLogEntry = useCallback(async (date: string, i: number, s: string, w: number) => {
    saveLocal(base, log);
    if (s) {
      await apiCall("POST", "/api/attendance/log", { date, i, s, w: w || 1 });
    } else {
      await apiCall("DELETE", "/api/attendance/log", { date, i });
    }
  }, [base, log, saveLocal]);

  // ── Mark attendance ──
  const setMark = useCallback(
    (i: number, st: "P" | "A" | "", w: number) => {
      if (st) toast(st === "P" ? "🎉 Present +" + w + " session(s)" : "😬 Absent +" + w + " session(s)");
      const dt = selectedDate;
      const newLog = log.filter((l) => !(l.d === dt && l.i === i));
      if (st) newLog.push({ d: dt, i, s: st, w: w || 1 });
      setLog(newLog);
      saveLogEntry(dt, i, st, w || 1);
    },
    [selectedDate, log, toast, saveLogEntry]
  );

  // ── Bulk day ──
  const bulkDay = useCallback(
    (st: "P" | "A" | "") => {
      const dt = selectedDate;
      const rows = getDayRows();
      const trackable = rows.filter((r) => r.i != null);
      let newLog = log.filter((l) => !(l.d === dt && trackable.some((r) => r.i === l.i)));
      if (st) trackable.forEach((r) => newLog.push({ d: dt, i: r.i!, s: st as "P" | "A", w: r.w }));
      setLog(newLog);
      saveLocal(base, newLog);
      const marks = trackable.map((r) => ({ i: r.i, s: st, w: r.w }));
      apiCall("POST", "/api/attendance/log/bulk", { date: dt, marks });
    },
    [selectedDate, log, base, saveLocal]
  );

  // ── Day rows ──
  const getDayRows = useCallback(() => {
    const dt = selectedDate;
    const by: Record<string, { i: number | undefined; name: string; w: number; t: string[] }> = {};
    getOcc(dt)
      .sort((a, b) => a.s.localeCompare(b.s))
      .forEach((x) => {
        const b = by[x.code] || (by[x.code] = { i: IDX[x.code], name: x.name, w: 0, t: [] });
        b.w += x.n;
        b.t.push(x.s + "–" + x.e);
      });
    const rows = Object.values(by).map((b) => ({ ...b, t: b.t.join(", ") }));
    if (showAll) {
      ORIG_D.forEach((d, i) => {
        if (!rows.some((r) => r.i === i)) rows.push({ i, name: d.name, w: 1, t: "not scheduled" });
      });
    }
    return rows;
  }, [selectedDate, showAll]);

  const dayRows = useMemo(() => getDayRows(), [getDayRows]);

  // ── Upload handler ──
  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return;
      const file = fileArray[0]; // for extension check of first file
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv" || ext === "txt") {
        setUploadStatus({ message: "Reading CSV file…", tone: "" });
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setUploadStatus({ message: "CSV must have at least a header and one data row.", tone: "bad" });
          return;
        }

        // Parse CSV, try to match course codes
        const updates: { i: number; values: BaseEntry }[] = [];
        for (let ln = 1; ln < lines.length; ln++) {
          const cols = lines[ln].split(",").map((c) => c.trim());
          const textCol = cols.find((c) => isNaN(Number(c)) && c.length > 3) || "";
          const nums = cols.map((c) => Number(c)).filter((n) => !isNaN(n) && Number.isFinite(n) && n >= 0);

          // Try to match a course
          let matchIdx = -1;
          ORIG_D.forEach((d, i) => {
            const upper = textCol.toUpperCase().replace(/[^A-Z0-9]/g, "");
            if (upper.includes(d.code.toUpperCase().replace(/[^A-Z0-9]/g, ""))) matchIdx = i;
            else if (textCol.toLowerCase().includes(d.name.toLowerCase().slice(0, 15))) matchIdx = i;
          });

          if (matchIdx >= 0 && nums.length >= 4) {
            updates.push({
              i: matchIdx,
              values: { total: nums[0], held: nums[1], p: nums[2], a: nums[3] },
            });
          }
        }

        if (!updates.length) {
          setUploadStatus({ message: "No courses matched. Make sure CSV contains course codes/names and numeric columns (total, held, present, absent).", tone: "bad" });
          return;
        }

        const newBase = [...base];
        updates.forEach(({ i, values }) => { newBase[i] = values; });
        let newLog = log;
        if (clearLogOnImport) newLog = [];
        setBase(newBase);
        setLog(newLog);
        await saveBaseToServer(newBase);
        if (clearLogOnImport) await apiCall("DELETE", "/api/attendance/log/clear");

        setUploadStatus({
          message: `Updated ${updates.length} course(s) from CSV.${clearLogOnImport ? " Daily marks cleared." : ""}`,
          tone: "ok",
        });
        toast("📄 Attendance updated from CSV");
        return;
      }

      if (ext === "json") {
        setUploadStatus({ message: "Reading JSON backup…", tone: "" });
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data.base) && data.base.length === ORIG_D.length) {
            const newBase = data.base;
            const newLog = Array.isArray(data.log) ? data.log : [];
            setBase(newBase);
            setLog(newLog);
            saveLocal(newBase, newLog);
            const baseAPI = newBase.map((b: any, i: number) => ({
              idx: b.idx ?? i,
              total: b.total,
              held: b.held,
              present: b.present ?? b.p,
              absent: b.absent ?? b.a,
            }));
            const logAPI = newLog.map((l: any) => ({
              date: l.date ?? l.d,
              i: l.i ?? l.course_idx,
              s: l.s ?? l.status,
              w: l.w ?? l.weight ?? 1,
            }));
            await apiCall("POST", "/api/attendance/restore", { base: baseAPI, log: logAPI });
            setUploadStatus({ message: "Backup restored successfully.", tone: "ok" });
            toast("✅ Backup restored");
          } else {
            setUploadStatus({ message: "Invalid JSON backup format.", tone: "bad" });
          }
        } catch {
          setUploadStatus({ message: "Could not parse JSON file.", tone: "bad" });
        }
        return;
      }

      // Image: use OCR (Tesseract.js)
      if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
        setUploadStatus({ message: `Preparing ${fileArray.length} screenshot(s) for OCR…`, tone: "" });

        if (!(window as any).Tesseract) {
          // Load Tesseract dynamically
          setUploadStatus({ message: "Loading OCR engine…", tone: "" });
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
          script.onload = () => runOCR(fileArray);
          script.onerror = () => setUploadStatus({ message: "Failed to load OCR. Check internet.", tone: "bad" });
          document.head.appendChild(script);
          return;
        }
        runOCR(fileArray);
        return;
      }

      // PDF: try to read as text
      if (ext === "pdf") {
        setUploadStatus({ message: "PDF parsing: please use a screenshot or CSV for now.", tone: "bad" });
        return;
      }

      setUploadStatus({ message: "Unsupported file type. Use CSV, JSON, or image.", tone: "bad" });
    },
    [base, log, clearLogOnImport, saveBaseToServer, saveLocal, toast]
  );

  const runOCR = useCallback(
    async (files: File[]) => {
      setUploadStatus({ message: "Reading attendance table…", tone: "" });
      try {
        let allLines: string[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 12 * 1024 * 1024) continue;
          
          const result = await (window as any).Tesseract.recognize(file, "eng", {
            logger: (m: any) => {
              if (m.status === "recognizing text") {
                setUploadStatus({ message: `Reading image ${i + 1}/${files.length}… ${Math.round((m.progress || 0) * 100)}%`, tone: "" });
              }
            },
          });
          const lines: string[] = (result.data.lines || []).map((x: any) => x.text).filter(Boolean);
          allLines = allLines.concat(lines.length ? lines : [result.data.text || ""]);
        }
        
        const source = allLines;
        const updates: { i: number; values: BaseEntry }[] = [];

        ORIG_D.forEach((course, i) => {
          const compact = course.code.toUpperCase();
          const lineIndex = source.findIndex((line: string) =>
            line.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(compact)
          );
          if (lineIndex < 0) return;
          const row = source.slice(lineIndex, lineIndex + 2).join(" ");
          const nums = (row.match(/\d+(?:[.,]\d+)?/g) || [])
            .map((v: string) => Number(v.replace(",", ".")))
            .filter(Number.isFinite);
          for (let n = 0; n <= nums.length - 4; n++) {
            const [total, held, present, absent] = nums.slice(n, n + 4);
            if (
              Number.isInteger(total) && Number.isInteger(held) && Number.isInteger(present) && Number.isInteger(absent) &&
              total > 0 && total <= 1000 && held >= 0 && held <= total && present >= 0 && present <= held && absent >= 0 && absent <= total
            ) {
              updates.push({ i, values: { total, held, p: present, a: absent } });
              break;
            }
          }
        });

        if (!updates.length) {
          setUploadStatus({ message: "No courses recognized. Use a clearer screenshot.", tone: "bad" });
          return;
        }

        const newBase = [...base];
        updates.forEach(({ i, values }) => { newBase[i] = values; });
        let newLog = log;
        if (clearLogOnImport) newLog = [];
        setBase(newBase);
        setLog(newLog);
        await saveBaseToServer(newBase);
        if (clearLogOnImport) await apiCall("DELETE", "/api/attendance/log/clear");

        const missing = ORIG_D.length - updates.length;
        setUploadStatus({
          message: `Updated ${updates.length} course(s).${missing ? ` ${missing} not found.` : ""}${clearLogOnImport ? " Daily marks cleared." : ""}`,
          tone: "ok",
        });
        toast("📸 Attendance updated from screenshot");
      } catch (err) {
        console.error("[OCR]", err);
        setUploadStatus({ message: "OCR failed. Try a sharper image.", tone: "bad" });
      }
    },
    [base, log, clearLogOnImport, saveBaseToServer, toast]
  );

  // ── Stats ──
  const stats = useMemo(() => {
    const tp = courses.reduce((s, d) => s + d.p, 0);
    const ta = courses.reduce((s, d) => s + d.a, 0);
    const th = courses.reduce((s, d) => s + d.held, 0);
    const avg = courses.reduce((s, d) => s + d.pp, 0) / courses.length;
    const combined = th ? (tp / th) * 100 : 0;
    const safe = courses.filter((d) => d.pp >= reqPct).length;
    const low = [...courses].sort((a, b) => a.pp - b.pp)[0];
    const best = [...courses].sort((a, b) => b.pp - a.pp).filter((d) => d.held > 5)[0];
    const totalSkips = courses.filter((d) => d.pp >= reqPct).reduce((s, d) => s + calcSkipNeed(d).skip, 0);

    // Streak
    const days = [...new Set(log.map((l) => l.d))].sort();
    let streak = 0;
    for (let k = days.length - 1; k >= 0; k--) {
      if (log.some((l) => l.d === days[k] && l.s === "A")) break;
      streak++;
    }

    // Insights
    const below = courses.filter((d) => d.pp < reqPct);
    const worst = courses.reduce((m, d) => (d.a > m.a ? d : m), courses[0]);

    return { tp, ta, th, avg, combined, safe, low, best, totalSkips, streak, below, worst, days };
  }, [courses, log, reqPct, calcSkipNeed]);

  // ── Hero title ──
  const heroTitle = useMemo(() => {
    const c = stats.combined;
    if (c >= 90) return "Attendance Legend 👑";
    if (c >= reqPct + 5) return "Cruising in the Safe Zone 😎";
    if (c >= reqPct) return "Hanging on the edge 😅";
    return "Danger Zone – time to show up 🚨";
  }, [stats.combined, reqPct]);

  // ── Next class ──
  const nextClass = useMemo(() => {
    const now = new Date();
    const hm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const tod = getOcc(ymd(now)).sort((a, b) => a.s.localeCompare(b.s));
    const nx = tod.find((x) => x.s > hm);
    if (nx) return `⏭️ Next: ${nx.name} at ${nx.s}`;
    if (tod.length) return "✅ No more classes today";
    return "🌴 No classes today";
  }, []);

  // ── Sorted table data ──
  const sortedCourses = useMemo(() => {
    return courses
      .map((d) => ({ ...d, ...calcSkipNeed(d) }))
      .sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (typeof av === "string") return av.localeCompare(bv) * sortDir;
        return ((av || 0) - (bv || 0)) * sortDir;
      });
  }, [courses, calcSkipNeed, sortKey, sortDir]);

  // ── Leave planner ──
  const leaveData = useMemo(() => {
    if (!leaveFrom || !leaveTo || leaveTo < leaveFrom) return null;
    const miss = ORIG_D.map(() => 0);
    let days = 0, tot = 0;
    const [y1, m1, d1] = leaveFrom.split("-").map(Number);
    const [y2, m2, d2] = leaveTo.split("-").map(Number);
    for (let d = new Date(y1, m1 - 1, d1), e = new Date(y2, m2 - 1, d2); d <= e; d.setDate(d.getDate() + 1)) {
      days++;
      getOcc(ymd(d)).forEach((x) => {
        const idx = IDX[x.code];
        if (idx != null) { miss[idx] += x.n; tot += x.n; }
      });
    }
    return { miss, days, tot };
  }, [leaveFrom, leaveTo]);

  // ── Bulk scenario ──
  const bulkData = useMemo(() => {
    return courses.map((d) => {
      const cur = d.held ? (d.p / d.held) * 100 : 0;
      const proj = bulkMode === "attend" ? ((d.p + bulkN) / (d.held + bulkN)) * 100 : (d.p / (d.held + bulkN)) * 100;
      return { ...d, cur, proj, diff: proj - cur };
    });
  }, [courses, bulkMode, bulkN]);

  // ── Sim ──
  const runSim = useCallback(() => {
    const d = courses[simCourse];
    if (!d) return;
    const p = d.p + simAttend;
    const t = d.held + simAttend + simMiss;
    const pct = t ? (p / t) * 100 : 0;
    const c = statusColor(pct);
    setSimResult(
      `${d.name}: ${d.pp}% → ${pct.toFixed(1)}% (${p}/${t}) — ${pct >= reqPct ? "✅ above" : "⚠️ below"} ${reqPct}%`
    );
  }, [courses, simCourse, simAttend, simMiss, reqPct, statusColor]);

  // ── Timetable week ──
  const timetableWeek = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const sel = new Date(y, m - 1, d);
    const mon = new Date(sel);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    const ts = ymd(new Date());
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const pal = ["#4f7cff", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#64748b"];

    return names.map((nm, k) => {
      const dt = new Date(mon);
      dt.setDate(mon.getDate() + k);
      const ds = ymd(dt);
      const slots = getOcc(ds).sort((a, b) => a.s.localeCompare(b.s));
      return {
        label: `${nm} ${dt.getDate()}/${dt.getMonth() + 1}${ds === ts ? " · today" : ""}`,
        isToday: ds === ts,
        slots: slots.map((x) => ({
          name: x.name,
          time: `${x.s}–${x.e}`,
          periods: x.n,
          color: IDX[x.code] != null ? pal[IDX[x.code] % 10] : "#64748b",
        })),
      };
    });
  }, [selectedDate]);

  // ── Log analysis ──
  const logStats = useMemo(() => {
    const W = (l: LogEntry) => l.w || 1;
    const days = [...new Set(log.map((l) => l.d))].sort();
    const P = log.filter((l) => l.s === "P").reduce((a, l) => a + W(l), 0);
    const A = log.reduce((a, l) => a + W(l), 0) - P;

    // Heatmap (last 35 days)
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const st = new Date(end);
    st.setDate(st.getDate() - 34);
    const heatmap: { date: string; day: number; p: number; a: number }[] = [];
    for (let k = 0; k < 35; k++) {
      const t = new Date(st);
      t.setDate(st.getDate() + k);
      const d = ymd(t);
      const m = log.filter((l) => l.d === d);
      const ab = m.filter((l) => l.s === "A").reduce((x, l) => x + W(l), 0);
      const pr = m.reduce((x, l) => x + W(l), 0) - ab;
      heatmap.push({ date: d, day: t.getDate(), p: pr, a: ab });
    }

    // Weekday stats
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wp = Array(7).fill(0);
    const wa = Array(7).fill(0);
    log.forEach((l) => {
      const g = new Date(l.d + "T00:00:00").getDay();
      l.s === "P" ? (wp[g] += W(l)) : (wa[g] += W(l));
    });

    // Recent entries
    const recent = [...log].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 20);

    return { days, P, A, streak: stats.streak, heatmap, wd, wp, wa, recent };
  }, [log, stats.streak]);

  // ── Badges ──
  const badges = useMemo(() => [
    { icon: "🔥", label: "3-day streak", active: stats.streak >= 3 },
    { icon: "🛡️", label: "All courses safe", active: courses.every((d) => d.held && (d.p / d.held) * 100 >= reqPct) },
    { icon: "👑", label: "90% club", active: stats.combined >= 90 },
    { icon: "💯", label: "A perfect course", active: courses.some((d) => d.held > 5 && d.p === d.held) },
    { icon: "🌱", label: "First log", active: log.length > 0 },
    { icon: "📆", label: "7 days logged", active: stats.days.length >= 7 },
  ], [stats, courses, log, reqPct]);

  // ── Priority table ──
  const priority = useMemo(() => {
    return courses
      .map((d) => {
        const pct = d.held ? (d.p / d.held) * 100 : 0;
        return { ...d, pct, gap: reqPct - pct, need: calcSkipNeed(d).need };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [courses, reqPct, calcSkipNeed]);

  // ── Planner ──
  const plannerData = useMemo(() => {
    const R = targetPct / 100;
    return courses.map((d) => {
      const pct = d.held ? (d.p / d.held) * 100 : 0;
      const rem = Math.max(d.total - d.held, 0);
      const need = pct / 100 >= R ? 0 : Math.ceil((R * d.held - d.p) / (1 - R));
      const fin = ((d.p + rem) / (d.held + rem)) * 100;
      const canMiss = Math.floor(d.p + rem - R * (d.held + rem));
      return { ...d, pct, rem, need, fin, canMiss, ok: need <= rem };
    });
  }, [courses, targetPct]);

  // ── Reset / clear / backup ──
  const handleReset = useCallback(async () => {
    const newBase = ORIG_D.map((o) => ({ total: o.total, held: o.held, p: o.p, a: o.a }));
    setBase(newBase);
    setLog([]);
    saveLocal(newBase, []);
    await apiCall("PUT", "/api/attendance/reset");
    const b = ORIG_D.map((o, i) => ({ idx: i, total: o.total, held: o.held, present: o.p, absent: o.a }));
    await apiCall("PUT", "/api/attendance/base", { base: b });
    toast("♻️ Reset to original");
  }, [saveLocal, toast]);

  const handleClearLog = useCallback(async () => {
    if (!clrConfirm) {
      setClrConfirm(true);
      setTimeout(() => setClrConfirm(false), 4000);
      return;
    }
    setClrConfirm(false);
    setLog([]);
    saveLocal(base, []);
    await apiCall("DELETE", "/api/attendance/log/clear");
    toast("🧹 Daily log cleared");
  }, [clrConfirm, base, saveLocal, toast]);

  const handleBackup = useCallback(() => {
    const b = new Blob([JSON.stringify({ base, log })], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "attendance-backup.json";
    a.click();
    URL.revokeObjectURL(u);
  }, [base, log]);

  const handleCSV = useCallback(() => {
    const header = "Code,Course,Total,Held,Present,Absent,Present%,Overall%\n";
    const rows = courses.map((d) => `${d.code},${d.name},${d.total},${d.held},${d.p},${d.a},${d.pp},${d.op}`).join("\n");
    const b = new Blob([header + rows], { type: "text/csv" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "attendance.csv";
    a.click();
    URL.revokeObjectURL(u);
  }, [courses]);

  // ── Edit base ──
  const updateBase = useCallback(
    (i: number, key: keyof BaseEntry, val: number) => {
      const newBase = [...base];
      newBase[i] = { ...newBase[i], [key]: val };
      setBase(newBase);
      saveBaseToServer(newBase);
    },
    [base, saveBaseToServer]
  );

  // ── Delete log entry ──
  const deleteLogEntry = useCallback(
    (date: string, i: number) => {
      const newLog = log.filter((l) => !(l.d === date && l.i === i));
      setLog(newLog);
      saveLocal(base, newLog);
      apiCall("DELETE", "/api/attendance/log", { date, i });
    },
    [log, base, saveLocal]
  );

  // ── Toggle section ──
  const toggleSection = (id: string) => setActiveSection((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <div className="att-loading">
        <div className="att-loading-spinner" />
        <p>Loading attendance data…</p>
      </div>
    );
  }

  return (
    <div className="att-page">
      <AttToast message={toastMsg} visible={toastVisible} />

      {/* Brand */}
      <div className="att-brand">
        <span className="att-brand-icon">🎓</span>
        <div>
          <h1 className="att-brand-title">Attendance HQ</h1>
          <div className="att-brand-sub">Your live semester tracker — marks, trends & what-ifs</div>
        </div>
      </div>

      {/* Hero */}
      <div className="att-hero">
        <div className="att-hero-ring">
          <Ring pct={stats.combined} size={140} color={stats.combined >= reqPct ? "#7dffb0" : "#ffd1c9"} label={stats.combined.toFixed(0) + "%"} />
        </div>
        <div className="att-hero-info">
          <div className="att-hero-title">{heroTitle}</div>
          <div className="att-hero-sub">{stats.tp}/{stats.th} sessions attended · {stats.streak}-day no-absence streak</div>
          <div className="att-hero-sub">{nextClass}</div>
        </div>
      </div>

      {/* Course cards */}
      <div className="att-course-grid">
        {courses.map((d, i) => {
          const pct = d.held ? (d.p / d.held) * 100 : 0;
          const k = calcSkipNeed(d);
          const ok = pct >= reqPct;
          const c = statusColor(pct);
          const emoji = pct >= 90 ? "🤩" : ok ? "😎" : pct >= reqPct - 10 ? "😬" : "😱";
          return (
            <div key={d.code} className="att-course-card" style={{ borderTopColor: c }}>
              <Ring pct={pct} size={72} color={c} label={pct.toFixed(0) + "%"} />
              <div className="att-cc-info">
                <div className="att-cc-name">{emoji} {shortName(d.name)}</div>
                <div className="att-cc-sub">{d.p}/{d.held} sessions</div>
                <span className="att-pill" style={{ background: c }}>
                  {ok ? `Can skip ${k.skip}` : `Attend ${k.need} in a row`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="att-card">
        <h2 className="att-h2">🏅 Achievements</h2>
        <div className="att-badges">
          {badges.map((b) => (
            <div key={b.label} className={`att-badge ${b.active ? "on" : ""}`}>
              <span>{b.icon}</span> {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Settings bar */}
      <div className="att-card att-tools">
        <label className="att-tool-label">
          Required %
          <input type="number" className="att-num-input" value={reqPct} min={1} max={100} onChange={(e) => setReqPct(+e.target.value || 75)} />
        </label>
      </div>

      {/* Upload Section */}
      <div className="att-card att-import">
        <h2 className="att-h2">📤 Upload Attendance Report</h2>
        <p className="att-note" style={{ margin: "0 0 12px" }}>
          Upload a <strong>CSV</strong>, <strong>screenshot/image</strong>, or <strong>JSON backup</strong>. The format is auto-detected.
          CSV should have columns: course code/name, total, held, present, absent.
        </p>
        <div className="att-tools" style={{ margin: 0 }}>
          <label className="att-upload-btn" onClick={() => fileRef.current?.click()}>
            <span className="att-upload-choose">Choose file</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.txt,image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            multiple
            onChange={(e) => {
              if (e.target.files?.length) handleFileUpload(e.target.files);
              e.target.value = "";
            }}
            id="attendance-file-upload"
          />
          <label className="att-check-label">
            <input type="checkbox" checked={clearLogOnImport} onChange={(e) => setClearLogOnImport(e.target.checked)} />
            Clear daily marks after import
          </label>
        </div>
        {uploadStatus.message && (
          <div className={`att-upload-status ${uploadStatus.tone}`}>{uploadStatus.message}</div>
        )}
      </div>

      {/* Daily Update */}
      <div className="att-card">
        <h2 className="att-h2">📅 Daily update – mark today's attendance</h2>
        <div className="att-tools">
          <label className="att-tool-label">
            Date
            <input type="date" className="att-date-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} id="att-date-picker" />
          </label>
          <label className="att-check-label">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Show all courses
          </label>
          <button className="att-btn-sec" onClick={() => bulkDay("P")}>All present</button>
          <button className="att-btn-sec" onClick={() => bulkDay("A")}>All absent</button>
          <button className="att-btn-sec" onClick={() => bulkDay("")}>Clear day</button>
        </div>
        <div className="att-mark-list">
          {dayRows.length ? (
            dayRows.map((r, ri) => {
              if (r.i == null)
                return (
                  <div key={ri} className="att-mark-row">
                    <span>{r.name} <span className="att-muted">· {r.t} · not tracked</span></span>
                  </div>
                );
              const entry = log.find((l) => l.d === selectedDate && l.i === r.i);
              const st = entry ? entry.s : "";
              const d = courses[r.i];
              return (
                <div key={ri} className="att-mark-row">
                  <span className="att-mark-name">
                    {r.name}
                    <span className="att-muted"> · {r.w} period{r.w > 1 ? "s" : ""} · {r.t} · now {d.held ? ((d.p / d.held) * 100).toFixed(0) : 0}%</span>
                  </span>
                  <span className="att-mark-btns">
                    <button className={`att-mark-btn ${st === "P" ? "on-p" : ""}`} onClick={() => setMark(r.i!, "P", r.w)}>Present</button>
                    <button className={`att-mark-btn ${st === "A" ? "on-a" : ""}`} onClick={() => setMark(r.i!, "A", r.w)}>Absent</button>
                    <button className="att-mark-btn" onClick={() => setMark(r.i!, "", r.w)}>Clear</button>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="att-note">No classes scheduled. Tick "Show all courses" to mark manually.</div>
          )}
        </div>
        <p className="att-note" style={{ marginTop: 8 }}>
          Classes shown from your timetable for the selected date. Multi-period classes count as multiple sessions.
        </p>
      </div>

      {/* Timetable */}
      <div className="att-card">
        <h2 className="att-h2">🗓️ Weekly timetable <span className="att-h2-sub">(week of selected date)</span></h2>
        <div className="att-timetable">
          {timetableWeek.map((day) => (
            <div key={day.label} className="att-tt-day">
              <div className={`att-tt-day-header ${day.isToday ? "today" : ""}`}>{day.label}</div>
              {day.slots.length ? (
                day.slots.map((sl, si) => (
                  <div key={si} className="att-tt-slot" style={{ borderLeftColor: sl.color }}>
                    <b>{sl.name}</b>
                    <span className="att-muted">{sl.time} · {sl.periods} period{sl.periods > 1 ? "s" : ""}</span>
                  </div>
                ))
              ) : (
                <div className="att-note" style={{ margin: 4 }}>No class</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave planner */}
      <div className="att-card">
        <h2 className="att-h2">🏖️ Leave / bunk planner</h2>
        <div className="att-tools">
          <label className="att-tool-label">From <input type="date" className="att-date-input" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} /></label>
          <label className="att-tool-label">To <input type="date" className="att-date-input" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} /></label>
        </div>
        {leaveData ? (
          <>
            <div className="att-note" style={{ margin: "8px 0", fontWeight: 600, color: "var(--text)" }}>
              {leaveData.days} day(s), {leaveData.tot} tracked periods missed.
            </div>
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Course</th><th>Periods missed</th><th>Now</th><th>After leave</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((d, i) => {
                    const now = d.held ? (d.p / d.held) * 100 : 0;
                    const aft = (d.p / (d.held + leaveData.miss[i])) * 100;
                    return (
                      <tr key={d.code}>
                        <td className="att-td-name">{d.name}</td>
                        <td>{leaveData.miss[i]}</td>
                        <td>{now.toFixed(1)}%</td>
                        <td><b>{aft.toFixed(1)}%</b></td>
                        <td><span className="att-pill" style={{ background: statusColor(aft) }}>{aft >= reqPct ? "Safe" : `Below ${reqPct}%`}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="att-note">Pick a valid date range.</div>
        )}
      </div>

      {/* KPI row */}
      <div className="att-kpi-grid">
        {[
          { label: "Average present %", value: stats.avg.toFixed(1) + "%", color: statusColor(stats.avg) },
          { label: "Classes attended", value: stats.tp, color: "" },
          { label: "Classes missed", value: stats.ta, color: "" },
          { label: `Courses above ${reqPct}%`, value: `${stats.safe} / ${courses.length}`, color: stats.safe === courses.length ? "#16a34a" : "#f59e0b" },
          { label: "Lowest course", value: stats.low.pp + "%", color: "#dc2626", sub: shortName(stats.low.name) },
          { label: "Best (5+ classes)", value: stats.best?.pp + "%", color: "#16a34a", sub: stats.best ? shortName(stats.best.name) : "" },
        ].map((k, idx) => (
          <div key={idx} className="att-kpi">
            <div className="att-kpi-label">{k.label}</div>
            <div className="att-kpi-value" style={{ color: k.color || "inherit" }}>{k.value}</div>
            {(k as any).sub && <div className="att-note" style={{ margin: "2px 0 0" }}>{(k as any).sub}</div>}
          </div>
        ))}
      </div>

      {/* Insights + Priority */}
      <div className="att-card">
        <h2 className="att-h2">💡 Auto insights</h2>
        <ul className="att-insights">
          <li>Combined attendance: <b>{stats.combined.toFixed(1)}%</b> ({stats.tp}/{stats.th} classes).</li>
          {stats.below.length ? (
            <li><b>{stats.below.length}</b> course(s) below {reqPct}%: {stats.below.map((d) => d.name).join(", ")}.</li>
          ) : (
            <li>All courses above {reqPct}% 🎉</li>
          )}
          <li>You can still skip about <b>{stats.totalSkips}</b> classes total across safe courses.</li>
          <li>Most absences: <b>{stats.worst.name}</b> ({stats.worst.a} missed).</li>
        </ul>

        <h2 className="att-h2" style={{ marginTop: 16 }}>🔥 Focus priority (attend these first)</h2>
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr><th>#</th><th>Course</th><th>Present %</th><th>Gap to {reqPct}%</th><th>Need to attend</th></tr>
            </thead>
            <tbody>
              {priority.map((r, i) => (
                <tr key={r.code}>
                  <td>{i + 1}</td>
                  <td className="att-td-name">{r.name}</td>
                  <td>{r.pct.toFixed(1)}%</td>
                  <td style={{ color: r.gap > 0 ? "#dc2626" : "#16a34a" }}>
                    {r.gap > 0 ? `-${r.gap.toFixed(1)}%` : `+${(-r.gap).toFixed(1)}%`}
                  </td>
                  <td>{r.gap > 0 ? r.need : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course details table */}
      <div className="att-card">
        <h2 className="att-h2">📊 Course details <span className="att-h2-sub">(tap a header to sort)</span></h2>
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                {[
                  ["code", "Code"], ["name", "Course"], ["held", "Held"], ["p", "Present"],
                  ["a", "Absent"], ["pp", "Present %"], ["op", "Overall %"], ["skip", "Can skip"], ["need", "Need"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => {
                      setSortDir(sortKey === key ? -sortDir : 1);
                      setSortKey(key);
                    }}
                    className="att-sortable"
                  >
                    {label} {sortKey === key ? (sortDir > 0 ? "▲" : "▼") : ""}
                  </th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCourses.map((r) => {
                const c = statusColor(r.pp);
                const ok = r.pp >= reqPct;
                return (
                  <tr key={r.code}>
                    <td>{r.code}</td>
                    <td className="att-td-name">{r.name}<div className="att-note" style={{ margin: 0 }}>{r.fac}</div></td>
                    <td>{r.held}/{r.total}</td>
                    <td>{r.p}</td>
                    <td>{r.a}</td>
                    <td>
                      <div className="att-bar"><div className="att-bar-fill" style={{ width: r.pp + "%", background: c }} /></div>
                      {r.pp}%
                    </td>
                    <td>{r.op}%</td>
                    <td>{ok ? r.skip : "–"}</td>
                    <td>{ok ? "–" : r.need}</td>
                    <td><span className="att-pill" style={{ background: c }}>{ok ? "Safe" : r.pp >= reqPct - 10 ? "Watch" : "Low"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="att-note" style={{ marginTop: 8 }}>
          "Can skip" = classes you can miss while staying above the required %. "Need" = consecutive classes to recover.
        </p>
      </div>

      {/* Log Analysis */}
      <div className="att-card">
        <h2 className="att-h2">📈 Daily log analysis</h2>
        <div className="att-kpi-grid" style={{ marginBottom: 12 }}>
          {[
            { label: "Days logged", value: logStats.days.length },
            { label: "Present sessions", value: logStats.P },
            { label: "Absent sessions", value: logStats.A },
            { label: "No-absence streak", value: logStats.streak + " day(s)" },
          ].map((k, i) => (
            <div key={i} className="att-kpi">
              <div className="att-kpi-label">{k.label}</div>
              <div className="att-kpi-value">{k.value}</div>
            </div>
          ))}
        </div>

        {logStats.days.length === 0 ? (
          <div className="att-note">No daily marks yet. Use the Daily update card above.</div>
        ) : (
          <>
            {/* Weekday bar chart */}
            <h3 className="att-h3">Present / absent by weekday</h3>
            <div className="att-weekday-chart">
              {logStats.wd.map((day, i) => {
                const total = logStats.wp[i] + logStats.wa[i];
                const maxH = Math.max(...logStats.wd.map((_, j) => logStats.wp[j] + logStats.wa[j]), 1);
                return (
                  <div key={day} className="att-wd-col">
                    <div className="att-wd-bars" style={{ height: 100 }}>
                      <div className="att-wd-bar present" style={{ height: total ? (logStats.wp[i] / maxH) * 100 + "%" : 0 }} title={`${logStats.wp[i]} present`} />
                      <div className="att-wd-bar absent" style={{ height: total ? (logStats.wa[i] / maxH) * 100 + "%" : 0 }} title={`${logStats.wa[i]} absent`} />
                    </div>
                    <div className="att-wd-label">{day}</div>
                  </div>
                );
              })}
            </div>

            {/* Heatmap */}
            <h3 className="att-h3">Last 5 weeks calendar</h3>
            <div className="att-heatmap">
              {logStats.heatmap.map((h, i) => {
                const bg = !log.some((l) => l.d === h.date) ? "var(--bg)" : h.a === 0 ? "#16a34a" : h.p === 0 ? "#dc2626" : "#f59e0b";
                const isHigh = h.p > 0 || h.a > 0;
                return (
                  <div
                    key={i}
                    className="att-heat-cell"
                    style={{ background: bg, color: isHigh ? "#fff" : "var(--text-3)" }}
                    title={`${h.date}: ${h.p} present, ${h.a} absent`}
                  >
                    {h.day}
                  </div>
                );
              })}
            </div>

            {/* Recent log */}
            <h3 className="att-h3">Recent entries</h3>
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr><th>Date</th><th>Course</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {logStats.recent.map((l, i) => (
                    <tr key={i}>
                      <td>{l.d}</td>
                      <td className="att-td-name">{shortName(courses[l.i]?.name || "Unknown")}</td>
                      <td>
                        <span className="att-pill" style={{ background: l.s === "P" ? "#16a34a" : "#dc2626" }}>
                          {l.s === "P" ? "Present" : "Absent"}{(l.w || 1) > 1 ? ` ×${l.w}` : ""}
                        </span>
                      </td>
                      <td>
                        <button className="att-btn-sec att-btn-sm" onClick={() => deleteLogEntry(l.d, l.i)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bulk scenario */}
      <div className="att-card">
        <h2 className="att-h2">🔮 Bulk scenario – every course at once</h2>
        <div className="att-tools">
          <label className="att-tool-label">
            If I
            <select className="att-select" value={bulkMode} onChange={(e) => setBulkMode(e.target.value as any)}>
              <option value="attend">attend</option>
              <option value="miss">miss</option>
            </select>
          </label>
          <label className="att-tool-label">
            the next
            <input type="number" className="att-num-input" value={bulkN} min={0} max={60} onChange={(e) => setBulkN(+e.target.value || 0)} />
            classes in every course
          </label>
        </div>
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr><th>Course</th><th>Now</th><th>After</th><th>Change</th><th>Status</th></tr>
            </thead>
            <tbody>
              {bulkData.map((r) => (
                <tr key={r.code}>
                  <td className="att-td-name">{r.name}</td>
                  <td>{r.cur.toFixed(1)}%</td>
                  <td><b>{r.proj.toFixed(1)}%</b></td>
                  <td style={{ color: r.diff >= 0 ? "#16a34a" : "#dc2626" }}>
                    {r.diff >= 0 ? "+" : ""}{r.diff.toFixed(1)}%
                  </td>
                  <td>
                    <span className="att-pill" style={{ background: statusColor(r.proj) }}>
                      {r.proj >= reqPct ? "Safe" : `Below ${reqPct}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planner */}
      <div className="att-card">
        <h2 className="att-h2">🚀 Classes needed to reach target</h2>
        <div className="att-tools">
          <label className="att-tool-label">
            Target %
            <input type="number" className="att-num-input" value={targetPct} min={1} max={99} onChange={(e) => setTargetPct(+e.target.value || 75)} />
          </label>
        </div>
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>Course</th><th>Now</th><th>Present/Held</th><th>Need to attend</th>
                <th>Classes left</th><th>Max possible %</th><th>Can still miss</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {plannerData.map((r) => (
                <tr key={r.code}>
                  <td className="att-td-name">{r.name}</td>
                  <td>{r.pct.toFixed(1)}%</td>
                  <td>{r.p}/{r.held}</td>
                  <td><b>{r.need === 0 ? "✅ Already there" : r.need}</b></td>
                  <td>{r.rem}</td>
                  <td>{r.fin.toFixed(1)}%</td>
                  <td>{r.canMiss >= 0 ? r.canMiss : "Not possible"}</td>
                  <td>
                    <span className="att-pill" style={{ background: r.need === 0 ? "#16a34a" : r.ok ? "#f59e0b" : "#dc2626" }}>
                      {r.need === 0 ? "Safe" : r.ok ? "Recoverable" : "Not enough classes left"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* What-if */}
      <div className="att-card">
        <h2 className="att-h2">🎯 What-if simulator</h2>
        <div className="att-tools">
          <select className="att-select" value={simCourse} onChange={(e) => setSimCourse(+e.target.value)}>
            {courses.map((d, i) => (
              <option key={d.code} value={i}>{d.code} – {shortName(d.name)}</option>
            ))}
          </select>
          <label className="att-tool-label">
            I attend <input type="number" className="att-num-input" value={simAttend} min={0} onChange={(e) => setSimAttend(+e.target.value || 0)} />
          </label>
          <label className="att-tool-label">
            and miss <input type="number" className="att-num-input" value={simMiss} min={0} onChange={(e) => setSimMiss(+e.target.value || 0)} />
          </label>
          <button className="att-btn" onClick={runSim}>Calculate</button>
        </div>
        {simResult && <div className="att-sim-result">{simResult}</div>}
      </div>

      {/* Edit & Export */}
      <div className="att-card">
        <h2 className="att-h2">✏️ Edit data & export</h2>
        <p className="att-note" style={{ margin: "0 0 10px" }}>
          Baseline numbers from your college portal. Daily marks are added on top.
        </p>
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr><th>Course</th><th>Total planned</th><th>Held (faculty)</th><th>Present</th><th>Absent</th></tr>
            </thead>
            <tbody>
              {ORIG_D.map((d, i) => (
                <tr key={d.code}>
                  <td className="att-td-name">{d.name}</td>
                  {(["total", "held", "p", "a"] as const).map((k) => (
                    <td key={k}>
                      <input
                        type="number"
                        className="att-num-input"
                        min={0}
                        value={base[i][k]}
                        onChange={(e) => updateBase(i, k, +e.target.value || 0)}
                        style={{ width: 70 }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="att-tools" style={{ marginTop: 12 }}>
          <button className="att-btn" onClick={handleReset}>Reset to original</button>
          <button className="att-btn-sec" onClick={handleClearLog}>
            {clrConfirm ? "Click again to confirm" : "Clear daily log"}
          </button>
          <button className="att-btn" onClick={handleCSV}>Download CSV</button>
          <button className="att-btn-sec" onClick={handleBackup}>Backup (JSON)</button>
        </div>
      </div>
    </div>
  );
}
