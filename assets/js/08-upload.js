/* 截图上传：点击选择 / 拖拽 / Ctrl+V 粘贴 */
/* ================= 上传 & 粘贴 ================= */
$("drop").onclick=()=>$("file").click();
$("file").onchange=e=>loadFile(e.target.files[0]);
document.addEventListener("paste",e=>{
  const item=[...(e.clipboardData||{items:[]}).items].find(i=>i.type.startsWith("image/"));
  if(item)loadFile(item.getAsFile());
});
["dragover","dragleave","drop"].forEach(ev=>$("drop").addEventListener(ev,e=>{
  e.preventDefault();$("drop").classList.toggle("over",ev==="dragover");
  if(ev==="drop"&&e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);
}));
function loadFile(f){
  if(!f||!f.type.startsWith("image/"))return;
  const r=new FileReader();
  r.onload=()=>{imgDataUrl=r.result;$("thumbbox").innerHTML=`<img class="thumb" src="${imgDataUrl}">`;
    show("ok",`截图已载入（${(f.size/1024).toFixed(0)}KB）——点「AI 识别截图」可同时识别英雄与地图`)};
  r.readAsDataURL(f);
}
function show(type,msg){const s=$("status");s.className="status "+type;s.textContent=msg}
