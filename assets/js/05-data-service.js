/* 社群数据访问层：localStorage 与后端 SQLite 双实现 */
/* ================= 社群投稿（数据访问层：本机 localStorage ↔ 后端 SQLite 数据库） =================
   界面与交互只有一套，底层数据源可切换 —— 这正是产品文档「内容层 / 状态层分层」的落地：
     · 本机模式：状态层落在浏览器 localStorage，离线可用，零部署
     · 后端模式：状态层落在 valorant_community.db（SQLite），由 Python 后端提供 REST API，
                 多人共享同一份数据，点赞按 (submission_id, user_id) 幂等去重
   后端不可用时自动降级回本机模式，功能不受影响（与 AI 识别降级同一设计原则）。            */
const CKEY="communityTips";
const LKEY="communityLiked";
const UIDKEY="vuid";
const DSMODE="dsmode";
const DSBASE="dsbase";
/* 匿名用户ID：首次进入自动生成并保存在本机，后续投稿自动携带（真实产品接入账号体系后替换为登录ID） */
let myUid=localStorage.getItem(UIDKEY)||("u_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
localStorage.setItem(UIDKEY,myUid);
let cTips=[];                                  /* 运行时数据：两种模式共用同一内存结构 */
let liked=new Set();                           /* 我已点赞的投稿 id（后端模式由接口 liked 字段同步） */

/* 本机模式的初始示例数据（后端模式由数据库提供，不注入） */
const DEMO_TIPS=[
  {id:"demo-1",type:"hero",target:"jett",text:"捷风 E 上升气流可以卡在箱子沿，先 E 再 Q 穿烟能拿到更高的枪线视角",gif:"",video:"",author:"阿P的枪线笔记",demo:true,source:"user",user_id:"u_demo_001",ts:"2026-08-20",likes:23,comments:[{author:"路过的青铜",text:"试了一下真的能白拿视角，学会了",ts:"2026-08-21"}]},
  {id:"demo-2",type:"map",target:"ascent",text:"亚海悬城守方开局直接关 B 门，对方只能从中路和 A 主推，信息压力小一半",gif:"",video:"",author:"老图手",demo:true,source:"user",user_id:"u_demo_002",ts:"2026-08-21",likes:17,comments:[]},
  {id:"demo-3",type:"hero",target:"sage",text:"贤者的墙可以横在 A 短垫脚上箱，配合大招读条更稳，队友别站在墙后吃枪线",gif:"",video:"",author:"冰墙工程师",demo:true,source:"user",user_id:"u_demo_003",ts:"2026-08-22",likes:31,comments:[{author:"瓦学十级",text:"补充：墙别急着立，等对面道具交了再立更赚",ts:"2026-08-23"}]}
];
function persist(){localStorage.setItem(CKEY,JSON.stringify(cTips))}
function today(){return new Date().toISOString().slice(0,10)}

/* ============ 数据访问层：界面只认这一层接口，换存储实现不动 UI ============ */
const DataService={
  mode:localStorage.getItem(DSMODE)||"local",          /* "local" | "api" */
  base:(localStorage.getItem(DSBASE)||"http://127.0.0.1:8000").replace(/\/+$/,""),
  online:false,
  stats:null,

  /* 统一请求出口：超时 6 秒，便于后端未启动时快速降级 */
  async _req(path,opt={}){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),6000);
    try{
      const r=await fetch(this.base+path,{
        method:opt.method||"GET",
        headers:{"Content-Type":"application/json"},
        signal:ctrl.signal,
        ...(opt.body?{body:JSON.stringify(opt.body)}:{})
      });
      if(!r.ok)throw new Error("HTTP "+r.status);
      return await r.json();
    }catch(e){
      if(e.name==="AbortError")throw new Error("请求超时（6s），后端可能未启动");
      throw new Error(e.message||"网络错误");
    }finally{clearTimeout(timer)}
  },

  setMode(m){this.mode=m;localStorage.setItem(DSMODE,m)},
  setBase(b){this.base=(b||"").trim().replace(/\/+$/,"");localStorage.setItem(DSBASE,this.base)},

  /* 健康检查：后端模式返回库内各表行数 */
  async health(){
    if(this.mode!=="api")return{ok:true,mode:"local"};
    const d=await this._req("/api/health");
    this.stats=d.counts;return{...d,mode:"api"};
  },

  /* 拉取投稿列表，同时同步「我已点赞」状态 */
  async list(){
    if(this.mode!=="api"){
      cTips=JSON.parse(localStorage.getItem(CKEY)||"[]");
      if(!cTips.length){cTips=DEMO_TIPS.map(x=>JSON.parse(JSON.stringify(x)));persist()}
      liked=new Set(JSON.parse(localStorage.getItem(LKEY)||"[]"));
      return cTips;
    }
    const d=await this._req("/api/submissions?user_id="+encodeURIComponent(myUid));
    cTips=(d.items||[]).map(t=>({...t,demo:!!t.demo}));
    liked=new Set(cTips.filter(t=>t.liked).map(t=>t.id));
    return cTips;
  },

  async add(p){
    if(this.mode!=="api"){
      const item={id:"u"+Date.now(),...p,source:"user",likes:0,comments:[]};
      cTips.push(item);persist();return item;
    }
    const d=await this._req("/api/submissions",{method:"POST",body:p});
    return d.item;
  },

  /* 点赞：后端按 (submission_id,user_id) 幂等，重复点击不会导致计数漂移 */
  async like(id,next){
    if(this.mode!=="api"){
      const t=cTips.find(x=>x.id===id);if(!t)return;
      if(next&&!liked.has(id)){liked.add(id);t.likes=(t.likes||0)+1}
      else if(!next&&liked.has(id)){liked.delete(id);t.likes=Math.max(0,(t.likes||0)-1)}
      localStorage.setItem(LKEY,JSON.stringify([...liked]));persist();return;
    }
    const d=await this._req("/api/submissions/"+encodeURIComponent(id)+"/like",
      {method:"POST",body:{user_id:myUid,liked:!!next}});
    const t=cTips.find(x=>x.id===id);if(t)t.likes=d.likes;
    if(d.liked)liked.add(id);else liked.delete(id);
  },

  /* 返回最新评论列表：调用方用它替换本地乐观插入的占位，避免两种模式下重复插入 */
  async comment(id,text){
    if(this.mode!=="api"){
      const t=cTips.find(x=>x.id===id);if(!t)return null;
      t.comments=(t.comments||[]).filter(c=>!c._pending);
      t.comments.push({author:"我",text,ts:today()});persist();
      return t.comments;
    }
    const d=await this._req("/api/submissions/"+encodeURIComponent(id)+"/comments",
      {method:"POST",body:{author:"我",text}});
    const t=cTips.find(x=>x.id===id);if(t)t.comments=d.comments;
    return d.comments;
  },

  async clear(){
    if(this.mode!=="api"){
      cTips=[];liked=new Set();
      localStorage.setItem(CKEY,"[]");localStorage.setItem(LKEY,"[]");return;
    }
    await this._req("/api/submissions",{method:"DELETE"});
  },

  /* 重置演示数据（仅后端模式：用 SQL 脚本重建 21 链接 + 4 投稿 + 3 评论 + 5 点赞） */
  async reset(){
    if(this.mode!=="api")throw new Error("本机模式不支持重置，请点「清空本机投稿」后刷新");
    return await this._req("/api/reset",{method:"POST"});
  },

  /* 攻略/教学链接（内容层）——后端模式走接口，本机模式直接用内置内容库 */
  async docs(target){
    if(this.mode!=="api")return null;
    const d=await this._req("/api/content_docs?target="+encodeURIComponent(target));
    return d.items||[];
  },

  /* 导出 ima 入库投稿包：后端模式直接由库导出，保证与数据库一致 */
  async exportPack(){
    if(this.mode!=="api")return null;
    return await this._req("/api/export");
  }
};

/* 载入数据；后端模式失败则自动降级为本机模式 */
async function loadCommunity(){
  try{
    await DataService.list();
    DataService.online=(DataService.mode==="api");
    /* 后端模式再取一次库内统计，用于在数据源卡片显示「链接 21 · 投稿 4 · 评论 3 · 点赞 5」 */
    if(DataService.online){
      try{await DataService.health()}catch(e){DataService.stats=null}
    }
    return true;
  }catch(e){
    if(DataService.mode==="api"){
      DataService.setMode("local");
      await DataService.list();
      DataService.online=false;
      syncModeUI();
      cshow("err","后端连接失败（"+e.message+"）——已自动降级为本机模式，功能不受影响。启动后端：python backend/server.py");
      return false;
    }
    throw e;
  }
}
/* 刷新：重新拉数据 → 重绘投稿流 → 重绘速记卡（速记卡里的社群投稿同步更新） */
async function refreshCommunity(){
  await loadCommunity();
  renderCommunity();
  rerender();
}
