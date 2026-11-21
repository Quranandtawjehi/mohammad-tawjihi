/* ===========================================================
   توجيهي محمد — شاشة القفل + المؤقت + تقويم الأيام + نسب السنة
   =========================================================== */
(function () {
  "use strict";
  const T = window.TJ, $ = (s) => document.querySelector(s);

  /* ---------------- شاشة القفل ---------------- */
  const err = (m) => { $("#lockErr").textContent = m; };
  function shake() { const b = $(".lock-box"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); }
  function openApp() {
    $("#lock").classList.add("unlocked");
    setTimeout(() => {
      $("#lock").classList.add("gone");
      $("#app").style.display = "";
      startApp();
      setTimeout(() => $("#lock").remove(), 900);
    }, 650);
  }
  async function boot() {
    T.starfield();
    if (!window.crypto || !crypto.subtle) { $("#lockSub").textContent = "⚠️ لازم تفتح الصفحة من رابط https"; return; }
    if (await T.Lock.auto()) return openApp();
    const mode = await T.Lock.mode();
    const form = $("#lockForm"), btn = $("#lockBtn");
    form.style.display = "";
    if (mode === "create") {
      $("#lockSub").textContent = "أول مرة؟ اختار كلمة مرور لصفحتك 🔐";
      $("#pw2").style.display = ""; btn.textContent = "🔐 إنشاء كلمة المرور";
    } else $("#lockSub").textContent = "اكتب كلمة المرور لتفتح صفحتك";
    const label = btn.textContent;
    const reset = () => { btn.disabled = false; btn.textContent = label; };
    setTimeout(() => $("#pw1").focus(), 300);
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); err("");
      const pw = $("#pw1").value, rem = $("#remember").checked;
      if (pw.length < 4) { shake(); return err("كلمة المرور لازم تكون 4 أحرف أو أكثر"); }
      if (mode === "create" && pw !== $("#pw2").value) { shake(); return err("الكلمتين مش متطابقات"); }
      btn.disabled = true; btn.textContent = "⏳ لحظة…";
      try {
        if (mode === "create") { await T.Lock.create(pw, rem); return openApp(); }
        if (await T.Lock.unlock(pw, rem)) return openApp();
        reset(); shake(); err("❌ كلمة المرور غلط"); $("#pw1").select();
      } catch (x) { console.error(x); reset(); err("صار خطأ، جرب مرة ثانية"); }
    });
  }

  /* ---------------- نسب السنة (خط الأعداد) ---------------- */
  let finalSeen = false, burst = false, lastSt = null;
  function numberLine(el, pct, soon) {
    const small = el.classList.contains("sm");
    const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter((t) => !small || t % 20 === 0);
    el.innerHTML = `<div class="fill"></div>${ticks.map((t, i) => `<span class="tk" style="right:${t}%;--i:${i}">${t}</span>`).join("")}
      <div class="pin ${soon ? "soon" : ""}">${soon ? "⏳ لم ينزل بعد" : pct.toFixed(1).replace(/\.0$/, "") + "%"}</div>`;
    if (!finalSeen) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add("go");
      el.querySelector(".fill").style.width = pct + "%";
      el.querySelector(".pin").style.right = (soon ? 50 : Math.min(94, Math.max(6, pct))) + "%";
    }));
  }
  function renderFinal(st) {
    const S = T.stats(st);
    numberLine($("#nlYear"), S.all.pct);
    numberLine($("#nlS1"), S.s1.pct);
    numberLine($("#nlS2"), S.s2.pct, !S.s2.released);
    $("#yearNote").textContent = S.s2.released ? `${S.all.done} درس مكتمل من ${S.all.n}` : "الفصل الثاني لسا ما نزل، فالنسبة هلأ محسوبة من دروس الفصل الأول";
  }
  function setupFinal() {
    const fin = $("#final");
    for (let i = 0; i < 14; i++) {
      const sp = document.createElement("span"); sp.className = "spark"; sp.textContent = ["✨", "⭐", "💫", "🌟"][i % 4];
      sp.style.cssText = `left:${Math.random() * 94}%;top:${10 + Math.random() * 80}%;animation-delay:${(Math.random() * 4).toFixed(2)}s;animation-duration:${(3 + Math.random() * 3).toFixed(2)}s`;
      fin.appendChild(sp);
    }
    new IntersectionObserver((es, io) => es.forEach((e) => {
      if (!e.isIntersecting || !lastSt) return;
      io.disconnect(); finalSeen = true; fin.classList.add("go"); renderFinal(lastSt);
      if (!burst && T.stats(lastSt).all.pct > 0) { burst = true; setTimeout(() => T.confetti(120), 1900); }
    }), { threshold: 0.35 }).observe(fin);
  }

  /* ---------------- تقويم آخر 5 أسابيع ---------------- */
  function renderHeat(st) {
    const days = T.lastDays(st, 35);
    $("#heat").innerHTML = days.map((d, i) => {
      const score = d.pg + d.mn / 10 + d.dq;
      const lvl = score <= 0 ? 0 : score < 6 ? 1 : score < 16 ? 2 : 3;
      return `<div class="hd l${lvl} ${i === 34 ? "today" : ""}" style="--i:${i}" title="${T.fmtShort(d.date)}: ${d.pg} صفحة · ${d.mn} دقيقة"><span>${d.date.getDate()}</span></div>`;
    }).join("");
  }

  /* ---------------- مؤقت الدراسة ---------------- */
  const KEY = "tj_timer_" + T.CFG.channelId;
  const C = 2 * Math.PI * 88;
  let tm = { total: 25 * 60, left: 25 * 60, end: 0, running: false, brk: false };
  try { const s = JSON.parse(T.ls.get(KEY)); if (s && s.total) tm = s; } catch {}
  let tick = null;
  const save = () => T.ls.set(KEY, JSON.stringify(tm));
  const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  function studiedToday() { try { const o = JSON.parse(T.ls.get(KEY + "_d")) || {}; return o[T.dayKey()] || 0; } catch { return 0; } }
  function addStudied(min) { let o = {}; try { o = JSON.parse(T.ls.get(KEY + "_d")) || {}; } catch {} o[T.dayKey()] = (o[T.dayKey()] || 0) + min; T.ls.set(KEY + "_d", JSON.stringify(o)); }
  function drawTimer() {
    if (tm.running) tm.left = Math.max(0, Math.round((tm.end - Date.now()) / 1000));
    $("#tTime").textContent = fmt(tm.left);
    $("#tMode").textContent = tm.brk ? "☕ استراحة" : tm.running ? "🔥 ركّز…" : "جلسة دراسة";
    const bar = $("#tBar");
    bar.style.strokeDasharray = C; bar.style.strokeDashoffset = C * (1 - tm.left / tm.total);
    bar.classList.toggle("brk", tm.brk);
    $(".timer").classList.toggle("running", tm.running);
    $("#tStart").textContent = tm.running ? "⏸️ إيقاف مؤقت" : tm.left < tm.total ? "▶️ كمّل" : "▶️ ابدأ";
    const m = studiedToday();
    $("#tStudied").textContent = m ? `⏱️ درست اليوم بالمؤقت: ${m} دقيقة` : "";
    document.title = tm.running ? `${fmt(tm.left)} · توجيهي محمد` : "توجيهي محمد 2027";
    if (tm.running && tm.left <= 0) finish();
  }
  function finish() {
    const wasBreak = tm.brk, mins = Math.round(tm.total / 60);
    tm.running = false; tm.left = tm.total; clearInterval(tick); save();
    T.chime(); setTimeout(() => T.chime(), 600);
    if (wasBreak) { T.toast("☕ خلصت الاستراحة — يلا نرجع ندرس 💪"); drawTimer(); return; }
    addStudied(mins); T.confetti(90);
    T.toast(`🎉 عاش! خلصت ${mins} دقيقة دراسة. سجّل شو قرأت`);
    drawTimer();
    setTimeout(() => { $("#openLog").click(); setTimeout(() => { const el = $("#lMn"); el.value = (+el.value || 0) + mins; el.dispatchEvent(new Event("input")); }, 100); }, 900);
  }
  function setupTimer() {
    document.querySelectorAll("#tPresets .chip").forEach((c) => {
      c.classList.toggle("on", +c.dataset.min * 60 === tm.total && !!c.dataset.break === tm.brk);
      c.addEventListener("click", () => {
        if (tm.running && !confirmSwitch()) return;
        document.querySelectorAll("#tPresets .chip").forEach((x) => x.classList.remove("on")); c.classList.add("on");
        clearInterval(tick); tm = { total: +c.dataset.min * 60, left: +c.dataset.min * 60, end: 0, running: false, brk: !!c.dataset.break }; save(); drawTimer();
      });
    });
    $("#tStart").addEventListener("click", () => {
      if (tm.running) { tm.left = Math.max(0, Math.round((tm.end - Date.now()) / 1000)); tm.running = false; clearInterval(tick); }
      else { tm.end = Date.now() + tm.left * 1000; tm.running = true; tick = setInterval(drawTimer, 250); }
      save(); drawTimer();
    });
    $("#tReset").addEventListener("click", () => { clearInterval(tick); tm.running = false; tm.left = tm.total; save(); drawTimer(); });
    if (tm.running) tick = setInterval(drawTimer, 250);
    drawTimer();
  }
  let switchWarned = 0;
  function confirmSwitch() { if (Date.now() - switchWarned < 4000) return true; switchWarned = Date.now(); T.toast("المؤقت شغّال — اضغط مرة ثانية لتغيّره", "warn"); return false; }

  /* ---------------- ربط مع الصفحة ---------------- */
  let ready = false;
  window.APP_EXTRA = {
    render(st) {
      lastSt = st;
      if (!ready) { ready = true; setupFinal(); setupTimer(); }
      renderHeat(st); renderFinal(st);
    },
  };

  boot();
})();
