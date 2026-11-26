(() => {
  "use strict";

  const states = [
    {id:"loop", name:"明知无聊还停不下", hint:"先关掉连续播放或退出匹配，让继续使用多一道操作。", next:"friction"},
    {id:"start", name:"学习工作提不起劲", hint:"把任务缩成一个看得见的动作，例如打开材料写下一句话。", next:"actions"},
    {id:"empty", name:"得到后很快空虚", hint:"先离开当前内容，选一件做完有明确终点的小事。", next:"actions"},
    {id:"irritable", name:"烦躁易怒", hint:"先暂停回复或购买决定，到安静处缓一会，再决定下一步。", next:"actions"},
    {id:"intense", name:"总想找更强刺激", hint:"先收起容易触发下一轮的入口，再决定要做什么。", next:"friction"}
  ];
  const dimensions = [
    {key:"wanting", name:"渴望驱动", en:"Wanting", prompt:"现在有多想继续？", color:"#f8ba83"},
    {key:"liking", name:"实际满足", en:"Liking", prompt:"刚才做时有多享受？", color:"#81dfcf"}
  ];

  function gauge({key,name,en,prompt,color}) {
    const options = Array.from({length:11}, (_,n) => '<option value="' + n + '">' + n + ' 分</option>').join("");
    const ticks = Array.from({length:11}, (_,n) => {
      const angle = Math.PI + n * Math.PI / 10;
      const outer = n % 5 === 0 ? 82 : 80;
      const x = radius => (90 + radius * Math.cos(angle)).toFixed(2);
      const y = radius => (83 + radius * Math.sin(angle)).toFixed(2);
      return '<line x1="' + x(76) + '" y1="' + y(76) + '" x2="' + x(outer) + '" y2="' + y(outer) + '"/>';
    }).join("");
    return '<div class="dose-gauge" data-gauge="' + key + '">' +
      '<h4>' + name + ' <span lang="en">' + en + '</span></h4>' +
      '<svg viewBox="0 0 180 106" aria-hidden="true" focusable="false" style="display:block;width:100%;max-width:205px;margin:auto">' +
      '<g stroke="#8499ab" stroke-width="1.3">' + ticks + '</g><path d="M 18 83 A 72 72 0 0 1 162 83" fill="none" stroke="#374657" stroke-width="9" stroke-linecap="round"/>' +
      '<path data-meter-fill="' + key + '" d="M 18 83 A 72 72 0 0 1 162 83" fill="none" stroke="' + color + '" stroke-width="9" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/>' +
      '<text data-meter-value="' + key + '" x="90" y="76" text-anchor="middle" fill="' + color + '" font-size="39" font-family="system-ui,sans-serif" font-weight="650">—</text>' +
      '<g fill="#afbdcb" font-family="system-ui,sans-serif" font-size="12"><text x="16" y="102">0</text><text x="90" y="98" text-anchor="middle">/ 10</text><text x="168" y="102" text-anchor="end">10</text></g></svg>' +
      '<label for="dose-rate-' + key + '">' + prompt + '</label>' +
      '<select class="dose-rating" id="dose-rate-' + key + '" data-dose-rating="' + key + '">' +
      '<option value="">尚未评分</option>' + options + '</select></div>';
  }

  // These cutoffs only group the current pair of self-ratings for display.
  function compare(want, like) {
    if (want === null || like === null) return null;
    if (want >= 7 && like <= 3) return {title:"很想继续，满足感偏低", next:"friction", hint:"如果你在等“下一条也许更有意思”，不确定的期待可能让你继续点开。先退出页面，再决定是否回来。"};
    if (want - like >= 3) return {title:"继续意愿高于实际满足", next:"friction", hint:"给这次活动设一个可见的结束点，例如在下一轮开始前退出页面。"};
    if (like - want >= 3) return {title:"满足感高于继续意愿", next:"actions", hint:"记下刚才最有意思的一点，再看看下一段时间想留给什么。"};
    if (want >= 7 && like >= 7) return {title:"继续意愿和满足感都高", next:"friction", hint:"回想你原先安排的结束时间，确认继续参与是否符合今天的计划。"};
    if (want <= 3 && like <= 3) return {title:"意愿和满足感都低", next:"actions", hint:"离开这项活动，试一件时间短、结束点明确的事。"};
    return {title:"两项评分接近", next:"actions", hint:"看看这项活动是否占用了原本想留给其他事情的时间，再选下一步。"};
  }

  function mount(element) {
    if (element.querySelector("[data-dose-state-panel]")) return;
    element.innerHTML =
      '<div class="dose-state-grid" data-dose-state-panel>' +
      '<section class="dose-card dose-input-card"><h3>此刻的感受</h3><p>想一件刚做过、还想做或难以开始的事。可多选。</p>' +
      '<div class="dose-chips" role="group" aria-label="当下状态">' +
      states.map(s => '<button type="button" data-dose-state="' + s.id + '" aria-pressed="false">' + s.name + '</button>').join("") +
      '</div><div class="dose-fatigue"><label for="dose-fatigue-range">当前疲劳度</label> <output for="dose-fatigue-range" data-fatigue-value>尚未评分</output>' +
      '<input id="dose-fatigue-range" data-dose-fatigue type="range" min="0" max="10" value="5" step="1" aria-valuetext="尚未评分，拖动或点选刻度填写">' +
      '<div class="dose-range-labels"><span>0 · 清醒满电</span><span>10 · 疲惫耗竭</span></div></div></section>' +
      '<section class="dose-card dose-meters-card"><h3>渴望与满足</h3><p>针对同一件事自评。还没体验过时，满足感可以先留空。</p>' +
      '<div class="dose-gauges">' + dimensions.map(gauge).join("") + '</div></section></div>' +
      '<section class="dose-card dose-state-result"><h3 data-dose-result-title>本次判读</h3>' +
      '<div role="status" aria-live="polite"><p data-dose-observation></p></div><p data-dose-hint></p>' +
      '<button type="button" class="dose-primary" data-dose-next hidden></button> <button type="button" data-dose-clear hidden>清空本次自评</button>' +
      '<details class="dose-rule"><summary>判读依据与科学边界</summary>' +
      '<p>按顺序判读。① 渴望 ≥7、满足 ≤3，标为“很想继续，满足感偏低”。② 其余凡相差至少 3 分，显示哪一项更高，例如渴望 7、满足 10。③ 差距小于 3 分且两项均 ≥7 或均 ≤3，标为双高或双低。其余标为接近。</p>' +
      '<p>这些分界仅用于整理本次记录。选了多项时，先回应停不下或追求更强刺激的情况，其余参考最近勾选的一项。疲劳达到 7 分会优先提示省力的行动。</p>' +
      '<p>Wanting 与 Liking 的区分来自奖赏研究。体感分数不能测量多巴胺、内啡肽或血清素，也不能判断 D2 受体变化、催产素不足或是否成瘾。</p>' +
      '<a href="https://pubmed.ncbi.nlm.nih.gov/9858756/" target="_blank" rel="noopener noreferrer">Berridge 与 Robinson · Wanting 与 Liking 的研究</a></details></section>';

    const find = selector => element.querySelector(selector);
    const selected = new Set();
    const scores = {wanting:null,liking:null};
    const slider = find("[data-dose-fatigue]");
    const next = find("[data-dose-next]");
    let fatigue = null;
    let target = null;

    function render() {
      const comparison = compare(scores.wanting,scores.liking);
      const recent = Array.from(selected).reverse();
      const priority = recent.find(id => id === "loop" || id === "intense") || recent[0];
      const tagged = states.find(s => s.id === priority);
      const highFatigue = fatigue !== null && fatigue >= 7;
      const impulsive = selected.has("loop") || selected.has("intense") || (comparison && scores.wanting - scores.liking >= 3);
      const busy = selected.size || fatigue !== null || Object.values(scores).some(v => v !== null);
      const observation = find("[data-dose-observation]");
      find("[data-dose-result-title]").textContent = comparison ? comparison.title : (busy ? "当前线索与下一步" : "本次判读");
      if (!busy) observation.textContent = "点选一个状态即可获得行动建议，填写两项分数后可比较渴望与满足。";
      else {
        const parts = [];
        if (comparison) parts.push("渴望 " + scores.wanting + " 分，满足 " + scores.liking + " 分。");
        else parts.push(scores.wanting === null && scores.liking === null ? "两项体验尚未评分。" : (scores.wanting === null ? "再评一下继续意愿，即可比较。" : "实际体验后再评满足感，即可比较。"));
        if (tagged) parts.push("已选 " + selected.size + " 项，先回应“" + tagged.name + "”。");
        if (fatigue !== null) parts.push("疲劳自评 " + fatigue + "/10。");
        observation.textContent = parts.join("");
      }
      target = tagged?.next || comparison?.next || "actions";
      let advice = tagged?.hint || comparison?.hint || "先选一个状态，或从一项短行动开始。";
      if (comparison && scores.wanting - scores.liking >= 3) { target = "friction"; advice = comparison.hint; }
      if (highFatigue) {
        target = impulsive ? "friction" : "actions";
        advice = impulsive ? "疲劳较高，先把设备放到手够不到的位置，或直接离开购买页面。把下一次启动变麻烦一点。" :
          "疲劳较高，先选一个省力动作，给自己留几分钟休息，再决定要不要继续。";
      }
      find("[data-dose-hint]").textContent = busy ? advice : "";
      next.hidden = !busy;
      find("[data-dose-clear]").hidden = !busy;
      next.textContent = target === "friction" ? "设置环境阻隔" : "选择替代行动";
    }

    for (const btn of element.querySelectorAll("[data-dose-state]")) btn.addEventListener("click", () => {
      const key = btn.dataset.doseState;
      if (selected.has(key)) selected.delete(key); else selected.add(key);
      btn.setAttribute("aria-pressed", String(selected.has(key)));
      render();
    });
    function readRating(select) {
      const key = select.dataset.doseRating;
      const value = select.value === "" ? null : Number(select.value);
      scores[key] = value;
      find('[data-meter-value="' + key + '"]').textContent = value ?? "—";
      find('[data-meter-fill="' + key + '"]').setAttribute("stroke-dashoffset", String(100 - (value ?? 0) * 10));
    }
    for (const select of element.querySelectorAll("[data-dose-rating]")) select.addEventListener("change", () => {
      readRating(select);
      render();
    });
    function enterFatigue() {
      fatigue = Number(slider.value);
      find("[data-fatigue-value]").textContent = fatigue + " / 10";
      slider.setAttribute("aria-valuetext", "疲劳 " + fatigue + " 分，满分 10 分");
      render();
    }
    slider.addEventListener("input", enterFatigue);
    slider.addEventListener("click", enterFatigue);
    find("[data-dose-clear]").addEventListener("click", () => {
      selected.clear();
      for (const btn of element.querySelectorAll("[data-dose-state]")) btn.setAttribute("aria-pressed","false");
      for (const select of element.querySelectorAll("[data-dose-rating]")) {
        select.value = "";
        readRating(select);
      }
      fatigue = null;
      slider.value = "5";
      slider.setAttribute("aria-valuetext","尚未评分，拖动或点选刻度填写");
      find("[data-fatigue-value]").textContent = "尚未评分";
      render();
      find("[data-dose-state]").focus({preventScroll:true});
    });
    next.addEventListener("click", () => {
      const goal = Array.from(selected).reverse().find(key => key === "empty" || key === "start");
      element.dispatchEvent(new CustomEvent("dose-mode", {bubbles:true,detail:{mode:target,goal}}));
    });
    render();
  }
  if (typeof module === "object" && module.exports) module.exports = {compare};
  else window.DoseState = Object.freeze({mount});
})();
