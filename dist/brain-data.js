(() => {
  "use strict";

  const sources = {
    anatomy: {name:"约翰斯·霍普金斯医学 · 大脑解剖与功能", url:"https://www.hopkinsmedicine.org/health/conditions-and-diseases/anatomy-of-the-brain"},
    evolution: {name:"美国国家科学院 · 脑的共同演化", url:"https://www.nationalacademies.org/read/18573/chapter/5"},
    development: {name:"NIMH · 青少年大脑发育", url:"https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know"},
    networks: {name:"Sridharan 等 · 三网切换研究", url:"https://pubmed.ncbi.nlm.nih.gov/18723676/"},
    stress: {name:"Qin 等 · 压力与工作记忆实验", url:"https://pubmed.ncbi.nlm.nih.gov/19403118/"},
    sleep: {name:"NHLBI · 睡眠与觉醒周期", url:"https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle"},
    insomnia: {name:"NHLBI · 失眠与行为干预", url:"https://www.nhlbi.nih.gov/health/insomnia/treatment"},
    habit: {name:"Tricomi 等 · 习惯学习实验", url:"https://pubmed.ncbi.nlm.nih.gov/19490086/"},
    attention: {name:"Stothart 等 · 通知与注意实验", url:"https://pubmed.ncbi.nlm.nih.gov/26121498/"},
    retrieval: {name:"Karpicke 等 · 主动回忆实验", url:"https://pubmed.ncbi.nlm.nih.gov/18276894/"},
    anger: {name:"NHS · 应对愤怒", url:"https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anger/"},
    stroke: {name:"CDC · 卒中急症信号", url:"https://www.cdc.gov/stroke/signs-symptoms/"}
  };

  const regions = {
    pfc: {
      name:"前额叶皮层", layer:"cortex", function:"在工作记忆中保持目标，比较选项，调整下一步行动。",
      limit:"疲劳或急性压力可使复杂任务更吃力。发育可延续到二十多岁；25 岁没有统一的成熟开关，也没有可由体感测出的耗能断电点。",
      action:"把当前目标缩成一个可见动作，写下后关掉无关页面。", avoid:"很困时反复切换任务，或仓促做重要决定。", refs:["development","stress","attention"]
    },
    parietal: {
      name:"顶叶", layer:"cortex", function:"整合触觉和空间信息，帮助把注意转向目标的位置。",
      limit:"杂乱的页面会让目标难找。突然忽略一侧空间，尤其伴单侧无力或言语不清，应立即联系当地急救。",
      action:"在密集材料中用手指或标记定位当前行。", avoid:"阅读长表时同时盯着几个不断更新的窗口。", refs:["anatomy","stroke"]
    },
    temporal: {
      name:"颞叶", layer:"cortex", function:"参与声音和语言的理解，也与记忆系统交换信息。",
      limit:"背景人声会增加听懂内容的难度。突然听不懂熟悉的话或说话含混，应立即联系当地急救。",
      action:"关掉背景音，听完一段后用自己的话复述。", avoid:"把在嘈杂环境中漏听一句归为脑区失灵。", refs:["anatomy","stroke"]
    },
    occipital: {
      name:"枕叶", layer:"cortex", function:"分析视野中的边缘、方向和运动等视觉特征。",
      limit:"突然视物不清或一侧视野缺损，应立即联系当地急救，即使很快缓解。",
      action:"要找图中一个细节时，放大目标并暂时隐藏无关图层。", avoid:"出现突发视觉变化后继续驾驶或等待自测结果。", refs:["anatomy","stroke"]
    },
    amygdala: {
      name:"杏仁核", layer:"deep", function:"参与评估线索的情绪意义，并学习哪些经历值得警觉。",
      limit:"心跳快、紧张或愤怒都有多种解释。感受强烈时仍有机会改变接下来的动作。",
      action:"先离开冲突现场或暂停回复，给当前情绪起个名字。", avoid:"在情绪最强时猜测对方动机并立即回击。", refs:["anatomy","anger"]
    },
    hippocampus: {
      name:"海马体", layer:"deep", function:"帮助把人物、地点和事件联系起来，形成可以回忆的新经历。",
      limit:"漏记可能发生在注意、编码或提取环节。单次遗忘无法判断皮质醇水平或海马体受损。",
      action:"合上材料，写出刚学的两个要点，再对照补漏。", avoid:"只重复阅读熟悉的文字来判断是否已经掌握。", refs:["anatomy","retrieval"]
    },
    striatum: {
      name:"纹状体（基底神经节）", layer:"deep", function:"参与动作选择、结果学习，以及练熟后容易重复的动作。",
      limit:"反复点开同一应用说明有可观察的行为模式，单靠时长无法推断多巴胺 D2 受体数量。",
      action:"给自动动作增加一步，例如关掉自动播放，下一条由自己选择。", avoid:"用所谓的“多巴胺排毒”替代对触发线索的观察。", refs:["anatomy","habit"]
    },
    thalamus: {
      name:"丘脑", layer:"deep", function:"许多感觉信号经此与皮层交换信息；丘脑也参与睡眠与觉醒。",
      limit:"注意涣散或容易被声音吸引，都无法单独定位到丘脑。",
      action:"要专注时静音提醒，在休息时集中查看消息。", avoid:"一边开着弹窗和声音，一边要求自己忽略每一条。", refs:["anatomy","sleep","attention"]
    },
    hypothalamus: {
      name:"下丘脑", layer:"deep", function:"参与体温、饥饿等生理调节，其中的视交叉上核帮助校准昼夜节律。",
      limit:"深夜有食欲可能同时受进餐间隔、作息和外界提示影响。",
      action:"记录最近一次进餐和睡眠的时间，再判断此刻是饥饿、困倦，还是被提示吸引。", avoid:"只凭一次夜宵冲动判断激素异常。", refs:["anatomy","sleep"]
    },
    cerebellum: {
      name:"小脑", layer:"base", function:"比较计划动作与实际反馈，帮助协调、校正和学习动作。",
      limit:"突然行走困难、明显失衡或协调异常，应立即联系当地急救。",
      action:"学新动作时在平稳环境里放慢速度，一次调整一个细节。", avoid:"突然站不稳时用高难度平衡动作做自测。", refs:["anatomy","stroke"]
    },
    brainstem: {
      name:"脑干", layer:"base", function:"参与呼吸等生命活动，以及保持清醒所需的广泛信号。",
      limit:"出现难以唤醒或呼吸明显异常时，应立即联系当地急救。",
      action:"困到难以保持清醒时，停止驾驶或机械操作，到安全处休息。", avoid:"靠再刷几条视频来判断自己是否足够清醒。", refs:["anatomy","sleep"]
    }
  };

  const states = [
    {id:"fog", name:"注意力涣散 / 脑雾", regions:["pfc","parietal","thalamus"],
      mechanism:"睡眠不足、打断和过高的任务负荷都可能让目标难以维持。检查最近的睡眠和任务环境，比猜测前额叶是否“离线”更有信息量。",
      now:"关掉通知，把接下来要完成的一步写在纸上，只做这一步。", later:"在相近时段记录睡眠、打断次数和任务完成情况。若持续加重或影响生活，安排就医评估。", refs:["attention","sleep","stress"]},
    {id:"loop", name:"短视频 / 游戏停不下", regions:["striatum","pfc","occipital"],
      mechanism:"图标、提示音和下一条内容都可能成为继续操作的线索。刷屏行为无法测出 D2 受体是否下调。",
      now:"退出应用，把手机放到需要起身才能拿到的位置；先完成原本想做的一件小事。", later:"记下最常开始刷屏的时段，关掉一个最常触发你的入口，比较使用记录。", refs:["habit","attention"]},
    {id:"tense", name:"易怒 / 焦虑", regions:["amygdala","pfc","brainstem"],
      mechanism:"感到被威胁时，身体唤醒和注意变化可能让你更快发出第一反应。单凭愤怒无法判断杏仁核活动或皮质醇水平。",
      now:"在安全的地方暂停对话，放慢呼吸，等能完整说出诉求再回复。", later:"回顾一次触发事件，写下当时的解释和另一种解释；反复影响生活时可寻求专业支持。", refs:["anger","stress"]},
    {id:"forget", name:"刚学完就忘", regions:["hippocampus","pfc","temporal"],
      mechanism:"读时熟悉、合上想不起来，可能是最初没有充分编码，也可能是提取困难。日常遗忘不能证明皮质醇正在抑制海马体。",
      now:"遮住原文，自问一个具体问题，尽力回答，再核对漏掉了什么。", later:"隔天再次闭卷回忆同一问题，比较自己能独立说出的内容。", refs:["retrieval","anatomy"]},
    {id:"sleep", name:"难入睡 / 多梦", regions:["hypothalamus","brainstem","thalamus"],
      mechanism:"先看作息、咖啡因、睡前刺激及白天是否困倦。梦记得多或睡得差，都无法据此判断类淋巴清除功能是否受阻。",
      now:"收起屏幕、调暗光线；躺着越来越清醒时，起身做安静的事，困了再回床。", later:"尽量固定适合自己班次的起床时间，记下睡眠和白天精神。长期失眠影响生活时，可咨询失眠认知行为治疗（CBT-I）。", refs:["sleep","insomnia"]}
  ];

  const networks = {
    cen:{name:"中央执行网络（CEN）", description:"背外侧前额叶、后顶叶等协同维持任务目标、操作工作记忆。", refs:["networks"]},
    dmn:{name:"默认模式网络（DMN）", description:"内侧前额叶、后扣带皮层等参与回忆、自我相关思考和想象未来。", refs:["networks"]},
    sn:{name:"突显网络（SN）", description:"前岛叶、背侧前扣带等参与识别重要变化，协调注意与其他网络的参与。", refs:["networks"]}
  };

  const scenarios = [
    {id:"night", name:"深夜想点夜宵、刷手机", refs:["habit","sleep","attention"],
      steps:[
        {region:"hypothalamus", title:"先察觉身体状态", text:"已经很困，也可能确实饿了。饥饿和困倦都是需要辨认的线索。", network:null},
        {region:"occipital", title:"推荐卡片亮起", text:"你正要睡下，屏幕上的食物图片吸引了注意。", network:"sn"},
        {region:"striatum", title:"熟悉的动作接上", text:"过去常在此时点开推荐，手指顺势滑向下一条。", network:null},
        {region:"pfc", title:"原先的目标退到一旁", text:"“再看一条”的回报就在眼前，原先的睡觉计划更难维持。", network:null}
      ],
      intervention:{title:"把入口移远", text:"先给手机接上远处的充电线。多出的一步让你有时间决定是否继续。", steps:[
        {region:"occipital", title:"看见熟悉提示", text:"同样的推荐出现，你认出这是常见的触发点。", network:"sn"},
        {region:"pfc", title:"按预先约定停一下", text:"先放远手机，再问自己想吃东西还是想用内容提神。", network:"cen"},
        {region:"hypothalamus", title:"回应实际需要", text:"确实饿了就按需要安排进食；困了就准备休息。这样可以观察哪种选择对自己更合适。", network:null}
      ]}},
    {id:"anger", name:"被挑衅，想立刻回击", refs:["anger","stress"],
      steps:[
        {region:"temporal", title:"听见一句刺耳的话", text:"话语的语义、语气和已有经验共同影响理解。", network:null},
        {region:"amygdala", title:"注意被威胁线索抓住", text:"你把这句话理解为攻击，其他解释暂时不容易想到。", network:"sn"},
        {region:"brainstem", title:"察觉身体已紧绷", text:"心跳和肌肉紧张可能改变，此时先留意自己是否安全。", network:null},
        {region:"striatum", title:"惯常的回应浮现", text:"如果以前总是当场反驳，一句回击可能很快脱口而出。", network:null}
      ],
      intervention:{title:"让回复延迟一步", text:"先说“我需要停一下”，或把回应写成草稿。", steps:[
        {region:"amygdala", title:"认出警报", text:"先觉察到发火的冲动，把注意转向当下的处境。", network:"sn"},
        {region:"pfc", title:"给第一反应留出间隔", text:"在安全处暂停，明确自己希望解决的问题。", network:"cen"},
        {region:"temporal", title:"换一种表达", text:"用一句可核对的事实或澄清问题代替猜测对方的动机。", network:null}
      ]}},
    {id:"focus", name:"清醒时攻克一道难题", refs:["networks","attention","retrieval"],
      steps:[
        {region:"hippocampus", title:"从已有经验找线索", text:"你想起以前遇过的类似问题，先在脑中试想可能的思路。", network:"dmn"},
        {region:"pfc", title:"把目标固定下来", text:"写下一个清楚的问题，用工作记忆维持当前的解题规则。", network:"cen"},
        {region:"parietal", title:"逐项比较条件", text:"把注意转到相关变量与位置，检验第一个解法。", network:"cen"},
        {region:"occipital", title:"弹窗打断推演", text:"一条与任务无关的通知吸引了视线，原来的步骤需要重新找回。", network:"sn"}
      ],
      intervention:{title:"先移除任务外线索", text:"开始前静音弹窗，把纸笔放在手边。", steps:[
        {region:"pfc", title:"只留下当前问题", text:"写出本轮要回答的问题，再关掉无关窗口。", network:"cen"},
        {region:"parietal", title:"用纸面保存中间步骤", text:"把条件画出来，让比较过程可见。", network:"cen"},
        {region:"hippocampus", title:"试着独立复述", text:"合上解答，用自己的话解释关键一步，再核对。", network:null}
      ]}}
  ];

  window.BrainData = {regions, states, scenarios, sources, networks};
})();
