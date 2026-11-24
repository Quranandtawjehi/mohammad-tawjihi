/* ===========================================================
   صفحة المواد — محمد ونورس
   =========================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const L = "أبجد";

  const USERS = {
    mohammad: { name: "محمد", full: "محمد عبد السلام زيادة", img: "img/mohammad.jpg" },
    nawras: { name: "نورس", full: "نورس العنانزة", img: "img/nawras.jpg" },
  };
  const SUBJECTS = [
    { id: "hi", title: "تاريخ الأردن", icon: "🏛️", color: "#db2777", data: "data/hi.json" },
    { id: "is", title: "التربية الإسلامية", icon: "🕌", color: "#059669", data: "data/is.json" },
    { id: "ar", title: "اللغة العربية", icon: "✍️", color: "#d97706", data: "data/ar.json" },
    { id: "ma", title: "الرياضيات", icon: "📐", color: "#3b82f6", data: null },
  ];
  const EXAM = new Date("2027-07-21T08:00:00+03:00");
  const NTFY = "https://ntfy.sh", CH = "mawad-mz-nw-7f3a91c2e4";
  const DUAS = [
    "اللهم لا سهل إلا ما جعلته سهلًا، وأنت تجعل الحزن إذا شئت سهلًا 🤲",
    "ربِّ اشرح لي صدري، ويسّر لي أمري، واحلل عقدة من لساني",
    "اللهم إني أسألك فهم النبيين وحفظ المرسلين",
    "ربِّ زدني علمًا وألحقني بالصالحين",
    "اللهم افتح علينا فتوح العارفين، وارزقنا علمًا نافعًا",
    "اللهم ذكّرنا ما نسينا، وعلّمنا ما جهلنا",
    "اللهم إني استودعتك ما قرأت وما حفظت، فردّه إليّ عند حاجتي إليه",
  ];
  const LEVELS = [[0, "مبتدئ", "🌱"], [300, "مجتهد", "📘"], [1000, "متقدّم", "🚀"], [2500, "متميّز", "💎"], [5000, "عبقري", "🧠"], [9000, "أسطورة", "👑"]];

  let user = null, S = null;
  const data = {};

  /* ---------------- الحالة ---------------- */
  const key = () => "mawad_" + user;
  function load() {
    try { S = JSON.parse(ls.get(key())) || {}; } catch { S = {}; }
    S.pts = S.pts || 0; S.ans = S.ans || 0; S.ok = S.ok || 0; S.mist = S.mist || {}; S.favs = S.favs || {};
    S.exams = S.exams || []; S.done = S.done || {}; S.seen = S.seen || {};
  }
  const save = () => ls.set(key(), JSON.stringify(S));
  const level = (p) => { let l = LEVELS[0], n = null; for (const x of LEVELS) { if (p >= x[0]) l = x; else { n = x; break; } } return { l, n }; };

  /* ---------------- مؤثرات ---------------- */
  function toast(m) { const t = document.createElement("div"); t.className = "toast"; t.innerHTML = m; $("#toasts").appendChild(t); setTimeout(() => t.classList.add("out"), 3000); setTimeout(() => t.remove(), 3600); }
  let actx;
  function beep(ok = true) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [660, 880] : [300, 220];
      notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = ok ? "sine" : "triangle"; o.frequency.value = f; const t = actx.currentTime + i * 0.09; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.32); });
    } catch {}
  }
  function confetti(n = 150) {
    const cv = document.createElement("canvas"); cv.className = "confetti"; document.body.appendChild(cv);
    const c = cv.getContext("2d"), dpr = devicePixelRatio || 1, W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const cols = ["#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#fff"];
    const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.6, vx: (Math.random() - 0.5) * 26 * dpr, vy: -(12 + Math.random() * 22) * dpr, s: (5 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * 6) | 0] }));
    let f = 0; (function tick() { c.clearRect(0, 0, W, H); ps.forEach((p) => { p.vy += 0.55 * dpr; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.max(0, 1 - f / 170); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); }); if (++f < 180) requestAnimationFrame(tick); else cv.remove(); })();
  }
  (function stars() {
    const cv = $("#stars"), c = cv.getContext("2d"); let W, H, pts;
    const rs = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; pts = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.3, v: Math.random() * 0.25 + 0.05, a: Math.random() * 6 })); };
    rs(); addEventListener("resize", rs);
    (function t() { c.clearRect(0, 0, W, H); pts.forEach((p) => { p.y -= p.v; p.a += 0.02; if (p.y < 0) { p.y = H; p.x = Math.random() * W; } c.globalAlpha = 0.35 + Math.sin(p.a) * 0.3; c.fillStyle = "#e9d5ff"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }); requestAnimationFrame(t); })();
  })();

  /* ---------------- النقاط ---------------- */
  function addPts(n) {
    const before = level(S.pts).l; S.pts = Math.max(0, S.pts + n); save();
    const p = $("#ptsPill"); p.textContent = "⭐ " + S.pts; p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump");
    const after = level(S.pts).l;
    if (after !== before && n > 0) { confetti(220); toast(`🎉 مبروك! وصلت مستوى <b>${after[2]} ${after[1]}</b>`); }
    renderMe();
  }
  function renderMe() {
    const u = USERS[user], lv = level(S.pts).l;
    $("#meImg").src = u.img; $("#meName").textContent = u.name; $("#meLvl").textContent = `${lv[2]} ${lv[1]}`;
    $("#ptsPill").textContent = "⭐ " + S.pts;
  }

  /* ---------------- تسجيل الدخول ---------------- */
  const norm = (s) => String(s || "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/^\s*سوره\s+/, "").replace(/\s+/g, "").replace(/^ال/, "").trim();
  let pending = null, ay = null, tries = 0;
  function newAyah() {
    let n; do { n = window.AYAT[(Math.random() * window.AYAT.length) | 0]; } while (ay && n === ay && window.AYAT.length > 1);
    ay = n; tries = 0; $("#vAyah").textContent = ay[0]; $("#vInput").value = ""; $("#vErr").textContent = "";
  }
  function openVerify(u) {
    pending = u; const x = USERS[u];
    $("#vImg").src = x.img; $("#vHi").textContent = `أهلًا يا ${x.name} 👋`;
    newAyah(); $("#verify").classList.add("on"); setTimeout(() => $("#vInput").focus(), 350);
  }
  $$(".user").forEach((b) => b.addEventListener("click", () => openVerify(b.dataset.u)));
  $("#vClose").onclick = () => $("#verify").classList.remove("on");
  $("#vNew").onclick = newAyah;
  $("#vForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = norm($("#vInput").value); if (!v) return;
    const ok = [ay[1], ...(ay[2] || [])].some((n) => norm(n) === v);
    if (ok) {
      beep(true); $("#verify").classList.add("unlocking");
      setTimeout(() => { $("#verify").classList.remove("on", "unlocking"); enter(pending); }, 800);
    } else {
      beep(false); tries++;
      const b = $("#vbox"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      if (tries >= 3) { $("#vErr").textContent = `❌ الجواب: سورة ${ay[1]} — جرّب هالآية`; setTimeout(newAyah, 1800); }
      else $("#vErr").textContent = `❌ مش صح، حاول مرة ثانية (${3 - tries} محاولات)`;
      $("#vInput").select();
    }
  });
  function enter(u) {
    user = u; load(); ls.set("mawad_last", u);
    $("#login").classList.remove("on"); $("#app").classList.add("on");
    renderMe(); go("home");
    confetti(90); toast(`🌙 أهلًا يا ${USERS[u].name}، الله يوفقك`);
    pullChallenge();
  }
  $("#logoutBtn").onclick = () => { $("#app").classList.remove("on"); $("#login").classList.add("on"); user = null; };
  $("#themeBtn").onclick = () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark"; ls.set("mawad_theme", r.dataset.theme); };
  document.documentElement.dataset.theme = ls.get("mawad_theme") || "dark";
  document.documentElement.style.setProperty("--fs", ls.get("mawad_fs") || 1);

  /* ---------------- التنقل ---------------- */
  $$("#bnav button").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  function go(v, arg) {
    stopTimer();
    $$("#bnav button").forEach((b) => b.classList.toggle("on", b.dataset.go === v));
    const views = { home, subject, review, examSetup, mistakes, favs, challenge, badges };
    $("#view").innerHTML = ""; $("#view").className = "view-in"; void $("#view").offsetWidth;
    (views[v] || home)(arg); scrollTo({ top: 0 });
  }

  /* ---------------- البيانات ---------------- */
  async function getData(id) {
    if (data[id]) return data[id];
    const s = SUBJECTS.find((x) => x.id === id); if (!s.data) return null;
    const d = await (await fetch(s.data, { cache: "no-cache" })).json();
    // توحيد الأسئلة وتجهيز معرفات
    d.pool = []; d.byUnit = {};
    const unitOf = (p) => (d.units.find((u) => p >= u.from && p <= u.to) || { n: 0 }).n;
    Object.entries(d.pq || {}).forEach(([p, v]) => (v.qs || []).forEach((q, i) => { const o = Object.assign({ id: `${id}:p${p}:${i}`, u: unitOf(+p), p: +p, s: id }, q); d.pool.push(o); }));
    (d.bank || []).forEach((q, i) => d.pool.push(Object.assign({ id: `${id}:b${i}`, s: id }, q)));
    d.pool.forEach((q) => { (d.byUnit[q.u] = d.byUnit[q.u] || []).push(q); });
    data[id] = d; return d;
  }

  /* ---------------- عرض سؤال اختيار من متعدد ---------------- */
  function qCard(q, num, { onAnswer, reveal = true, picked = null } = {}) {
    const el = document.createElement("div"); el.className = "q";
    const order = shuffle(q.o.map((_, i) => i));
    el.innerHTML = `<div class="qtop"><span class="qn">${num}</span><button class="fav ${S.favs[q.id] ? "on" : ""}" title="مفضلة">⭐</button></div>
      <div class="qt">${esc(q.q)}</div>
      <div class="opts">${order.map((i, k) => `<button class="opt" data-i="${i}"><span>${L[k]}</span>${esc(q.o[i])}</button>`).join("")}</div>
      <div class="expl">${q.e ? "💡 " + esc(q.e) : `✅ الجواب الصحيح: <b>${esc(q.o[q.a])}</b>`}</div>`;
    $(".fav", el).onclick = () => { if (S.favs[q.id]) delete S.favs[q.id]; else S.favs[q.id] = q; save(); $(".fav", el).classList.toggle("on", !!S.favs[q.id]); toast(S.favs[q.id] ? "⭐ انضاف للمفضلة" : "انشال من المفضلة"); };
    $$(".opt", el).forEach((b) => b.onclick = () => {
      if (!reveal) { $$(".opt", el).forEach((x) => x.classList.remove("pick")); b.classList.add("pick"); onAnswer && onAnswer(+b.dataset.i); return; }
      if (el.classList.contains("done")) return;
      el.classList.add("done"); const i = +b.dataset.i, ok = i === q.a;
      $$(".opt", el).forEach((x) => { if (+x.dataset.i === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      record(q, ok); beep(ok);
      onAnswer && onAnswer(i, ok);
    });
    if (picked != null) { const b = $(`.opt[data-i="${picked}"]`, el); b && b.classList.add("pick"); }
    return el;
  }
  function record(q, ok) {
    S.ans++; if (ok) { S.ok++; delete S.mist[q.id]; addPts(10); } else { S.mist[q.id] = q; save(); }
    S.seen[q.id] = ok ? 1 : 0; save(); checkBadges();
  }

  /* ---------------- الرئيسية ---------------- */
  function home() {
    const u = USERS[user], lv = level(S.pts);
    const acc = S.ans ? Math.round((S.ok / S.ans) * 100) : 0;
    $("#view").innerHTML = `
      <div class="card hero"><img src="${u.img}" alt=""><div>
        <h2>أهلًا بكم يا <span class="grad">محمد ونورس</span> في صفحة المواد 🌙</h2>
        <div class="muted">أهلًا يا ${u.name}، اختر ما تريد 👇</div></div></div>
      <div class="card mt"><div class="center muted small" style="font-weight:800">⏳ باقي على امتحانات التوجيهي</div>
        <div class="cd" id="cd"><div><b data-k="d">0</b><span>يوم</span></div><div><b data-k="h">0</b><span>ساعة</span></div><div><b data-k="m">0</b><span>دقيقة</span></div><div><b data-k="s">0</b><span>ثانية</span></div></div>
        <div class="dua" id="dua">${DUAS[(Math.random() * DUAS.length) | 0]}</div></div>
      <div class="sec">📚 المواد</div>
      <div class="subjects">${SUBJECTS.map((s, i) => `<button class="subj" style="--c:${s.color};animation-delay:${i * 0.08}s" data-s="${s.id}">
          ${s.data ? "" : '<span class="soon">قريبًا</span>'}<div class="ico">${s.icon}</div><h3>${s.title}</h3>
          <div class="meta" id="m-${s.id}">${s.data ? "جارِ التحميل…" : "بانتظار الكتاب"}</div><div class="bar"><i id="b-${s.id}"></i></div></button>`).join("")}</div>
      <div class="sec">📊 إحصائياتي</div>
      <div class="stats"><div class="stat"><b>${S.ans}</b><span>سؤال حليته</span></div><div class="stat"><b>${acc}%</b><span>نسبة الصح</span></div>
        <div class="stat"><b>${S.exams.length}</b><span>امتحان</span></div><div class="stat"><b>${Object.keys(S.mist).length}</b><span>بدفتر أخطائي</span></div></div>
      <div class="card mt lvl"><span class="e">${lv.l[2]}</span><div class="grow"><b>مستواك: ${lv.l[1]}</b>
        <div class="small muted">${lv.n ? `باقي ${lv.n[0] - S.pts} نقطة لمستوى ${lv.n[2]} ${lv.n[1]}` : "وصلت أعلى مستوى 👑"}</div>
        <div class="bar"><i style="width:${lv.n ? ((S.pts - lv.l[0]) / (lv.n[0] - lv.l[0])) * 100 : 100}%"></i></div></div></div>
      <div class="card mt"><b>🔠 حجم خط الأسئلة</b><div class="fsz mt">${[0.9, 1, 1.15, 1.3].map((f) => `<button class="chip ${+(ls.get("mawad_fs") || 1) === f ? "on" : ""}" data-fs="${f}">${f === 1 ? "عادي" : f < 1 ? "صغير" : f < 1.2 ? "كبير" : "كبير جدًا"}</button>`).join("")}</div></div>`;
    $$("[data-s]").forEach((b) => b.onclick = () => { const s = SUBJECTS.find((x) => x.id === b.dataset.s); if (!s.data) return toast("⏳ كتاب هالمادة رح ينضاف قريبًا"); go("subject", s.id); });
    $$("[data-fs]").forEach((b) => b.onclick = () => { ls.set("mawad_fs", b.dataset.fs); document.documentElement.style.setProperty("--fs", b.dataset.fs); home(); });
    countdown();
    SUBJECTS.filter((s) => s.data).forEach(async (s) => {
      try { const d = await getData(s.id); const done = (S.done[s.id] || []).length, tot = d.pages;
        const m = $("#m-" + s.id); if (m) m.textContent = `${d.pool.length} سؤال · خلّصت ${done} صفحة`;
        const b = $("#b-" + s.id); if (b) requestAnimationFrame(() => (b.style.width = (done / tot) * 100 + "%"));
      } catch { const m = $("#m-" + s.id); if (m) m.textContent = "تعذّر التحميل"; }
    });
  }
  let cdT;
  function countdown() {
    clearInterval(cdT);
    const up = () => { const el = $("#cd"); if (!el) return clearInterval(cdT); let ms = Math.max(0, EXAM - Date.now()); const d = Math.floor(ms / 864e5); ms -= d * 864e5; const h = Math.floor(ms / 36e5); ms -= h * 36e5; const m = Math.floor(ms / 6e4); const s = Math.floor((ms - m * 6e4) / 1e3);
      $('[data-k="d"]', el).textContent = d; $('[data-k="h"]', el).textContent = h; $('[data-k="m"]', el).textContent = m; $('[data-k="s"]', el).textContent = s; };
    up(); cdT = setInterval(up, 1000);
  }

  /* ---------------- صفحة المادة ---------------- */
  async function subject(id) {
    const s = SUBJECTS.find((x) => x.id === id); const d = await getData(id);
    const done = S.done[id] || [];
    const mastery = (u) => { const qs = d.byUnit[u] || []; if (!qs.length) return 0; return Math.round((qs.filter((q) => S.seen[q.id] === 1).length / qs.length) * 100); };
    $("#view").innerHTML = `<button class="back" id="bk">→ رجوع للمواد</button>
      <div class="shead" style="--c:${s.color}"><div class="ico">${s.icon}</div><div><h2>${s.title}</h2><div class="muted small">${d.pages} صفحة · ${d.pool.length} سؤال · ${d.units.length} وحدات</div></div></div>
      <div class="modes">
        <button class="mode big" data-m="exam"><div class="e">🎯</div><b>ابدأ امتحاني</b><small>اختار عدد الأسئلة، وأسئلة عشوائية من أول المادة لآخرها</small></button>
        <button class="mode" data-m="book"><div class="e">📖</div><b>الكتاب صفحة صفحة</b><small>كل صفحة وأسئلتها</small></button>
        <button class="mode" data-m="review"><div class="e">📝</div><b>أسئلة الدروس مع حلها</b><small>التقويم والمراجعة لكل درس</small></button>
        <button class="mode" data-m="quick"><div class="e">⚡</div><b>مراجعة سريعة</b><small>10 أسئلة خاطفة</small></button>
        <button class="mode" data-m="mist"><div class="e">❌</div><b>امتحان من أخطائي</b><small>${d.pool.filter((q) => S.mist[q.id]).length} سؤال غلطت فيه</small></button>
      </div>
      <div class="sec">🧩 الوحدات ونسبة إتقانك</div>
      <div class="units">${d.units.map((u) => `<div class="unit"><div class="grow"><b>الوحدة ${u.n}: ${esc(u.t)}</b><div class="small muted">صفحات ${u.from}–${u.to} · ${(d.byUnit[u.n] || []).length} سؤال · إتقانك ${mastery(u.n)}%</div>
        <div class="bar" style="--c:${s.color}"><i style="width:${mastery(u.n)}%"></i></div></div>
        <div class="row"><button class="btn sm ghost" data-ub="${u.from}">📖</button><button class="btn sm" data-uq="${u.n}">🎯 أسئلة الوحدة</button></div></div>`).join("")}</div>`;
    $("#bk").onclick = () => go("home");
    $$("[data-m]").forEach((b) => b.onclick = () => {
      const m = b.dataset.m;
      if (m === "exam") go("examSetup", { id });
      if (m === "book") openReader(id);
      if (m === "review") go("review", id);
      if (m === "quick") startExam(id, shuffle(d.pool).slice(0, 10), { title: "⚡ مراجعة سريعة", minutes: 0 });
      if (m === "mist") { const qs = d.pool.filter((q) => S.mist[q.id]); if (!qs.length) return toast("👏 ما عندك أخطاء بهالمادة"); startExam(id, shuffle(qs), { title: "❌ امتحان من أخطائي", minutes: 0 }); }
    });
    $$("[data-ub]").forEach((b) => b.onclick = () => openReader(id, +b.dataset.ub));
    $$("[data-uq]").forEach((b) => b.onclick = () => go("examSetup", { id, unit: +b.dataset.uq }));
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".bar i").forEach((i) => { const w = i.style.width; i.style.width = "0"; requestAnimationFrame(() => (i.style.width = w)); })));
  }

  /* ---------------- قارئ الكتاب ---------------- */
  let R = null;
  function openReader(id, page) {
    getData(id).then((d) => {
      R = { id, d, page: page || +(ls.get(`mawad_pg_${user}_${id}`)) || d.start || 1, list: false };
      let el = $("#reader");
      if (!el) {
        el = document.createElement("div"); el.id = "reader"; el.className = "reader";
        el.innerHTML = `<div class="rtop"><button class="btn sm ghost" id="rX">✕</button><div class="grow"><b id="rT"></b><div class="small muted" id="rS"></div></div><button class="btn sm ghost" id="rL">🗂️ الصفحات</button></div>
          <div class="rbody" id="rB"></div>
          <div class="rnav"><button class="btn sm ghost" id="rP">➡️ السابقة</button><div class="row" style="gap:6px"><span class="small muted">صفحة</span><input id="rI" type="number" inputmode="numeric"></div><button class="btn sm ghost" id="rN">التالية ⬅️</button></div>`;
        document.body.appendChild(el);
        $("#rX").onclick = () => { el.classList.remove("on"); document.body.style.overflow = ""; if ($("#view .shead")) subject(R.id); };
        $("#rL").onclick = () => { R.list = !R.list; drawR(); };
        $("#rP").onclick = () => goP(R.page - 1); $("#rN").onclick = () => goP(R.page + 1);
        $("#rI").onchange = (e) => goP(+e.target.value || 1);
      }
      el.classList.add("on"); document.body.style.overflow = "hidden"; drawR();
    });
  }
  function goP(p) { R.page = Math.min(R.d.pages, Math.max(1, p)); R.list = false; ls.set(`mawad_pg_${user}_${R.id}`, R.page); drawR(); $("#rB").scrollTop = 0; }
  function drawR() {
    const { d, id } = R, s = SUBJECTS.find((x) => x.id === id), done = new Set(S.done[id] || []);
    $("#rT").textContent = `${s.icon} ${s.title}`; $("#rS").textContent = R.list ? "كل الصفحات" : `صفحة ${R.page} من ${d.pages}`;
    $("#rI").value = R.page; $("#rP").disabled = R.page <= 1; $("#rN").disabled = R.page >= d.pages;
    const B = $("#rB");
    if (R.list) {
      let h = '<div class="pgrid">';
      for (let p = 1; p <= d.pages; p++) {
        const u = d.units.find((x) => x.from === p); if (u) h += `<div class="pcell unit-h">🧩 الوحدة ${u.n}: ${esc(u.t)}</div>`;
        const pq = d.pq[p];
        h += `<button class="pcell ${done.has(p) ? "done" : ""}" data-p="${p}"><b>${p}</b><span>${pq ? esc(pq.h.slice(0, 44)) : "—"}</span>${pq ? `<i>📝 ${pq.qs.length} سؤال</i>` : ""}</button>`;
      }
      B.innerHTML = h + "</div>"; $$(".pcell[data-p]", B).forEach((c) => c.onclick = () => goP(+c.dataset.p)); return;
    }
    const pq = d.pq[R.page], unitEnd = d.units.find((u) => u.to === R.page);
    B.innerHTML = `${pq ? `<div class="ph">${esc(pq.h)}</div>` : ""}<div class="pimg"><img src="${d.img}${R.page}.jpg" alt=""><div class="pload">⏳</div></div>
      <div id="rQ" class="mt"></div>
      ${unitEnd ? `<div class="card mt center"><b>🏁 نهاية الوحدة ${unitEnd.n}: ${esc(unitEnd.t)}</b><div class="small muted">${(d.byUnit[unitEnd.n] || []).length} سؤال على الوحدة</div><button class="btn block mt" id="uQ">🎯 أسئلة الوحدة كاملة</button></div>` : ""}
      <button class="btn block mt ${done.has(R.page) ? "ghost" : "green"}" id="mD">${done.has(R.page) ? "↩️ إلغاء: خلّصت هالصفحة" : "✅ خلّصت هالصفحة"}</button>`;
    const img = $(".pimg img", B); img.onload = () => img.parentNode.classList.add("ok"); img.onclick = () => img.parentNode.classList.toggle("zoom");
    if (R.page < d.pages) new Image().src = `${d.img}${R.page + 1}.jpg`;
    if (pq) { $("#rQ").innerHTML = `<div class="row" style="justify-content:space-between"><b>📝 أسئلة الصفحة (${pq.qs.length})</b><span class="small muted" id="rSc"></span></div>`;
      let ok = 0, n = 0;
      pq.qs.forEach((q, i) => { const full = d.pool.find((x) => x.id === `${id}:p${R.page}:${i}`) || q;
        $("#rQ").appendChild(qCard(full, i + 1, { onAnswer: (_, good) => { n++; if (good) ok++; $("#rSc").textContent = `✔️ ${ok} من ${n}`; if (n === pq.qs.length && ok === n) { confetti(80); toast("🌟 علامة كاملة بأسئلة الصفحة!"); } } })); });
    } else $("#rQ").innerHTML = `<div class="empty"><span class="e">📘</span>صفحة بدون أسئلة</div>`;
    if (unitEnd) $("#uQ").onclick = () => { $("#reader").classList.remove("on"); document.body.style.overflow = ""; go("examSetup", { id, unit: unitEnd.n }); };
    $("#mD").onclick = () => { const a = new Set(S.done[id] || []); if (a.has(R.page)) a.delete(R.page); else { a.add(R.page); addPts(5); toast(`✅ صفحة ${R.page} خلصت`); } S.done[id] = [...a]; save(); checkBadges(); if (a.has(R.page) && R.page < d.pages) setTimeout(() => goP(R.page + 1), 500); else drawR(); };
  }

  /* ---------------- أسئلة الدروس مع حلها ---------------- */
  async function review(id) {
    const s = SUBJECTS.find((x) => x.id === id), d = await getData(id);
    $("#view").innerHTML = `<button class="back" id="bk">→ رجوع لـ ${s.title}</button><div class="shead" style="--c:${s.color}"><div class="ico">📝</div><div><h2>أسئلة الدروس مع حلها</h2><div class="muted small">أسئلة التقويم والمراجعة بآخر كل درس — اضغط على السؤال لتشوف الحل</div></div></div>
      <div class="row mt"><button class="btn sm ghost" id="openAll">👁️ أظهر كل الحلول</button></div><div id="rv"></div>`;
    $("#bk").onclick = () => go("subject", id);
    const box = $("#rv");
    (d.review || []).forEach((L2) => {
      box.insertAdjacentHTML("beforeend", `<div class="lesson-h">📘 ${esc(L2.t)} <span class="small muted">(صفحة ${L2.page})</span></div>`);
      L2.items.forEach((it, i) => box.insertAdjacentHTML("beforeend", `<div class="rv"><div class="qt">${i + 1}) ${esc(it.q)}</div><button class="btn sm ghost mt sa">👁️ أظهر الحل</button><div class="ans">${esc(it.a).replace(/\n/g, "<br>")}</div></div>`));
    });
    if (!(d.review || []).length) box.innerHTML = `<div class="empty"><span class="e">⏳</span>قريبًا</div>`;
    $$(".sa", box).forEach((b) => b.onclick = () => { const r = b.parentNode; r.classList.toggle("open"); b.textContent = r.classList.contains("open") ? "🙈 أخفِ الحل" : "👁️ أظهر الحل"; });
    let all = false; $("#openAll").onclick = () => { all = !all; $$(".rv", box).forEach((r) => r.classList.toggle("open", all)); $$(".sa", box).forEach((b) => b.textContent = all ? "🙈 أخفِ الحل" : "👁️ أظهر الحل"); $("#openAll").textContent = all ? "🙈 أخفِ كل الحلول" : "👁️ أظهر كل الحلول"; };
  }

  /* ---------------- إعداد الامتحان ---------------- */
  async function examSetup({ id, unit }) {
    const s = SUBJECTS.find((x) => x.id === id), d = await getData(id);
    const poolOf = (u) => (u ? d.byUnit[u] || [] : d.pool);
    let cnt = 50, mins = -1, u = unit || 0;
    const draw = () => {
      const max = poolOf(u).length;
      $("#view").innerHTML = `<button class="back" id="bk">→ رجوع لـ ${s.title}</button>
        <div class="shead" style="--c:${s.color}"><div class="ico">🎯</div><div><h2>ابدأ امتحاني</h2><div class="muted small">${s.title} — الأسئلة عشوائية ومخلوطة، وترتيب الخيارات بيتغير كل مرة</div></div></div>
        <div class="card mt">
          <label class="lbl">📚 من وين الأسئلة؟</label>
          <div class="chips">${[[0, "المادة كاملة"], ...d.units.map((x) => [x.n, "الوحدة " + x.n])].map(([n, t]) => `<button class="chip ${u === n ? "on" : ""}" data-u="${n}">${t}</button>`).join("")}</div>
          <label class="lbl">🔢 عدد الأسئلة (متوفر ${max})</label>
          <div class="chips">${[10, 20, 30, 50, 75, 100].filter((n) => n <= max || n === 10).map((n) => `<button class="chip ${cnt === n ? "on" : ""}" data-c="${n}">${n}</button>`).join("")}</div>
          <input id="cN" type="number" min="1" max="${max}" class="mt" placeholder="أو اكتب العدد اللي بدك إياه" value="">
          <label class="lbl">⏱️ الوقت</label>
          <div class="chips">${[[-1, "دقيقة لكل سؤال"], [0, "بدون وقت"], [30, "30 دقيقة"], [60, "60 دقيقة"]].map(([m, t]) => `<button class="chip ${mins === m ? "on" : ""}" data-t="${m}">${t}</button>`).join("")}</div>
          <button class="btn block mt2" id="go">🚀 ابدأ الامتحان</button>
        </div>`;
      $("#bk").onclick = () => go("subject", id);
      $$("[data-u]").forEach((b) => b.onclick = () => { u = +b.dataset.u; draw(); });
      $$("[data-c]").forEach((b) => b.onclick = () => { cnt = +b.dataset.c; draw(); });
      $$("[data-t]").forEach((b) => b.onclick = () => { mins = +b.dataset.t; draw(); });
      $("#go").onclick = () => {
        const typed = +$("#cN").value; let n = typed > 0 ? typed : cnt; n = Math.min(n, max);
        if (!n) return toast("ما في أسئلة");
        const qs = pickSpread(poolOf(u), n, d);
        startExam(id, qs, { title: `🎯 امتحان ${s.title}${u ? " — الوحدة " + u : ""}`, minutes: mins === -1 ? n : mins });
      };
    };
    draw();
  }
  // اختيار عشوائي موزّع على كل المادة (من أولها لآخرها) ثم خلط
  function pickSpread(pool, n, d) {
    const groups = {}; pool.forEach((q) => (groups[q.u || 0] = groups[q.u || 0] || []).push(q));
    const keys = Object.keys(groups); const out = []; const sh = {}; keys.forEach((k) => (sh[k] = shuffle(groups[k])));
    let i = 0; while (out.length < n && keys.some((k) => sh[k].length)) { const k = keys[i++ % keys.length]; if (sh[k].length) out.push(sh[k].pop()); }
    return shuffle(out);
  }

  /* ---------------- الامتحان ---------------- */
  let T = null, tT = null;
  function stopTimer() { clearInterval(tT); tT = null; }
  function startExam(id, qs, { title, minutes }) {
    stopTimer();
    T = { id, qs, title, ans: new Array(qs.length).fill(null), cur: 0, secs: minutes > 0 ? minutes * 60 : 0, total: minutes > 0 ? minutes * 60 : 0, start: Date.now() };
    $$("#bnav button").forEach((b) => b.classList.remove("on"));
    drawExam();
    if (T.secs) tT = setInterval(() => { T.secs--; drawTimer(); if (T.secs === 60) { toast("⏰ باقي دقيقة وحدة!"); beep(false); } if (T.secs <= 0) { stopTimer(); toast("⌛ خلص الوقت!"); finishExam(); } }, 1000);
  }
  function drawTimer() {
    const el = $(".timer"); if (!el) return; const C = 2 * Math.PI * 24;
    const m = Math.floor(T.secs / 60), s = T.secs % 60; $("b", el).textContent = `${m}:${String(s).padStart(2, "0")}`;
    $(".tb", el).style.strokeDasharray = C; $(".tb", el).style.strokeDashoffset = C * (1 - T.secs / T.total); el.classList.toggle("warn", T.secs <= 60);
  }
  function drawExam() {
    const n = T.qs.length, answered = T.ans.filter((x) => x != null).length, q = T.qs[T.cur];
    $("#view").innerHTML = `<div class="exam-top">${T.total ? `<div class="timer"><svg viewBox="0 0 54 54"><circle class="tr" cx="27" cy="27" r="24"/><circle class="tb" cx="27" cy="27" r="24"/></svg><b></b></div>` : ""}
        <div class="prog"><b class="small">${esc(T.title)}</b><div class="small muted">سؤال ${T.cur + 1} من ${n} · جاوبت ${answered}</div><div class="bar"><i style="width:${(answered / n) * 100}%"></i></div></div>
        <button class="btn sm ghost" id="quit">✕</button></div>
      <div class="exam-q" id="eq"></div>
      <div class="exam-nav"><button class="btn ghost" id="pv" ${T.cur === 0 ? "disabled" : ""}>➡️ السابق</button>
        ${T.cur === n - 1 ? `<button class="btn gold" id="fin">🏁 سلّم الامتحان</button>` : `<button class="btn" id="nx">التالي ⬅️</button>`}</div>
      <div class="dots">${T.qs.map((_, i) => `<button class="${T.ans[i] != null ? "ans" : ""} ${i === T.cur ? "cur" : ""}" data-j="${i}">${i + 1}</button>`).join("")}</div>
      <div class="center mt"><button class="btn sm ghost" id="fin2">🏁 سلّم الآن</button></div>`;
    $("#eq").appendChild(qCard(q, `${T.cur + 1}/${n}`, { reveal: false, picked: T.ans[T.cur], onAnswer: (i) => { T.ans[T.cur] = i; setTimeout(() => { if (T.cur < n - 1) { T.cur++; drawExam(); } else drawExam(); }, 260); } }));
    if (T.total) drawTimer();
    $("#pv").onclick = () => { T.cur--; drawExam(); };
    const nx = $("#nx"); if (nx) nx.onclick = () => { T.cur++; drawExam(); };
    const fin = () => { const left = T.ans.filter((x) => x == null).length; if (left && !confirmTwice(`باقي ${left} سؤال بدون جواب — اضغط مرة ثانية لتسلّم`)) return; finishExam(); };
    const f1 = $("#fin"); if (f1) f1.onclick = fin; $("#fin2").onclick = fin;
    $$(".dots button").forEach((b) => b.onclick = () => { T.cur = +b.dataset.j; drawExam(); });
    $("#quit").onclick = () => { if (confirmTwice("اضغط مرة ثانية للخروج بدون تسليم")) { stopTimer(); go("subject", T.id); } };
  }
  let ctw = 0, ctwMsg = "";
  function confirmTwice(m) { if (Date.now() - ctw < 3500 && ctwMsg === m) { ctw = 0; return true; } ctw = Date.now(); ctwMsg = m; toast(m); return false; }
  function finishExam() {
    stopTimer();
    const n = T.qs.length; let ok = 0; const wrong = [];
    T.qs.forEach((q, i) => { const g = T.ans[i] === q.a; if (g) ok++; else wrong.push(i); S.ans++; S.seen[q.id] = g ? 1 : 0; if (g) { S.ok++; delete S.mist[q.id]; } else S.mist[q.id] = q; });
    const pct = Math.round((ok / n) * 100), secs = Math.round((Date.now() - T.start) / 1000);
    S.exams.push({ s: T.id, t: T.title, ok, n, pct, d: Date.now(), secs }); save();
    addPts(ok * 10 + (pct === 100 && n >= 10 ? 100 : 0)); checkBadges(); pushChallenge();
    const g = pct >= 95 ? ["🏆", "أسطوري! علامة شبه كاملة"] : pct >= 85 ? ["🌟", "ممتاز جدًا"] : pct >= 70 ? ["👏", "جيد جدًا، كمّل"] : pct >= 50 ? ["💪", "مقبول، بدك شوية تركيز"] : ["📚", "راجع وارجع جرّب"];
    const C = 2 * Math.PI * 80;
    $("#view").innerHTML = `<div class="card result"><div class="score-ring"><svg viewBox="0 0 180 180"><defs><linearGradient id="sg"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#fbbf24"/></linearGradient></defs><circle class="tr" cx="90" cy="90" r="80"/><circle class="tb" cx="90" cy="90" r="80" style="stroke-dasharray:${C};stroke-dashoffset:${C}"/></svg><b id="pc">0%</b></div>
        <div class="grade">${g[0]} ${g[1]}</div><div class="muted mt">جاوبت صح <b>${ok}</b> من <b>${n}</b> · الوقت ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} · +${ok * 10} نقطة</div>
        <div class="row mt" style="justify-content:center"><button class="btn" id="again">🔁 امتحان جديد</button>${wrong.length ? `<button class="btn ghost" id="redo">❌ أعد الغلط (${wrong.length})</button>` : ""}<button class="btn ghost" id="back2">↩️ للمادة</button></div></div>
      ${wrong.length ? `<div class="sec">❌ الأسئلة اللي غلطت فيها مع الحل</div><div id="wr"></div>` : `<div class="empty"><span class="e">🎉</span>ولا غلطة!</div>`}`;
    requestAnimationFrame(() => requestAnimationFrame(() => { $(".score-ring .tb").style.strokeDashoffset = C * (1 - pct / 100); }));
    let k = 0; const cu = setInterval(() => { k = Math.min(pct, k + Math.max(1, Math.round(pct / 40))); const el = $("#pc"); if (!el) return clearInterval(cu); el.textContent = k + "%"; if (k >= pct) clearInterval(cu); }, 40);
    if (pct >= 70) confetti(pct >= 90 ? 260 : 140);
    wrong.forEach((i, j) => { const q = T.qs[i], el = qCard(q, j + 1); $("#wr").appendChild(el);
      el.classList.add("done"); $$(".opt", el).forEach((x) => { if (+x.dataset.i === q.a) x.classList.add("right"); if (+x.dataset.i === T.ans[i]) x.classList.add("wrong"); });
      if (T.ans[i] == null) $(".expl", el).insertAdjacentHTML("afterbegin", "⚪ ما جاوبت · "); });
    const id = T.id, wq = wrong.map((i) => T.qs[i]);
    $("#again").onclick = () => go("examSetup", { id });
    const rd = $("#redo"); if (rd) rd.onclick = () => startExam(id, shuffle(wq), { title: "❌ إعادة الأسئلة الغلط", minutes: 0 });
    $("#back2").onclick = () => go("subject", id);
  }

  /* ---------------- دفتر الأخطاء والمفضلة ---------------- */
  function listView(title, emoji, obj, emptyMsg, kind) {
    const qs = Object.values(obj);
    $("#view").innerHTML = `<div class="shead" style="--c:#8b5cf6"><div class="ico">${emoji}</div><div><h2>${title}</h2><div class="muted small">${qs.length} سؤال</div></div></div>
      ${qs.length ? `<div class="row mt"><button class="btn" id="ex">🎯 امتحن حالك فيهم</button></div>` : ""}<div id="lst" class="mt"></div>`;
    if (!qs.length) return ($("#lst").innerHTML = `<div class="empty"><span class="e">${kind === "m" ? "🎉" : "⭐"}</span>${emptyMsg}</div>`);
    $("#ex").onclick = () => startExam(qs[0].s, shuffle(qs), { title: `${emoji} ${title}`, minutes: 0 });
    qs.forEach((q, i) => $("#lst").appendChild(qCard(q, i + 1, { onAnswer: () => {} })));
  }
  const mistakes = () => listView("دفتر أخطائي", "❌", S.mist, "ما عندك أخطاء! كل سؤال بتغلط فيه بينحفظ هون لحد ما تجاوبه صح", "m");
  const favs = () => listView("المفضلة", "⭐", S.favs, "اضغط ⭐ على أي سؤال صعب لتحفظه هون", "f");

  /* ---------------- الأوسمة ---------------- */
  function badgeList() {
    const best = S.exams.reduce((m, e) => Math.max(m, e.n >= 10 ? e.pct : 0), 0), pages = Object.values(S.done).reduce((a, x) => a + x.length, 0);
    return [
      ["🚀", "أول خطوة", "جاوب أول سؤال", S.ans >= 1], ["💯", "100 سؤال", "حل 100 سؤال", S.ans >= 100], ["🔥", "500 سؤال", "حل 500 سؤال", S.ans >= 500],
      ["🌋", "1000 سؤال", "حل 1000 سؤال", S.ans >= 1000], ["🎯", "أول امتحان", "سلّم أول امتحان", S.exams.length >= 1], ["📝", "10 امتحانات", "سلّم 10 امتحانات", S.exams.length >= 10],
      ["🏆", "علامة كاملة", "100% بامتحان 10 أسئلة أو أكثر", best === 100], ["🌟", "متفوّق", "90% أو أكثر بامتحان", best >= 90],
      ["📖", "قارئ نشيط", "خلّص 20 صفحة", pages >= 20], ["📚", "دودة كتب", "خلّص 100 صفحة", pages >= 100],
      ["🧹", "منظّف الأخطاء", "صحّح أخطاءك لحد ما يفضى الدفتر بعد 50 سؤال", S.ans >= 50 && !Object.keys(S.mist).length],
      ["💎", "متميّز", "وصل 2500 نقطة", S.pts >= 2500], ["👑", "أسطورة", "وصل 9000 نقطة", S.pts >= 9000],
    ].map(([e, t, d, ok]) => ({ e, t, d, ok }));
  }
  function checkBadges() {
    S.bdg = S.bdg || []; badgeList().forEach((b) => { if (b.ok && !S.bdg.includes(b.t)) { S.bdg.push(b.t); save(); setTimeout(() => { confetti(120); toast(`🏅 وسام جديد: <b>${b.e} ${b.t}</b>`); }, 400); } });
  }
  function badges() {
    const bl = badgeList();
    $("#view").innerHTML = `<div class="shead" style="--c:#fbbf24"><div class="ico">🏅</div><div><h2>أوسمتي</h2><div class="muted small">${bl.filter((b) => b.ok).length} من ${bl.length}</div></div></div>
      <div class="badges mt">${bl.map((b) => `<div class="bdg ${b.ok ? "ok" : ""}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`).join("")}</div>
      <div class="sec">🕒 آخر امتحاناتي</div><div>${S.exams.slice(-15).reverse().map((e) => `<div class="unit"><div class="grow"><b>${esc(e.t)}</b><div class="small muted">${new Date(e.d).toLocaleDateString("ar-JO-u-nu-latn")} · ${e.ok}/${e.n}</div></div><b style="font-size:1.3rem">${e.pct}%</b></div>`).join("") || '<div class="empty">لسا ما عملت امتحان</div>'}</div>`;
  }

  /* ---------------- تحدي محمد ضد نورس ---------------- */
  let board = JSON.parse(ls.get("mawad_board") || "{}");
  function myCard() { const best = S.exams.reduce((m, e) => Math.max(m, e.n >= 10 ? e.pct : 0), 0); return { u: user, pts: S.pts, ans: S.ans, ok: S.ok, ex: S.exams.length, best, t: Date.now() }; }
  async function pushChallenge() {
    const c = myCard(); board[user] = c; ls.set("mawad_board", JSON.stringify(board));
    try { await fetch(NTFY + "/", { method: "POST", body: JSON.stringify({ topic: CH, message: JSON.stringify(c), priority: 1 }) }); } catch {}
  }
  async function pullChallenge() {
    board[user] = myCard();
    try { const r = await fetch(`${NTFY}/${CH}/json?poll=1&since=all`, { cache: "no-store" }); const t = await r.text();
      t.split("\n").filter(Boolean).forEach((l) => { try { const m = JSON.parse(l); if (m.event !== "message") return; const c = JSON.parse(m.message); if (c.u && USERS[c.u] && (!board[c.u] || c.t > board[c.u].t) && c.u !== user) board[c.u] = c; } catch {} });
    } catch {}
    ls.set("mawad_board", JSON.stringify(board)); pushChallenge();
  }
  async function challenge() {
    $("#view").innerHTML = `<div class="empty"><span class="e">⚔️</span>جارِ تحميل التحدي…</div>`;
    await pullChallenge();
    const a = board.mohammad || { pts: 0, ans: 0, ok: 0, ex: 0, best: 0 }, b = board.nawras || { pts: 0, ans: 0, ok: 0, ex: 0, best: 0 };
    const lead = a.pts === b.pts ? null : a.pts > b.pts ? "mohammad" : "nawras";
    const row = (t, x, y, sfx = "") => `<div class="unit"><b class="grow center" style="color:${x > y ? "var(--good)" : "inherit"}">${x}${sfx}</b><span class="small muted center" style="min-width:110px">${t}</span><b class="grow center" style="color:${y > x ? "var(--good)" : "inherit"}">${y}${sfx}</b></div>`;
    const acc = (c) => (c.ans ? Math.round((c.ok / c.ans) * 100) : 0);
    $("#view").innerHTML = `<div class="shead" style="--c:#ec4899"><div class="ico">⚔️</div><div><h2>تحدي محمد ضد نورس</h2><div class="muted small">مين الأقوى؟ كل امتحان بتسلّمه بيتحدّث هون</div></div></div>
      <div class="card mt vs">
        <div class="${lead === "mohammad" ? "lead" : ""}"><div class="crown">${lead === "mohammad" ? "👑" : ""}</div><img src="img/mohammad.jpg"><b>محمد</b><div class="num">${a.pts}</div><div class="small muted">نقطة</div></div>
        <div class="vsx">VS</div>
        <div class="${lead === "nawras" ? "lead" : ""}"><div class="crown">${lead === "nawras" ? "👑" : ""}</div><img src="img/nawras.jpg"><b>نورس</b><div class="num">${b.pts}</div><div class="small muted">نقطة</div></div>
      </div>
      <div class="units mt">${row("أسئلة محلولة", a.ans, b.ans)}${row("نسبة الصح", acc(a), acc(b), "%")}${row("امتحانات", a.ex, b.ex)}${row("أعلى علامة", a.best, b.best, "%")}</div>
      <div class="center mt"><button class="btn" id="chEx">🎯 امتحان وارفع نقاطك</button></div>`;
    $("#chEx").onclick = () => go("home");
    if (lead === user) confetti(80);
  }

  /* ---------------- بداية ---------------- */
  const last = ls.get("mawad_last");
  if (last && USERS[last]) { const b = $(`.user[data-u="${last}"]`); b && b.parentNode.prepend(b); }
})();
