/* 通用工具与全局状态：$ 选择器、esc 转义、截图与当前选中项 */
/* ================= 元素 & 状态 ================= */
const $=id=>document.getElementById(id);
let imgDataUrl=null;
let heroIdx=0, mapIdx=null;

/* 下拉框 */
HEROES.forEach((h,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`英雄：${h.name_cn} ${h.name_en}`;$("heroSel").appendChild(o)});
{const o=document.createElement("option");o.value=-1;o.textContent="地图：暂不选择";$("mapSel").appendChild(o)}
MAPS.forEach((m,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`地图：${m.name_cn} ${m.name_en}`;$("mapSel").appendChild(o)});

/* 快捷切换 chips */
HEROES.forEach(h=>{const c=document.createElement("span");c.className="chip";c.style.cssText="display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;margin:2px;cursor:pointer;background:#fff";
  c.textContent=h.name_cn;c.onclick=()=>render(h.id,$("mapSel").value>=0?MAPS[$("mapSel").value].id:null);$("chips").appendChild(c)});
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
