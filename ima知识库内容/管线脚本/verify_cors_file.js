/**
 * file:// 场景的 CORS 验证
 *
 * 这是最常见的实际使用方式：用户直接双击工作台 HTML（origin 为 null），
 * 而不是通过 http://127.0.0.1:8000/ 访问。此时请求后端属于跨源，
 * Access-Control-Allow-Origin: * 能否放行 null origin，必须实测确认。
 */
const { chromium } = require('playwright-core');

const FILE = 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/ima_export/cors_test.html';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto('file:///' + FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__done === true, { timeout: 30000 });
  const results = await page.evaluate(() => window.__results.logs);

  console.log('=== file:// 场景（Origin: null，双击 HTML 打开的真实情况）===');
  let pass = 0;
  for (const r of results) {
    console.log('  ' + (r.pass ? '[OK] ' : '[NG] ') + r.name);
    console.log('      ' + r.detail);
    if (!r.pass && r.corsBlocked) console.log('      ! 被 CORS 拦截');
    if (r.pass) pass++;
  }
  console.log('');
  console.log('  通过 ' + pass + '/' + results.length);

  await browser.close();
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => {
  console.error('异常:', e.message);
  process.exit(1);
});
