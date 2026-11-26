(() => {
  "use strict";
  const paths = {
    orbit: '<ellipse cx="12" cy="12" rx="10" ry="4.7" transform="rotate(-27 12 12)"/><ellipse cx="12" cy="12" rx="4.5" ry="9.8" transform="rotate(-34 12 12)"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    shield: '<path d="M12 3 4 6v5c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V6Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    brain: '<path d="M12 5.2a3 3 0 0 0-5.7-1A3.4 3.4 0 0 0 3.6 9a4.1 4.1 0 0 0-.1 7 3.5 3.5 0 0 0 3.4 4A2.8 2.8 0 0 0 12 18V5.2Zm0 0a3 3 0 0 1 5.7-1A3.4 3.4 0 0 1 20.4 9a4.1 4.1 0 0 1 .1 7 3.5 3.5 0 0 1-3.4 4A2.8 2.8 0 0 1 12 18"/><path d="M5.5 9.5c2 .2 3 1.3 3 3M7 17c.1-1.6 1.1-2.5 2.5-3M18.5 9.5c-2 .2-3 1.3-3 3M17 17c-.1-1.6-1.1-2.5-2.5-3"/>',
    path: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.5 6H16a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M10 9v12"/>',
    book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20v-2.1a6.5 6.5 0 0 1 13 0V20"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    box: '<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10"/>',
    "chevron-right": '<path d="m9 6 6 6-6 6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16.5l9 5 9-5"/>',
    activity: '<path d="M2 13h5l3-8 4 14 3-8h5"/>',
    trend: '<path d="m3 17 6-6 4 4 8-9m-6 0h6v6"/>',
    pie: '<path d="M11 3a9 9 0 1 0 10 10H11V3Z"/><path d="M15 2.8V9h6.3A8.4 8.4 0 0 0 15 2.8Z"/>',
    wallet: '<path d="M20 8H5a2 2 0 0 1 0-4h12v4M3 6v12a2 2 0 0 0 2 2h15V8"/><path d="M21 12h-5a2 2 0 0 0 0 4h5v-4Z"/>',
    sliders: '<path d="M3 6h5m4 0h9M3 12h10m4 0h4M3 18h3m4 0h11"/><circle cx="10" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    reset: '<path d="M3 5v5h5M3.5 10a8 8 0 1 1 .8 6"/>',
    chart: '<path d="M3 3v17h18M6 14l4-5 4 3 6-7"/>',
    bulb: '<path d="M8.5 15a6 6 0 1 1 7 0c-1 .8-1.5 1.8-1.5 3h-4c0-1.2-.5-2.2-1.5-3ZM10 21h4"/>',
    braces: '<path d="M9 3H7a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2M15 3h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2"/>',
    external: '<path d="M14 3h7v7m0-7L11 13M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>'
  };
  document.querySelectorAll("i[data-icon]").forEach(icon => {
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + paths[icon.dataset.icon] + '</svg>';
  });

  const id = name => document.getElementById(name);
  const form = id("parameters");
  const stateKey = "personal-toolbox.kelly.v1";
  const defaults = { winProbability:"60", winAmount:"1", lossAmount:"1", bankroll:"10000", fraction:"1" };
  const strategies = { "1":"全凯利", "0.5":"半凯利", "0.25":"¼ 凯利" };
  const examples = [
    ["对称盈亏", "胜率 60% · 赢 1 元 / 输 1 元 · 全凯利", defaults],
    ["小概率高回报", "胜率 30% · 赢 3 元 / 输 1 元 · 半凯利", {...defaults, winProbability:"30", winAmount:"3", fraction:"0.5"}],
    ["部分亏损", "胜率 55% · 赢 0.6 元 / 输 0.4 元 · 全凯利", {...defaults, winProbability:"55", winAmount:"0.6", lossAmount:"0.4"}],
    ["负期望", "胜率 45% · 赢 1 元 / 输 1 元 · 全凯利", {...defaults, winProbability:"45"}]
  ];
  let result;
  function setFields(values) {
    for (const key of Object.keys(defaults)) form.elements.namedItem(key).value = values[key];
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(stateKey));
      if (saved && Object.keys(defaults).every(k => typeof saved[k] === "string") &&
          Object.prototype.hasOwnProperty.call(strategies, saved.fraction) && ToolboxMath.calculate(saved).ok) setFields(saved);
    } catch { /* 初次使用或浏览器禁用存储时使用当前表单。 */ }
  }
  function groupDigits(value) {
    const [whole, decimals] = value.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimals === undefined ? grouped : grouped + "." + decimals;
  }
  function formatMoney(exact) { return groupDigits(exact.toFixed(2)); }
  // Display bounds explicitly when a nonzero result would round to zero.
  function numberText(exact, digits = 2, percent = false) {
    const value = percent ? exact.percent(digits).slice(0,-1) : exact.toFixed(digits);
    const sign = exact.compare(0);
    if (sign && Number(value) === 0) return (sign > 0 ? "<" : ">−") + (10 ** -digits).toFixed(digits);
    if (percent && exact.compare(1) < 0 && value === (100).toFixed(digits)) return "<" + value;
    return value.replace("-", "−");
  }
  function decimal(exact) {
    // Inputs, complementary probabilities and EV all have terminating decimal expansions.
    const magnitude = exact.numerator < 0n ? -exact.numerator : exact.numerator;
    let remainder = magnitude % exact.denominator;
    let value = String(magnitude / exact.denominator);
    if (remainder) value += ".";
    while (remainder) {
      remainder *= 10n;
      value += String(remainder / exact.denominator);
      remainder %= exact.denominator;
    }
    return (exact.numerator < 0n ? "−" : "") + value;
  }
  function pct(exact) { return numberText(exact, 2, true) + "%"; }
  function metric(name, value, suffix = "", prefix = "") {
    const el = id(name);
    el.replaceChildren();
    if (prefix) { const span = document.createElement("span"); span.className = "currency"; span.textContent = prefix; el.append(span); }
    el.append(document.createTextNode(value));
    if (suffix) { const span = document.createElement("span"); span.className = suffix === "%" ? "percent" : "unit"; span.textContent = suffix; el.append(span); }
  }
  function addStep(container, index, title, calculation, detail) {
    const item = document.createElement("div");
    item.className = "step";
    const heading = document.createElement("h3");
    const number = document.createElement("span");
    number.textContent = index;
    heading.append(number, title);
    const code = document.createElement("code");
    code.textContent = calculation;
    const p = document.createElement("p");
    p.textContent = detail;
    item.append(heading, code, p);
    container.append(item);
  }
  function renderCalculations() {
    const values = Object.fromEntries(new FormData(form));
    result = ToolboxMath.calculate(values);
    const slider = id("probability-slider");
    if (!result.errors?.winProbability) {
      slider.value = String(Number(values.winProbability.normalize("NFKC")));
      slider.style.setProperty("--position", slider.value + "%");
      slider.setAttribute("aria-valuetext", slider.value + "%");
    }
    const badge = id("edge-badge");
    const steps = id("steps");
    steps.replaceChildren();
    Object.keys(defaults).filter(key => key !== "fraction").forEach(key => {
      const error = result.errors?.[key] || "";
      id("err-" + key).textContent = error;
      id(key).setAttribute("aria-invalid", String(Boolean(error)));
    });
    if (!result.ok) {
      badge.hidden = true;
      ["metric-ev","metric-allocation","metric-stake"].forEach(name => metric(name, "—"));
      id("metric-ev").className = "metric-num";
      id("allocation-caption").textContent = "等待有效参数";
      id("stake-caption").textContent = "等待有效参数";
      id("insight").textContent = "修正标出的参数后，即可查看增长曲线。";
      steps.textContent = "请先填写有效参数。";
      id("storage-status").textContent = "当前输入待修正";
    } else {
      try { localStorage.setItem(stateKey, JSON.stringify(values)); id("storage-status").textContent = "参数已存于本机"; }
      catch { id("storage-status").textContent = "当前会话"; }
      const {ev,edgeSign,p,q,win,loss,rawKelly,fullKelly,allocation,stake,bankroll,breakEven} = result;
      badge.hidden = false;
      const edgeClass = edgeSign > 0 ? "positive" : edgeSign < 0 ? "negative" : "";
      badge.className = "badge " + edgeClass;
      badge.textContent = edgeSign > 0 ? "正期望" : edgeSign < 0 ? "负期望" : "盈亏平衡";
      id("metric-ev").className = "metric-num " + edgeClass;
      let displayedEV = numberText(ev);
      if (edgeSign > 0 && !displayedEV.startsWith("<")) displayedEV = "+" + displayedEV;
      metric("metric-ev", displayedEV, "元");
      metric("metric-allocation", numberText(allocation, 2, true), "%");
      metric("metric-stake", formatMoney(stake), "", "¥");
      id("allocation-caption").textContent = strategies[values.fraction] + " · 占可用本金的比例";
      id("stake-caption").textContent = "可用本金 ¥" + groupDigits(decimal(bankroll));
      id("insight").replaceChildren();
      const strong = document.createElement("strong");
      if (edgeSign <= 0) {
        strong.textContent = "最优仓位为 0%。";
        id("insight").append(strong, edgeSign === 0 ? "当前正好达到盈亏平衡，增加仓位会降低预期对数增长率。" : "当前胜率低于盈亏平衡点，模型选择保留本金。");
      } else {
        strong.textContent = "全凯利峰值在 " + pct(fullKelly) + " 仓位。";
        id("insight").append(strong, rawKelly.compare(1) > 0 ? "理论仓位超过本金，图中按 100% 上限计算。" : "当前盈亏条件下，胜率达到 " + pct(breakEven) + " 即可盈亏平衡。");
      }
      addStep(steps, "1", "按概率加权", decimal(p) + " × " + decimal(win) + " − " + decimal(q) + " × " + decimal(loss) + " = " + decimal(ev), "用获胜的平均贡献减去失败的平均损失。");
      addStep(steps, "2", "求全凯利仓位", "f* = " + decimal(ev) + " ÷ (" + decimal(win) + " × " + decimal(loss) + ")", "将结果限制在 0% 至 100%，得到 " + pct(fullKelly) + "。");
      addStep(steps, "3", "换算投入金额", "本金 × 全凯利仓位 × " + values.fraction, strategies[values.fraction] + "投入 ¥" + formatMoney(stake) + "，向下取到分。");
    }
    if (!id("calculator-view").hidden) GrowthChart.render(id("plot"), result);
  }
  function announce(message) { id("announcer").textContent = message; }
  function applyScenario(values, title) {
    setFields(values);
    renderCalculations();
    announce("已载入" + title);
  }
  form.addEventListener("input", event => {
    if (event.target.id === "probability-slider") id("winProbability").value = event.target.value;
    renderCalculations();
  });
  form.addEventListener("submit", event => event.preventDefault());
  id("reset").addEventListener("click", () => applyScenario(defaults, "默认参数"));
  const dialog = id("examples");
  examples.forEach(([title, copy, values]) => {
    const button = document.createElement("button");
    button.className = "example-item"; button.type = "button";
    const heading = document.createElement("strong"); heading.textContent = title;
    const small = document.createElement("small"); small.textContent = copy;
    button.append(heading, small);
    button.addEventListener("click", () => {
      dialog.close(); if (location.hash !== "#calculator") location.hash = "calculator";
      applyScenario(values, title);
    });
    id("example-list").append(button);
  });
  id("open-examples").addEventListener("click", () => dialog.showModal());
  id("close-examples").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });

  const rail = id("rail");
  const scrim = document.querySelector(".scrim");
  const mobile = window.matchMedia("(max-width:840px)");
  function toggleMenu(open, returnFocus = false) {
    rail.classList.toggle("open", open); scrim.hidden = !open;
    id("menu").setAttribute("aria-expanded", String(open));
    if (open) rail.querySelector('[aria-current]').focus();
    if (returnFocus) id("menu").focus();
  }
  id("menu").addEventListener("click", () => toggleMenu(true));
  scrim.addEventListener("click", () => toggleMenu(false, true));
  rail.addEventListener("click", event => { if (event.target.closest("a") && rail.classList.contains("open")) toggleMenu(false, true); });
  document.addEventListener("keydown", event => {
    if (!rail.classList.contains("open")) return;
    if (event.key === "Escape") toggleMenu(false, true);
    if (event.key === "Tab") {
      const links = rail.querySelectorAll("a");
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links[links.length-1].focus(); }
      else if (!event.shiftKey && document.activeElement === links[links.length-1]) { event.preventDefault(); links[0].focus(); }
    }
  });
  mobile.addEventListener("change", () => toggleMenu(false));
  const dosePanels = {state:window.DoseState, friction:window.DoseFriction, actions:window.DoseActions};
  const mountedDosePanels = new Set();
  let doseMode;
  function updateDoseTimerMark() {
    id("dose-timer-mark").hidden = !window.DoseActions.hasActive();
  }
  function openDoseMode(mode, moveFocus = false) {
    if (!Object.prototype.hasOwnProperty.call(dosePanels, mode)) return;
    doseMode = mode;
    for (const button of id("dose-modes").querySelectorAll("button")) {
      const active = button.dataset.doseMode === mode;
      button.setAttribute("aria-pressed", String(active));
      id("dose-" + button.dataset.doseMode + "-panel").hidden = !active;
      if (active && moveFocus) button.focus();
    }
    if (!mountedDosePanels.has(mode)) {
      dosePanels[mode].mount(id("dose-" + mode + "-panel"));
      mountedDosePanels.add(mode);
    }
    updateDoseTimerMark();
  }
  const doseView = id("dose-view");
  id("dose-modes")?.addEventListener("click", event => {
    const button = event.target.closest("[data-dose-mode]");
    if (button) openDoseMode(button.dataset.doseMode);
  });
  doseView?.addEventListener("dose-mode", event => {
    const {mode,goal} = event.detail;
    openDoseMode(mode, true);
    if (mode === "actions" && goal) id("dose-actions-panel").dispatchEvent(new CustomEvent("dose-goal", {detail:goal}));
  });
  doseView?.addEventListener("dose-timer-change", updateDoseTimerMark);
  if (doseView) window.addEventListener("storage", () => { if (!doseView.hidden) updateDoseTimerMark(); });
  const pageLabelInput = id("memory-page-label");
  id("sla-shortcuts")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-jump]");
    if (!button) return;
    const heading = id(button.dataset.jump);
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:"start"});
  });
  if (pageLabelInput) {
    const key = "toolbox.memory.sla.page";
    const applyLabel = label => {
      pageLabelInput.value = label || pageLabelInput.defaultValue;
      document.querySelectorAll("[data-sla-page]").forEach(badge => { badge.textContent = pageLabelInput.value; });
    };
    let saved;
    try { saved = localStorage.getItem(key); } catch { /* A private browser may disable storage. */ }
    applyLabel(saved);
    pageLabelInput.addEventListener("input", () => pageLabelInput.setCustomValidity(""));
    id("memory-page-form").addEventListener("submit", event => {
      event.preventDefault();
      const label = pageLabelInput.value.trim();
      if (!label || /^(P1|P3)$/i.test(label)) {
        pageLabelInput.setCustomValidity(label ? "这个页码已有卡片，请换一个。" : "请输入页码。");
        pageLabelInput.reportValidity();
        return;
      }
      applyLabel(label);
      const status = id("memory-page-status");
      try { localStorage.setItem(key, label); status.textContent = "页码已保存到此浏览器"; }
      catch { status.textContent = "页码已更新，本次访问有效"; }
    });
    window.addEventListener("storage", event => {
      if (event.key === key || event.key === null) applyLabel(event.newValue);
    });
  }
  function route(moveFocus = false) {
    const pages = { calculator:"期望值与凯利公式", tools:"全部工具", stress:"定投压力测试", brain:"大脑功能与状态", dose:"DOSE 奖赏状态", guide:"凯利公式手册", memory:"记忆强化 / 知识图谱区", sla:"极致高效二语习得闭环", "memory-p1":"P1 · DOSE 奖赏信使", "memory-p3":"P3 · 大脑架构" };
    const url = new URL(location.href);
    const requested = url.hash.slice(1) || url.searchParams.get("tool");
    const known = Object.prototype.hasOwnProperty.call(pages, requested);
    const view = known && id(requested + "-view");
    // An older cached document can load this router before it contains the requested tool.
    if (known && !view && !url.searchParams.has("toolbox-refresh")) {
      url.searchParams.set("toolbox-refresh", "1");
      location.replace(url.href);
      return;
    }
    const name = view ? requested : "tools";
    const inMemory = name === "sla" || name.startsWith("memory");
    document.body.classList.toggle("brain-active", name === "brain" || name === "dose" || inMemory);
    document.body.classList.toggle("memory-active", inMemory);
    document.body.classList.toggle("dose-active", name === "dose");
    Object.keys(pages).forEach(key => {
      const panel = id(key + "-view");
      if (panel) panel.hidden = key !== name;
      const link = document.querySelector('.nav-link[href="#' + key + '"]');
      if (!link) return;
      if (key === name) link.setAttribute("aria-current", "page");
      else if (key === "memory" && inMemory) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    id("current-page").textContent = pages[name];
    document.title = pages[name] + " · 个人工具箱";
    id("open-examples").hidden = name !== "calculator";
    id("storage-status").textContent = "当前设备";
    toggleMenu(false);
    if (moveFocus) { window.scrollTo(0,0); id("content").focus({preventScroll:true}); }
    if (name === "calculator") { renderCalculations(); drawSurface(); }
    if (name === "stress") StressTest.open();
    if (name === "sla") window.SLA.open();
    else window.SLA?.close();
    if (name.startsWith("memory-")) view.querySelectorAll("details[open]").forEach(detail => { detail.open = false; });
    if (name === "brain") {
      document.title = "大脑功能架构与状态诊断器 · 个人工具箱";
      BrainTool.open();
    } else if (window.BrainTool) BrainTool.close();
    if (name === "dose") {
      document.title = "DOSE 奖赏状态诊断与反成瘾决策器 · 个人工具箱";
      openDoseMode(doseMode || (window.DoseActions.hasActive() ? "actions" : "state"));
    }
  }
  window.addEventListener("hashchange", () => route(true));
  document.querySelector(".skip").addEventListener("click", event => {
    event.preventDefault();
    id("content").focus();
  });

  // Project a two-dimensional mesh onto the hero illustration.
  function drawSurface() {
    const canvas = id("surface");
    const {width:w, height:h} = canvas.getBoundingClientRect();
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr,dpr);
    function point(u,v) {
      const ridge = .77*Math.exp(-((u-.1)**2/.30 + (v+.19-.30*u)**2/.48))
        + .31*Math.exp(-((u+.68)**2/.18+(v-.18)**2/.48)) + .12*Math.sin(3*u+v)*Math.cos(2*v);
      return [w*(.50+.39*u+.22*v), h*(.81+.15*v-.175*u-.77*ridge), ridge];
    }
    const n = 33, m = 26;
    for (let j = 0; j < m; j++) {
      const v = -1 + 2*j/m;
      for (let i = n-1; i >= 0; i--) {
        const u = -1+2*i/n;
        const pts = [point(u,v),point(u+2/n,v),point(u+2/n,v+2/m),point(u,v+2/m)];
        const z = Math.max(0,pts[0][2]);
        const tone = Math.min(1,Math.max(0,(u+v+1.3)/2.8));
        ctx.beginPath();ctx.moveTo(...pts[0].slice(0,2));
        for (const p of pts.slice(1)) ctx.lineTo(p[0],p[1]);
        ctx.closePath();
        ctx.fillStyle = 'rgb('+ Math.round(44+42*z) +','+ Math.round(39+27*z) +','+ Math.round(74+69*z) +')';
        ctx.fill();
        ctx.strokeStyle = 'rgba('+Math.round(137+58*z-15*tone)+','+Math.round(103+32*z+53*tone)+','+Math.round(203+42*z)+','+(.36+.48*z)+')';
        ctx.lineWidth = .77; ctx.stroke();
      }
    }
    const p = point(.18,-.10);
    ctx.strokeStyle = "#d6c5ff80"; ctx.lineWidth = .85; ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0],p[1]-17); ctx.lineTo(p[0]+25,p[1]-17); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#eee2ff";ctx.shadowColor = "#b78aff";ctx.shadowBlur = 8;
    ctx.beginPath();ctx.arc(p[0],p[1],2.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  restore();
  route();
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.contentRect.width === 0) continue;
      if (entry.target.id === "surface") drawSurface();
      if (entry.target.id === "plot" && result) GrowthChart.render(entry.target, result);
    }
  });
  observer.observe(id("surface")); observer.observe(id("plot"));
})();
