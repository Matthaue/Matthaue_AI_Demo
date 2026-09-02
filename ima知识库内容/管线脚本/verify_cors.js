/**
 * CORS 真实浏览器验证
 *
 * 为什么必须用浏览器：curl 不会执行 CORS 策略，缺 CORS 头的响应它照收不误。
 * 只有浏览器会真正拦截。本脚本在 3000 端口起一个「敌对源」静态服务，
 * 页面向 127.0.0.1:8000 发请求 —— 浏览器视 localhost 与 127.0.0.1 为不同 host，
 * 构成真实跨域，CORS 策略会被严格执行。
 *
 * 用法：node verify_cors.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const PAGE_FILE = path.join(__dirname, 'cors_test.html');
const ORIGIN_PORT = 3000;   // 敌对源端口
const API_ORIGIN = 'http://127.0.0.1:8000';

// ---------- 起一个敌对源静态服务 ----------
function startOriginServer() {
  return new Promise((resolve) => {
    const html = fs.readFileSync(PAGE_FILE, 'utf-8');
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    srv.listen(ORIGIN_PORT, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await startOriginServer();
  console.log('敌对源服务已启动: http://localhost:%d/', ORIGIN_PORT);
  console.log('目标 API: %s\n', API_ORIGIN);

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(`http://localhost:${ORIGIN_PORT}/cors_test.html`, {
    waitUntil: 'domcontentloaded',
  });

  // 等待页面内 5 个测试跑完
  await page.waitForFunction(() => window.__done === true, { timeout: 30000 });
  const results = await page.evaluate(() => window.__results.logs);

  console.log('=== 真实浏览器 CORS 验证结果 ===');
  let pass = 0;
  for (const r of results) {
    const mark = r.pass ? '✓' : '✗';
    console.log(`  ${mark} ${r.name}`);
    console.log(`      ${r.detail}`);
    if (!r.pass && r.corsBlocked) {
      console.log('      ⚠ 被浏览器 CORS 策略拦截（不是业务错误）');
    }
    if (r.pass) pass++;
  }

  console.log(`\n  通过 ${pass}/${results.length}`);
  console.log(`  页面 JS 错误: ${pageErrors.length === 0 ? '无' : pageErrors.join(' | ')}`);
  console.log(`  控制台错误  : ${consoleErrors.length === 0 ? '无' : consoleErrors.join(' | ')}`);

  await browser.close();
  srv.close();
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => {
  console.error('验证脚本异常:', e.message);
  process.exit(1);
});
