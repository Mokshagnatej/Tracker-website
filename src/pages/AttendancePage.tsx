import { useEffect, useRef, useCallback } from "react";

// We'll load Chart.js from CDN since the original HTML uses it
declare const Chart: any;

const ORIG_DATA = [
  ["10210CH104","Environmental Science & Sustainability",45,28,19,3,68,42,"Dr. Kanniraj A"],
  ["10211CS129","Modern Computer Architecture",45,30,24,6,80,53,"Dr. Barkathulla A. A"],
  ["10211CS208","Software Engineering",60,38,28,10,74,47,"Dr. Amu. D"],
  ["10211CS223","Machine Learning Techniques",60,40,31,8,78,52,"Dr. Godlin Jasil. S.P"],
  ["10211CS227","Problem Solving and Testing",75,53,42,10,79,56,"Dr. Sathyamoorthy. K"],
  ["10212CS217","Data Science",60,47,41,4,87,68,"Dr. Angeline Lydia"],
  ["10212CS295","Applied Coding Skills",75,47,36,10,77,48,"Dr. Kaviarasan. S"],
  ["10212CS461","Design & Impl. of Human-Computer Interfaces",12,1,1,0,100,8,"Gopi. S"],
  ["10213GE308","Professional Communication for Engineers",45,29,18,4,62,40,"Dr. Umanesan. R"],
  ["10216GE903","Aptitude Skills - I",30,19,15,4,79,50,"Dinesh Kumar. R"]
];

export default function AttendancePage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const initDashboard = useCallback(() => {
    const root = wrapRef.current;
    if (!root) return;

    // Prevent double init
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ---- All the original JS logic, scoped to our container ----
    const $ = (id: string) => root.querySelector(`#${id}`) as HTMLElement | null;
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

    type CourseData = {
      code: string; name: string; total: number; held: number;
      p: number; a: number; pp: number; op: number; fac: string;
    };

    const D: CourseData[] = ORIG_DATA.map((r: any) => ({
      code: r[0], name: r[1], total: r[2], held: r[3],
      p: r[4], a: r[5], pp: r[6], op: r[7], fac: r[8]
    }));

    const ORIG = JSON.parse(JSON.stringify(D));
    let BASE = ORIG.map((o: any) => ({ total: o.total, held: o.held, p: o.p, a: o.a }));
    let LOG: any[] = [];

    try {
      const sv = JSON.parse(localStorage.getItem("att_v2") || "null");
      if (sv) {
        if (Array.isArray(sv.base) && sv.base.length === D.length) BASE = sv.base;
        if (Array.isArray(sv.log)) LOG = sv.log;
      }
    } catch (e) {}

    function save() {
      try { localStorage.setItem("att_v2", JSON.stringify({ base: BASE, log: LOG })); } catch (e) {}
    }

    function recompute() {
      D.forEach((d, i) => {
        const b = BASE[i];
        let p = b.p, a = b.a, h = b.held;
        LOG.forEach((l: any) => {
          if (l.i === i) { h++; l.s === "P" ? p++ : a++; }
        });
        Object.assign(d, { total: b.total, p, a, held: h, pp: h ? Math.round(p / h * 100) : 0, op: b.total ? Math.round(p / b.total * 100) : 0 });
      });
    }
    recompute();

    let charts: any[] = [], sortKey = "pp", sortDir = 1;
    const req = () => +(($ ("req") as HTMLInputElement)?.value) || 75;
    const col = (v: number) => v >= req() ? css("--att-ok") : v >= req() - 10 ? css("--att-warn") : css("--att-bad");
    const short = (d: CourseData) => d.name.length > 22 ? d.name.slice(0, 21) + "…" : d.name;

    function calc(d: CourseData) {
      const R = req() / 100, c = d.p, t = d.held;
      const pct = t ? c / t * 100 : 0;
      let skip = Math.floor(c / R - t), need = 0;
      if (skip < 0) { skip = 0; need = Math.ceil((R * t - c) / (1 - R)); }
      return { pct, skip, need, t };
    }

    function kpis() {
      const tp = D.reduce((s, d) => s + d.p, 0), ta = D.reduce((s, d) => s + d.a, 0);
      const avg = D.reduce((s, d) => s + d.pp, 0) / D.length;
      const safe = D.filter(d => d.pp >= req()).length;
      const low = [...D].sort((a, b) => a.pp - b.pp)[0];
      const best = [...D].sort((a, b) => b.pp - a.pp).filter(d => d.held > 5)[0];
      const items = [
        ["Average present %", avg.toFixed(1) + "%", col(avg)],
        ["Classes attended", tp, ""],
        ["Classes missed", ta, ""],
        ["Courses above " + req() + "%", safe + " / " + D.length, safe == D.length ? css("--att-ok") : css("--att-warn")],
        ["Lowest course", low.pp + "%", css("--att-bad"), low.name.slice(0, 22)],
        ["Best (5+ classes)", best.pp + "%", css("--att-ok"), best.name.slice(0, 22)]
      ];
      const el = $("kpis");
      if (el) el.innerHTML = items.map(i => `<div class="att-card att-kpi"><div class="att-l">${i[0]}</div><div class="att-v" style="color:${i[2] || "inherit"}">${i[1]}</div>${i[3] ? `<div class="att-note" style="margin:2px 0 0">${i[3]}</div>` : ""}</div>`).join("");
    }

    function table() {
      const rows = D.map(d => ({ ...d, ...calc(d) })).sort((a: any, b: any) => (typeof a[sortKey] == "string" ? a[sortKey].localeCompare(b[sortKey]) : a[sortKey] - b[sortKey]) * sortDir);
      const H = [["code", "Code"], ["name", "Course"], ["held", "Held"], ["p", "Present"], ["a", "Absent"], ["pp", "Present %"], ["op", "Overall %"], ["skip", "Can skip"], ["need", "Need"]];
      const el = $("tbl");
      if (el) {
        el.innerHTML = "<tr>" + H.map(h => `<th data-k="${h[0]}">${h[1]}</th>`).join("") + "<th>Status</th></tr>" +
          rows.map((r: any) => {
            const c = col(r.pp), ok = r.pp >= req();
            return `<tr><td>${r.code}</td><td>${r.name}<div class="att-note" style="margin:0">${r.fac}</div></td><td>${r.held}/${r.total}</td><td>${r.p}</td><td>${r.a}</td>
            <td><div class="att-bar"><i style="width:${r.pp}%;background:${c}"></i></div>${r.pp}%</td><td>${r.op}%</td>
            <td>${ok ? r.skip : "–"}</td><td>${ok ? "–" : r.need}</td>
            <td><span class="att-pill" style="background:${c}">${ok ? "Safe" : r.pp >= req() - 10 ? "Watch" : "Low"}</span></td></tr>`;
          }).join("");
        el.querySelectorAll("th[data-k]").forEach((th: any) => th.onclick = () => { const k = th.dataset.k; sortDir = sortKey == k ? -sortDir : 1; sortKey = k; table(); });
      }
    }

    function draw() {
      charts.forEach(c => c.destroy()); charts = [];
      const m = ($("metric") as HTMLSelectElement)?.value || "pp";
      const tx = css("--att-muted"), ln = css("--att-line");
      Chart.defaults.color = tx;
      const labels = D.map(short), vals = D.map((d: any) => d[m]), r = req();
      const scales = { x: { grid: { color: ln }, ticks: { maxRotation: 60, minRotation: 40 } }, y: { grid: { color: ln }, beginAtZero: true, max: 100 } };
      const line = {
        id: "req", afterDraw(ch: any) {
          const y = ch.scales.y.getPixelForValue(r), { left, right } = ch.chartArea, x = ch.ctx;
          x.save(); x.strokeStyle = css("--att-bad"); x.setLineDash([6, 4]); x.beginPath(); x.moveTo(left, y); x.lineTo(right, y); x.stroke(); x.restore();
        }
      };
      const c1 = $("c1") as HTMLCanvasElement;
      const c2 = $("c2") as HTMLCanvasElement;
      const c3 = $("c3") as HTMLCanvasElement;
      const c4 = $("c4") as HTMLCanvasElement;
      if (c1) charts.push(new Chart(c1, { type: "bar", data: { labels, datasets: [{ data: vals, backgroundColor: vals.map(col), borderRadius: 6 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales }, plugins: [line] }));
      if (c2) charts.push(new Chart(c2, { type: "bar", data: { labels, datasets: [{ label: "Present", data: D.map(d => d.p), backgroundColor: css("--att-ok"), borderRadius: 4 }, { label: "Absent", data: D.map(d => d.a), backgroundColor: css("--att-bad"), borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true, grid: { color: ln }, ticks: { maxRotation: 60, minRotation: 40 } }, y: { stacked: true, grid: { color: ln } } } } }));
      if (c3) charts.push(new Chart(c3, { type: "radar", data: { labels: D.map(d => d.code.slice(-5)), datasets: [{ label: "Present %", data: D.map(d => d.pp), borderColor: css("--att-acc"), backgroundColor: "rgba(79,124,255,.25)" }, { label: "Required", data: D.map(() => r), borderColor: css("--att-bad"), borderDash: [5, 4], pointRadius: 0, fill: false }] }, options: { maintainAspectRatio: false, scales: { r: { min: 0, max: 100, grid: { color: ln }, angleLines: { color: ln }, ticks: { backdropColor: "transparent" } } } } }));
      if (c4) charts.push(new Chart(c4, { type: "bar", data: { labels, datasets: [{ label: "Attended", data: D.map(d => d.p), backgroundColor: css("--att-ok") }, { label: "Missed", data: D.map(d => d.a), backgroundColor: css("--att-bad") }, { label: "Other (OD/leave)", data: D.map(d => Math.max(d.held - d.p - d.a, 0)), backgroundColor: css("--att-warn") }, { label: "Remaining", data: D.map(d => Math.max(d.total - d.held, 0)), backgroundColor: ln }] }, options: { indexAxis: "y", maintainAspectRatio: false, scales: { x: { stacked: true, grid: { color: ln } }, y: { stacked: true, grid: { display: false } } } } }));
    }

    function sim() {
      const simcEl = $("simc") as HTMLSelectElement;
      const attEl = $("att") as HTMLInputElement;
      const misEl = $("mis") as HTMLInputElement;
      if (!simcEl || !attEl || !misEl) return;
      const d = D[+simcEl.value], a = +attEl.value || 0, ms = +misEl.value || 0;
      const p = d.p + a, t = d.held + a + ms, pct = t ? p / t * 100 : 0;
      const simout = $("simout");
      if (simout) simout.innerHTML = `<b>${d.name}</b>: ${d.pp}% → <b style="color:${col(pct)}">${pct.toFixed(1)}%</b> (${p}/${t}) — ${pct >= req() ? "✅ above" : "⚠️ below"} ${req()}%.`;
    }

    let pc: any;
    function planner() {
      const R = (+($("tgt") as HTMLInputElement)?.value || 75) / 100;
      const rows = D.map(d => {
        const t = d.held, pct = t ? d.p / t * 100 : 0, rem = Math.max(d.total - t, 0), miss = Math.floor(d.p + rem - R * (t + rem));
        const need = pct / 100 >= R ? 0 : Math.ceil((R * t - d.p) / (1 - R));
        const fin = (d.p + rem) / (t + rem) * 100;
        return { ...d, pct, rem, need, fin, miss, ok: need <= rem };
      });
      const el = $("plan");
      if (el) el.innerHTML = "<tr><th>Course</th><th>Now</th><th>Present/Held</th><th>Need to attend</th><th>Classes left</th><th>Max possible %</th><th>Can still miss (of left)</th><th>Result</th></tr>" +
        rows.map(r => `<tr><td>${r.name}</td><td>${r.pct.toFixed(1)}%</td><td>${r.p}/${r.held}</td>
        <td><b>${r.need === 0 ? "✅ Already there" : r.need}</b></td><td>${r.rem}</td><td>${r.fin.toFixed(1)}%</td><td>${r.miss >= 0 ? r.miss : "Not possible"}</td>
        <td><span class="att-pill" style="background:${r.need === 0 ? css("--att-ok") : r.ok ? css("--att-warn") : css("--att-bad")}">${r.need === 0 ? "Safe" : r.ok ? "Recoverable" : "Not enough classes left"}</span></td></tr>`).join("");
      if (pc) pc.destroy();
      const c5 = $("c5") as HTMLCanvasElement;
      if (c5) pc = new Chart(c5, { type: "bar", data: { labels: rows.map(r => short(r)), datasets: [{ label: "Classes to attend", data: rows.map(r => r.need), backgroundColor: rows.map(r => r.need === 0 ? css("--att-ok") : r.ok ? css("--att-warn") : css("--att-bad")), borderRadius: 6 }, { label: "Classes left", data: rows.map(r => r.rem), backgroundColor: css("--att-line"), borderRadius: 6 }] }, options: { maintainAspectRatio: false, scales: { x: { grid: { color: css("--att-line") }, ticks: { maxRotation: 60, minRotation: 40 } }, y: { grid: { color: css("--att-line") }, beginAtZero: true } } } });
    }

    let xc: any[] = [];
    function extra() {
      const R = req(), ln = css("--att-line"), cur = D.map(d => d.held ? d.p / d.held * 100 : 0);
      const tp = D.reduce((a, d) => a + d.p, 0), tt = D.reduce((a, d) => a + d.held, 0), comb = tt ? tp / tt * 100 : 0;
      const low = D.filter((_d, i) => cur[i] < R), safe = D.filter((_d, i) => cur[i] >= R);
      const skips = safe.reduce((a, d) => a + calc(d).skip, 0);
      const worst = D.reduce((m, d) => d.a > m.a ? d : m, D[0]);
      const L = [
        `Combined attendance across all courses: <b>${comb.toFixed(1)}%</b> (${tp}/${tt} classes).`,
        low.length ? `<b>${low.length}</b> course(s) below ${R}%: ${low.map(d => d.name).join(", ")}.` : `All courses are above ${R}% 🎉`,
        `You can still skip about <b>${skips}</b> classes in total across safe courses without dropping below ${R}%.`,
        `Most absences: <b>${worst.name}</b> (${worst.a} missed).`
      ];
      const ins = $("ins");
      if (ins) ins.innerHTML = L.map(x => "<li>" + x + "</li>").join("");

      const pr = D.map((d, i) => ({ ...d, pct: cur[i], need: calc(d).need, gap: R - cur[i] })).sort((a, b) => b.gap - a.gap);
      const prio = $("prio");
      if (prio) prio.innerHTML = "<tr><th>#</th><th>Course</th><th>Present %</th><th>Gap to " + R + "%</th><th>Need to attend</th></tr>" +
        pr.map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.pct.toFixed(1)}%</td><td style="color:${r.gap > 0 ? css("--att-bad") : css("--att-ok")}">${r.gap > 0 ? "-" + r.gap.toFixed(1) + "%" : "+" + (-r.gap).toFixed(1) + "%"}</td><td>${r.gap > 0 ? r.need : "–"}</td></tr>`).join("");

      const n = +($("bn") as HTMLInputElement)?.value || 0, att = ($("bm") as HTMLSelectElement)?.value === "attend";
      const proj = D.map(d => { const t = d.held; return att ? (d.p + n) / (t + n) * 100 : d.p / (t + n) * 100; });
      const bulk = $("bulk");
      if (bulk) bulk.innerHTML = "<tr><th>Course</th><th>Now</th><th>After</th><th>Change</th><th>Status</th></tr>" +
        D.map((d, i) => { const df = proj[i] - cur[i]; return `<tr><td>${d.name}</td><td>${cur[i].toFixed(1)}%</td><td><b>${proj[i].toFixed(1)}%</b></td><td style="color:${df >= 0 ? css("--att-ok") : css("--att-bad")}">${df >= 0 ? "+" : ""}${df.toFixed(1)}%</td><td><span class="att-pill" style="background:${col(proj[i])}">${proj[i] >= R ? "Safe" : "Below " + R + "%"}</span></td></tr>`; }).join("");

      xc.forEach(c => c.destroy()); xc = [];
      const sc = { x: { grid: { color: ln }, ticks: { maxRotation: 60, minRotation: 40 } }, y: { grid: { color: ln }, beginAtZero: true, max: 100 } };
      const c6 = $("c6") as HTMLCanvasElement;
      const c7 = $("c7") as HTMLCanvasElement;
      const c8 = $("c8") as HTMLCanvasElement;
      if (c6) xc.push(new Chart(c6, { type: "bar", data: { labels: D.map(short), datasets: [{ label: "Now", data: cur, backgroundColor: css("--att-acc"), borderRadius: 4 }, { label: "After", data: proj, backgroundColor: proj.map(col), borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: sc } }));
      const pal = ["#4f7cff", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#64748b"];
      if (c7) xc.push(new Chart(c7, { type: "doughnut", data: { labels: D.map(short), datasets: [{ data: D.map(d => d.a), backgroundColor: pal, borderColor: css("--att-card") }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 11 } } } } } }));
      if (c8) xc.push(new Chart(c8, { type: "scatter", data: { datasets: [{ data: D.map((d, i) => ({ x: +(d.held / d.total * 100).toFixed(1), y: +cur[i].toFixed(1), n: short(d) })), backgroundColor: D.map((_d, i) => col(cur[i])), pointRadius: 8 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => c.raw.n + ": " + c.raw.y + "% (progress " + c.raw.x + "%)" } } }, scales: { x: { title: { display: true, text: "Semester progress %" }, grid: { color: ln }, min: 0 }, y: { title: { display: true, text: "Present %" }, grid: { color: ln }, min: 0, max: 100 } } } }));
    }

    function editTbl() {
      const el = $("edit");
      if (!el) return;
      el.innerHTML = "<tr><th>Course</th><th>Total planned</th><th>Held (faculty sessions)</th><th>Present</th><th>Absent</th></tr>" +
        D.map((d, i) => `<tr><td>${d.name}</td>${["total", "held", "p", "a"].map(k => `<td><input type="number" min="0" data-i="${i}" data-k="${k}" value="${(BASE[i] as any)[k]}"></td>`).join("")}</tr>`).join("");
      el.querySelectorAll("input").forEach((inp: any) => inp.onchange = () => { (BASE[inp.dataset.i] as any)[inp.dataset.k] = +inp.value || 0; save(); recompute(); all(true); });
    }

    const rstBtn = $("rst");
    if (rstBtn) rstBtn.onclick = () => { BASE = ORIG.map((o: any) => ({ total: o.total, held: o.held, p: o.p, a: o.a })); LOG = []; save(); recompute(); all(); };

    let clrArm = false;
    const clrBtn = $("clr");
    if (clrBtn) clrBtn.onclick = () => {
      if (!clrArm) { clrArm = true; clrBtn.textContent = "Click again to confirm"; setTimeout(() => { clrArm = false; clrBtn.textContent = "Clear daily log"; }, 4000); return; }
      clrArm = false; clrBtn.textContent = "Clear daily log"; LOG = []; save(); recompute(); all();
    };

    const bkBtn = $("bk");
    if (bkBtn) bkBtn.onclick = () => {
      const b = new Blob([JSON.stringify({ base: BASE, log: LOG })], { type: "application/json" });
      const u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = "attendance-backup.json"; a.click(); URL.revokeObjectURL(u);
    };

    const rsInput = $("rs") as HTMLInputElement;
    if (rsInput) rsInput.onchange = (e: any) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const x = JSON.parse(r.result as string); if (Array.isArray(x.base) && x.base.length === D.length) { BASE = x.base; LOG = Array.isArray(x.log) ? x.log : []; save(); recompute(); all(); } } catch (er) {} };
      r.readAsText(f);
    };

    const csvBtn = $("csv");
    if (csvBtn) csvBtn.onclick = () => {
      const header = "Code,Course,Total,Held,Present,Absent,Present%,Overall%,Faculty\n";
      const rows = D.map(d => `${d.code},"${d.name}",${d.total},${d.held},${d.p},${d.a},${d.pp},${d.op},"${d.fac}"`).join("\n");
      const b = new Blob([header + rows], { type: "text/csv" });
      const u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = "attendance.csv"; a.click(); URL.revokeObjectURL(u);
    };

    const ymd = (t: Date) => t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    const dayInput = $("day") as HTMLInputElement;
    if (dayInput) dayInput.value = ymd(new Date());

    function setMark(i: number, st: string) {
      const dt = (dayInput as HTMLInputElement)?.value;
      LOG = LOG.filter((l: any) => !(l.d === dt && l.i === i));
      if (st) LOG.push({ d: dt, i, s: st });
      save(); recompute(); all(true);
    }

    function daily() {
      const dt = (dayInput as HTMLInputElement)?.value;
      const markEl = $("mark");
      if (!markEl) return;
      markEl.innerHTML = D.map((d, i) => {
        const l = LOG.find((x: any) => x.d === dt && x.i === i), st = l ? l.s : "";
        return `<div class="att-mrow"><span>${d.name} <span style="color:var(--att-muted)">· ${d.held ? (d.p / d.held * 100).toFixed(0) : 0}%</span></span><span class="att-mb"><button class="att-b ${st === "P" ? "on p" : ""}" data-i="${i}" data-s="P">Present</button><button class="att-b ${st === "A" ? "on a" : ""}" data-i="${i}" data-s="A">Absent</button><button class="att-b" data-i="${i}" data-s="">Clear</button></span></div>`;
      }).join("");
      markEl.querySelectorAll(".att-b").forEach((b: any) => b.onclick = () => setMark(+b.dataset.i, b.dataset.s));
    }

    if (dayInput) dayInput.oninput = () => daily();

    const bulkDay = (st: string) => {
      const dt = dayInput?.value;
      LOG = LOG.filter((l: any) => l.d !== dt);
      if (st) D.forEach((_d, i) => LOG.push({ d: dt, i, s: st }));
      save(); recompute(); all(true);
    };
    const allpBtn = $("allp"); if (allpBtn) allpBtn.onclick = () => bulkDay("P");
    const allaBtn = $("alla"); if (allaBtn) allaBtn.onclick = () => bulkDay("A");
    const allcBtn = $("allc"); if (allcBtn) allcBtn.onclick = () => bulkDay("");

    let lc: any[] = [];
    function logAnalysis() {
      lc.forEach(c => c.destroy()); lc = [];
      const ln = css("--att-line"), days = [...new Set(LOG.map((l: any) => l.d))].sort() as string[];
      const P = LOG.filter((l: any) => l.s === "P").length, A = LOG.length - P;
      const dayA = (d: string) => LOG.some((l: any) => l.d === d && l.s === "A");
      let streak = 0; for (let k = days.length - 1; k >= 0; k--) { if (dayA(days[k])) break; streak++; }
      const lk = $("lk");
      if (lk) lk.innerHTML = [["Days logged", days.length], ["Present marks", P], ["Absent marks", A], ["No-absence streak", streak + " day(s)"]].map(x => `<div class="att-card att-kpi"><div class="att-l">${x[0]}</div><div class="att-v">${x[1]}</div></div>`).join("");
      const logempty = $("logempty");
      if (logempty) logempty.style.display = days.length ? "none" : "block";

      let bp = BASE.reduce((a: number, b: any) => a + b.p, 0), bh = BASE.reduce((a: number, b: any) => a + b.held, 0);
      const tr = [{ x: "Start", y: bh ? bp / bh * 100 : 0 }];
      days.forEach(d => { LOG.filter((l: any) => l.d === d).forEach((l: any) => { bh++; if (l.s === "P") bp++; }); tr.push({ x: d.slice(5), y: bp / bh * 100 }); });
      const c9 = $("c9") as HTMLCanvasElement;
      if (c9) lc.push(new Chart(c9, { type: "line", data: { labels: tr.map(t => t.x), datasets: [{ label: "Combined %", data: tr.map(t => +t.y.toFixed(1)), borderColor: css("--att-acc"), backgroundColor: "rgba(79,124,255,.15)", fill: true, tension: .3 }, { label: "Required", data: tr.map(() => req()), borderColor: css("--att-bad"), borderDash: [5, 4], pointRadius: 0 }] }, options: { maintainAspectRatio: false, scales: { x: { grid: { color: ln } }, y: { grid: { color: ln }, suggestedMin: 50, max: 100 } } } }));

      const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], wp = Array(7).fill(0), wa = Array(7).fill(0);
      LOG.forEach((l: any) => { const g = new Date(l.d + "T00:00:00").getDay(); l.s === "P" ? wp[g]++ : wa[g]++; });
      const c10 = $("c10") as HTMLCanvasElement;
      if (c10) lc.push(new Chart(c10, { type: "bar", data: { labels: wd, datasets: [{ label: "Present", data: wp, backgroundColor: css("--att-ok"), borderRadius: 4 }, { label: "Absent", data: wa, backgroundColor: css("--att-bad"), borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true, grid: { color: ln } }, y: { stacked: true, grid: { color: ln }, beginAtZero: true } } } }));

      const end = new Date(); end.setHours(0, 0, 0, 0); const st = new Date(end); st.setDate(st.getDate() - 34);
      let h = wd.map(x => `<div style="background:none">${x}</div>`).join("") + Array(st.getDay()).fill('<div style="background:none"></div>').join("");
      for (let k = 0; k < 35; k++) {
        const t = new Date(st); t.setDate(st.getDate() + k); const d = ymd(t), m = LOG.filter((l: any) => l.d === d), ab = m.filter((l: any) => l.s === "A").length, pr = m.length - ab;
        const c = !m.length ? "" : ab === 0 ? css("--att-ok") : pr === 0 ? css("--att-bad") : css("--att-warn");
        h += `<div title="${d}: ${pr} present, ${ab} absent" style="${c ? "background:" + c + ";color:#fff" : ""}">${t.getDate()}</div>`;
      }
      const heat = $("heat");
      if (heat) heat.innerHTML = h;

      const rec = [...LOG].sort((a: any, b: any) => b.d.localeCompare(a.d)).slice(0, 25);
      const logt = $("logt");
      if (logt) {
        logt.innerHTML = "<tr><th>Date</th><th>Course</th><th>Status</th><th></th></tr>" + (rec.length ? rec.map((l: any) => `<tr><td>${l.d}</td><td>${short(D[l.i])}</td><td><span class="att-pill" style="background:${l.s === "P" ? css("--att-ok") : css("--att-bad")}">${l.s === "P" ? "Present" : "Absent"}</span></td><td><button class="att-b" data-d="${l.d}" data-i="${l.i}">Delete</button></td></tr>`).join("") : "<tr><td colspan=4>Nothing yet</td></tr>");
        logt.querySelectorAll(".att-b").forEach((b: any) => b.onclick = () => { LOG = LOG.filter((l: any) => !(l.d === b.dataset.d && l.i == +b.dataset.i)); save(); recompute(); all(true); });
      }

      const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const ms = ymd(mon);
      const wk = LOG.filter((l: any) => l.d >= ms), wP = wk.filter((l: any) => l.s === "P").length;
      const insEl = $("ins");
      if (insEl) insEl.insertAdjacentHTML("beforeend", `<li>This week so far: <b>${wP}</b> present, <b>${wk.length - wP}</b> absent marked.</li>`);
    }

    const bmEl = $("bm"); const bnEl = $("bn");
    if (bmEl) bmEl.oninput = () => extra();
    if (bnEl) bnEl.oninput = () => extra();

    function all(keepEdit?: boolean) { kpis(); table(); draw(); planner(); extra(); logAnalysis(); sim(); daily(); if (!keepEdit) editTbl(); }

    const simcEl = $("simc");
    if (simcEl) simcEl.innerHTML = D.map((d, i) => `<option value="${i}">${d.code} – ${short(d)}</option>`).join("");

    ["req", "metric", "tgt"].forEach(i => { const el = $(i); if (el) el.oninput = () => all(); });
    const goBtn = $("go"); if (goBtn) goBtn.onclick = () => sim();

    all();
  }, []);

  useEffect(() => {
    // Load Chart.js from CDN if not already loaded
    if (typeof (window as any).Chart !== "undefined") {
      initDashboard();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    script.onload = () => initDashboard();
    document.head.appendChild(script);

    return () => {
      initializedRef.current = false;
    };
  }, [initDashboard]);

  return (
    <div className="attendance-page" ref={wrapRef}>
      <style>{`
        .attendance-page {
          --att-bg: var(--bg-1, #f4f6fb);
          --att-card: var(--bg-2, #fff);
          --att-text: var(--text-1, #1c2333);
          --att-muted: var(--text-4, #6b7488);
          --att-line: var(--border, #e4e8f0);
          --att-ok: #16a34a;
          --att-warn: #f59e0b;
          --att-bad: #dc2626;
          --att-acc: #4f7cff;
          padding: 20px 16px 40px;
          max-width: 1150px;
          margin: 0 auto;
          color: var(--att-text);
        }
        .attendance-page h1 { margin: 0 0 4px; font-size: 26px; }
        .attendance-page .att-sub { color: var(--att-muted); margin-bottom: 18px; font-size: 14px; }
        .attendance-page .att-grid { display: grid; gap: 14px; }
        .attendance-page .att-kpis { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 14px; }
        .attendance-page .att-card { background: var(--att-card); border: 1px solid var(--att-line); border-radius: 14px; padding: 16px; }
        .attendance-page .att-kpi .att-l { color: var(--att-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
        .attendance-page .att-kpi .att-v { font-size: 30px; font-weight: 700; margin-top: 4px; }
        .attendance-page .att-two { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-bottom: 14px; }
        .attendance-page h2 { font-size: 16px; margin: 0 0 12px; }
        .attendance-page .att-ch { position: relative; height: 290px; }
        .attendance-page .att-tools { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
        .attendance-page .att-tools label { font-size: 13px; color: var(--att-muted); }
        .attendance-page input[type=number],
        .attendance-page select { background: var(--att-bg); color: var(--att-text); border: 1px solid var(--att-line); border-radius: 8px; padding: 6px 8px; font-size: 14px; }
        .attendance-page input[type=number] { width: 70px; }
        .attendance-page input[type=date] { background: var(--att-bg); color: var(--att-text); border: 1px solid var(--att-line); border-radius: 8px; padding: 6px 8px; font-size: 14px; }
        .attendance-page .att-tblw { overflow-x: auto; }
        .attendance-page table { border-collapse: collapse; width: 100%; font-size: 14px; min-width: 760px; }
        .attendance-page th,
        .attendance-page td { padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--att-line); }
        .attendance-page th { color: var(--att-muted); font-size: 12px; text-transform: uppercase; cursor: pointer; white-space: nowrap; }
        .attendance-page .att-bar { height: 8px; background: var(--att-line); border-radius: 6px; overflow: hidden; min-width: 80px; }
        .attendance-page .att-bar i { display: block; height: 100%; }
        .attendance-page .att-pill { padding: 2px 9px; border-radius: 99px; font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; }
        .attendance-page .att-note { font-size: 13px; color: var(--att-muted); margin-top: 8px; }
        .attendance-page .att-sim { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 14px; }
        .attendance-page .att-mrow { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid var(--att-line); font-size: 14px; }
        .attendance-page .att-mb { display: flex; gap: 6px; }
        .attendance-page .att-b { background: var(--att-bg); color: var(--att-text); border: 1px solid var(--att-line); padding: 6px 10px; font-size: 13px; border-radius: 8px; cursor: pointer; }
        .attendance-page .att-b.on.p { background: var(--att-ok); color: #fff; border-color: var(--att-ok); }
        .attendance-page .att-b.on.a { background: var(--att-bad); color: #fff; border-color: var(--att-bad); }
        .attendance-page .att-sec { background: var(--att-bg); color: var(--att-text); border: 1px solid var(--att-line); }
        .attendance-page .att-heat { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; max-width: 420px; }
        .attendance-page .att-heat div { aspect-ratio: 1; border-radius: 6px; background: var(--att-line); font-size: 10px; display: flex; align-items: center; justify-content: center; color: var(--att-muted); }
        .attendance-page button { background: var(--att-acc); color: #fff; border: 0; border-radius: 8px; padding: 7px 12px; cursor: pointer; font-size: 14px; }
        .attendance-page button.att-sec { background: var(--att-bg); color: var(--att-text); border: 1px solid var(--att-line); }
      `}</style>

      <h1>📊 Semester Attendance</h1>
      <div className="att-sub">Interactive dashboard of your course-wise attendance. Set your required minimum below.</div>

      <div className="att-card att-tools">
        <label>Required attendance % <input id="req" type="number" defaultValue={75} min={1} max={100} /></label>
        <label>Chart metric
          <select id="metric">
            <option value="pp">My present % (in held classes)</option>
            <option value="op">Overall % (of total planned)</option>
          </select>
        </label>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>📅 Daily update – mark today's attendance</h2>
        <div className="att-tools">
          <label>Date <input type="date" id="day" /></label>
          <button className="att-sec" id="allp">All present</button>
          <button className="att-sec" id="alla">All absent</button>
          <button className="att-sec" id="allc">Clear day</button>
        </div>
        <div id="mark"></div>
        <div className="att-note">Tap Present or Absent for each course you had class in. Skip courses with no class that day. Changing a mark replaces the old one, and every chart below updates instantly.</div>
      </div>

      <div className="att-grid att-kpis" id="kpis"></div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>💡 Auto insights</h2>
        <ul id="ins" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}></ul>
        <h2 style={{ marginTop: 16 }}>🔥 Focus priority (attend these first)</h2>
        <div className="att-tblw"><table id="prio" style={{ minWidth: 560 }}></table></div>
      </div>

      <div className="att-grid att-two">
        <div className="att-card"><h2>Present % by course</h2><div className="att-ch"><canvas id="c1"></canvas></div></div>
        <div className="att-card"><h2>Present vs absent classes</h2><div className="att-ch"><canvas id="c2"></canvas></div></div>
        <div className="att-card"><h2>Course health radar</h2><div className="att-ch"><canvas id="c3"></canvas></div></div>
        <div className="att-card"><h2>Semester progress (held vs remaining)</h2><div className="att-ch"><canvas id="c4"></canvas></div></div>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>Course details <span style={{ fontWeight: 400, color: "var(--att-muted)", fontSize: 12 }}>(click a header to sort)</span></h2>
        <div className="att-tblw"><table id="tbl"></table></div>
        <div className="att-note">"Can skip" = classes you can still miss while staying at the required % of held classes. "Need" = consecutive classes you must attend to recover.</div>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>📈 Daily log analysis</h2>
        <div className="att-grid att-kpis" id="lk" style={{ marginBottom: 10 }}></div>
        <div id="logempty" className="att-note" style={{ display: "none" }}>No daily marks yet. Use the Daily update card above and these charts will fill in.</div>
        <div className="att-grid att-two">
          <div><h2 style={{ fontSize: 14 }}>Combined attendance % over time</h2><div className="att-ch" style={{ height: 240 }}><canvas id="c9"></canvas></div></div>
          <div><h2 style={{ fontSize: 14 }}>Present / absent by weekday</h2><div className="att-ch" style={{ height: 240 }}><canvas id="c10"></canvas></div></div>
        </div>
        <h2 style={{ fontSize: 14, marginTop: 14 }}>Last 5 weeks calendar <span style={{ fontWeight: 400, color: "var(--att-muted)" }}>(green all present · red all absent · amber mixed)</span></h2>
        <div className="att-heat" id="heat"></div>
        <h2 style={{ fontSize: 14, marginTop: 14 }}>Recent entries</h2>
        <div className="att-tblw"><table id="logt" style={{ minWidth: 420 }}></table></div>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>🔮 Bulk scenario – every course at once</h2>
        <div className="att-tools">
          <label>If I</label>
          <select id="bm"><option value="attend">attend</option><option value="miss">miss</option></select>
          <label>the next <input id="bn" type="number" defaultValue={5} min={0} max={60} /> classes in every course</label>
        </div>
        <div className="att-tblw"><table id="bulk" style={{ minWidth: 560 }}></table></div>
        <div className="att-ch" style={{ height: 260, marginTop: 14 }}><canvas id="c6"></canvas></div>
      </div>

      <div className="att-grid att-two">
        <div className="att-card"><h2>Where your absences come from</h2><div className="att-ch"><canvas id="c7"></canvas></div></div>
        <div className="att-card"><h2>Course progress vs attendance</h2><div className="att-ch"><canvas id="c8"></canvas></div><div className="att-note">Each dot is a course: x = % of planned classes counted so far, y = present %.</div></div>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>✏️ Edit data &amp; export</h2>
        <div className="att-note" style={{ margin: "0 0 10px" }}>Baseline numbers from your college portal. Your daily marks are added on top. When you refresh from the portal, update these and press "Clear daily log".</div>
        <div className="att-tblw"><table id="edit" style={{ minWidth: 560 }}></table></div>
        <div className="att-sim" style={{ marginTop: 12 }}>
          <button id="rst">Reset to original</button>
          <button id="clr" className="att-sec">Clear daily log</button>
          <button id="csv">Download CSV</button>
          <button id="bk" className="att-sec">Backup (JSON)</button>
          <label className="att-sec" style={{ cursor: "pointer", background: "var(--att-bg)", border: "1px solid var(--att-line)", borderRadius: 8, padding: "7px 12px", fontSize: 14 }}>Restore backup<input id="rs" type="file" accept=".json" style={{ display: "none" }} /></label>
        </div>
      </div>

      <div className="att-card" style={{ marginBottom: 14 }}>
        <h2>🚀 Classes needed to reach target</h2>
        <div className="att-tools">
          <label>Target attendance % <input id="tgt" type="number" defaultValue={75} min={1} max={99} /></label>
          <span className="att-note" style={{ margin: 0 }}>Shows how many classes in a row you must attend (with no more absences) to reach the target.</span>
        </div>
        <div className="att-tblw"><table id="plan"></table></div>
        <div className="att-ch" style={{ height: 260, marginTop: 14 }}><canvas id="c5"></canvas></div>
      </div>

      <div className="att-card">
        <h2>🎯 What-if simulator</h2>
        <div className="att-sim">
          <select id="simc"></select>
          <label>I attend <input id="att" type="number" defaultValue={5} min={0} /></label> next class(es),
          <label>and miss <input id="mis" type="number" defaultValue={0} min={0} /></label>
          <button id="go">Calculate</button>
        </div>
        <div id="simout" className="att-note" style={{ fontSize: 15, color: "var(--att-text)" }}></div>
      </div>
    </div>
  );
}
