(function () {
  "use strict";

  const data = window.SLAData;
  const storagePrefix = "personal-toolbox.sla.stage.v1.";
  const progress = new Map();
  const statusText = { unseen: "尚未自评", review: "模糊需重测", mastered: "已掌握" };
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = value => String(value).replace(/[&<>"']/g, char => entities[char]);
  let root;
  let active = false;
  let stage;
  let skill;
  let trapIndex = 0;
  let deadline = 0;
  let clockId;

  function readProgress() {
    for (const entry of data.stages) {
      try {
        const value = localStorage.getItem(storagePrefix + entry.id);
        progress.set(entry.id, value === "mastered" || value === "review" ? value : "unseen");
      } catch {
        if (!progress.has(entry.id)) progress.set(entry.id, "unseen");
      }
    }
  }

  function sourceLink(key) {
    const source = data.sources[key];
    if (!source) return "";
    return `<a class="sla-source" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">参考 · ${esc(source.title)}</a>`;
  }

  function recallList(items, prefix) {
    return `<div class="sla-recall-list">${items.map((item, index) => {
      const answerId = "sla-answer-" + prefix + "-" + index;
      return `<div class="sla-recall-item">
        <button type="button" class="sla-recall-toggle" data-act="toggle-answer" aria-expanded="false" aria-controls="${answerId}">
          <span class="sla-recall-question">${esc(item.q)}</span><span class="sla-mask-label">揭晓</span>
        </button>
        <div class="sla-answer" id="${answerId}" hidden><p>${esc(item.a)}</p>${sourceLink(item.source)}</div>
      </div>`;
    }).join("")}</div>`;
  }

  function cardHead(label, title, cue) {
    return `<div class="sla-card-head"><div><small>${esc(label)}</small><h3>${esc(title)}</h3></div>
      <button type="button" class="sla-reveal-all" data-act="reveal-all">揭晓全部</button></div>
      <p class="sla-cue">${esc(cue)}</p>`;
  }

  function renderStage() {
    const card = root.querySelector("#sla-stage-card");
    card.innerHTML = cardHead("阶段 " + (data.stages.indexOf(stage) + 1), stage.title, stage.cue)
      + recallList(stage.items, "stage") + `<div class="sla-mark-row" role="group" aria-label="阶段自评">
        <button type="button" class="sla-mark" data-mark="mastered">已掌握</button>
        <button type="button" class="sla-mark" data-mark="review">模糊需重测</button>
      </div><p class="sla-save-status" role="status"></p>`;
    updateProgress();
  }

  function updateProgress() {
    let mastered = 0;
    let review = 0;
    for (const button of root.querySelectorAll("[data-stage]")) {
      const id = button.dataset.stage;
      const status = progress.get(id);
      button.dataset.status = status;
      button.setAttribute("aria-pressed", String(id === stage.id));
      const title = button.querySelector(".sla-node-title").textContent;
      button.setAttribute("aria-label", title + "，" + statusText[status]);
      button.title = statusText[status];
      if (status === "mastered") mastered++;
      if (status === "review") review++;
    }
    root.querySelector("[data-progress]").textContent =
      mastered + " / " + data.stages.length + " 已掌握 · " + review + " 待重测";
    for (const button of root.querySelectorAll("[data-mark]")) {
      button.setAttribute("aria-pressed", String(button.dataset.mark === progress.get(stage.id)));
    }
  }

  function markStage(status) {
    progress.set(stage.id, status);
    let message = "已记录：" + statusText[status];
    try {
      localStorage.setItem(storagePrefix + stage.id, status);
    } catch {
      message = "本次已标记。当前浏览器无法保存，下次需重新标记。";
    }
    updateProgress();
    root.querySelector(".sla-save-status").textContent = message;
  }

  function toggleAnswer(button, show) {
    document.getElementById(button.getAttribute("aria-controls")).hidden = !show;
    button.setAttribute("aria-expanded", String(show));
    button.querySelector(".sla-mask-label").textContent = show ? "遮盖" : "揭晓";
  }

  function handleRecall(button) {
    const card = button.closest(".sla-stage-card, .sla-skill-card");
    const toggles = Array.from(card.querySelectorAll(".sla-recall-toggle"));
    const isOpen = item => item.getAttribute("aria-expanded") === "true";
    if (button.dataset.act === "reveal-all") {
      const show = !toggles.every(isOpen);
      for (const item of toggles) toggleAnswer(item, show);
    } else {
      toggleAnswer(button, !isOpen(button));
    }
    card.querySelector(".sla-reveal-all").textContent = toggles.every(isOpen) ? "全部遮盖" : "揭晓全部";
  }

  function flowPath() {
    return `<svg class="sla-flow-path sla-flow-wide" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">
      <path d="M100 50H900 M900 50V86Q900 93 893 93H107Q100 93 100 86V60" vector-effect="non-scaling-stroke"/>
      <path d="m195 45 7 5-7 5m200-10 7 5-7 5m200-10 7 5-7 5m200-10 7 5-7 5 M510 89l-7 4 7 4" vector-effect="non-scaling-stroke"/></svg>
      <svg class="sla-flow-path sla-flow-tall" viewBox="0 0 100 500" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">
      <path d="M50 50V450 M50 450H93Q96 450 96 445V55Q96 50 93 50H59" vector-effect="non-scaling-stroke"/>
      <path d="m48 96 2 6 2-6m-4 100 2 6 2-6m-4 100 2 6 2-6m-4 100 2 6 2-6 M94 253l2-6 2 6" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function renderMap() {
    const nodes = data.stages.map((item, index) => `<li><button type="button" class="sla-node" data-stage="${esc(item.id)}" aria-controls="sla-stage-card">
      <span class="sla-node-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <span class="sla-node-title">${esc(item.title)}</span><span class="sla-node-dot" aria-hidden="true"></span>
    </button></li>`).join("");
    return `<section class="sla-panel sla-map" aria-labelledby="sla-map-title">
      <div class="sla-panel-head"><h2 id="sla-map-title">习得闭环图谱</h2><span class="sla-count" data-progress></span></div>
      <p class="sla-map-hint">点选阶段，先回想，再揭晓核对。红点标出尚未掌握的阶段。</p>
      <div class="sla-flow">${flowPath()}<ol class="sla-node-list" aria-label="五个习得阶段">${nodes}</ol></div>
      <div class="sla-stage-card" id="sla-stage-card"></div></section>`;
  }

  function stopClock() {
    clearInterval(clockId);
    deadline = 0;
  }

  function tickClock() {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    root.querySelector("[data-clock]").textContent = left + " 秒";
    if (left === 0) {
      stopClock();
      root.querySelector(".sla-clock-status").textContent = "时间到，可以翻卡核对。";
    }
  }

  function startClock() {
    setTrapSide(false);
    deadline = Date.now() + 10000;
    root.querySelector("[data-act=start-clock]").textContent = "重新计时";
    tickClock();
    clockId = setInterval(tickClock, 200);
  }

  function setTrapSide(show) {
    stopClock();
    const button = root.querySelector("[data-act=flip-trap]");
    button.setAttribute("aria-expanded", String(show));
    button.querySelector(".sla-trap-front").hidden = show;
    button.querySelector(".sla-trap-back").hidden = !show;
    root.querySelector(".sla-trap-source").hidden = !show;
    root.querySelector("[data-clock]").textContent = "10 秒";
    root.querySelector("[data-act=start-clock]").textContent = "开始计时";
    root.querySelector(".sla-clock-status").textContent = "";
  }

  function renderTrap() {
    const trap = data.traps[trapIndex];
    root.querySelector("[data-trap-count]").textContent = (trapIndex + 1) + " / " + data.traps.length;
    root.querySelector(".sla-trap-question").textContent = trap.q;
    root.querySelector(".sla-trap-answer").textContent = trap.a;
    root.querySelector(".sla-trap-source").innerHTML = sourceLink(trap.source);
    setTrapSide(false);
  }

  function trapSection() {
    return `<section class="sla-panel sla-traps" aria-labelledby="sla-traps-title">
      <div class="sla-panel-head"><h2 id="sla-traps-title">伪努力 · 10 秒盲测</h2><span class="sla-count" data-trap-count></span></div>
      <div class="sla-trap-card"><button type="button" class="sla-trap-flip" data-act="flip-trap" aria-controls="sla-trap-response" aria-expanded="false">
        <span class="sla-trap-front"><span class="sla-trap-question"></span><span class="sla-trap-invite">想好后，点卡核对 ↗</span></span>
        <span class="sla-trap-back" id="sla-trap-response" hidden><span class="sla-trap-answer"></span><span class="sla-trap-invite">点卡重新盲测 ↺</span></span></button>
        <div class="sla-trap-source" hidden></div></div>
      <div class="sla-trap-controls"><span class="sla-clock" data-clock>10 秒</span>
        <button type="button" data-act="start-clock">开始计时</button>
        <button type="button" data-act="prev-trap">上一题</button><button type="button" data-act="next-trap">下一题</button></div>
      <p class="sla-clock-status" role="status"></p></section>`;
  }

  function skillsSection() {
    const tabs = data.skills.map(item => `<button type="button" class="sla-tab" role="tab" id="sla-tab-${esc(item.id)}" aria-controls="sla-skill-card" data-skill="${esc(item.id)}">${esc(item.title)}</button>`).join("");
    return `<section class="sla-panel sla-skills" aria-labelledby="sla-skills-title">
      <div class="sla-panel-head"><h2 id="sla-skills-title">听说读写与进阶练习</h2></div>
      <div class="sla-tabs" role="tablist" aria-label="训练维度">${tabs}</div>
      <div class="sla-skill-card" id="sla-skill-card" role="tabpanel"></div></section>`;
  }

  function renderSkill() {
    for (const button of root.querySelectorAll("[data-skill]")) {
      const selected = button.dataset.skill === skill.id;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    const card = root.querySelector("#sla-skill-card");
    card.setAttribute("aria-labelledby", "sla-tab-" + skill.id);
    card.innerHTML = cardHead("核心动作", skill.title, skill.cue) + recallList(skill.items, "skill");
    if (skill.id === "speak") card.insertAdjacentHTML("beforeend",
      `<button type="button" class="sla-copy" data-act="copy-prompt">一键复制 AI 语音反迎合纠偏指令</button>
       <p class="sla-copy-status" role="status"></p><label class="sla-copy-fallback" hidden>长按或全选复制指令
       <textarea readonly rows="5"></textarea></label>`);
  }

  async function copyPrompt() {
    const status = root.querySelector(".sla-copy-status");
    const fallback = root.querySelector(".sla-copy-fallback");
    try {
      await navigator.clipboard.writeText(data.prompt);
      if (status.isConnected) {
        status.textContent = "指令已复制，可粘贴到 AI 语音对话。";
        fallback.hidden = true;
      }
      return;
    } catch {
      if (!status.isConnected || !active) return;
    }
    const field = fallback.querySelector("textarea");
    fallback.hidden = false;
    field.value = data.prompt;
    field.focus();
    field.select();
    status.textContent = "请复制下方已选中的指令。";
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.dataset.stage) {
      stage = data.stages.find(item => item.id === button.dataset.stage);
      renderStage();
      const card = root.querySelector("#sla-stage-card");
      if (matchMedia("(max-width: 640px)").matches && card.getBoundingClientRect().top > innerHeight - 100) {
        card.scrollIntoView({block: "start"});
      }
    } else if (button.dataset.mark) {
      markStage(button.dataset.mark);
    } else if (button.dataset.skill) {
      skill = data.skills.find(item => item.id === button.dataset.skill);
      renderSkill();
    } else {
      switch (button.dataset.act) {
        case "toggle-answer":
        case "reveal-all": handleRecall(button); break;
        case "flip-trap": setTrapSide(button.getAttribute("aria-expanded") !== "true"); break;
        case "start-clock": startClock(); break;
        case "prev-trap":
        case "next-trap":
          trapIndex = (trapIndex + (button.dataset.act === "next-trap" ? 1 : -1) + data.traps.length) % data.traps.length;
          renderTrap();
          break;
        case "copy-prompt": copyPrompt(); break;
      }
    }
  }

  function onKeydown(event) {
    const current = event.target.closest("[data-skill]");
    if (!current) return;
    const tabs = Array.from(root.querySelectorAll("[data-skill]"));
    const index = tabs.indexOf(current);
    let next;
    switch (event.key) {
      case "Home": next = tabs[0]; break;
      case "End": next = tabs[tabs.length - 1]; break;
      case "ArrowLeft": next = tabs[(index - 1 + tabs.length) % tabs.length]; break;
      case "ArrowRight": next = tabs[(index + 1) % tabs.length]; break;
      default: return;
    }
    event.preventDefault();
    next.focus();
    next.click();
  }

  function open() {
    close();
    root = document.getElementById("sla-workspace");
    readProgress();
    stage = data.stages.find(item => progress.get(item.id) === "review")
      || data.stages.find(item => progress.get(item.id) === "unseen") || data.stages[0];
    skill = data.skills[0];
    trapIndex = 0;
    root.innerHTML = renderMap() + trapSection() + skillsSection();
    renderStage();
    renderTrap();
    renderSkill();
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeydown);
    active = true;
  }

  function close() {
    if (!active) return;
    stopClock();
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeydown);
    active = false;
  }

  window.addEventListener("storage", event => {
    if (active && (event.key === null || event.key.startsWith(storagePrefix))) {
      readProgress();
      updateProgress();
    }
  });
  window.SLA = { open, close };
})();
