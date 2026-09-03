const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });

  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  const file = 'file:///' + path.resolve(
    'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/WeGame_Agent_产品文档.html'
  ).replace(/\\/g, '/');

  await page.goto(file, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // 1) 截 ER 图区块
  const target = await page.$('.er-figure');
  if (target) {
    await target.screenshot({
      path: 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/06_数据模型ER图.png'
    });
    console.log('  ER 图区块截图已保存');
  }

  // 2) 截整节：从 h4 数据模型 起，到下一个 H2/H3 之前为止
  const box = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h4')].find(x => x.textContent.includes('数据模型'));
    if (!h) return null;
    const top = h.getBoundingClientRect().top + window.scrollY - 12;
    let n = h.nextElementSibling, lastEl = h;
    while (n) {
      if (['H2', 'H3'].includes(n.tagName)) break;
      lastEl = n;
      n = n.nextElementSibling;
    }
    const bottom = lastEl.getBoundingClientRect().bottom + window.scrollY + 12;
    return { top, bottom };
  });
  if (box && box.bottom > box.top) {
    await page.screenshot({
      path: 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/06b_数据模型整节.png',
      clip: { x: 40, y: box.top, width: 920, height: box.bottom - box.top },
      fullPage: true
    });
    console.log('  整节截图已保存（h=' + (box.bottom - box.top) + '）');
  } else {
    console.log('  整节截图跳过：bottom <= top');
  }

  // 3) 关键节点校验
  const chk = await page.evaluate(() => {
    const svg = document.querySelector('.er-figure svg');
    return {
      svgW: Math.round(svg.getBoundingClientRect().width),
      svgH: Math.round(svg.getBoundingClientRect().height),
      rects: svg.querySelectorAll('rect').length,
      texts: svg.querySelectorAll('text').length,
      paths: svg.querySelectorAll('path').length,
    };
  });
  console.log('\n=== ER 图节点 ===');
  Object.entries(chk).forEach(([k, v]) => console.log('  ' + k + ':', v));
  console.log('\n页面 JS 错误:', errors.length ? errors : '无');
  await browser.close();
})();
