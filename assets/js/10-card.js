/* 速记卡渲染：英雄技能、社群提示、视频链接、地图速记 */
/* ================= 渲染速记卡 ================= */
$("goBtn").onclick=()=>{
  const h=HEROES[$("heroSel").value],m=$("mapSel").value>=0?MAPS[$("mapSel").value]:null;
  render(h.id,m?m.id:null);
  show("ok","已按手动选择生成（降级入口永远可用）");
};
function rerender(){if($("card").style.display==="block"){render(HEROES[heroIdx].id,mapIdx?mapIdx.id:null)}}

function render(id,mapId){
  const h=HEROES.find(x=>x.id===id);if(!h)return;
  const mp=mapId?MAPS.find(x=>x.id===mapId):null;
  heroIdx=HEROES.indexOf(h);mapIdx=mp;
  $("card").style.display="block";
  $("hName").innerHTML=`${h.name_cn}<small>${h.name_en} · ${h.role}</small><span class="rolechip">英雄速记</span>${mp?`<span class="mapchip">${mp.name_cn}</span>`:""}`;
  $("hOne").textContent=h.one_liner;

  $("skills").innerHTML=["Q","C","E","X"].map(k=>{
    const s=h.skills[k];
    const gif=s.gif?`<img src="${s.gif}" alt="${s.name}">`:"动图占位 · 自录后回填URL";
    return `<div class="skill">
      <div class="key ${k==="X"?"x":""}">${k}</div>
      <div><div class="sname">${s.name}</div><div class="scost">${s.cost}</div></div>
      <div class="sdesc">${s.desc}</div>
      <div class="gifbox">${gif}</div>
    </div>`}).join("");

  /* 英雄提示 = 官方整理 + 社群投稿 */
  const ch=communityFor("hero",h.id);
  $("tipsList").innerHTML=h.quick_tips.map(t=>`<li>${t}</li>`).join("")
    +(ch.length?ch.map(t=>`<li><span class="tip-badge">社群投稿</span>${esc(t.text)}${t.gif?` <a class="tip-link" href="${esc(t.gif)}" target="_blank" rel="noopener">↗ 动图</a>`:""}${t.video?` <a class="tip-link" href="${esc(t.video)}" target="_blank" rel="noopener">↗ 视频</a>`:""} <span style="color:var(--sub);font-size:11px">— ${esc(t.author)} · ID:${esc(t.user_id||"")}</span></li>`).join(""):"");

  /* 英雄视频 = 官方 + 社群投稿的视频 */
  const chv=ch.filter(t=>t.video).map(t=>({title:`社群投稿视频 · ${esc(t.author)}`,url:t.video}));
  $("vidList").innerHTML=[...h.videos,...chv].map(v=>
    `<a class="vidbtn" href="${v.url}" target="_blank" rel="noopener">▶ ${v.title}</a>`).join("");

  /* 地图速记 */
  if(mp){
    $("mapsec").style.display="block";
    const cm=communityFor("map",mp.id);
    $("mName").innerHTML=`${mp.name_cn}<small>${mp.name_en}</small>`;
    $("mOne").textContent=mp.one_liner;
    $("mTipsList").innerHTML=mp.tips.map(t=>`<li>${t}</li>`).join("")
      +(cm.length?cm.map(t=>`<li><span class="tip-badge">社群投稿</span>${esc(t.text)}${t.gif?` <a class="tip-link" href="${esc(t.gif)}" target="_blank" rel="noopener">↗ 动图</a>`:""}${t.video?` <a class="tip-link" href="${esc(t.video)}" target="_blank" rel="noopener">↗ 视频</a>`:""} <span style="color:var(--sub);font-size:11px">— ${esc(t.author)} · ID:${esc(t.user_id||"")}</span></li>`).join(""):"");
    const cmv=cm.filter(t=>t.video).map(t=>({title:`社群投稿视频 · ${esc(t.author)}`,url:t.video}));
    $("mVidList").innerHTML=[...mp.videos,...cmv].map(v=>
      `<a class="vidbtn" href="${v.url}" target="_blank" rel="noopener">▶ ${v.title}</a>`).join("");
  }else{
    $("mapsec").style.display="none";
  }

  $("card").scrollIntoView({behavior:"smooth"});
}
