/* ===========================================================
   نظام توجيهي محمد — النواة المشتركة (بيانات + مزامنة + مؤثرات)
   =========================================================== */
(function () {
  "use strict";
  const CFG = window.TJ_CONFIG;
  const LS_STATE = "tj_state_" + CFG.channelId;
  
  /* ---------------- المواد ---------------- */
  const SUBJECTS = [
    { id: "is", name: "التربية الإسلامية", short: "الدين", icon: "🕌", color: "#059669", s1: 26, s1Units: 4 },
    { id: "ma", name: "الرياضيات", short: "الرياضيات", icon: "📐", color: "#3b82f6", s1: 13, s1Units: 3 },
    { id: "ar", name: "اللغة العربية", short: "العربي", icon: "📜", color: "#d97706", s1: 25, s1Units: 5 },
    { id: "hi", name: "تاريخ الأردن", short: "التاريخ", icon: "🏛️", color: "#db2777", s1: 13, s1Units: 3 },
  ];
  const SUBJ = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
  const LEVELS = [0, 25, 50, 75, 100];

  function split(n, k) {
    if (!n || !k) return [];
    const base = Math.floor(n / k), extra = n % k;
    return Array.from({ length: k }, (_, i) => base + (i < extra ? 1 : 0));
  }

  function defaultState() {
    const cur = {}, p = {};
    SUBJECTS.forEach((s) => {
      cur[s.id] = { s1: split(s.s1, s.s1Units), s2: [] };
      p[s.id] = { s1: "0".repeat(s.s1), s2: "" };
    });
    return { v: 1, ts: 0, cur, p, pp: {}, days: {}, log: [], goal: 10 };
  }

  const sum = (a) => (a || []).reduce((x, y) => x + (+y || 0), 0);

  function normalize(st) {
    const d = defaultState();
    if (!st || typeof st !== "object") st = d;
    st.v = 1;
    st.ts = +st.ts || 0;
    st.cur = st.cur || d.cur;
    st.p = st.p || d.p;
    st.pp = st.pp && typeof st.pp === "object" ? st.pp : {};
    SUBJECTS.forEach((s) => {
      st.cur[s.id] = st.cur[s.id] || d.cur[s.id];
      st.p[s.id] = st.p[s.id] || d.p[s.id];
      st.pp[s.id] = st.pp[s.id] || {};
      ["s1", "s2"].forEach((sem) => {
        const units = (st.cur[s.id][sem] || []).map((x) => Math.max(0, parseInt(x) || 0)).filter((x) => x > 0);
        st.cur[s.id][sem] = units;
        const n = sum(units);
        let str = String(st.p[s.id][sem] || "").replace(/[^0-4]/g, "");
        str = (str + "0".repeat(n)).slice(0, n);
        st.p[s.id][sem] = str;
        const pp = (Array.isArray(st.pp[s.id][sem]) ? st.pp[s.id][sem] : []).map((x) => Math.max(0, parseInt(x) || 0));
        st.pp[s.id][sem] = pp.concat(Array(n).fill(0)).slice(0, n);
      });
    });
    st.days = st.days && typeof st.days === "object" ? st.days : {};
    st.log = Array.isArray(st.log) ? st.log : [];
    st.goal = +st.goal || 10;
    return st;
  }

  /* ---------------- التواريخ ---------------- */
  const dayKey = (d = new Date()) => {
    const x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  };
  const EXAM = new Date(CFG.examDate);
  const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const AR_MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const fmtDate = (d) => { d = new Date(d); return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = (d) => { d = new Date(d); return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`; };
  const fmtTime = (d) => { d = new Date(d); let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0"); const ap = h >= 12 ? "م" : "ص"; h = h % 12 || 12; return `${h}:${m} ${ap}`; };
  function relTime(ts) {
    if (!ts) return "—";
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return "الآن";
    const m = Math.round(s / 60); if (m < 60) return m === 1 ? "منذ دقيقة" : m === 2 ? "منذ دقيقتين" : `منذ ${m} ${m <= 10 ? "دقائق" : "دقيقة"}`;
    const h = Math.round(m / 60); if (h < 24) return h === 1 ? "منذ ساعة" : h === 2 ? "منذ ساعتين" : `منذ ${h} ${h <= 10 ? "ساعات" : "ساعة"}`;
    const dd = Math.round(h / 24); return dd === 1 ? "أمس" : dd === 2 ? "منذ يومين" : `منذ ${dd} ${dd <= 10 ? "أيام" : "يوماً"}`;
  }

  /* ---------------- الإحصائيات ---------------- */
  function semInfo(st, sid, sem) {
    const n = sum(st.cur[sid][sem]);
    const str = st.p[sid][sem] || "";
    let q = 0, done = 0;
    for (const c of str) { q += +c; if (c === "4") done++; }
    return { n, q, done, pct: n ? (q / (4 * n)) * 100 : 0, released: n > 0 };
  }
  function groupInfo(st, sems) {
    let n = 0, q = 0, done = 0;
    SUBJECTS.forEach((s) => sems.forEach((sem) => { const i = semInfo(st, s.id, sem); n += i.n; q += i.q; done += i.done; }));
    return { n, q, done, pct: n ? (q / (4 * n)) * 100 : 0, released: n > 0 };
  }
  function subjectTotal(st, sid) {
    const a = semInfo(st, sid, "s1"), b = semInfo(st, sid, "s2");
    const n = a.n + b.n, q = a.q + b.q;
    return { n, q, done: a.done + b.done, pct: n ? (q / (4 * n)) * 100 : 0 };
  }
  function streak(st) {
    let c = 0; const d = new Date();
    const has = (k) => st.days[k] && (st.days[k].pg > 0 || st.days[k].dq > 0 || st.days[k].mn > 0);
    if (!has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (has(dayKey(d))) { c++; d.setDate(d.getDate() - 1); }
    return c;
  }
  function bestStreak(st) {
    const keys = Object.keys(st.days).filter((k) => st.days[k].pg > 0 || st.days[k].dq > 0 || st.days[k].mn > 0).sort();
    let best = 0, cur = 0, prev = null;
    keys.forEach((k) => {
      const t = new Date(k + "T12:00:00").getTime();
      cur = prev && Math.round((t - prev) / 864e5) === 1 ? cur + 1 : 1;
      best = Math.max(best, cur); prev = t;
    });
    return best;
  }
  function lastDays(st, n) {
    const out = []; const d = new Date(); d.setDate(d.getDate() - (n - 1));
    for (let i = 0; i < n; i++) {
      const k = dayKey(d); const v = st.days[k] || {};
      out.push({ key: k, date: new Date(d), pg: v.pg || 0, mn: v.mn || 0, dq: v.dq || 0 });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function stats(st) {
    const s1 = groupInfo(st, ["s1"]), s2 = groupInfo(st, ["s2"]), all = groupInfo(st, ["s1", "s2"]);
    const now = Date.now();
    const msLeft = Math.max(0, EXAM - now);
    const daysLeft = Math.ceil(msLeft / 864e5);
    const today = st.days[dayKey()] || { pg: 0, mn: 0, dq: 0 };
    const l14 = lastDays(st, 14);
    const lessons14 = sum(l14.map((d) => d.dq)) / 4;
    const activeDays14 = l14.filter((d) => d.pg || d.dq || d.mn).length;
    const avgPerDay = lessons14 / 14;
    const remaining = (all.n * 4 - all.q) / 4;
    const studyDays = Math.max(1, daysLeft - 30); // آخر شهر للمراجعة
    const required = remaining / studyDays;
    const projDays = avgPerDay > 0 ? Math.ceil(remaining / avgPerDay) : null;
    const totalPages = sum(Object.values(st.days).map((d) => d.pg));
    const totalMin = sum(Object.values(st.days).map((d) => d.mn));
    let bestDay = null;
    Object.entries(st.days).forEach(([k, v]) => { if (!bestDay || (v.pg || 0) > bestDay.pg) bestDay = { key: k, pg: v.pg || 0 }; });
    const perSubjPages = {};
    SUBJECTS.forEach((s) => (perSubjPages[s.id] = 0));
    st.log.forEach((e) => { if (perSubjPages[e.s] != null) perSubjPages[e.s] += +e.pg || 0; });
    return {
      s1, s2, all, daysLeft, msLeft, today, l14, lessons14, activeDays14, avgPerDay, remaining, required, projDays,
      projDate: projDays != null ? new Date(now + projDays * 864e5) : null,
      onTrack: avgPerDay >= required, streak: streak(st), bestStreak: bestStreak(st), totalPages, totalMin, bestDay, perSubjPages,
    };
  }

  function badges(st) {
    const S = stats(st);
    const anyFull = SUBJECTS.some((s) => { const i = semInfo(st, s.id, "s1"); return i.n && i.done === i.n; });
    const list = [
      ["🚀", "أول خطوة", "سجّل أول إنجاز", st.log.length >= 1],
      ["✅", "أول درس", "أنهى أول درس كامل", S.all.done >= 1],
      ["🔟", "عشرة دروس", "أنهى 10 دروس", S.all.done >= 10],
      ["🎯", "ربع الطريق", "25% من الفصل الأول", S.s1.pct >= 25],
      ["⚡", "نص الطريق", "50% من الفصل الأول", S.s1.pct >= 50],
      ["🔥", "ثلاث أرباع", "75% من الفصل الأول", S.s1.pct >= 75],
      ["👑", "الفصل الأول كامل", "100% من الفصل الأول", S.s1.pct >= 100],
      ["📗", "مادة كاملة", "أنهى مادة كاملة", anyFull],
      ["🔗", "3 أيام ورا بعض", "سلسلة 3 أيام", S.bestStreak >= 3],
      ["💎", "أسبوع التزام", "سلسلة 7 أيام", S.bestStreak >= 7],
      ["🏆", "شهر أسطوري", "سلسلة 30 يوم", S.bestStreak >= 30],
      ["📚", "100 صفحة", "مجموع 100 صفحة", S.totalPages >= 100],
      ["🌋", "500 صفحة", "مجموع 500 صفحة", S.totalPages >= 500],
      ["🦸", "يوم بطولي", "30 صفحة أو أكثر بيوم واحد", S.bestDay && S.bestDay.pg >= 30],
    ];
    return list.map(([icon, title, desc, ok]) => ({ icon, title, desc, ok: !!ok }));
  }

  /* ---------------- الأدعية ---------------- */
  const DUAS = [
    "اللهم وفّق محمد ويسّر له أمره، واجعل التوجيهي باب خيرٍ له 🤲",
    "اللهم لا سهل إلا ما جعلته سهلاً، وأنت تجعل الحزن إذا شئت سهلاً",
    "ربِّ اشرح لي صدري، ويسّر لي أمري، واحلل عقدة من لساني، يفقهوا قولي",
    "اللهم إني أسألك فهم النبيين، وحفظ المرسلين، وإلهام الملائكة المقربين",
    "اللهم افتح على محمد فتوح العارفين، وارزقه علماً نافعاً وعملاً متقبلاً",
    "اللهم اجعل محمد من الأوائل، وأقرّ عين أهله بنجاحه وتفوّقه 🌟",
    "اللهم ذكّره ما نسي، وعلّمه ما جهل، واحفظ له ما تعلّم",
    "ربِّ زدني علماً، وألحقني بالصالحين",
    "اللهم ارزقه التركيز والبركة في الوقت، وأبعد عنه الكسل والتشتت",
    "اللهم إني استودعتك ما قرأت وما حفظت، فردّه إليّ عند حاجتي إليه",
    "اللهم اجعل تعبه في ميزان حسناته، وفرحة نجاحه قريبة يا رب 💚",
  ];
  const QUOTES = [
    "كل صفحة اليوم هي علامة بكرة 💪",
    "الاستمرارية أقوى من الحماس",
    "مش لازم تكون مثالي، لازم تكون مستمر",
    "تعب ساعة ولا ندم سنة",
    "حلمك يستاهل التعب يا بطل",
    "خطوة صغيرة كل يوم = إنجاز عظيم بالنهاية",
  ];

  /* ---------------- التشفير بكلمة المرور ---------------- */
  // كل البيانات (على الجهاز وعلى الإنترنت) مشفّرة AES-GCM بمفتاح مشتق من كلمة المرور.
  // بدون كلمة المرور ما حدا بيقدر يقرأ ولا إشي، حتى لو معه الرابط.
  const LS_KEY = "tj_key_" + CFG.channelId;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const b64 = (buf) => { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const canZip = typeof CompressionStream === "function";
  async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

  const Crypto = {
    key: null,
    async derive(pw) {
      const enc = new TextEncoder();
      const base = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("tawjihi:" + CFG.channelId), iterations: 250000, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    },
    async enc(str, key = this.key) {
      let data = new TextEncoder().encode(str), z = 0;
      if (canZip) { data = await pipe(data, new CompressionStream("deflate-raw")); z = 1; }
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
      const out = new Uint8Array(13 + ct.length); out[0] = z; out.set(iv, 1); out.set(ct, 13);
      return "v1." + b64(out);
    },
    async dec(str, key = this.key) {
      if (!str || !str.startsWith("v1.")) throw new Error("bad");
      const raw = unb64(str.slice(3));
      let data = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(1, 13) }, key, raw.slice(13)));
      if (raw[0] === 1) data = await pipe(data, new DecompressionStream("deflate-raw"));
      return new TextDecoder().decode(data);
    },
  };

  /* ---------------- التخزين والمزامنة ---------------- */
  const T_STATE = CFG.channelId + "-s";
  let MEM = null; // نسخة البيانات بعد فك التشفير (بالذاكرة بس)
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const loadLocal = () => normalize(MEM ? clone(MEM) : null);
  const saveLocal = (st) => { MEM = clone(st); if (Crypto.key) Crypto.enc(JSON.stringify(st)).then((x) => ls.set(LS_STATE, x)).catch(() => {}); };

  async function ntfyPublish(topic, message, extra = {}) {
    const res = await fetch(CFG.ntfyServer.replace(/\/$/, "") + "/", { method: "POST", body: JSON.stringify(Object.assign({ topic, message }, extra)) });
    if (!res.ok) throw new Error("ntfy " + res.status);
    return res.json().catch(() => ({}));
  }
  async function ntfyPoll(topic) {
    const res = await fetch(`${CFG.ntfyServer}/${topic}/json?poll=1&since=all`, { cache: "no-store" });
    if (!res.ok) throw new Error("ntfy " + res.status);
    return (await res.text()).split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((m) => m && m.event === "message");
  }
  function ntfySubscribe(topic, cb, onStatus) {
    let es, retry = 0;
    const open = () => {
      try { es = new EventSource(`${CFG.ntfyServer}/${topic}/sse`); } catch { return; }
      es.onopen = () => { retry = 0; onStatus && onStatus(true); };
      es.onmessage = (e) => { try { const d = JSON.parse(e.data); if (d.event === "message") cb(d); } catch {} };
      es.onerror = () => { onStatus && onStatus(false); es.close(); setTimeout(open, Math.min(30000, 2000 * ++retry)); };
    };
    open();
  }
  /** آخر نسخة مشفّرة على الإنترنت (أو null) */
  async function remoteLatest() { try { const m = await ntfyPoll(T_STATE); return m.length ? m[m.length - 1].message : null; } catch { return null; } }

  async function compactEncrypted(st) {
    const c = clone(st);
    c.log = c.log.slice(-40).map((e) => Object.assign({}, e, { note: (e.note || "").slice(0, 80) }));
    const keys = Object.keys(c.days).sort();
    keys.slice(0, Math.max(0, keys.length - 90)).forEach((k) => delete c.days[k]);
    let out = await Crypto.enc(JSON.stringify(c));
    while (out.length > 3900 && (c.log.length > 2 || Object.keys(c.days).length > 10)) {
      if (c.log.length > 2) c.log.splice(0, Math.ceil(c.log.length / 4));
      else { const ks = Object.keys(c.days).sort(); ks.slice(0, Math.ceil(ks.length / 4)).forEach((k) => delete c.days[k]); }
      out = await Crypto.enc(JSON.stringify(c));
    }
    return out;
  }

  /* ---------------- القفل ---------------- */
  const Lock = {
    /** "login" إذا في بيانات محفوظة (على الجهاز أو الإنترنت)، و"create" إذا أول مرة */
    async mode() {
      if (ls.get(LS_STATE)) return "login";
      this._remote = await remoteLatest();
      return this._remote ? "login" : "create";
    },
    /** يجرب كلمة المرور. يرجع true إذا صحيحة */
    async unlock(pw, remember) {
      const key = await Crypto.derive(pw);
      return this._useKey(key, remember);
    },
    async _useKey(key, remember) {
      const local = ls.get(LS_STATE);
      const blob = local || this._remote || (await remoteLatest());
      if (blob) {
        try { MEM = JSON.parse(await Crypto.dec(blob, key)); }
        catch { return false; }
      } else MEM = null;
      Crypto.key = key;
      if (remember) ls.set(LS_KEY, b64(await crypto.subtle.exportKey("raw", key)));
      return true;
    },
    async create(pw, remember) {
      Crypto.key = await Crypto.derive(pw);
      MEM = defaultState(); MEM.ts = Date.now();
      saveLocal(MEM);
      try { await ntfyPublish(T_STATE, await compactEncrypted(MEM), { priority: 1, title: "sync" }); } catch {}
      if (remember) ls.set(LS_KEY, b64(await crypto.subtle.exportKey("raw", Crypto.key)));
      return true;
    },
    /** فتح تلقائي إذا الجهاز متذكّر */
    async auto() {
      const raw = ls.get(LS_KEY); if (!raw) return false;
      try { const key = await crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", true, ["encrypt", "decrypt"]); return await this._useKey(key, false); }
      catch { return false; }
    },
    lock() { ls.del(LS_KEY); Crypto.key = null; MEM = null; },
    /** يتأكد إن كلمة المرور هي الحالية */
    async verify(pw) {
      if (!Crypto.key) return false;
      const k = await Crypto.derive(pw);
      const [a, b] = await Promise.all([crypto.subtle.exportKey("raw", k), crypto.subtle.exportKey("raw", Crypto.key)]);
      return b64(a) === b64(b);
    },
    async changePassword(newPw, st) {
      Crypto.key = await Crypto.derive(newPw);
      if (ls.get(LS_KEY)) ls.set(LS_KEY, b64(await crypto.subtle.exportKey("raw", Crypto.key)));
      st.ts = Date.now(); saveLocal(st);
      await ntfyPublish(T_STATE, await compactEncrypted(st), { priority: 1, title: "sync" });
    },
  };

  const Store = {
    mode: "ntfy", online: false,
    _onState: null, _onStatus: () => {}, _timer: null,
    async init({ onState, onStatus }) {
      this._onState = onState; this._onStatus = onStatus || (() => {});
      onState(loadLocal(), "local");
      const take = async (msg) => {
        try {
          const remote = normalize(JSON.parse(await Crypto.dec(msg)));
          const local = loadLocal();
          if (remote.ts > local.ts) { saveLocal(remote); this._onState(remote, "remote"); }
          else if (local.ts > remote.ts) this._push(local);
        } catch {}
      };
      const last = await remoteLatest();
      if (last) await take(last); else if (loadLocal().ts) this._push(loadLocal());
      this.online = last !== null || navigator.onLine; this._onStatus(this.online, this.mode);
      ntfySubscribe(T_STATE, (d) => take(d.message), (ok) => { this.online = ok; this._onStatus(ok, this.mode); });
    },
    save(st) {
      st.ts = Date.now(); saveLocal(st);
      clearTimeout(this._timer); this._timer = setTimeout(() => this._push(st), 800);
    },
    async _push(st) {
      try { await ntfyPublish(T_STATE, await compactEncrypted(st), { priority: 1, title: "sync" }); this._onStatus(true, this.mode); return true; }
      catch (e) { console.warn(e); this._onStatus(false, this.mode); return false; }
    },
    flush(st) { clearTimeout(this._timer); return this._push(st); },
  };

  /* ---------------- مؤثرات وواجهة ---------------- */
  function ring(pct, { size = 120, stroke = 10, color = "#8b5cf6", color2, track = "rgba(255,255,255,.08)", id } = {}) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const gid = "g" + (id || Math.random().toString(36).slice(2));
    const c2 = color2 || color;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle class="ring-bar" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${gid})" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-c="${c}" data-pct="${Math.min(100, pct)}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  }
  function animateRings(root = document) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll(".ring-bar").forEach((el) => {
        const c = +el.dataset.c, p = +el.dataset.pct;
        el.style.strokeDashoffset = c - (c * p) / 100;
      });
    }));
  }
  function countUp(el, to, { dur = 1200, dec = 0, suffix = "" } = {}) {
    if (!el) return;
    const from = parseFloat(el.dataset.v || "0") || 0;
    el.dataset.v = to;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (from + (to - from) * e).toFixed(dec) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function toast(msg, type = "ok") {
    let box = document.getElementById("toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast " + type; t.innerHTML = msg;
    box.appendChild(t);
    setTimeout(() => t.classList.add("out"), 3600);
    setTimeout(() => t.remove(), 4200);
  }

  function confetti(n = 160) {
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const W = (cv.width = innerWidth * devicePixelRatio), H = (cv.height = innerHeight * devicePixelRatio);
    const cols = ["#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#ffffff"];
    const ps = Array.from({ length: n }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.65,
      vx: (Math.random() - 0.5) * 26 * devicePixelRatio, vy: -(12 + Math.random() * 22) * devicePixelRatio,
      s: (5 + Math.random() * 7) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[(Math.random() * cols.length) | 0], shape: Math.random() < 0.5,
    }));
    let f = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => {
        p.vy += 0.55 * devicePixelRatio; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - f / 170);
        if (p.shape) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      if (++f < 180) requestAnimationFrame(tick); else cv.remove();
    };
    tick();
  }

  function starfield() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.createElement("canvas");
    cv.id = "stars";
    document.body.prepend(cv);
    const ctx = cv.getContext("2d");
    let W, H, pts;
    const resize = () => {
      W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio;
      pts = Array.from({ length: Math.min(90, (innerWidth * innerHeight) / 14000) | 0 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + 0.3) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio, vy: (-Math.random() * 0.25 - 0.05) * devicePixelRatio, a: Math.random() * Math.PI * 2,
      }));
    };
    resize(); addEventListener("resize", resize);
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.a += 0.02;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        ctx.globalAlpha = 0.35 + Math.sin(p.a) * 0.3;
        ctx.fillStyle = "#e9d5ff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      });
      requestAnimationFrame(tick);
    };
    tick();
  }

  let audioCtx;
  function chime(kind = "ok") {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === "ok" ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 880];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.55);
      });
    } catch {}
  }

  function countdown(root) {
    const set = (sel, v) => { const el = root.querySelector(sel); if (el && el.textContent !== v) { el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } };
    const upd = () => {
      let ms = Math.max(0, EXAM - Date.now());
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      set("[data-cd=d]", String(d)); set("[data-cd=h]", String(h).padStart(2, "0"));
      set("[data-cd=m]", String(m).padStart(2, "0")); set("[data-cd=s]", String(s).padStart(2, "0"));
    };
    upd(); setInterval(upd, 1000);
  }

  function rotator(el, list, ms = 8000) {
    if (!el) return;
    let i = Math.floor(Math.random() * list.length);
    const show = () => { el.classList.add("fade-out"); setTimeout(() => { el.textContent = list[i]; el.classList.remove("fade-out"); i = (i + 1) % list.length; }, 450); };
    el.textContent = list[i]; i = (i + 1) % list.length;
    setInterval(show, ms);
  }

  /** مخطط أعمدة بسيط مع تلميح عند المرور */
  function barChart(el, data, { color = "#8b5cf6", height = 180, label = (d) => "", tip = (d) => "" } = {}) {
    if (!el) return;
    const max = Math.max(1, ...data.map((d) => d.v));
    const nice = Math.ceil(max / 5) * 5 || 5;
    el.innerHTML = `<div class="bc" style="height:${height}px">
      <div class="bc-grid">${[1, 0.5, 0].map((g) => `<div class="bc-gl"><span>${Math.round(nice * g)}</span></div>`).join("")}</div>
      <div class="bc-bars">${data.map((d, i) => `<div class="bc-col" data-i="${i}">
          <div class="bc-bar ${d.today ? "today" : ""}" style="--h:${(d.v / nice) * 100}%;--c:${color};--d:${i * 40}ms"></div>
          <div class="bc-x">${label(d)}</div></div>`).join("")}</div>
      <div class="bc-tip"></div></div>`;
    const tipEl = el.querySelector(".bc-tip");
    el.querySelectorAll(".bc-col").forEach((col) => {
      const show = () => { const d = data[+col.dataset.i]; tipEl.innerHTML = tip(d); tipEl.style.opacity = 1;
        const r = col.getBoundingClientRect(), pr = el.getBoundingClientRect();
        tipEl.style.left = Math.min(pr.width - 10, Math.max(10, r.left - pr.left + r.width / 2)) + "px"; };
      col.addEventListener("mouseenter", show); col.addEventListener("click", show);
      col.addEventListener("mouseleave", () => (tipEl.style.opacity = 0));
    });
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelector(".bc").classList.add("in")));
  }

  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function lessonLabel(st, sid, sem, idx) {
    const units = st.cur[sid][sem]; let acc = 0;
    for (let u = 0; u < units.length; u++) { if (idx < acc + units[u]) return { unit: u + 1, inUnit: idx - acc + 1, global: idx + 1 }; acc += units[u]; }
    return { unit: 1, inUnit: idx + 1, global: idx + 1 };
  }

  window.TJ = {
    CFG, SUBJECTS, SUBJ, LEVELS, split, defaultState, normalize, dayKey, EXAM, fmtDate, fmtShort, fmtTime, relTime,
    semInfo, groupInfo, subjectTotal, stats, badges, lastDays, DUAS, QUOTES, Store, ring, animateRings, countUp, toast,
    confetti, starfield, chime, countdown, rotator, barChart, reveal, esc, sum, lessonLabel, loadLocal, Lock, ls,
  };
})();
