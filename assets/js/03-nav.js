/* 顶部横向导航切换 */
/* ================= 顶部导航 ================= */
function switchTab(name){
  document.querySelectorAll(".tabpage").forEach(p=>p.style.display="none");
  $("page-"+name).style.display="block";
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===name));
  window.scrollTo({top:0,behavior:"smooth"});
  refreshCarousels();   /* 页面从 display:none 变为可见后重测轮播尺寸 */
}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>switchTab(t.dataset.page));
