const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const svg = fs.readFileSync('C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/er_mermaid_render.svg', 'utf8');
  // 嵌入 SVG 居中显示，外加页面背景与字体设置
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#fff;font-family:system-ui,'Microsoft YaHei',sans-serif}
    .wrap{max-width:920px;margin:0 auto;background:#fff;padding:18px;border:1px solid #e3e6ec;border-radius:10px}
    h3{font-size:14px;margin:0 0 12px;color:#1a1d24}
    svg{width:100%;height:auto;display:block}
  </style></head><body>
  <div class="wrap">
    <h3>Mermaid 官方 erDiagram 渲染（GitHub README 上会看到的样子）</h3>
    ${svg}
  </div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const target = await page.$('.wrap');
  await target.screenshot({
    path: 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/07_mermaid_er渲染效果.png'
  });
  console.log('Mermaid 渲染效果截图已保存');
  await browser.close();
})();
