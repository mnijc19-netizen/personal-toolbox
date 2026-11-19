(() => {
  "use strict";
  const get = id => document.getElementById(id);
  const form = get("stress-form");
  const ranges = [...form.querySelectorAll("input[type=range]")];
  const ledger = get("stress-ledger");
  const storageKey = "personal-toolbox.stress.v1";
  const defaults = { cash:"24000", fund:"40000", living:"4000", drop:"40", months:"6", contribution:"2000" };
  const units = { drop:"%", months:"个月", contribution:"元" };
  const integer = new Intl.NumberFormat("zh-CN", { maximumFractionDigits:0 });
  let initialized = false;
  let result;

  function amount(cents) {
    const fraction = cents % 100;
    return integer.format(Math.trunc(cents / 100)) + (fraction ? "." + String(fraction).padStart(2,"0") : "");
  }
  function yuan(cents) { return amount(cents) + " 元"; }
  function setFields(values) {
    for (const field of Object.keys(defaults)) form.elements.namedItem(field).value = values[field];
  }
  function syncSliders(values, errors) {
    for (const slider of ranges) {
      const field = slider.dataset.field;
      if (errors?.[field]) continue;
      const value = Number(values[field].trim().normalize("NFKC"));
      if (field === "contribution" && value > Number(slider.max)) slider.max = String(Math.ceil(value / 100) * 100);
      slider.value = String(value);
      slider.style.setProperty("--position", (100 * Number(slider.value) / Number(slider.max)) + "%");
      slider.setAttribute("aria-valuetext", slider.value + units[field]);
    }
  }
  function showRunway(id, captionId, plan) {
    const metric = get(id);
    metric.replaceChildren();
    if (plan.monthlyCost === 0) {
      metric.textContent = "不耗现金";
      get(captionId).textContent = "每月计划支出为 0 元";
      return;
    }
    const unit = document.createElement("span");
    unit.className = "unit";
    unit.textContent = "个整月";
    metric.append(integer.format(plan.fullMonths), unit);
    get(captionId).textContent = "若持续停薪，第 " + integer.format(plan.firstShortMonth) + " 个月首次不足";
  }
  function endLabel(plan) {
    if (plan.shortfall > 0) return "缺口 " + yuan(plan.shortfall);
    if (plan.balance > 0) return "剩余 " + yuan(plan.balance);
    return "结余 0 元，无缺口";
  }
  function showEnding(id, plan) {
    const el = get(id);
    el.textContent = endLabel(plan);
    el.classList.toggle("shortfall", plan.shortfall > 0);
  }
  function addStep(title, detail) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("p");
    p.textContent = detail;
    li.append(strong, p);
    get("stress-steps").append(li);
  }
  function runwayFormula(cash, plan) {
    if (plan.monthlyCost === 0) return "每月需求为 0 元，现金不会耗尽";
    return yuan(cash) + " ÷ " + yuan(plan.monthlyCost) + "，向下取整为 " + integer.format(plan.fullMonths) + " 个月";
  }
  function endFormula(cash, months, plan) {
    const cost = yuan(plan.monthlyCost) + " × " + months + " = " + yuan(plan.required);
    if (plan.shortfall) return cost + "，缺口 = " + yuan(plan.required) + " − " + yuan(cash) + " = " + yuan(plan.shortfall);
    return cost + "，结余 = " + yuan(cash) + " − " + yuan(plan.required) + " = " + yuan(plan.balance);
  }
  function showSteps(r) {
    addStep("计算基金浮亏", yuan(r.fund) + " × " + r.dropBps / 100 + "% = " + yuan(r.loss) + "（到分四舍五入）。下跌后原持仓价值为 " + yuan(r.fundAfter) + "，手头现金仍是 " + yuan(r.cash) + "。");
    addStep("列出每月现金需求", "继续定投，每月需 " + yuan(r.living) + "生活费 + " + yuan(r.contribution) + "定投 = " + yuan(r.continuing.monthlyCost) + "。暂停定投只需生活费 " + yuan(r.paused.monthlyCost) + "。");
    addStep("算出能付清的完整月数", "继续定投，" + runwayFormula(r.cash,r.continuing) + "。暂停定投，" + runwayFormula(r.cash,r.paused) + "。");
    addStep("核对停薪期末", "继续定投总需 " + endFormula(r.cash,r.months,r.continuing) + "。暂停定投总需 " + endFormula(r.cash,r.months,r.paused) + "。");
  }
  function ledgerRow(label, on, off) {
    const row = document.createElement("tr");
    const month = document.createElement("th");
    month.scope = "row";
    month.textContent = label;
    row.append(month);
    for (const plan of [on,off]) {
      const cell = row.insertCell();
      cell.textContent = "余额 " + yuan(plan.balance);
      if (plan.shortfall) {
        const detail = document.createElement("small");
        detail.className = "shortfall";
        detail.textContent = "累计缺口 " + yuan(plan.shortfall);
        cell.append(detail);
      }
    }
    return row;
  }
  function showLedger() {
    const body = get("stress-rows");
    body.replaceChildren();
    if (!ledger.open || !result?.ok) return;
    const fragment = document.createDocumentFragment();
    const initial = {balance:result.cash,shortfall:0};
    fragment.append(ledgerRow("期初", initial, initial));
    for (const row of result.rows) fragment.append(ledgerRow("第 " + row.month + " 月末", row.continuing, row.paused));
    body.append(fragment);
  }
  function update() {
    const values = Object.fromEntries(new FormData(form));
    result = StressMath.calculate(values);
    for (const field of Object.keys(defaults)) {
      const message = result.errors?.[field] || "";
      get("s-error-" + field).textContent = message;
      form.elements.namedItem(field).setAttribute("aria-invalid", String(Boolean(message)));
    }
    syncSliders(values, result.errors);
    get("stress-steps").replaceChildren();
    if (!result.ok) {
      for (const id of ["stress-run-on","stress-run-off","stress-loss","s-end-on","s-end-off"]) get(id).textContent = "—";
      for (const id of ["stress-on-caption","stress-off-caption","stress-fund-caption"]) get(id).textContent = "";
      get("stress-end-title").textContent = "停薪期末";
      get("stress-insight").textContent = "请修正标出的输入，再查看计算结果。";
      for (const hint of form.querySelectorAll(".range-result")) hint.textContent = "";
      get("storage-status").textContent = "当前输入待修正";
    } else {
      const r = result;
      showRunway("stress-run-on","stress-on-caption",r.continuing);
      showRunway("stress-run-off","stress-off-caption",r.paused);
      const unit = document.createElement("span");
      unit.className = "unit"; unit.textContent = "元";
      get("stress-loss").replaceChildren(amount(r.loss), unit);
      get("stress-fund-caption").textContent = "原持仓跌后价值 " + yuan(r.fundAfter);
      get("stress-end-title").textContent = r.months ? "停薪 " + r.months + " 个月后的结果" : "期初状态 · 停薪 0 个月";
      showEnding("s-end-on",r.continuing); showEnding("s-end-off",r.paused);
      let insight;
      if (r.months === 0) insight = "停薪期为 0 个月，尚未扣减生活费或定投。上方月数表示持续停薪时的现金承受能力。";
      else if (r.continuing.shortfall) insight = "第 " + r.continuing.firstShortMonth + " 个月首次无法付清生活费和定投。" +
        (r.paused.shortfall ? "即使暂停定投，第 " + r.paused.firstShortMonth + " 个月也会出现生活费缺口。" : "暂停定投后，生活费可覆盖整个停薪期。");
      else insight = "按当前计划，现金可以覆盖整个停薪期的生活费和定投。" + (r.continuing.balance ? "" : "期末现金刚好用完。");
      get("stress-insight").textContent = insight;
      get("range-result-drop").textContent = "原持仓浮亏 " + yuan(r.loss) + "，现金仍是 " + yuan(r.cash) + "。";
      get("range-result-months").textContent = "此时继续定投，期末" + endLabel(r.continuing) + "。";
      get("range-result-contribution").textContent = r.continuing.monthlyCost ? "每月需 " + yuan(r.continuing.monthlyCost) + "，现金可撑 " + integer.format(r.continuing.fullMonths) + " 个整月。" : "每月现金需求为 0 元。";
      showSteps(r);
      try { localStorage.setItem(storageKey,JSON.stringify(values)); get("storage-status").textContent = "参数已存于本机"; }
      catch { get("storage-status").textContent = "当前会话"; }
    }
    StressChart.render(get("stress-plot"), result);
    showLedger();
  }
  form.addEventListener("input", event => {
    if (event.target.matches("input[type=range]")) form.elements.namedItem(event.target.dataset.field).value = event.target.value;
    update();
  });
  form.addEventListener("submit", event => event.preventDefault());
  for (const slider of ranges) {
    const hint = document.createElement("small");
    hint.id = "range-result-" + slider.dataset.field;
    hint.className = "range-result";
    slider.after(hint);
  }
  get("stress-reset").addEventListener("click", () => {
    setFields(defaults);
    form.querySelector('[data-field="contribution"]').max = "10000";
    update();
    get("announcer").textContent = "已恢复定投压力测试示例";
  });
  ledger.addEventListener("toggle", showLedger);
  window.StressTest = {open() {
    if (!initialized) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && Object.keys(defaults).every(key => typeof saved[key] === "string") && StressMath.calculate(saved).ok) setFields(saved);
      } catch { /* 存储不可用时保留页面默认值。 */ }
      initialized = true;
    }
    update();
  }};
})();
