/* ===========================================================
   📖 كتبي — قارئ الكتب صفحة صفحة مع أسئلة لكل صفحة
   =========================================================== */
(function () {
  "use strict";
  const T = window.TJ, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BOOK_IDS = ["is"];
  const books = {};
  const esc = T.esc;
  let cur = null, page = 1, view = "page";

  const getSt = () => (window.APP ? window.APP.st() : null);
  function doneSet(bid) {
    const st = getSt(); if (!st) return new Set();
    st.books = st.books || {};
    return new Set(st.books[bid] || []);
  }
  function setDone(bid, p, on) {
    const st = getSt(); if (!st) return;
    st.books = st.books || {};
    const s = new Set(st.books[bid] || []);
    on ? s.add(p) : s.delete(p);
    st.books[bid] = [...s].sort((a, b) => a - b);
    window.APP.save();
  }
  const lastKey = (bid) => "tj_book_last_" + bid;

  /* ---------- البطاقات بالصفحة الرئيسية ---------- */
  function renderShelf() {
    const box = $("#bookShelf"); if (!box) return;
    box.innerHTML = BOOK_IDS.map((id) => {
      const b = books[id];
      if (!b) return `<div class="card book-card"><div class="empty">جارِ تحميل الكتاب…</div></div>`;
      const done = doneSet(id), withQ = Object.keys(b.q).length, total = b.pages - b.start + 1;
      const pct = Math.round((done.size / total) * 100);
      return `<div class="card hover book-card" style="--c:${b.color}" data-book="${id}">
        <div class="glow"></div>
        <div class="row"><div class="book-ico">${b.icon}</div><div class="grow"><h3>${b.title}</h3>
          <div class="small muted">${b.pages} صفحة · أسئلة جاهزة لـ ${withQ} صفحة</div></div>
          <div class="book-pct">${pct}<small>%</small></div></div>
        <div class="bar mt" style="--c:${b.color}"><i style="width:${pct}%"></i></div>
        <div class="row mt" style="justify-content:space-between"><span class="small muted">✅ خلّصت ${done.size} صفحة من ${total}</span>
          <button class="btn sm" type="button">📖 افتح الكتاب</button></div>
      </div>`;
    }).join("");
    $$("[data-book]", box).forEach((el) => el.addEventListener("click", () => open(el.dataset.book)));
  }

  /* ---------- القارئ ---------- */
  function open(bid, p) {
    cur = books[bid]; if (!cur) return;
    page = p || +(T.ls ? T.ls.get(lastKey(bid)) : localStorage.getItem(lastKey(bid))) || cur.start;
    view = "page";
    $("#reader").classList.add("open"); document.body.style.overflow = "hidden";
    draw();
  }
  function close() { $("#reader").classList.remove("open"); document.body.style.overflow = ""; renderShelf(); }
  function go(p) {
    page = Math.min(cur.pages, Math.max(1, p)); view = "page";
    try { localStorage.setItem(lastKey(cur.id), page); } catch {}
    draw(); $("#rdBody").scrollTop = 0;
  }

  function draw() {
    const done = doneSet(cur.id);
    $("#rdTitle").textContent = `${cur.icon} ${cur.title}`;
    $("#rdSub").textContent = view === "list" ? "كل الصفحات" : `صفحة ${page} من ${cur.pages}`;
    $("#rdList").classList.toggle("on", view === "list");
    if (view === "list") return drawList(done);
    const d = cur.q[page];
    const isDone = done.has(page);
    $("#rdBody").innerHTML = `
      ${d ? `<div class="pg-h">${esc(d.h)}</div>` : ""}
      <div class="pg-img"><img src="books/${cur.id}/img/${page}.jpg" alt="صفحة ${page}" loading="eager"><div class="pg-load">⏳</div></div>
      ${d ? `<div class="qs-h"><b>📝 أسئلة الصفحة (${d.qs.length})</b><span class="small muted" id="qScore"></span></div>
        <div class="qs">${d.qs.map((q, i) => qHtml(q, i)).join("")}</div>`
        : `<div class="empty"><span class="e">${page < cur.start ? "📘" : "⏳"}</span>${page < cur.start ? "صفحة تمهيدية بدون أسئلة" : "أسئلة هالصفحة لسا عم تنكتب، رح تنضاف قريبًا"}</div>`}
      <button class="btn block mt ${isDone ? "ghost" : "green"}" id="markDone">${isDone ? "↩️ إلغاء: خلّصت هالصفحة" : "✅ خلّصت هالصفحة"}</button>`;
    const img = $(".pg-img img");
    img.onload = () => img.parentNode.classList.add("ok");
    img.onclick = () => img.parentNode.classList.toggle("zoom");
    // preload next
    if (page < cur.pages) { const n = new Image(); n.src = `books/${cur.id}/img/${page + 1}.jpg`; }
    bindQs(d);
    $("#markDone").onclick = () => {
      setDone(cur.id, page, !isDone);
      if (!isDone) { T.confetti(70); T.toast(`✅ صفحة ${page} خلصت!`); setTimeout(() => go(page + 1), 700); } else draw();
    };
    $("#rdPrev").disabled = page <= 1; $("#rdNext").disabled = page >= cur.pages;
    $("#rdPage").value = page;
  }

  function qHtml(q, i) {
    const n = `<span class="qn">${i + 1}</span>`;
    if (q.t === "m") return `<div class="q" data-i="${i}">${n}<div class="qt">${esc(q.q)}</div>
      <div class="opts">${q.o.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span>${"أبجد"[k]}</span>${esc(o)}</button>`).join("")}</div><div class="fb"></div></div>`;
    if (q.t === "tf") return `<div class="q" data-i="${i}">${n}<div class="qt">${esc(q.q)}</div>
      <div class="opts tf"><button type="button" class="opt" data-k="1">✔️ صح</button><button type="button" class="opt" data-k="0">✖️ خطأ</button></div><div class="fb"></div></div>`;
    return `<div class="q" data-i="${i}">${n}<div class="qt">${esc(q.q)}</div>
      <button type="button" class="btn ghost sm show-a">👁️ أظهر الجواب</button><div class="ans">${esc(q.a).replace(/\n/g, "<br>")}</div></div>`;
  }
  function bindQs(d) {
    if (!d) return;
    let right = 0, answered = 0;
    const objective = d.qs.filter((q) => q.t !== "s").length;
    const score = () => { $("#qScore").textContent = objective ? `✔️ ${right} صح من ${answered} (${objective} سؤال اختيار)` : ""; };
    score();
    $$(".q").forEach((el) => {
      const q = d.qs[+el.dataset.i];
      if (q.t === "s") {
        $(".show-a", el).onclick = (e) => { el.classList.toggle("open"); e.target.textContent = el.classList.contains("open") ? "🙈 أخفِ الجواب" : "👁️ أظهر الجواب"; };
        return;
      }
      $$(".opt", el).forEach((b) => b.onclick = () => {
        if (el.classList.contains("done")) return;
        el.classList.add("done"); answered++;
        const k = +b.dataset.k, correct = q.t === "m" ? q.a : (q.a ? 1 : 0);
        $$(".opt", el).forEach((x) => { if (+x.dataset.k === correct) x.classList.add("right"); });
        if (k === correct) { right++; b.classList.add("right"); $(".fb", el).innerHTML = "✅ صح! ممتاز"; T.chime && T.chime(); }
        else { b.classList.add("wrong"); $(".fb", el).innerHTML = `❌ غلط، الجواب الصحيح: <b>${q.t === "m" ? esc(q.o[correct]) : (correct ? "صح" : "خطأ")}</b>`; }
        score();
        if (answered === objective && right === objective && objective > 0) { T.confetti(90); T.toast("🌟 جبت العلامة الكاملة بأسئلة هالصفحة!"); }
      });
    });
  }

  function drawList(done) {
    let html = `<div class="pg-grid">`;
    for (let p = 1; p <= cur.pages; p++) {
      const d = cur.q[p];
      html += `<button type="button" class="pg-cell ${done.has(p) ? "done" : ""} ${d ? "hasq" : ""} ${p === page ? "cur" : ""}" data-p="${p}">
        <b>${p}</b>${d ? `<span>${esc(d.h.length > 42 ? d.h.slice(0, 42) + "…" : d.h)}</span><i>📝 ${d.qs.length}</i>` : `<span class="dim">${p < cur.start ? "تمهيد" : "قريبًا"}</span>`}</button>`;
    }
    $("#rdBody").innerHTML = html + `</div>`;
    $$(".pg-cell").forEach((c) => c.onclick = () => go(+c.dataset.p));
    const c = $(".pg-cell.cur"); c && c.scrollIntoView({ block: "center" });
  }

  /* ---------- إعداد ---------- */
  function mount() {
    const r = document.createElement("div");
    r.className = "reader"; r.id = "reader";
    r.innerHTML = `<div class="rd-top">
        <button class="btn ghost sm" id="rdClose">✕</button>
        <div class="grow" style="min-width:0"><b id="rdTitle"></b><div class="small muted" id="rdSub"></div></div>
        <button class="btn ghost sm" id="rdList">🗂️ الصفحات</button>
      </div>
      <div class="rd-body" id="rdBody"></div>
      <div class="rd-nav">
        <button class="btn ghost sm" id="rdPrev">➡️ السابقة</button>
        <div class="row" style="gap:6px"><span class="small muted">صفحة</span><input id="rdPage" type="number" min="1" inputmode="numeric"></div>
        <button class="btn ghost sm" id="rdNext">التالية ⬅️</button>
      </div>`;
    document.body.appendChild(r);
    $("#rdClose").onclick = close;
    $("#rdList").onclick = () => { view = view === "list" ? "page" : "list"; draw(); };
    $("#rdNext").onclick = () => go(page + 1);
    $("#rdPrev").onclick = () => go(page - 1);
    $("#rdPage").onchange = (e) => go(+e.target.value || 1);
    document.addEventListener("keydown", (e) => {
      if (!$("#reader").classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") go(page + 1);
      if (e.key === "ArrowRight") go(page - 1);
    });
    BOOK_IDS.forEach((id) => fetch(`books/${id}/data.json`, { cache: "no-cache" }).then((r) => r.json()).then((b) => { books[id] = b; renderShelf(); }).catch(() => {}));
    renderShelf();
  }

  window.BOOKS = { renderShelf };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
