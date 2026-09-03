/* 数据源模式切换 UI（本机 / 后端数据库） */
/* ============ 数据源模式切换 UI ============ */
function statLine(){
  const s=DataService.stats;
  if(!s)return "SQLite";
  return `链接 ${s.content_docs??"-"} · 投稿 ${s.submissions??"-"} · 评论 ${s.comments??"-"} · 点赞 ${s.likes??"-"}`;
}
function syncModeUI(){
  const isApi=DataService.mode==="api";
  document.querySelectorAll(".dsmode").forEach(b=>
    b.classList.toggle("active",b.dataset.mode===DataService.mode));
  const box=$("dsStat"),txt=$("dsStatText");
  box.className="dsstat "+(isApi?(DataService.online?"on":"off"):"");
  txt.textContent=!isApi?"本机模式 localStorage"
    :(DataService.online?"已连接 · "+statLine():"后端未连接 · 已降级本机");
  if($("apiBase").value!==DataService.base)$("apiBase").value=DataService.base;
  $("cReset").style.display=isApi?"":"none";       /* 重置演示数据仅后端模式可用 */
}
/* 切换模式：切到后端模式会立即拉一次数据，失败自动降级 */
document.querySelectorAll(".dsmode").forEach(b=>b.onclick=async()=>{
  const m=b.dataset.mode;
  if(m===DataService.mode)return;
  if(m==="api")DataService.setBase($("apiBase").value);
  DataService.setMode(m);
  syncModeUI();
  await refreshCommunity();
  syncModeUI();
  if(m==="api"&&DataService.online)cshow("ok","已切到后端数据库模式 · "+statLine());
  if(m==="local")cshow("ok","已切到本机模式，数据存在浏览器 localStorage（离线可用）");
});
$("apiBase").onchange=()=>DataService.setBase($("apiBase").value);
/* 测试连接：不改当前模式，只探测后端是否可达；成功则顺带切过去 */
$("dsTest").onclick=async()=>{
  DataService.setBase($("apiBase").value);
  const prev=DataService.mode;
  DataService.mode="api";
  const btn=$("dsTest");btn.disabled=true;btn.textContent="测试中…";
  try{
    const h=await DataService.health();
    DataService.stats=h.counts;DataService.online=true;
    if(prev!=="api"){DataService.setMode("api");await refreshCommunity()}
    syncModeUI();
    cshow("ok","连接成功 · "+statLine()+" —— 已切换到后端数据库模式");
  }catch(e){
    DataService.mode=prev;DataService.online=false;syncModeUI();
    cshow("err","连接失败："+e.message+" —— 请先双击 backend/start_server.bat 启动后端");
  }finally{btn.disabled=false;btn.textContent="测试连接"}
};
