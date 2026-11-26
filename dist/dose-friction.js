(() => {
  "use strict";

  const stimuli = {
    video: {
      name: "短视频",
      prompts: {
        know: "即使认得推荐流的设计，下一条预览仍会出现在眼前。先让这个入口离开视线。",
        five: "每滑一次都能重新许诺“五分钟”。试着把这条视频的结尾当作退出点。",
        study: "先把要分析的一个设计问题写下来。若只需分析一个例子，就截一张图，退出推荐流后再看。"
      },
      plans: [
        ["撤掉首页入口", "退出推荐流，把应用图标移出手机首页。下次打开时，需要主动搜索应用。"],
        ["留出一个无视频时段", "在屏幕使用时间或专注模式中，给短视频应用设置接下来半小时的限用。保留电话和必要消息。"],
        ["让设备离开手边", "给需要联系你的人保留来电铃声，把手机放到另一处充电。回到眼下的活动，下一次取手机需要专门起身。"]
      ]
    },
    game: {
      name: "竞技游戏",
      prompts: {
        know: "你懂匹配和段位奖励，也仍可能在结算页顺手点下排队。把出口放在下一次匹配之前。",
        five: "一局的时长往往由比赛进程决定。可以在当前对局结束后退出队列，同时告诉队友你要下线。",
        study: "若确实在研究机制，留下一段回放并写明要观察的片段。分析回放无需再开一局。"
      },
      plans: [
        ["截断下一局", "正在比赛就等本局结算，随后退出队列、关闭组队邀请提醒；若仍在大厅，现在就退出。"],
        ["退出游戏入口", "给队友发一句“今天先下线”，关闭游戏和启动器，再关闭启动器的开机自启或通知。"],
        ["把设备收起来", "结束当前对局后，把手柄或游戏专用外设收进另一房间的柜子。手机游戏则给游戏设限，并将手机放离座位。"]
      ]
    },
    shop: {
      name: "冲动网购",
      prompts: {
        know: "能识别倒计时和促销话术，也可能顺手付款。先看这件东西是否已在原先的购物清单里。",
        five: "再逛五分钟会带来更多商品和优惠提示。先把当前这件放入待考虑清单，退出商品页。",
        study: "把你要分析的一处界面截下来，再退出商城。研究这个设计可以在截图上完成。"
      },
      plans: [
        ["离开结算页", "把商品名和含运费总价写进待考虑清单，关闭商品页和直播间，留到明天再看。"],
        ["增加付款步骤", "在购物应用的支付设置里关闭小额免密或一键付款，让下次下单需要手动确认金额。"],
        ["分开浏览与购买", "退出手机商城账号，移除首页快捷入口，约定下次只在电脑上对照购物清单下单。"]
      ]
    }
  };
  const thoughts = {
    know: {
      label: "我懂成瘾原理，所以能控制",
      title: "可能把“知道”当成“做到”",
      explanation: "特种部队谬误（G.I. Joe Fallacy）描述了一种常见误判：知道一种偏误，就以为自己已经免受影响。"
    },
    five: {
      label: "只再来五分钟",
      title: "可能在给继续行动找理由",
      explanation: "如果上次的“五分钟”也一再延长，这次的估时可能偏乐观。想继续的愿望也可能影响判断，这符合动机性推理的一种表现。"
    },
    study: {
      label: "我在研究它的设计",
      title: "检查研究目标是否清楚",
      explanation: "如果没有具体问题、产出或停止条件，“研究”可能成了继续接触刺激的理由。这是动机性推理的一种可能。"
    }
  };
  const levels = ["低", "中", "高"];

  function mount(container) {
    if (container.querySelector(".dose-friction")) return;
    const panel = document.createElement("div");
    panel.className = "dose-friction";
    panel.innerHTML = `
      <div class="dose-friction-input">
        <h2>借口拦截与环境摩擦</h2>
        <p class="dose-friction-rule">疲惫时先改环境：移开线索、拉开距离，或让下一次操作多一个步骤。前额叶没有能随意关闭递质释放的开关。</p>
        <h3>你想暂时离开什么？</h3>
        <div class="dose-picks" role="group" aria-label="即时刺激来源" data-group="source"></div>
        <h3>哪句话最像此刻的念头？</h3>
        <div class="dose-picks" role="group" aria-label="脑中浮现的念头" data-group="thought"></div>
        <div class="dose-friction-insight" aria-live="polite">
          <strong data-part="bias"></strong><p data-part="explanation"></p><p data-part="response"></p>
        </div>
      </div>
      <h3>选一个现在就能改的环境条件</h3>
      <div class="dose-friction-grid"></div>
      <div class="dose-friction-plan" hidden>
        <div role="status"><strong data-part="plan-name"></strong><p data-part="plan-text"></p></div>
        <button type="button" data-part="replace">选择替代行动</button>
      </div>`;
    container.append(panel);
    const part = key => panel.querySelector('[data-part="' + key + '"]');
    let source = "video";
    let thought = null;
    let chosen = null;

    function makeButton(parent, label, dataKey, value, handler) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset[dataKey] = value;
      button.textContent = label;
      button.addEventListener("click", handler);
      parent.append(button);
      return button;
    }

    const cards = levels.map((level, i) => {
      const card = document.createElement("article");
      card.className = "dose-friction-card";
      card.innerHTML = '<span class="dose-level"></span><h4></h4><p></p>';
      card.querySelector(".dose-level").textContent = level + "摩擦";
      const button = makeButton(card, "采用这一档", "doseLevel", String(i), () => {
        chosen = i;
        render();
      });
      panel.querySelector(".dose-friction-grid").append(card);
      return {card, button, title:card.querySelector("h4"), body:card.querySelector("p")};
    });

    for (const [key, item] of Object.entries(stimuli)) {
      makeButton(panel.querySelector('[data-group="source"]'), item.name, "doseSource", key, () => {
        if (source !== key) chosen = null;
        source = key;
        render();
      });
    }
    for (const [key, item] of Object.entries(thoughts)) {
      makeButton(panel.querySelector('[data-group="thought"]'), item.label, "doseThought", key, () => {
        thought = thought === key ? null : key;
        render();
      });
    }
    part("replace").addEventListener("click", () => {
      container.dispatchEvent(new CustomEvent("dose-mode", {bubbles:true, detail:{mode:"actions",goal:"empty"}}));
    });

    function render() {
      const stimulus = stimuli[source];
      for (const button of panel.querySelectorAll("[data-dose-source]")) {
        button.setAttribute("aria-pressed", String(button.dataset.doseSource === source));
      }
      for (const button of panel.querySelectorAll("[data-dose-thought]")) {
        button.setAttribute("aria-pressed", String(button.dataset.doseThought === thought));
      }
      const insight = panel.querySelector(".dose-friction-insight");
      insight.hidden = !thought;
      if (thought) {
        part("bias").textContent = thoughts[thought].title;
        part("explanation").textContent = thoughts[thought].explanation;
        part("response").textContent = stimulus.prompts[thought];
      }
      cards.forEach(({card, button, title, body}, i) => {
        const [heading, action] = stimulus.plans[i];
        title.textContent = heading;
        body.textContent = action;
        card.classList.toggle("is-selected", chosen === i);
        button.setAttribute("aria-pressed", String(chosen === i));
        button.setAttribute("aria-label", (chosen === i ? "已采用" : "采用") + levels[i] + "摩擦方案：" + heading);
        button.textContent = chosen === i ? "已选为当前方案" : "采用这一档";
      });
      const plan = panel.querySelector(".dose-friction-plan");
      plan.hidden = chosen === null;
      if (chosen !== null) {
        part("plan-name").textContent = "当前方案 · " + stimulus.name + " · " + stimulus.plans[chosen][0];
        part("plan-text").textContent = "完成这一步环境调整后，给接下来的几分钟安排一件具体的事。";
      }
    }
    render();
  }

  window.DoseFriction = {mount};
})();
