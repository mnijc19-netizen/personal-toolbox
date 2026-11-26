(() => {
  "use strict";
  const goals = [
    {id:"start", name:"启动高阻力任务"},
    {id:"empty", name:"缓解停止刺激后的空虚"},
    {id:"sleep", name:"睡前情绪降温"}
  ];
  const actions = [
    {id:"first", goal:"start", name:"只做第一个动作", minutes:5, lens:"多巴胺 · 动机与线索", target:"降低启动门槛",
      steps:["把“完成任务”改写成一个看得见的动作，例如写下题目的已知条件。","打开需要的材料，做完这一步，再决定要不要继续。"]},
    {id:"desk", goal:"start", name:"布置单任务桌面", minutes:10, lens:"多巴胺 · 动机与线索", target:"让下一步更容易看见",
      steps:["把手机放到伸手够不到的位置，关掉与任务无关的页面。","在纸上只写本轮要回答的一个问题，余下时间只处理它。"]},
    {id:"work", goal:"start", name:"微阻力攻坚", minutes:15, lens:"多巴胺 · 行动与反馈", target:"获得可核对的进展",
      steps:["选一个能留下痕迹的小任务，例如写一段草稿或做一道题。","卡住时记下具体卡点。结束时圈出已完成的部分，写下下次从哪里接上。"]},
    {id:"walk", goal:"empty", name:"离屏走一小圈", minutes:10, lens:"内啡肽 · 舒适体验", target:"给重复点开的动作找个替代",
      steps:["放下手机，选一条熟悉、安全的短路线；也可以在室内活动。","用舒适的速度走一圈，回来后留意此刻还多想立刻打开应用。"]},
    {id:"connect", goal:"empty", name:"发起一次真实联系", minutes:5, lens:"催产素 · 社会联结", target:"给空下来的时间安排一次交流",
      steps:["找一个相处自在的人，写下一件具体近况，或问对方一个真心想知道的问题。","按自己的意愿发送或留作下次聊天。把手机放下，不必守着等回复。"]},
    {id:"hands", goal:"empty", name:"用双手完成一件小事", minutes:10, lens:"多巴胺 · 行动与反馈", target:"让眼前出现一个具体结果",
      steps:["挑一件不依赖推荐流的小事，例如擦净桌上的一小块地方或画一张速写。","只做到约定的范围。结束时看一眼实际变化，再决定接下来做什么。"]},
    {id:"dim", goal:"sleep", name:"把房间切到休息状态", minutes:5, lens:"血清素 · 作息与情绪", target:"减少睡前刺激",
      steps:["把灯调暗，把手机放到睡觉时够不到、仍能听到必要来电的位置。","准备好明早需要的一件物品，然后停止安排新任务。"]},
    {id:"paper", goal:"sleep", name:"把未完事项留在纸上", minutes:10, lens:"血清素 · 情绪调节", target:"把反复盘算的事情暂时放下",
      steps:["写下脑中反复出现的事项，选一件并写下明天可做的第一步。","合上纸本，告诉自己已有记录，今晚可以到此为止。"]},
    {id:"ease", goal:"sleep", name:"做一段温和的放松", minutes:10, lens:"内啡肽 · 舒适体验", target:"观察身体紧绷感的变化",
      steps:["找一个舒服的坐姿或卧姿，松开下颌、肩膀和双手，保持自然呼吸。","依次留意这些部位的感受。动作以舒适为限，想睡时可直接结束。"]}
  ];
  const byId = new Map(actions.map(action => [action.id, action]));
  const storageKey = "personal-toolbox.dose-actions.v1";
  const duration = id => byId.get(id).minutes * 60000;
  const empty = () => ({timer:null,history:[]});
  const validTime = value => Number.isSafeInteger(value) && value >= 0;
  function readState(raw) {
    if (!raw) return empty();
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.history)) throw new Error("无效的计时记录");
    const validEntry = record => record && typeof record.id === "string" && byId.has(record.action);
    const timer = saved.timer;
    if (timer && (!validEntry(timer) || !validTime(timer.left) || timer.left > duration(timer.action) ||
        !(timer.deadline === null || validTime(timer.deadline)))) throw new Error("无效的计时器");
    if (!saved.history.every(record => validEntry(record) && validTime(record.at))) throw new Error("无效的打卡记录");
    return {timer:timer || null, history:saved.history};
  }
  function remaining(timer, now) {
    return timer.deadline === null ? timer.left : Math.min(timer.left,Math.max(0,timer.deadline-now));
  }
  function transition(state, cmd, key, now, newId) {
    const timer = state.timer;
    if (cmd === "start") {
      if (timer || !byId.has(key)) return state;
      const left = duration(key);
      return {...state,timer:{id:newId,action:key,left,deadline:now+left}};
    }
    if (!timer || timer.id !== key) return state;
    const left = remaining(timer,now);
    if (cmd === "pause" && timer.deadline !== null && left > 0) return {...state,timer:{...timer,left,deadline:null}};
    if (cmd === "resume" && timer.deadline === null && left > 0) return {...state,timer:{...timer,deadline:now+left}};
    if (cmd === "end") return {...state,timer:null};
    if (cmd === "check" && left === 0) return {timer:null,history:[{id:timer.id,action:timer.action,at:now},...state.history]};
    return state;
  }
  if (typeof module === "object" && module.exports) {
    module.exports = {empty,readState,remaining,transition};
    return;
  }

  function el(tag,text,cls) {
    const node = document.createElement(tag);
    if (text !== null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function button(text) {
    const btn = el("button",text);
    btn.type = "button";
    return btn;
  }
  function clockString(ms) {
    const seconds = Math.ceil(ms/1000);
    return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  }
  const fmt = new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const mounted = new WeakSet();
  let mountedTimer;
  function hasActive() {
    if (mountedTimer) return Boolean(mountedTimer());
    try { return Boolean(readState(localStorage.getItem(storageKey)).timer); }
    catch { return false; }
  }
  function mount(root) {
    if (mounted.has(root)) return;
    mounted.add(root);
    let state = empty(), goal = goals[0].id, storageOK = true, lastPhase = "", interval = null, pending = false;
    mountedTimer = () => state.timer;
    const heading = el("h2","选一个此刻想达到的状态");
    const chips = el("div",null,"dose-goals dose-chips");
    chips.setAttribute("role","group"); chips.setAttribute("aria-label","替代行动目标");
    const timerPanel = el("section",null,"dose-active-timer dose-panel");
    timerPanel.tabIndex = -1;
    const cards = el("div",null,"dose-action-list");
    const log = el("section",null,"dose-action-log");
    const notice = el("p","","dose-action-notice");
    notice.setAttribute("role","status");
    const storageNote = el("p","","dose-action-storage");
    const boundary = el("p","DOSE 标签用来认识动机、联结、情绪和舒适体验。只打卡你实际做过的事；完成动作无法确认递质升高或皮质醇降低。","dose-action-boundary");
    root.append(heading,chips,timerPanel,notice,cards,boundary,log,storageNote);

    function sync() {
      try {
        state = readState(localStorage.getItem(storageKey));
      } catch { storageOK = false; }
      storageNote.textContent = storageOK ? "计时与打卡仅存于本机浏览器。" : "本机存储暂时不可用，当前计时与打卡保留在本次页面中。";
    }
    sync();
    if (state.timer) goal = byId.get(state.timer.action).goal;
    for (const item of goals) {
      const btn = button(item.name); btn.dataset.actionGoal = item.id;
      chips.append(btn);
    }
    function drawCards() {
      for (const btn of chips.children) btn.setAttribute("aria-pressed",String(btn.dataset.actionGoal === goal));
      cards.replaceChildren();
      for (const action of actions.filter(item => item.goal === goal)) {
        const card = el("details",null,"dose-action-card dose-panel");
        card.dataset.actionCard = action.id;
        const summary = el("summary",null);
        summary.append(el("strong",action.name),el("span",action.minutes+" 分钟","dose-action-meta"));
        const body = el("div",null,"dose-action-body");
        body.append(el("p","行为目标 · "+action.target,"dose-action-target"),
          el("p","DOSE 关联 · "+action.lens,"dose-action-meta"));
        const steps = el("ol",null);
        for (const step of action.steps) steps.append(el("li",step));
        const start = button("开始 "+action.minutes+" 分钟"); start.dataset.actionStart = action.id;
        body.append(steps,start);
        card.append(summary,body); cards.append(card);
      }
    }
    function drawLog() {
      log.replaceChildren(el("h3","最近打卡"));
      if (!state.history.length) { log.append(el("p","还没有完成记录。计时结束后确认打卡，记录就会出现在这里。")); return; }
      const list = el("ul",null);
      for (const record of state.history.slice(0,5)) {
        const action = byId.get(record.action);
        const li = el("li",null);
        li.append(el("span",action.name+" · "+action.minutes+" 分钟"),el("time",fmt.format(record.at)));
        list.append(li);
      }
      log.append(list);
    }
    function renderTimer() {
      const timer = state.timer;
      const time = timer ? remaining(timer,Date.now()) : 0;
      const phase = !timer ? "idle" : !time ? "ready" : timer.deadline === null ? "paused" : "running";
      const identity = timer ? timer.id + phase : phase;
      if (timer && lastPhase === identity) {
        timerPanel.querySelector(".dose-clock").textContent = clockString(time);
        return;
      }
      if (lastPhase !== identity) {
        lastPhase = identity;
        clearInterval(interval); interval = null;
        timerPanel.replaceChildren();
        timerPanel.hidden = !timer;
        if (timer) {
          const action = byId.get(timer.action);
          timerPanel.append(el("h3",action.name),el("p",{ready:"时间已到，做完后即可打卡。",paused:"已暂停，可随时继续。",running:"计时中，锁屏或切走后可回来确认。"}[phase],"dose-timer-status"));
          const clock = el("strong","","dose-clock"); clock.setAttribute("role","timer"); clock.setAttribute("aria-label","剩余时间");
          const controls = el("div",null,"dose-timer-controls");
          const primary = {running:["pause","暂停"],paused:["resume","继续"],ready:["check","确认完成并打卡"]}[phase];
          const end = ["end",phase === "ready" ? "结束不打卡" : "提前结束"];
          for (const [cmd,label] of [primary,end]) {
            const btn = button(label); btn.dataset.timerCmd = cmd; btn.dataset.timerId = timer.id;
            controls.append(btn);
          }
          timerPanel.append(clock,controls);
          if (phase === "running") interval = setInterval(renderTimer,500);
          if (phase === "ready") notice.textContent = "时间已到。完成行动后，请确认打卡。";
        }
        updateStartButtons();
        root.dispatchEvent(new CustomEvent("dose-timer-change",{bubbles:true,detail:{active:Boolean(timer),phase}}));
      }
      if (timer) timerPanel.querySelector(".dose-clock").textContent = clockString(time);
    }
    function updateStartButtons() {
      for (const start of cards.querySelectorAll("[data-action-start]")) {
        start.disabled = Boolean(state.timer && state.timer.action !== start.dataset.actionStart);
        start.textContent = state.timer?.action === start.dataset.actionStart ? "查看当前计时" : "开始 "+byId.get(start.dataset.actionStart).minutes+" 分钟";
      }
    }
    async function apply(cmd,key) {
      if (pending) return;
      pending = true;
      const work = () => {
        if (storageOK) sync();
        const newId = cmd === "start" ? Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-") : "";
        const changed = transition(state,cmd,key,Date.now(),newId);
        if (changed !== state) {
          if (storageOK) {
            try { localStorage.setItem(storageKey,JSON.stringify(changed)); }
            catch { storageOK = false; storageNote.textContent = "保存失败，当前计时与打卡保留在本次页面中。"; }
          }
          state = changed;
          notice.textContent = {start:"已开始计时。",pause:"计时已暂停。",resume:"继续计时。",end:"计时已结束，本次未打卡。",check:"已完成打卡。"}[cmd];
        }
        drawLog(); renderTimer();
        if (cmd === "start" && state.timer) timerPanel.focus();
      };
      try {
        if (navigator.locks && storageOK) await navigator.locks.request(storageKey,work);
        else work();
      } catch (error) {
        if (error.name === "SecurityError" || error.name === "NotSupportedError") work();
        else throw error;
      } finally { pending = false; }
    }
    function selectGoal(key) {
      if (!goals.some(item => item.id === key)) return;
      goal = key; drawCards(); updateStartButtons();
    }
    root.addEventListener("dose-goal",e => { if (!state.timer) selectGoal(e.detail); });
    root.addEventListener("click",e => {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn)) return;
      if (btn.dataset.actionGoal) {
        selectGoal(btn.dataset.actionGoal);
      } else if (btn.dataset.actionStart) {
        if (state.timer?.action === btn.dataset.actionStart) timerPanel.focus();
        else apply("start",btn.dataset.actionStart);
      } else if (btn.dataset.timerCmd) apply(btn.dataset.timerCmd,btn.dataset.timerId);
    });
    function refresh() {
      if (storageOK) sync();
      notice.textContent = "";
      drawLog(); renderTimer();
    }
    window.addEventListener("storage",e => { if (e.key === storageKey || e.key === null) refresh(); });
    window.addEventListener("pageshow",refresh);
    document.addEventListener("visibilitychange",() => { if (!document.hidden) refresh(); });
    drawCards(); drawLog(); renderTimer();
  }
  window.DoseActions = {mount,hasActive};
})();
