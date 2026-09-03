/* 启动初始化：轮播装配 + 社群数据载入 */
/* ================= 初始化 ================= */
renderHeroCarousel();
renderMapCarousel();
/* 轮播先初始化，再渲染社群数据（renderCommCarousel 依赖 CAROUSELS.commCarousel） */
setupCarousel("heroCarousel");
setupCarousel("mapCarousel");
setupCarousel("commCarousel");
/* 社群数据：按上次选择的模式载入（后端不可达时自动降级回本机模式），再渲染 */
(async()=>{
  await loadCommunity();
  renderCommunity();
  syncModeUI();
})();
