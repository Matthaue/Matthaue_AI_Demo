/* 端到端验证：工作台能否真正切到后端 SQLite 数据库
   用法：NODE_PATH=<workspace>/node_modules node verify_backend.js   */
const { chromium } = require('playwright-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:8000/';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 160)); });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('1. 页面加载完成（后端静态托管）');

  // 切到社群投稿页
  await page.click('.tab[data-page="community"]');
  await page.waitForTimeout(600);
  console.log('2. 已切到社群投稿页');

  // 本机模式基线
  const localStat = await page.textContent('#dsStatText');
  const localCount = await page.textContent('#qCount');
  console.log('3. 本机模式：', localStat, '|', localCount);

  // 切到后端数据库模式
  await page.click('.dsmode[data-mode="api"]');
  await page.waitForTimeout(2500);

  const apiStat = await page.textContent('#dsStatText');
  const apiCount = await page.textContent('#qCount');
  const feedCount = await page.locator('.feed-item').count();
  console.log('4. 后端模式：', apiStat);
  console.log('   队列文案：', apiCount);
  console.log('   投稿流渲染条数：', feedCount);

  // 点赞一次，验证写回数据库
  const before = await page.locator('.feed-item').first().locator('[data-like] span').textContent();
  await page.locator('.feed-item').first().locator('[data-like]').click();
  await page.waitForTimeout(1500);
  const after = await page.locator('.feed-item').first().locator('[data-like] span').textContent();
  console.log('5. 点赞：', before, '->', after);

  // 后端校验：库内点赞数是否真的变了
  const res = await page.evaluate(async () => {
    const r = await fetch('http://127.0.0.1:8000/api/health');
    return (await r.json()).counts;
  });
  console.log('6. 数据库行数：', JSON.stringify(res));

  await page.screenshot({ path: 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/05_后端数据库模式.png', fullPage: true });
  console.log('7. 截图已保存');

  console.log('\n=== 页面错误 ===');
  console.log(errors.length ? errors.join('\n') : '无');

  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
