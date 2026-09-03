/* 社群投稿：投稿表单、清空/重置/导出、点赞评论、投稿流渲染 */
function fillCTarget(){
  const isHero=$("cType").value==="hero";
  const src=isHero?HEROES:MAPS;
  $("cTarget").innerHTML=src.map(x=>`<option value="${x.id}">${x.name_cn} ${x.name_en||""}</option>`).join("");
}
$("cType").onchange=fillCTarget;fillCTarget();

$("cSubmit").onclick=async()=>{
  const text=$("cText").value.trim();
  if(!text){cshow("err","技巧内容必填——一句话就够");return}
  /* 来源标注：用户上传（官方条目在内容库中标记 source:"official"）；元数据：用户ID/时间/点赞/评论随条目保存 */
  const payload={type:$("cType").value,target:$("cTarget").value,text,
    gif:$("cGif").value.trim(),video:$("cVideo").value.trim(),
    author:$("cAuthor").value.trim()||"匿名玩家",
    source:"user",user_id:myUid,ts:today()};
  const btn=$("cSubmit");btn.disabled=true;btn.textContent="提交中…";
  try{
    await DataService.add(payload);
    await refreshCommunity();
    $("cText").value="";$("cGif").value="";$("cVideo").value="";
    const where=DataService.mode==="api"?"已写入 valorant_community.db 数据库":"已进入本机队列";
    cshow("ok","投稿成功："+where+"并记录元数据（来源=用户上传 · 用户ID="+myUid+" · 时间="+today()+"），即时出现在速记卡与投稿流中；「导出投稿包」后可经审核同步到 ima");
  }catch(e){
    cshow("err","投稿失败："+e.message);
  }finally{btn.disabled=false;btn.textContent="提交投稿"}
};
function cshow(type,msg){const s=$("cStatus");s.className="status "+type;s.textContent=msg}

$("cClear").onclick=async()=>{
  const isApi=DataService.mode==="api";
  if(!confirm(isApi?"将清空数据库中的全部投稿与点赞/评论数据（可用「重置演示数据」恢复）。确定？"
                   :"清空后本机投稿与示例将全部删除，且不可恢复。确定？"))return;
  try{
    await DataService.clear();
    await refreshCommunity();
    cshow("ok",isApi?"已清空数据库投稿与互动数据（点「重置演示数据」可恢复）":"已清空本机投稿队列（含示例）");
  }catch(e){cshow("err","清空失败："+e.message)}
};

/* 重置演示数据（仅后端模式可用） */
$("cReset").onclick=async()=>{
  if(!confirm("将用 SQL 脚本重建演示数据：21 条攻略链接 + 4 条投稿 + 3 条评论 + 5 条点赞，当前数据会被覆盖。确定？"))return;
  try{
    await DataService.reset();
    await refreshCommunity();
    cshow("ok","已重置为初始演示数据，并重新连接数据库");
  }catch(e){cshow("err","重置失败："+e.message)}
};

$("cExport").onclick=async()=>{
  try{
    let pack;
    if(DataService.mode==="api"){
      /* 后端模式：直接由数据库导出，保证投稿包与库内数据完全一致 */
      pack=await DataService.exportPack();
      if(!pack)throw new Error("导出失败");
    }else{
      if(!cTips.length){cshow("err","投稿队列为空，先提交一条试试");return}
      pack={kb:"valorantHeroKnow",exported:today(),
        note:"社群投稿包：每条含来源标注(source: official|user)与完整元数据(user_id/ts/likes/comments)。用户上传条目经人工审核后，按 ima 条目模板（来源标注 + 元数据表）写入腾讯 ima 共享知识库 valorantHeroKnow；demo 字段为示例数据，入库前请剔除",
        entries:cTips.map(t=>({type:t.type,target:t.target,text:t.text,gif:t.gif,video:t.video,
          source:t.source||(t.demo?"user":"official"),
          user_id:t.user_id||"",author:t.author,ts:t.ts,likes:t.likes||0,
          comments:(t.comments||[]).map(c=>({author:c.author,text:c.text,ts:c.ts}))}))};
    }
    const blob=new Blob([JSON.stringify(pack,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download="community_tips_pack.json";a.click();
    cshow("ok",`已导出 ${(pack.entries||[]).length} 条投稿（含来源标注与元数据）——审核后按 ima 条目模板入库`);
  }catch(e){cshow("err","导出失败："+e.message)}
};

/* 点赞 / 评论 —— 两种模式都只走 DataService，界面层不碰存储实现 */
async function toggleLike(id){
  const t=cTips.find(x=>x.id===id);if(!t)return;
  const next=!liked.has(id);
  /* 乐观更新：立即反馈，请求失败再回滚，避免网络延迟造成"点了没反应" */
  if(next){liked.add(id);t.likes=(t.likes||0)+1}
  else{liked.delete(id);t.likes=Math.max(0,(t.likes||0)-1)}
  renderCommunity();
  try{
    await DataService.like(id,next);
    renderCommunity();
  }catch(e){
    if(next){liked.delete(id);t.likes=Math.max(0,(t.likes||0)-1)}
    else{liked.add(id);t.likes=(t.likes||0)+1}
    renderCommunity();
    cshow("err","点赞同步失败："+e.message);
  }
}
async function addComment(id,text){
  const t=cTips.find(x=>x.id===id);if(!t)return;
  t.comments=t.comments||[];
  t.comments.push({author:"我",text,ts:today(),_pending:true});   /* 乐观占位，成功后被真实列表替换 */
  renderCommunity();
  try{
    const latest=await DataService.comment(id,text);
    if(latest)t.comments=latest;
  }catch(e){
    t.comments=t.comments.filter(c=>!c._pending);
    cshow("err","评论失败："+e.message);
  }
  renderCommunity();
  const el=$("cmt-"+id);if(el)el.style.display="block";   /* 发完保持评论区展开 */
}
function toggleCmt(id){
  const el=$("cmt-"+id);
  if(el)el.style.display=el.style.display==="none"?"block":"none";
}

function renderCommunity(){
  renderCommCarousel();renderFeed();
  const demoN=cTips.filter(t=>t.demo).length;
  $("qCount").textContent=DataService.mode==="api"
    ? `数据库投稿：${cTips.length} 条（读写 valorant_community.db，含示例 ${demoN} 条）`
    : `本机投稿队列：${cTips.length} 条（含示例 ${demoN} 条）`;
}

/* 社群轮播 */
function renderCommCarousel(){
  const list=[...cTips].reverse().slice(0,8);
  document.querySelector("#commCarousel .cartrack").innerHTML=list.map(t=>{
    const name=(t.type==="hero"?HEROES:MAPS).find(x=>x.id===t.target);
    return `<div class="cslide comm">
      <div class="cname"><span class="feed-type ${t.type}">${t.type==="hero"?"英雄":"地图"}</span> ${name?esc(name.name_cn):esc(t.target)}</div>
      <div class="commtext">“${esc(t.text)}”</div>
      <div class="commmeta">👍 ${t.likes||0} · 💬 ${(t.comments||[]).length}${t.gif?` · <a class="tip-link" href="${esc(t.gif)}" target="_blank" rel="noopener">↗ 动图</a>`:""}${t.video?` · <a class="tip-link" href="${esc(t.video)}" target="_blank" rel="noopener">↗ 视频</a>`:""}</div>
      <div class="commmeta"><span class="srcbadge ${t.source==="official"?"off":""}">${t.source==="official"?"官网来源":"用户上传"}</span>— ${esc(t.author)}${t.demo?" <span class=\"demo\" style=\"color:var(--star)\">示例</span>":""}</div>
    </div>`;
  }).join("")||"<div style='flex:1;color:var(--ph);font-size:12.5px;padding:20px;text-align:center'>还没有投稿，来发第一条技巧吧</div>";
  if(CAROUSELS.commCarousel)CAROUSELS.commCarousel.measure();
}

/* 投稿流（点赞 + 评论） */
function renderFeed(){
  const list=[...cTips].reverse();
  $("commFeed").innerHTML=list.map(t=>{
    const name=(t.type==="hero"?HEROES:MAPS).find(x=>x.id===t.target);
    const isLiked=liked.has(t.id);
    const cmts=(t.comments||[]).map(c=>`<div class="cmt"><b>${esc(c.author)}</b>${esc(c.text)}<span class="ts">${c.ts}</span></div>`).join("")||"<div class='cmtempty'>还没有评论，抢个沙发</div>";
    return `<div class="feed-item">
      <div class="feed-top">
        <span class="feed-type ${t.type}">${t.type==="hero"?"英雄":"地图"} · ${name?esc(name.name_cn):esc(t.target)}</span>
        <span class="feed-author">${t.demo?"<span class='demo'>⭐ 示例</span> ":""}<span class="srcbadge ${t.source==="official"?"off":""}">${t.source==="official"?"官网来源":"用户上传"}</span>${esc(t.author)} · ${t.ts}</span>
      </div>
      <div class="feed-text">${esc(t.text)}</div>
      <div class="feed-links">${t.gif?`<a class="tip-link" href="${esc(t.gif)}" target="_blank" rel="noopener">↗ 技巧动图</a>`:""}${t.video?`<a class="tip-link" href="${esc(t.video)}" target="_blank" rel="noopener">↗ 教学视频</a>`:""}</div>
      <div class="feed-actions">
        <button class="actbtn ${isLiked?"liked":""}" data-like="${t.id}">👍 <span>${t.likes||0}</span>${isLiked?" 已赞":""}</button>
        <button class="actbtn" data-cmt="${t.id}">💬 <span>${(t.comments||[]).length}</span> 评论</button>
      </div>
      <div class="cmtsec" id="cmt-${t.id}" style="display:none">
        <div class="cmtlist">${cmts}</div>
        <div class="cmtinput">
          <input type="text" placeholder="友善交流，给出你的补充…" data-cid="${t.id}">
          <button data-add="${t.id}">发送</button>
        </div>
      </div>
    </div>`;
  }).join("")||"<div style='color:var(--ph);font-size:12.5px;padding:20px;text-align:center'>还没有投稿，来发第一条技巧吧</div>";

  document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>toggleLike(b.dataset.like));
  document.querySelectorAll("[data-cmt]").forEach(b=>b.onclick=()=>toggleCmt(b.dataset.cmt));
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{
    const inp=document.querySelector(`input[data-cid="${b.dataset.add}"]`);
    const txt=(inp.value||"").trim();
    if(!txt)return;
    addComment(b.dataset.add,txt);
  });
}

function communityFor(type,id){return cTips.filter(t=>t.type===type&&t.target===id)}
