(function () {
  "use strict";

  const svgNS = "http://www.w3.org/2000/svg";
  const ink = "#302459";
  const purple = "#7754df";
  const muted = "#686c80";
  let chartId = 0;

  function shape(parent, name, attributes, label) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (label !== undefined) node.textContent = label;
    parent.appendChild(node);
    return node;
  }

  function numberLabel(value, digits = 2) {
    if (value === 0) return "0";
    if (Math.abs(value) < 10 ** -digits / 2) return value.toExponential(1).replace(".0e", "e");
    return Number(value.toFixed(digits)).toString();
  }

  // log(1+x) - x loses the quadratic term near zero under direct subtraction.
  function logRemainder(x) {
    let term = -x * x / 2;
    let total = term;
    for (let n = 3; n <= 30; n++) {
      term *= -x * (n - 1) / n;
      total += term;
      if (Math.abs(term) <= Math.abs(total) * Number.EPSILON) break;
    }
    return total;
  }

  function growthFunction(result) {
    const p = result.p.toNumber();
    const q = result.q.toNumber();
    const win = result.win.toNumber();
    const loss = result.loss.toNumber();
    const ev = result.ev.toNumber();
    const retained = result.p.add(result.q).subtract(result.loss).toNumber();
    return f => {
      if (f === 0) return 0;
      const up = win * f;
      const down = loss * f;
      if (Math.max(up, down) <= 0.125) {
        return 100 * (ev * f + p * logRemainder(up) + q * logRemainder(-down));
      }
      const logGain = p ? p * Math.log1p(up) : 0;
      if (q === 0) return 100 * logGain;
      // (1-f) + f*(1-loss) preserves tiny remainders at full exposure.
      const logLoss = down > 0.5 ? Math.log((1 - f) + f * retained) : Math.log1p(-down);
      return 100 * (logGain + q * logLoss);
    };
  }

  function niceStep(span) {
    const unit = 10 ** Math.floor(Math.log10(span));
    const normalized = span / unit;
    const step = [1, 2, 2.5, 5, 10].find(n => n >= normalized - 1e-12);
    return (step || 10) * unit;
  }

  function message(element, text) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    paragraph.style.cssText = "margin:0;padding:1.25rem;box-sizing:border-box;height:100%;display:grid;align-content:center;color:#616579;background:#f8f7fd;border-radius:.6rem;font-size:.94rem;line-height:1.65";
    element.replaceChildren(paragraph);
    element.setAttribute("aria-label", text);
  }

  function render(element, result) {
    if (!element) return;
    element.onkeydown = null;
    element.onblur = null;
    if (!result || !result.ok) {
      message(element, "填写有效参数后，这里会显示仓位与预期对数增长率的关系。");
      return;
    }
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const font = Math.max(12, rootSize * 0.78);
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width === 0 || height === 0) return;

    const one = result.p.add(result.q);
    const peak = result.fullKelly.toNumber();
    const remaining = one.subtract(result.fullKelly).toNumber();
    const selected = result.allocation.toNumber();
    const growth = growthFunction(result);
    const peakValue = growth(peak);
    if (peak > 0 && peak < 1e-6) {
      message(element, "增长峰值对应的仓位仅约 " + numberLabel(peak * 100, 5) + "%，已接近零仓位。当前系数对应的仓位约为 " + numberLabel(selected * 100, 5) + "%。");
      return;
    }
    if (remaining > 0 && remaining < 1e-6) {
      message(element, "峰值仓位距离满仓仅约 " + numberLabel(remaining * 100, 5) + " 个百分点。两者在图上无法区分，当前系数对应的仓位约为 " + numberLabel(selected * 100, 4) + "%。");
      return;
    }
    if (!Number.isFinite(peakValue) || width < font * 15 || height < font * 9) {
      message(element, "全凯利仓位 " + result.fullKelly.percent(4) + "，当前仓位 " + result.allocation.percent(4) + "，峰值预期对数增长率约为 " + numberLabel(peakValue, 4) + "%。");
      return;
    }

    // Center an interior optimum in the useful range, labeling the actual domain.
    const xMax = peak > 0 && peak < 0.5 ? Math.min(1, 4 * niceStep(peak / 2)) : 1;
    const endValue = growth(xMax);
    const finiteEnd = Number.isFinite(endValue) ? endValue : growth(xMax * 0.98);
    const low = Math.min(0, finiteEnd);
    const high = Math.max(0, peakValue);
    const targetTicks = height < font * 15 ? 3 : 4;
    const step = niceStep((high - low || 1) / targetTicks);
    const firstTick = Math.min(0, Math.floor(low / step + 1e-10));
    const lastTick = Math.max(firstTick + 1, Math.ceil(high / step - 1e-10));
    const yMin = step * firstTick;
    const yMax = step * lastTick;
    const yDigits = Math.min(6, Math.max(0, 1 - Math.floor(Math.log10(step))));
    const yLabel = i => numberLabel(i * step, yDigits);
    let widest = 0;
    for (let i = firstTick; i <= lastTick; i++) widest = Math.max(widest, yLabel(i).length);
    const left = Math.max(font * 3.55, font * (0.62 * widest + 0.9));
    const right = width - font * 0.9;
    const top = font * 2.8;
    const bottom = height - font * 3.05;
    const plotWidth = right - left;
    const x = f => left + plotWidth * f / xMax;
    const y = g => bottom - (bottom - top) * (g - yMin) / (yMax - yMin);
    const clamp = (v, a, b) => Math.max(a, Math.min(v, b));

    element.replaceChildren();
    const svg = shape(element, "svg", { viewBox: "0 0 " + width + " " + height,
      width: "100%", height: "100%", "font-size": font, "font-family": "inherit", "aria-hidden": "true" });
    svg.style.cssText = "display:block;overflow:visible;touch-action:pan-y";
    const defs = shape(svg, "defs", {});
    const fillId = "growth-area-" + (++chartId);
    const gradient = shape(defs, "linearGradient", { id: fillId, x1: "0", y1: "0", x2: "0", y2: "1" });
    shape(gradient, "stop", { offset: "0%", "stop-color": "#9779eb", "stop-opacity": 0.26 });
    shape(gradient, "stop", { offset: "100%", "stop-color": "#bba4fa", "stop-opacity": 0.03 });
    shape(svg, "text", { x: left - font * 0.48, y: font * 1.15, fill: muted, "text-anchor": "end" }, "G(f) %");
    for (let i = firstTick; i <= lastTick; i++) {
      const pos = y(i * step);
      shape(svg, "line", { x1: left, y1: pos, x2: right, y2: pos,
        stroke: i === 0 ? "#a9a6ba" : "#dcdde9", "stroke-dasharray": i === 0 ? "4 4" : "3 5" });
      shape(svg, "text", { x: left - font * 0.58, y: pos + font * 0.32,
        "text-anchor": "end", fill: muted }, yLabel(i));
    }
    const leading = Math.round(xMax / 10 ** Math.floor(Math.log10(xMax)));
    const xTicks = plotWidth < font * 18 || leading === 4 || leading === 8 ? 4 : 5;
    const xDigits = Math.min(7, Math.max(0, 2 - Math.floor(Math.log10(100 * xMax))));
    for (let i = 0; i <= xTicks; i++) {
      const pos = x(xMax * i / xTicks);
      shape(svg, "text", { x: pos, y: bottom + font * 1.55, fill: muted,
        "text-anchor": i === xTicks ? "end" : i === 0 ? "start" : "middle" },
      numberLabel(100 * xMax * i / xTicks, xDigits + 1) + "%");
    }
    shape(svg, "text", { x: (left + right) / 2, y: height - font * 0.18, fill: muted,
      "text-anchor": "middle" }, "投入仓位");

    // A possible total loss has G(1) = -Infinity. Stop at the lower edge of the scale.
    let lastF = xMax;
    if (endValue < yMin) {
      let a = peak, b = xMax;
      for (let i = 0; i < 56; i++) {
        const mid = a + (b - a) / 2;
        if (growth(mid) > yMin) a = mid;
        else b = mid;
      }
      lastF = a;
    }
    const samples = [0, peak, selected, lastF];
    const count = Math.max(96, Math.min(450, Math.ceil(plotWidth)));
    for (let i = 1; i < count; i++) samples.push(lastF * i / count);
    const path = samples.sort((a, b) => a - b).map((f, i) =>
      (i === 0 ? "M" : "L") + x(f).toFixed(2) + " " + clamp(y(growth(f)), top, bottom).toFixed(2)).join(" ");
    shape(svg, "path", { d: path + " L" + x(lastF) + " " + bottom + " L" + left + " " + bottom + " Z",
      fill: "url(#" + fillId + ")" });
    shape(svg, "path", { d: path, fill: "none", stroke: purple, "stroke-width": 2.8,
      "stroke-linecap": "round", "stroke-linejoin": "round" });
    if (!Number.isFinite(endValue)) {
      shape(svg, "text", { x: right - font * 0.6, y: bottom - font * 0.55, fill: muted,
        "text-anchor": "end", stroke: "white", "stroke-width": 3, "paint-order": "stroke" }, "满仓 −∞");
    }

    function badge(parent, label, anchorX, anchorY, below, dark) {
      const group = shape(parent, "g", {});
      const labelText = shape(group, "text", { fill: dark ? "white" : ink,
        "font-weight": 600, "text-anchor": "middle" }, label);
      const boxWidth = labelText.getComputedTextLength() + font * 1.5;
      const boxHeight = font * 1.95;
      const boxY = clamp(below ? anchorY + font * 0.7 : anchorY - boxHeight - font * 0.7,
        1, bottom - boxHeight);
      const minX = boxY < font * 1.45 && boxWidth < width - left ? left : 1;
      const boxX = clamp(anchorX - boxWidth / 2, minX, width - boxWidth - 1);
      const back = shape(group, "rect", { x: boxX, y: boxY, width: boxWidth, height: boxHeight,
        rx: font * 0.48, fill: dark ? "#594294" : "#f4f0ff" });
      group.insertBefore(back, labelText);
      labelText.setAttribute("x", boxX + boxWidth / 2);
      labelText.setAttribute("y", boxY + boxHeight / 2 + font * 0.34);
      return group;
    }

    const annotations = shape(svg, "g", {});
    const peakX = x(peak), peakY = y(peakValue);
    shape(annotations, "line", { x1: peakX, y1: peakY, x2: peakX, y2: bottom,
      stroke: "#a18bdb", "stroke-dasharray": "3 4" });
    shape(annotations, "circle", { cx: peakX, cy: peakY, r: 4.5, fill: purple, stroke: "white", "stroke-width": 2 });
    badge(annotations, "峰值 " + numberLabel(100 * peak, 3) + "%", peakX, peakY, false, true);
    if (result.allocation.compare(result.fullKelly) !== 0) {
      const cx = x(selected), cy = y(growth(selected));
      shape(annotations, "circle", { cx, cy, r: 4, fill: "white", stroke: purple, "stroke-width": 2 });
      badge(annotations, "当前 " + numberLabel(100 * selected, 3) + "%", cx, cy, true, false);
    }

    const description = "仓位增长曲线，图示仓位范围 0% 至 " + numberLabel(100 * xMax, 4)
      + "%，峰值仓位 " + numberLabel(peak * 100, 4) + "%。左右方向键查看，Home 和 End 跳至两端。";
    element.setAttribute("aria-label", description);
    const cursor = shape(svg, "g", {});
    let cursorF = null;
    function inspect(f) {
      cursorF = clamp(f, 0, xMax);
      const g = growth(cursorF);
      const cx = x(cursorF);
      const cy = Number.isFinite(g) ? clamp(y(g), top, bottom) : bottom;
      const label = "仓位 " + numberLabel(cursorF * 100, Math.max(xDigits + 1, 2)) + "% · G "
        + (Number.isFinite(g) ? numberLabel(g, 3) + "%" : "−∞");
      annotations.setAttribute("visibility", "hidden");
      cursor.replaceChildren();
      shape(cursor, "line", { x1: cx, y1: top, x2: cx, y2: bottom, stroke: purple, "stroke-dasharray": "3 3" });
      if (Number.isFinite(g) && g >= yMin) {
        shape(cursor, "circle", { cx, cy, r: 4.5, fill: purple, stroke: "white", "stroke-width": 2 });
      }
      badge(cursor, label, cx, cy, false, true);
      element.setAttribute("aria-label", label + "。" + description);
    }
    function clearCursor() {
      cursorF = null;
      cursor.replaceChildren();
      annotations.removeAttribute("visibility");
      element.setAttribute("aria-label", description);
    }
    function pointer(event) {
      const bounds = svg.getBoundingClientRect();
      const pos = (event.clientX - bounds.left) * width / bounds.width;
      inspect((pos - left) * xMax / plotWidth);
    }
    svg.onpointerdown = pointer;
    svg.onpointermove = pointer;
    svg.onpointerleave = e => { if (e.pointerType === "mouse") clearCursor(); };
    element.onblur = clearCursor;
    element.onkeydown = event => {
      if (event.key === "Escape") { clearCursor(); return; }
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home" || event.key === "End") inspect(event.key === "Home" ? 0 : xMax);
      else inspect((cursorF ?? selected) + (event.key === "ArrowLeft" ? -1 : 1) * xMax / 100);
    };
  }

  window.GrowthChart = Object.freeze({ render });
})();
