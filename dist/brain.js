(() => {
  "use strict";

  const id = name => document.getElementById("brain-" + name);
  const layers = {all:"全部", cortex:"皮层", deep:"深部结构", base:"小脑与脑干"};
  const pickedStates = new Set();
  const overlays = {map:new Set(), check:new Set(), sandbox:new Set()};
  let data, map, scenario;
  let mode = "map", layer = "all", selected = "pfc", hovered = null;
  let intervention = false, step = 0, timer = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function button(parent, text, action, value, handler) {
    const btn = node("button", text);
    btn.type = "button";
    btn.dataset[action] = value;
    btn.addEventListener("click", handler);
    parent.append(btn);
    return btn;
  }

  function setPressed(selector, dataKey, predicate) {
    for (const btn of id("view").querySelectorAll(selector)) {
      btn.setAttribute("aria-pressed", String(predicate(btn.dataset[dataKey])));
    }
  }

  function references(refs) {
    const details = node("details", null, "brain-references");
    details.append(node("summary", "研究与资料"));
    for (const key of new Set(refs || [])) {
      const source = data.sources[key];
      if (!source) continue;
      const link = node("a", source.name);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      details.append(link);
    }
    details.hidden = details.children.length === 1;
    return details;
  }

  function definitions(entries) {
    const dl = node("dl");
    for (const [label,text] of entries) dl.append(node("dt",label),node("dd",text));
    return dl;
  }

  function selectedStates() {
    return data.states.filter(s => pickedStates.has(s.id));
  }

  function trajectory() {
    return intervention ? scenario.intervention.steps : scenario.steps;
  }

  function updateMap() {
    const inScene = mode === "sandbox";
    map.update({
      layer,
      selected:hovered || selected,
      related:mode === "check" ? [...new Set(selectedStates().flatMap(s => s.regions))] : [],
      networks:[...overlays[mode]],
      path:inScene ? trajectory().map(s => s.region) : [],
      step:inScene ? step : 0
    });
  }

  function showRegion() {
    const region = data.regions[hovered || selected];
    id("detail-name").textContent = region ? region.name : "脑区详情";
    const body = id("detail-body");
    if (!region) {
      body.replaceChildren(node("p","点选脑图中的区域或下方的脑区名称。"));
      return;
    }
    body.replaceChildren(definitions([
      ["核心功能",region.function],["功能边界",region.limit],
      ["可以尝试",region.action],["避免事项",region.avoid]
    ]), references(region.refs));
  }

  function selectRegion(key) {
    if (!data.regions[key]) return;
    if (mode === "sandbox") pause();
    if (layer !== "all" && layer !== data.regions[key].layer) layer = "all";
    selected = key;
    hovered = null;
    id("detail").open = true;
    refreshMapPanel();
  }

  function hoverRegion(key) {
    const next = data.regions[key] ? key : null;
    if (hovered === next) return;
    hovered = next;
    showRegion();
    updateMap();
  }

  function refreshMapPanel() {
    setPressed("[data-brain-layer]","brainLayer",k => layer === k);
    setPressed("[data-brain-region]","brainRegion",k => selected === k);
    setPressed("[data-brain-network]","brainNetwork",k => overlays[mode].has(k));
    for (const btn of id("region-index").children) {
      btn.hidden = layer !== "all" && data.regions[btn.dataset.brainRegion].layer !== layer;
    }
    const note = id("network-note");
    note.hidden = !overlays[mode].size;
    note.replaceChildren(...[...overlays[mode]].map(key => {
      const line = node("p");
      line.append(node("strong",data.networks[key].name + "　"),data.networks[key].description);
      return line;
    }));
    if (overlays[mode].size) note.append(references([...overlays[mode]].flatMap(key => data.networks[key].refs || [])));
    showRegion();
    updateMap();
  }

  function showCheck() {
    const results = id("check-results");
    setPressed("[data-brain-state]","brainState",k => pickedStates.has(k));
    id("quick").hidden = pickedStates.size === 0;
    const latest = [...pickedStates].pop();
    const current = data.states.find(s => s.id === latest);
    id("quick-action").textContent = current ? current.now : "";
    id("go-actions").textContent = "查看全部建议（" + pickedStates.size + "）";
    if (!pickedStates.size) {
      results.replaceChildren(node("p","选择与你当下体验相符的状态，查看相关脑区和可以尝试的行动。"));
      return;
    }
    results.replaceChildren(...selectedStates().map(s => {
      const card = node("article",null,"brain-state-card");
      card.append(node("h3",s.name),node("p",s.mechanism), definitions([
        ["可能参与", s.regions.map(k => data.regions[k].name).join("、")],
        ["现在可以做",s.now], ["长期调整",s.later]
      ]), references(s.refs));
      return card;
    }));
  }

  function toggleState(s) {
    if (pickedStates.has(s.id)) {
      pickedStates.delete(s.id);
      const related = selectedStates().flatMap(item => item.regions);
      if (!related.includes(selected)) selected = related[0] || null;
    } else {
      pickedStates.add(s.id);
      selected = s.regions[0];
    }
    hovered = null;
    layer = "all";
    showCheck();
    refreshMapPanel();
  }

  function buttonByCommand(command) {
    return id("scene-controls").querySelector('[data-brain-command="' + command + '"]');
  }

  function updatePlayback() {
    const play = buttonByCommand("play");
    if (!play) return;
    id("map").style.setProperty("--brain-play-state", timer === null ? "paused" : "running");
    play.textContent = timer !== null ? "暂停" : step === trajectory().length-1 ? "重新播放" : "播放";
    buttonByCommand("back").disabled = step === 0;
    buttonByCommand("next").disabled = step === trajectory().length-1;
  }

  function pause() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    if (scenario) updatePlayback();
  }

  function showStep(next) {
    const steps = trajectory();
    step = Math.max(0,Math.min(next,steps.length-1));
    const current = steps[step];
    selected = current.region;
    hovered = null;
    layer = "all";
    overlays.sandbox = new Set(current.network ? [current.network] : []);
    const panel = id("scene-results");
    const header = node("p", "第 " + (step + 1) + " / " + steps.length + " 步 · " + data.regions[current.region].name, "brain-step-meta");
    panel.replaceChildren(header,node("h3",current.title),node("p",current.text));
    if (intervention) panel.append(node("p",scenario.intervention.text,"brain-intervention-note"));
    panel.append(references(scenario.refs));
    if (step === steps.length-1) pause();
    refreshMapPanel();
    updatePlayback();
  }

  function play() {
    pause();
    if (step === trajectory().length-1) showStep(0);
    timer = window.setInterval(() => {
      if (document.hidden || id("view").hidden) pause();
      else showStep(step+1);
    }, 3300);
    updatePlayback();
  }

  function startScene(s, withIntervention, autoPlay) {
    pause();
    scenario = s;
    intervention = withIntervention;
    setPressed("[data-brain-scenario]","brainScenario",k => k === s.id);
    const branch = buttonByCommand("intervention");
    branch.textContent = s.intervention.title;
    branch.setAttribute("aria-pressed",String(withIntervention));
    buttonByCommand("original").setAttribute("aria-pressed",String(!withIntervention));
    showStep(0);
    if (autoPlay && !reducedMotion.matches) play();
  }

  function changeMode(next) {
    pause();
    mode = next;
    layer = "all";
    hovered = null;
    setPressed("[data-brain-mode]","brainMode",k => k === mode);
    id("check-tools").hidden = id("check-results").hidden = mode !== "check";
    id("sandbox-tools").hidden = id("scene-results").hidden = mode !== "sandbox";
    if (mode === "sandbox") {
      startScene(scenario,intervention,false);
      return;
    }
    selected = mode === "map" ? "pfc" : selectedStates()[0]?.regions[0] || null;
    if (mode === "check") showCheck();
    refreshMapPanel();
  }

  function bind() {
    data = window.BrainData;
    scenario = data.scenarios[0];
    if (window.matchMedia("(max-width: 680px)").matches) id("detail").open = false;
    for (const btn of id("view").querySelectorAll("[data-brain-mode]")) {
      btn.addEventListener("click",() => { if (mode !== btn.dataset.brainMode) changeMode(btn.dataset.brainMode); });
    }
    for (const [key,label] of Object.entries(layers)) {
      button(id("layers"),label,"brainLayer",key,() => {
        if (mode === "sandbox") pause();
        layer = key;
        hovered = null;
        if (key !== "all" && data.regions[selected]?.layer !== key) selected = Object.keys(data.regions).find(k => data.regions[k].layer === key);
        refreshMapPanel();
      });
    }
    for (const [key,network] of Object.entries(data.networks)) {
      button(id("networks"),network.name,"brainNetwork",key,() => {
        if (overlays[mode].has(key)) overlays[mode].delete(key);
        else overlays[mode].add(key);
        refreshMapPanel();
      });
    }
    for (const [key,r] of Object.entries(data.regions)) {
      button(id("region-index"),r.name,"brainRegion",key,() => selectRegion(key));
    }
    for (const s of data.states) button(id("states"),s.name,"brainState",s.id,() => toggleState(s));
    id("go-actions").addEventListener("click",() => {
      id("check-results").focus({preventScroll:true});
      id("check-results").scrollIntoView({block:"start"});
    });
    for (const s of data.scenarios) button(id("scenarios"),s.name,"brainScenario",s.id,() => startScene(s,false,true));
    const controls = id("scene-controls");
    const branches = node("div",null,"brain-branches");
    const playback = node("div",null,"brain-playback");
    controls.append(branches,playback);
    button(branches,"原始路径","brainCommand","original",() => startScene(scenario,false,true));
    button(branches,"加入干预","brainCommand","intervention",() => startScene(scenario,true,true));
    button(playback,"上一步","brainCommand","back",() => { pause(); showStep(step-1); });
    button(playback,"播放","brainCommand","play",() => { if (timer === null) play(); else pause(); });
    button(playback,"下一步","brainCommand","next",() => { pause(); showStep(step+1); });
    button(playback,"从头开始","brainCommand","restart",() => startScene(scenario,intervention,true));

    map = window.BrainMap.mount(id("map"), {onSelect:selectRegion,onHover:hoverRegion});
    id("scene-results").addEventListener("focusin",pause);
    document.addEventListener("visibilitychange",() => { if (document.hidden) pause(); });
    window.addEventListener("pagehide",pause);
    window.addEventListener("hashchange",() => { if (location.hash !== "#brain") pause(); });
    reducedMotion.addEventListener("change",() => { if (reducedMotion.matches) pause(); });
    changeMode(mode);
  }

  window.BrainTool = {
    open() { if (!map) bind(); else refreshMapPanel(); },
    close:pause
  };
})();
