/* Carousel 轮播实测：三个页面分别验证 箭头翻页 / 指示点 / 拖拽跟手 / 自动轮播暂停 / 移动端单列 / 投稿后重测 */
const { chromium } = require('playwright-core');

const URL = 'file:///C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/补位急救站_workbench.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/ima_export/';
const results = [];
const ok = (name, pass, detail) => { results.push({ name, pass, detail }); console.log((pass ? 'PASS' : 'FAIL') + ' | ' + name + ' | ' + detail); };

async function carState(page, rootSel) {
  return await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const track = root.querySelector('.cartrack');
    const dots = [...root.querySelectorAll('.cardots button')];
    return {
      slides: track.children.length,
      dots: dots.length,
      activeDot: dots.findIndex(d => d.classList.contains('on')),
      transform: track.style.transform,
      prevDisabled: root.querySelector('.carbtn.prev').disabled,
      nextDisabled: root.querySelector('.carbtn.next').disabled,
      noslides: root.classList.contains('noslides'),
      note: root.parentElement.querySelector('.carnote') ? root.parentElement.querySelector('.carnote').textContent : ''
    };
  }, rootSel);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1500 } });
  const logs = [];
  page.on('console', m => { if (m.type() === 'error') logs.push('[console.error] ' + m.text()); });
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  /* ---------- 1. 英雄技巧讲解 ---------- */
  await page.click('.tab[data-page="heroes"]');
  await page.waitForTimeout(300);
  let s = await carState(page, '#heroCarousel');
  ok('英雄轮播-卡片数', s.slides === 3, '3 张技巧卡');
  ok('英雄轮播-指示点', s.dots === 2 && s.activeDot === 0, `dots=${s.dots}, active=${s.activeDot}（3卡/每屏2 → 2屏）`);
  ok('英雄轮播-页码注记', /3 张 · 自动轮播 · 第 1\/2 屏/.test(s.note), s.note);

  await page.click('#heroCarousel .carbtn.prev'); // 首页点上一张 → 循环跳到尾屏
  await page.waitForTimeout(700);
  s = await carState(page, '#heroCarousel');
  ok('英雄轮播-首页循环', s.activeDot === 1 && /第 2\/2 屏/.test(s.note), `active=${s.activeDot}, note=${s.note}`);

  await page.click('#heroCarousel .carbtn.next');
  await page.waitForTimeout(700);
  await page.click('#heroCarousel .carbtn.next');
  await page.waitForTimeout(700);
  s = await carState(page, '#heroCarousel');
  ok('英雄轮播-翻页位移', /translateX\(-\d+(\.\d+)?px\)/.test(s.transform), s.transform);

  await page.click('#heroCarousel .carbtn.next'); // 尾页再点 → 回卷到开头
  await page.waitForTimeout(700);
  s = await carState(page, '#heroCarousel');
  ok('英雄轮播-尾页回卷', s.activeDot === 0 && /translateX\(0px\)/.test(s.transform), `active=${s.activeDot}, transform=${s.transform}`);
  await page.screenshot({ path: OUT + '轮播实测_英雄页.png', fullPage: true });

  /* ---------- 2. 地图技巧讲解：指示点定位 + 拖拽跟手 ---------- */
  await page.click('.tab[data-page="maps"]');
  await page.waitForTimeout(300);
  s = await carState(page, '#mapCarousel');
  ok('地图轮播-卡片数', s.slides === 7, `${s.slides} 张技巧卡`);
  ok('地图轮播-指示点', s.dots === 6 && s.activeDot === 0, `dots=${s.dots}（7卡/每屏2 → 6屏）`);

  await page.click('#mapCarousel .cardots button:nth-child(4)'); // 点第4个指示点
  await page.waitForTimeout(700);
  s = await carState(page, '#mapCarousel');
  ok('地图轮播-指示点跳转', s.activeDot === 3, `active=${s.activeDot}`);

  // 鼠标拖拽（pointer events）：向左拖 200px → 下一屏
  const box = await page.locator('#mapCarousel .carview').boundingBox();
  const before = (await carState(page, '#mapCarousel')).activeDot;
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75 - 210, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  s = await carState(page, '#mapCarousel');
  ok('地图轮播-拖拽跟手', s.activeDot === before + 1, `拖拽前 active=${before} → 拖拽后 active=${s.activeDot}`);

  // 拖拽后点击"当前可见卡"的按钮（第 5 张在第 5 屏左侧可见），验证拖拽后不误触、按钮可正常点
  await page.click('#mapCarousel .cslide:nth-child(5) .goto');
  await page.waitForTimeout(500);
  const backAtStation = await page.evaluate(() => document.querySelector('#page-station').style.display !== 'none');
  ok('地图轮播-卡片按钮可点', backAtStation, '点"查看速记卡"成功跳回补位急救站');
  await page.click('.tab[data-page="maps"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '轮播实测_地图页.png', fullPage: true });

  /* ---------- 3. 社群投稿：投稿后轮播即时刷新 ---------- */
  await page.click('.tab[data-page="community"]');
  await page.waitForTimeout(300);
  s = await carState(page, '#commCarousel');
  const beforeSlides = s.slides;
  ok('社群轮播-初始渲染', s.slides >= 3 && s.dots >= 2, `${s.slides} 卡 / ${s.dots} 屏`);

  await page.selectOption('#cType', 'map');
  await page.fill('#cText', '轮播实测投稿： Haven C 点长廊守方可以留一个跳箱位踩高看小车');
  await page.fill('#cAuthor', '轮播测试员');
  await page.click('#cSubmit');
  await page.waitForTimeout(500);
  s = await carState(page, '#commCarousel');
  ok('社群轮播-投稿后刷新', s.slides === Math.min(8, beforeSlides + 1), `投稿后 ${s.slides} 卡（新投稿即时进轮播）`);
  /* 悬停暂停自动轮播并复位到第 1 屏，保证翻页断言确定性 */
  await page.hover('#commCarousel .carview');
  await page.evaluate(() => CAROUSELS.commCarousel.goTo(0));
  await page.click('#commCarousel .carbtn.next');
  await page.waitForTimeout(700);
  s = await carState(page, '#commCarousel');
  ok('社群轮播-翻页正常', s.activeDot === 1, `active=${s.activeDot}（悬停状态下人工翻页，不受自动轮播干扰）`);
  await page.screenshot({ path: OUT + '轮播实测_社群页.png', fullPage: true });

  /* ---------- 4. 移动端 375px：单列 + 箭头 ---------- */
  const mob = await browser.newPage({ viewport: { width: 375, height: 740 } });
  mob.on('pageerror', e => logs.push('[mobile pageerror] ' + e.message));
  await mob.goto(URL, { waitUntil: 'load' });
  await mob.waitForTimeout(300);
  await mob.click('.tab[data-page="maps"]');
  await mob.waitForTimeout(300);
  const ms = await carState(mob, '#mapCarousel');
  const mobDim = await mob.evaluate(() => {
    const view = document.querySelector('#mapCarousel .carview');
    const slide = document.querySelector('#mapCarousel .cslide');
    return { viewW: view.clientWidth, slideW: slide.getBoundingClientRect().width };
  });
  ok('移动端-单列铺满', mobDim.viewW - mobDim.slideW < 8, `视口内宽 ${mobDim.viewW}px，卡片 ${Math.round(mobDim.slideW)}px（375 屏去除页面留白后铺满）`);
  ok('移动端-指示点', ms.dots === 7 && ms.activeDot === 0, `dots=${ms.dots}（7卡/每屏1 → 7屏）`);
  await mob.click('#mapCarousel .carbtn.next');
  await mob.waitForTimeout(700);
  const ms2 = await carState(mob, '#mapCarousel');
  ok('移动端-箭头翻页', ms2.activeDot === 1, `active=${ms2.activeDot}`);
  const btnSize = await mob.evaluate(() => { const b = document.querySelector('#mapCarousel .carbtn.next'); const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
  ok('移动端-箭头44px触控', btnSize === '44x44', btnSize);
  await mob.screenshot({ path: OUT + '轮播实测_移动端.png', fullPage: true });
  await mob.close();

  /* ---------- 汇总 ---------- */
  console.log('\n=== 汇总 ===');
  console.log(`通过 ${results.filter(r => r.pass).length} / ${results.length}`);
  console.log('运行时错误：' + (logs.length ? '\n' + logs.join('\n') : '(无)'));
  await browser.close();
  if (results.some(r => !r.pass) || logs.length) process.exit(1);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
