/* 通用轮播引擎 + 英雄/地图轮播渲染 */
/* ================= Carousel 轮播滑块 ================= */
/* 通用轮播引擎：滑轨平移 + 箭头翻页 + 指示点 + 自动轮播（悬停/隐藏页暂停）+ 拖拽跟手（边缘阻尼回弹）
   数据层零改动：卡片渲染函数只负责往 .cartrack 里塞内容，翻页状态由引擎自行测量 */
const CAROUSELS={};
function setupCarousel(rootId,autoMs){
  const root=$(rootId);
  const view=root.querySelector(".carview");
  const track=root.querySelector(".cartrack");
  const dotsEl=root.querySelector(".cardots");
  const prevBtn=root.querySelector(".carbtn.prev");
  const nextBtn=root.querySelector(".carbtn.next");
  const noteEl=root.parentElement?root.parentElement.querySelector(".carnote"):null;
  const st={index:0,slides:0,maxIndex:0,step:0,timer:null};
  const visible=()=>root.offsetParent!==null;

  function apply(anim){
    if(!anim){track.style.transition="none";requestAnimationFrame(()=>{track.style.transition=""})}
    track.style.transform="translateX("+(-st.index*st.step)+"px)";
    dotsEl.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("on",i===st.index));
    if(noteEl)noteEl.textContent=st.maxIndex>0?(st.slides+" 张 · 自动轮播 · 第 "+(st.index+1)+"/"+(st.maxIndex+1)+" 屏"):"";
  }
  function goTo(i,anim=true){
    if(st.maxIndex<=0){st.index=0;apply(false);return}
    if(i>st.maxIndex)i=0;          /* 尾页继续下一张 → 回到开头 */
    if(i<0)i=st.maxIndex;          /* 首页继续上一张 → 跳到尾页 */
    st.index=i;apply(anim);
  }
  function measure(){
    const n=track.children.length;
    st.slides=n;
    /* 空内容或页面不可见（display:none 尺寸为 0）时不测量，等切页/resize 后重测 */
    if(!n||!visible()){root.classList.add("noslides");st.maxIndex=0;st.index=0;st.step=0;if(noteEl)noteEl.textContent=n?n+" 张":"";return}
    st.step=n>1?(track.children[1].offsetLeft-track.children[0].offsetLeft):view.clientWidth||1;
    const perView=Math.max(1,Math.round(view.clientWidth/st.step));
    st.maxIndex=Math.max(0,n-perView);
    if(st.index>st.maxIndex)st.index=Math.max(0,st.maxIndex);
    dotsEl.innerHTML="";
    for(let i=0;i<=st.maxIndex;i++){
      const b=document.createElement("button");
      b.type="button";b.setAttribute("aria-label","定位到第 "+(i+1)+" 屏");
      b.innerHTML="<i></i>";
      b.onclick=()=>{goTo(i);restart()};
      dotsEl.appendChild(b);
    }
    root.classList.toggle("noslides",st.maxIndex<=0);
    apply(false);
  }
  function tick(){
    if(document.hidden||!visible()||st.maxIndex<=0)return;
    if(root.matches(":hover"))return;             /* 悬停暂停 */
    goTo(st.index+1);
  }
  function restart(){clearInterval(st.timer);st.timer=setInterval(tick,autoMs||3600)}
  prevBtn.onclick=()=>{goTo(st.index-1);restart()};
  nextBtn.onclick=()=>{goTo(st.index+1);restart()};

  /* 拖拽 / 触摸滑动（水平拖动跟手，垂直滑动放行给页面滚动） */
  let sx=0,sy=0,dx=0,dragging=false,pid=null;
  view.addEventListener("pointerdown",e=>{
    if(st.maxIndex<=0)return;
    if(e.pointerType==="mouse"&&e.button!==0)return;
    pid=e.pointerId;sx=e.clientX;sy=e.clientY;dx=0;dragging=false;
  });
  view.addEventListener("pointermove",e=>{
    if(pid===null||e.pointerId!==pid)return;
    const mx=e.clientX-sx,my=e.clientY-sy;
    if(!dragging){
      if(Math.abs(mx)>8&&Math.abs(mx)>Math.abs(my)){
        dragging=true;track.classList.add("dragging");
        try{view.setPointerCapture(pid)}catch(_){}
      }else if(Math.abs(my)>8){pid=null;return}
      else return;
    }
    dx=mx;
    let t=-st.index*st.step+dx;
    if((st.index===0&&dx>0)||(st.index===st.maxIndex&&dx<0))t=-st.index*st.step+dx*0.35; /* 边缘阻尼 */
    track.style.transform="translateX("+t+"px)";
  });
  function endDrag(){
    if(pid===null)return;
    pid=null;
    if(!dragging)return;
    dragging=false;track.classList.remove("dragging");
    if(Math.abs(dx)>50)goTo(st.index+(dx<0?1:-1));
    else apply(true);
    restart();
    if(Math.abs(dx)>8){ /* 拖拽后吞掉这次 click，避免误触发卡片里的链接/按钮 */
      const kill=ev=>{ev.preventDefault();ev.stopPropagation()};
      view.addEventListener("click",kill,{capture:true,once:true});
      setTimeout(()=>view.removeEventListener("click",kill,{capture:true,once:true}),80);
    }
  }
  view.addEventListener("pointerup",endDrag);
  view.addEventListener("pointercancel",endDrag);

  const api={measure,goTo,restart};
  CAROUSELS[rootId]=api;
  measure();restart();
  return api;
}
/* 切换 Tab / 窗口尺寸变化后重测（display:none 时尺寸为 0，必须重新测量） */
function refreshCarousels(){Object.values(CAROUSELS).forEach(c=>c.measure())}
let _rzT=null;
window.addEventListener("resize",()=>{clearTimeout(_rzT);_rzT=setTimeout(refreshCarousels,150)});

function renderHeroCarousel(){
  document.querySelector("#heroCarousel .cartrack").innerHTML=HEROES.map(h=>{
    const minis=["Q","C","E","X"].map(k=>`<div><b class="${k==="X"?"x":""}">${k}</b>${esc(h.skills[k].name)}：${esc(h.skills[k].desc)}</div>`).join("");
    return `<div class="cslide">
      <div class="cname">${esc(h.name_cn)}<small>${esc(h.name_en)}</small><span class="rolechip">${esc(h.role)}</span></div>
      <div class="cone">${esc(h.one_liner)}</div>
      <div class="minis">${minis}</div>
      <ul class="ctips">${h.quick_tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
      <div class="cvids">${h.videos.map(v=>`<a class="vidbtn" href="${esc(v.url)}" target="_blank" rel="noopener">▶ ${esc(v.title)}</a>`).join("")}</div>
      <button class="btn-main goto" data-hero="${h.id}">查看速记卡 →</button>
    </div>`;
  }).join("");
  document.querySelectorAll("#heroCarousel .goto").forEach(b=>b.onclick=()=>{
    switchTab("station");
    $("heroSel").value=HEROES.findIndex(x=>x.id===b.dataset.hero);
    render(b.dataset.hero,$("mapSel").value>=0?MAPS[$("mapSel").value].id:null);
  });
  if(CAROUSELS.heroCarousel)CAROUSELS.heroCarousel.measure();
}

function renderMapCarousel(){
  document.querySelector("#mapCarousel .cartrack").innerHTML=MAPS.map(m=>{
    return `<div class="cslide map">
      <div class="cname">${esc(m.name_cn)}<small>${esc(m.name_en)}</small><span class="mapchip">地图速记</span></div>
      <div class="cone">${esc(m.one_liner)}</div>
      <ul class="ctips">${m.tips.map(t=>`<li>${esc(typeof t==="string"?t:t.text)}</li>`).join("")}</ul>
      <div class="cvids">${m.videos.map(v=>`<a class="vidbtn" href="${esc(v.url)}" target="_blank" rel="noopener">▶ ${esc(v.title)}</a>`).join("")}</div>
      <button class="btn-main goto" data-map="${m.id}">查看速记卡 →</button>
    </div>`;
  }).join("");
  document.querySelectorAll("#mapCarousel .goto").forEach(b=>b.onclick=()=>{
    switchTab("station");
    const mi=MAPS.findIndex(x=>x.id===b.dataset.map);
    $("mapSel").value=mi;
    render(HEROES[$("heroSel").value].id,mi>=0?MAPS[mi].id:null);
  });
  if(CAROUSELS.mapCarousel)CAROUSELS.mapCarousel.measure();
}
