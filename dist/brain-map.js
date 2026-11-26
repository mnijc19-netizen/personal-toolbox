(() => {
  "use strict";
  const ns = "http://www.w3.org/2000/svg";
  const outline = "M100 197 C91 187 93 175 99 164 C94 151 102 138 113 130 C115 114 125 105 141 99 C147 86 164 78 178 78 C190 64 207 61 225 61 C242 49 262 47 279 50 C297 42 314 44 327 48 C345 42 364 45 380 51 C398 48 417 55 428 62 C445 60 462 70 473 80 C490 81 505 94 510 108 C527 115 535 127 536 141 C547 150 551 165 546 178 C552 191 543 204 536 211 C534 223 522 235 506 239 C494 250 481 251 469 251 C449 265 425 269 402 265 C383 274 362 273 343 271 C326 282 304 282 284 277 C265 285 245 283 229 277 C208 278 191 267 181 256 C168 245 168 235 168 226 C151 233 132 229 120 222 C108 220 100 210 100 197Z";
  const regions = {
    pfc: {name:"前额叶",layer:"cortex",at:[149,157],label:[28,108,86,108], d:"M83 192 Q83 107 167 72 Q206 54 227 56 C215 77 207 84 210 105 C214 121 198 131 204 148 C209 164 198 175 186 185 C178 198 176 209 166 225 Q102 250 83 192Z"},
    parietal: {name:"顶叶",layer:"cortex",at:[414,96],label:[442,27,423,27], d:"M327 41 Q438 30 485 83 C474 100 465 109 468 123 C474 143 449 151 443 169 C420 179 403 177 380 181 L303 173 C310 159 332 140 325 126 C318 110 334 99 329 87 C321 70 336 57 327 41Z"},
    temporal: {name:"颞叶",layer:"cortex",at:[207,241],label:[46,287,116,287], d:"M167 229 C180 213 201 212 224 202 C240 195 247 186 262 183 C292 170 320 184 348 179 C383 184 405 171 442 169 C457 177 468 184 475 202 L471 254 Q415 287 347 278 Q272 296 195 277 L165 255Z"},
    occipital: {name:"枕叶",layer:"cortex",at:[508,165],label:[574,135,550,135], d:"M481 78 C477 94 464 110 468 123 C473 138 453 151 443 169 C451 180 446 189 454 202 C467 222 458 236 469 255 Q562 247 562 164 Q555 100 481 78Z"},
    amygdala: {name:"杏仁核",layer:"deep",at:[241,219],label:[64,266,155,266], d:"M228 220 Q225 208 238 207 Q251 206 254 218 Q251 229 240 231 Q231 231 228 220Z"},
    hippocampus: {name:"海马体",layer:"deep",at:[303,236],label:[392,325,377,325], d:"M255 229 C271 224 286 237 305 233 C338 232 353 218 371 209 C382 204 395 208 393 216 C389 222 377 221 368 229 C345 246 322 251 302 250 C284 249 270 244 255 244 C249 243 246 234 255 229Z"},
    striatum: {name:"纹状体",layer:"deep",at:[277,166],label:[131,83,199,83], d:"M244 185 C238 164 253 148 276 143 C306 135 341 144 354 160 C337 154 311 151 296 159 C281 164 280 181 263 190 C253 194 248 191 244 185Z"},
    thalamus: {name:"丘脑",layer:"deep",at:[330,184],label:[491,114,450,114], d:"M299 186 C296 174 308 164 324 164 C338 163 353 168 358 179 C363 188 352 199 338 202 C319 207 303 200 299 186Z"},
    hypothalamus: {name:"下丘脑",layer:"deep",at:[296,210],label:[167,319,234,319], d:"M287 200 C295 196 303 200 311 204 L309 213 Q303 221 296 223 L284 217 Q280 209 287 200Z"},
    cerebellum: {name:"小脑",layer:"base",at:[445,283],label:[515,330,493,330], d:"M367 262 C377 246 399 239 421 240 C446 236 470 246 483 259 C499 268 507 285 499 299 C504 312 486 324 472 327 C453 337 436 333 421 331 C400 334 385 323 379 314 C362 304 357 290 362 276Z"},
    brainstem: {name:"脑干",layer:"base",at:[350,303],label:[239,357,289,357], d:"M313 210 Q325 207 339 213 C340 234 353 248 365 261 C383 275 377 291 365 299 C359 315 365 336 374 354 L353 363 C340 345 338 326 334 308 C315 303 307 285 310 275 C311 262 322 256 324 249 Q321 229 313 218Z"}
  };
  const networks = {
    cen:{color:"#71dfff", points:[[170,122],[411,107]], title:"CEN · 背外侧前额叶与后顶叶"},
    dmn:{color:"#efb4fb", points:[[139,182],[379,127],[445,142]], title:"DMN · 内侧前额叶、后扣带/楔前叶与角回"},
    sn:{color:"#ffbd78", points:[[236,190],[293,140]], title:"SN · 前岛叶与背侧前扣带"}
  };
  const colors = {
    pfc:["#285a69","#173f4f","#5997a5"],parietal:["#3b646d","#22444e","#73a2aa"],
    temporal:["#315663","#183646","#578898"],occipital:["#365867","#1d3648","#7496a1"],
    amygdala:["#ce9962","#92684a","#efd09b"], hippocampus:["#9c835a","#76644b","#e5c493"],
    striatum:["#b59167","#786246","#e4c195"],thalamus:["#bd916e","#86694f","#edc6a6"],
    hypothalamus:["#c7a882","#917b66","#e7d1ab"], cerebellum:["#635e84","#3b3c5c","#a59cc3"],
    brainstem:["#77718a","#434558","#aaa1b8"]
  };
  // Sulci follow the lateral cortical surface; the central opening is a cutaway.
  const sulci = [
    "M108 157q10 6 16-2t15-11q8-3 10-16t16-14q12-2 14-15",
    "M105 183q15 1 21-13t17-13q14 0 18-10t14-18q10-10 7-25",
    "M115 199q11 0 19-9t19-11q16-2 15-19t15-17",
    "M131 216q10-10 24-11t16-17q5-13 18-14", "M135 126q13-3 15-16t16-14",
    "M159 88q10 8 23 3t24-16","M190 74q10 1 17-4","M181 118q11 0 17-14",
    "M190 155q2-12 13-17","M207 86q10-11 24-11t19-15","M218 116q-5-13 11-22t16-13",
    "M219 143q-3-11 12-21t18-23q2-7 12-10","M233 156q13-16 16-32t18-20q10-5 11-19",
    "M258 71q10 6 22-4t21-9","M266 141q-3-13 10-23t13-26q0-9 12-17",
    "M282 132q4-9 14-15t12-22q0-11 10-22","M301 137q11-4 13-16",
    "M343 56q-8 11-4 24t-2 19","M354 63q-7 12-1 24t-7 25q-8 8-6 17",
    "M373 63q-6 11-5 22t-8 20q-11 10-7 22","M392 66q-13 7-14 18t-9 17",
    "M407 76q-16 6-16 16t-13 16q-10 5-9 16","M433 80q-12 0-17 12t-16 14q-16 1-17 16",
    "M449 91q-15 1-18 13t-17 16q-14 2-16 12","M458 109q-9 2-11 14t-24 16",
    "M446 141q-9 13-24 12t-21 8","M475 100q12 1 20 11","M481 122q14 3 18 15t23 15",
    "M469 148q11-5 20 8t21 9q11-1 18 7","M461 169q12-6 23 3t19 8q12-3 23 8",
    "M473 190q9-7 17 0t22 10","M471 210q9-5 18 2t19 8","M478 234q13-7 22-3",
    "M185 238q16-11 35-14t23-11","M192 251q22-12 42-12","M208 260q19-7 36-5t25-3",
    "M228 270q13-5 26-3t25-3","M279 266q16-7 30-5t29-5","M335 265q22-11 40-9t28-6",
    "M388 245q16-11 28-9t20-13","M408 226q9-7 20-6t16-13","M415 207q17-9 20-18"
  ].join(" ");
  let instance = 0;
  function mount(container, {onHover, onSelect}) {
    const prefix = "bm" + (++instance);
    const link = name => "url(#" + prefix + "-" + name + ")";
    const root = document.createElementNS(ns,"svg");
    root.setAttribute("viewBox","14 10 612 374");
    root.setAttribute("role","group");
    root.setAttribute("aria-label","交互式侧视脑图，前方在左。用 Tab 切换脑区，Enter 或空格选择。");
    root.classList.add("brain-atlas-svg");
    root.style.cssText = "display:block;width:100%;height:auto;max-height:540px;min-height:145px;touch-action:manipulation;";
    container.replaceChildren(root);
    const regionNodes = new Map(), labelNodes = new Map(), networkNodes = new Map();
    function add(parent, tag, attrs = {}, text) {
      const el = document.createElementNS(ns,tag);
      for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
      if (text !== undefined) el.textContent = text;
      parent.appendChild(el);
      return el;
    }
    function path(parent,d,attrs) { return add(parent,"path",{d,...attrs}); }
    add(root,"desc",{},"外层脑叶与深部结构以剖开展示，多种颜色区分结构组。网络节点是侧面投影，连线示意协同关系。");
    add(root,"style",{},`
      .brain-atlas-svg text{font-family:system-ui,"Microsoft YaHei",sans-serif}
      .brain-atlas-svg .region,.brain-atlas-svg .callout{cursor:pointer;outline:none}
      .brain-atlas-svg .shape,.brain-atlas-svg .region,.brain-atlas-svg .callout{transition:opacity .15s,stroke .15s,fill .15s}
      .brain-atlas-svg .region.is-current .shape,.brain-atlas-svg .region:focus-visible .shape{fill:#367d7f;stroke:#a1f9dd;stroke-width:3}
      .brain-atlas-svg .region.is-related:not(.is-current) .shape{stroke:#ffd88f;stroke-width:2.8;stroke-dasharray:5 2}
      .brain-atlas-svg .callout.is-current text{fill:#b1ffe5;font-weight:700}
      .brain-atlas-svg .callout.is-current path{stroke:#95e9d0}
      .brain-atlas-svg .callout.is-related:not(.is-current) text{fill:#ffe1a0}
      .brain-atlas-svg.compact .callout text{font-size:20px}
      .brain-atlas-svg .region.filtered{opacity:.16;pointer-events:none}
      .brain-atlas-svg .motion-signal{animation:bm-travel 1s linear infinite;animation-play-state:var(--brain-play-state,running)}
      @keyframes bm-travel{to{stroke-dashoffset:-25}}
      @media(prefers-reduced-motion:reduce){.brain-atlas-svg *{animation:none!important;transition:none!important}}
    `);
    const defs = add(root,"defs");
    const clip = add(defs,"clipPath",{id:prefix+"-clip"});
    path(clip,outline);
    for (const [key,[top,base]] of Object.entries(colors)) {
      const gradient = add(defs,"linearGradient",{id:prefix+"-"+key,x2:".75",y2:"1"});
      add(gradient,"stop",{offset:"0%","stop-color":top});
      add(gradient,"stop",{offset:"100%","stop-color":base});
    }
    const arrow = add(defs,"marker",{id:prefix+"-arr",viewBox:"0 0 8 8",refX:"7",refY:"4",markerWidth:"5",markerHeight:"5",orient:"auto-start-reverse"});
    path(arrow,"M0 0L8 4L0 8L2 4Z",{fill:"#9ff9dc"});
    const grid = add(defs,"pattern",{id:prefix+"-grid",width:22,height:22,patternUnits:"userSpaceOnUse"});
    add(grid,"circle",{cx:1,cy:1,r:.85,fill:"#87a6ab",opacity:.22});
    add(root,"rect",{x:14,y:10,width:612,height:374,rx:10,fill:link("grid"),"pointer-events":"none"});
    const base = add(root,"g");
    function region(parent,id) {
      const r = regions[id];
      const group = add(parent,"g",{class:"region","data-region":id,tabindex:"0",role:"button","aria-label":r.name});
      add(group,"title",{},r.name);
      path(group,r.d,{class:"shape",fill:link(id),stroke:colors[id][2],"stroke-width":1.3,"stroke-linejoin":"round"});
      regionNodes.set(id, group);
      return group;
    }
    region(base,"brainstem");
    region(base,"cerebellum");
    const cbClip = add(defs,"clipPath",{id:prefix+"-cb"});
    path(cbClip,regions.cerebellum.d);
    const folds = add(base,"g",{"clip-path":link("cb"),fill:"none","pointer-events":"none"});
    for (let j=0;j<16;j++) {
      const y=233+j*6.6, curl=(j-7)*2;
      const d=`M354 ${y+16} Q379 ${y-3+j*.4} 400 ${y+3} Q414 ${y+9} 437 ${y+4} Q461 ${y-3} 475 ${y+curl*.3} Q492 ${y+curl} 514 ${y-16+curl}`;
      path(folds,d,{stroke:"#302e4d","stroke-width":3,opacity:.63});
      path(folds,d,{stroke:"#bfb2d5","stroke-width":1.3,transform:"translate(0 1.3)",opacity:.75});
    }
    path(base,"M325 221q19 25 19 47m-24 6q19 7 38 1m-37 6q18 6 37 0m-35 6q18 6 34-1m-31 7q18 6 29-2m-17 12q8 18 16 37m-9-39q5 20 14 33",{stroke:"#c1b4cd","stroke-width":1.7,opacity:.52,fill:"none","pointer-events":"none"});
    const cortex = add(root,"g");
    path(cortex,outline,{fill:"#244956",stroke:"#91b2ba","stroke-width":2.5});
    const lobes=add(cortex,"g",{"clip-path":link("clip")});
    for (const id of ["pfc","parietal","occipital","temporal"]) region(lobes,id);
    const grooves=add(lobes,"g",{fill:"none","stroke-linecap":"round","pointer-events":"none"});
    path(grooves,sulci,{stroke:"#102d3c","stroke-width":4.3,opacity:.66});
    path(grooves,sulci,{stroke:"#83aab0","stroke-width":1.1,transform:"translate(0 1.8)",opacity:.58});
    path(grooves,"M326 48 C336 62 320 68 329 87 C337 105 315 111 325 127 M167 225 C185 211 208 211 224 202 Q246 187 260 184",{stroke:"#142e3d","stroke-width":3});
    const cut = add(root,"g",{"pointer-events":"none"});
    path(cut,"M219 193 C225 169 249 146 272 139 C300 127 343 130 368 149 C384 163 390 177 398 190 C414 208 404 226 383 234 C354 247 331 255 304 255 C277 257 247 249 230 237 C216 228 214 213 219 193Z",{fill:"#152a31",stroke:"#74939a","stroke-width":1.45});
    path(cut,"M229 186 C247 151 282 139 309 140 C346 138 373 161 381 180 M231 232 Q254 250 284 249",{fill:"none",stroke:"#68838a","stroke-width":3,opacity:.48});
    path(cut,"M231 186 C234 164 261 139 302 137 C346 133 372 151 385 176 C388 182 387 188 383 191 C380 184 377 172 368 163 C349 147 326 143 299 145 C269 147 250 160 243 178 C241 185 239 192 235 194 Q231 194 231 186Z",{fill:"#b6bd9c",opacity:.66,stroke:"#c6c9b6","stroke-width":.7});
    path(cut,"M254 197 C273 192 277 175 294 163 Q312 152 332 157 C313 156 299 166 291 178 C281 193 270 199 254 197Z",{fill:"#547077",opacity:.85});
    const deep=add(root,"g");
    for(const id of ["striatum","thalamus","hippocampus","hypothalamus","amygdala"]) region(deep,id);
    path(deep,"M252 177q15-24 38-27m21 35q15-13 33-7m-78 58q46 15 92-14",{fill:"none",stroke:"#ead2a5","stroke-width":1.3,opacity:.6,"pointer-events":"none"});
    const wiring=add(root,"g",{"pointer-events":"none"});
    for(const [key,net] of Object.entries(networks)) {
      const group=add(wiring,"g",{"data-network":key,display:"none"});
      add(group,"title",{},net.title);
      let line="M"+net.points[0].join(" ");
      for(let i=1;i<net.points.length;i++) {
        const [x,y]=net.points[i], [px,py]=net.points[i-1];
        line+=` Q${(px+x)/2} ${Math.min(py,y)-24} ${x} ${y}`;
      }
      path(group,line,{fill:"none",stroke:"#092026","stroke-width":6});
      path(group,line,{fill:"none",stroke:net.color,"stroke-width":2.7,"stroke-dasharray":key==="sn"?"4 3":key==="dmn"?"8 4":"none"});
      for(const [x,y] of net.points) {
        add(group,"circle",{cx:x,cy:y,r:6.5,fill:"#10232d",stroke:net.color,"stroke-width":2});
        add(group,"circle",{cx:x,cy:y,r:2.1,fill:net.color});
      }
      networkNodes.set(key,group);
    }
    const flow = add(root,"g",{"pointer-events":"none"});
    const labels=add(root,"g");
    for(const [id,r] of Object.entries(regions)) {
      const [x,y,elbow,ey]=r.label, [ax,ay]=r.at;
      const g=add(labels,"g",{class:"callout","data-region":id,"aria-hidden":"true"});
      const end=x<elbow?x+(r.name.length*14.5)+5:x-5;
      path(g,`M${ax} ${ay} L${elbow} ${ey-4} H${end}`,{fill:"none",stroke:"#86a3ad","stroke-width":1,opacity:.8});
      add(g,"circle",{cx:ax,cy:ay,r:2.3,fill:colors[id][2]});
      add(g,"text",{x,y,fill:"#c8dbdf","font-size":14.5,"paint-order":"stroke",stroke:"#10232c","stroke-width":3.2},r.name);
      labelNodes.set(id,g);
    }
    const note=add(root,"text",{x:600,y:376,fill:"#9bb2bc","font-size":"12","text-anchor":"end","pointer-events":"none"});
    let currentLayer="all", previousFlow="";
    function update({layer="all",networks=[],selected=null,related=[],path:route=[],step=0}) {
      currentLayer=layer;
      const relatedSet=new Set(related);
      const currentStep=Math.min(route.length-1,Math.max(0,step));
      for(const [id,g] of regionNodes) {
        const info=regions[id], filtered=layer!=="all"&&info.layer!==layer;
        g.classList.toggle("filtered",filtered);
        g.classList.toggle("is-current",id===selected);
        g.classList.toggle("is-related",relatedSet.has(id));
        g.setAttribute("aria-pressed",String(id===selected));
        g.setAttribute("aria-hidden",String(filtered));
        g.setAttribute("tabindex",filtered?"-1":"0");
        const lbl=labelNodes.get(id);
        const show=!filtered && (layer!=="all" || info.layer!=="deep" || id===selected);
        lbl.setAttribute("display",show?"inline":"none");
        lbl.classList.toggle("is-current",id===selected);
        lbl.classList.toggle("is-related",relatedSet.has(id));
      }
      cut.setAttribute("opacity", layer==="base"||layer==="cortex" ? ".23" : "1");
      cortex.setAttribute("opacity",layer==="base"||layer==="deep"?".42":"1");
      deep.setAttribute("opacity",layer==="cortex"||layer==="base"?".22":"1");
      for(const [id,g] of networkNodes) g.setAttribute("display",networks.includes(id)?"inline":"none");
      note.textContent=networks.length?"网络节点含内侧结构的侧面投影":"左侧为前方  ·  右侧为后方";
      const flowKey=route.join(",")+"/"+currentStep;
      if(previousFlow===flowKey) return;
      previousFlow=flowKey; flow.replaceChildren();
      for(let i=1;i<=currentStep;i++) {
        if(!regions[route[i-1]]||!regions[route[i]]) continue;
        const [sx,sy]=regions[route[i-1]].at,[tx,ty]=regions[route[i]].at;
        const dist=Math.hypot(tx-sx,ty-sy);
        if(!dist) continue;
        const dx=(tx-sx)/dist,dy=(ty-sy)/dist,curve=Math.min(30,dist*.19);
        const d=`M${sx+dx*6} ${sy+dy*6} Q${(sx+tx)/2+dy*curve} ${(sy+ty)/2-dx*curve} ${tx-dx*9} ${ty-dy*9}`;
        const g=add(flow,"g",{opacity:i===currentStep?1:.56});
        path(g,d,{fill:"none",stroke:"#0f2f38","stroke-width":6});
        path(g,d,{fill:"none",stroke:"#9ff9dc","stroke-width":2.5,"marker-end":link("arr")});
        if(i===currentStep) path(g,d,{class:"motion-signal",fill:"none",stroke:"white","stroke-width":3.4,"stroke-dasharray":"5 20"});
      }
      const active=regions[route[currentStep]];
      if(active) {
        const [cx,cy]=active.at;
        add(flow,"circle",{cx,cy,r:9,fill:"#18393a",stroke:"#a0ffe2","stroke-width":2});
        add(flow,"circle",{cx,cy,r:3.4,fill:"#c8ffef"});
      }
    }
    function regionAt(target) {
      const id=target?.closest?.("[data-region]")?.getAttribute("data-region");
      return id&&(currentLayer==="all"||currentLayer===regions[id].layer)?id:null;
    }
    root.addEventListener("pointerover",e=>{
      if(e.pointerType!=="mouse") return;
      const id=regionAt(e.target);
      if(id&&id!==regionAt(e.relatedTarget)) onHover?.(id);
    });
    root.addEventListener("pointerout",e=>{
      if(e.pointerType==="mouse"&&regionAt(e.target)&&!regionAt(e.relatedTarget)) onHover?.(null);
    });
    root.addEventListener("click",e=>{const id=regionAt(e.target); if(id) onSelect?.(id);});
    root.addEventListener("keydown",e=>{
      if(e.key!=="Enter"&&e.key!==" ") return;
      const id=regionAt(e.target);
      if(id) {e.preventDefault();onSelect?.(id);}
    });
    new ResizeObserver(([entry]) => root.classList.toggle("compact",entry.contentRect.width<540)).observe(container);
    update({});
    return {update};
  }
  window.BrainMap = {mount};
})();
