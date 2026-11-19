(() => {
  "use strict";
  const green = "#11796d";
  const purple = "#7657cc";
  const muted = "#596478";
  const amounts = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 6 });
  const latestResults = new WeakMap();
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) draw(entry.target, latestResults.get(entry.target));
  });

  function add(parent, tag, attrs, text) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  }

  function scaleFor(cash) {
    if (cash === 0) return { step: 1, top: 0 };
    const target = Math.max(1, cash / 4);
    const magnitude = 10 ** Math.floor(Math.log10(target));
    const multiple = [1, 2, 2.5, 5, 10].reduce((a, b) =>
      Math.abs(b * magnitude - target) < Math.abs(a * magnitude - target) ? b : a);
    const step = Math.ceil(multiple * magnitude);
    return { step, top: Math.ceil(cash / step) * step };
  }

  function draw(element, result) {
    if (!result?.ok) {
      const message = document.createElement("p");
      message.style.cssText = "padding:1rem;color:#596478;font-size:.9rem";
      message.textContent = "填写有效参数后，这里会显示每月现金余额。";
      element.replaceChildren(message);
      return;
    }
    const width = element.clientWidth;
    if (!width) return;
    const height = element.clientHeight || 230;
    const font = Math.max(12, parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.8);
    const { cash, months, rows } = result;
    const coincident = rows.every(row => row.continuing.balance === row.paused.balance);
    const note = !months ? "仅显示期初" : coincident ? "两条余额线重合" : "";
    const { step, top } = scaleFor(cash);
    const divisor = top >= 1e10 ? 1e10 : top >= 1e6 ? 1e6 : 100;
    const unit = divisor === 1e10 ? "亿元" : divisor === 1e6 ? "万元" : "元";
    const yTicks = [];
    for (let amount = 0; amount <= top; amount += step) {
      yTicks.push({ value: amount, text: amounts.format(amount / divisor) });
    }
    const labelWidth = Math.max(...yTicks.map(tick => tick.text.length)) * font * 0.65;
    const left = Math.ceil(labelWidth + font);
    const right = width - font;
    const label = "现金余额（" + unit + "）";
    const wrapNote = note && (label.length + note.length + 2) * font > width;
    const upper = font * (wrapNote ? 4.1 : 2.7);
    const lower = height - font * 3.05;
    const x = month => months ? left + month / months * (right - left) : left;
    const y = amount => top ? lower - amount / top * (lower - upper) : lower;

    const description = "从期初至停薪第 " + months + " 个月的继续定投及暂停定投现金余额。" + note;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", [0, 0, width, height].join(" "));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", description);
    svg.setAttribute("font-size", font);
    svg.setAttribute("fill", muted);
    svg.style.cssText = "display:block;width:100%;height:100%";
    add(svg, "text", { x: 2, y: font * 1.2 }, label);
    if (note) add(svg, "text", { x: wrapNote ? 2 : right, y: font * (wrapNote ? 2.6 : 1.2),
      "text-anchor": wrapNote ? "start" : "end" }, note);

    const tickSpacing = (lower - upper) / Math.max(1, yTicks.length - 1);
    const labelStride = Math.max(1, Math.ceil(font * 1.35 / Math.max(1, tickSpacing)));
    for (const [index, tick] of yTicks.entries()) {
      const pos = y(tick.value);
      add(svg, "line", { x1: left, y1: pos, x2: right, y2: pos,
        stroke: tick.value ? "#e1e6ed" : "#b5c0cb", "stroke-dasharray": tick.value ? "3 4" : "none" });
      if (index % labelStride === 0) {
        add(svg, "text", { x: left - font * 0.5, y: pos + font * 0.33, "text-anchor": "end" }, tick.text);
      }
    }
    const divisions = Math.min(months, Math.max(1, Math.min(6, Math.floor((right - left) / (font * 3.7)))));
    for (let i = 0; i <= divisions; i++) {
      const month = divisions ? Math.round(i * months / divisions) : 0;
      add(svg, "text", { x: x(month), y: lower + font * 1.45,
        "text-anchor": month === 0 ? "start" : month === months ? "end" : "middle" }, month || "期初");
    }
    add(svg, "text", { x: right, y: height - font * 0.4, "text-anchor": "end" }, "停薪月数（月）");

    for (const [key, color] of [["continuing", green], ["paused", purple]]) {
      const paused = key === "paused";
      const points = [[x(0), y(cash)], ...rows.map(row => [x(row.month), y(row[key].balance)])];
      if (months) add(svg, "polyline", { points: points.map(p => p.join(",")).join(" "),
        fill: "none", stroke: color, "stroke-width": paused ? 2.25 : 3.4,
        "stroke-dasharray": paused ? "6 5" : "none", "stroke-linecap": "round", "stroke-linejoin": "round" });
      const markers = months > 12 ? [points[0], points[points.length - 1]] : points;
      for (const [cx, cy] of markers) {
        add(svg, "circle", { cx, cy, r: paused ? 4 : 2.6,
          fill: paused ? "none" : color, stroke: color, "stroke-width": paused ? 1.6 : 1 });
      }
    }
    element.replaceChildren(svg);
  }

  function render(element, result) {
    if (!latestResults.has(element)) observer.observe(element);
    latestResults.set(element, result);
    draw(element, result);
  }

  window.StressChart = Object.freeze({ render });
})();
