/* 验证产品文档里的 Mermaid erDiagram 语法能否被官方解析器通过
   用 mermaid CDN（jsdelivr）在真实浏览器里 parse，捕获语法错误 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const MD = 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/WeGame_Agent_产品文档.md';

// 从 md 中抽出 ```mermaid 块
const md = fs.readFileSync(MD, 'utf8');
const m = md.match(/```mermaid\n([\s\S]*?)```/);
if (!m) { console.error('未找到 mermaid 代码块'); process.exit(1); }
const code = m[1];
console.log('=== 提取到的 Mermaid 源码（' + code.split('\n').length + ' 行）===');
console.log(code.split('\n').slice(0, 4).join('\n') + '\n  ...');

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="out"></div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  window.__mermaid = mermaid;
  window.__ready = true;
</script>
</body></html>`;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });
  console.log('\n=== Mermaid 库加载成功 ===');

  const result = await page.evaluate(async (src) => {
    const mermaid = window.__mermaid;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
    try {
      const r = await mermaid.parse(src);
      return { ok: true, diagramType: r && r.diagramType };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }, code);

  console.log('\n=== 语法校验结果 ===');
  if (result.ok) {
    console.log('  通过，图表类型:', result.diagramType);
  } else {
    console.log('  失败:', result.error);
  }

  // 真正渲染一次，确认能出 SVG（parse 通过但 render 失败的情况也存在）
  if (result.ok) {
    const rendered = await page.evaluate(async (src) => {
      const mermaid = window.__mermaid;
      try {
        const { svg } = await mermaid.render('t' + Date.now(), src);
        return { ok: true, len: svg.length,
                 entities: (svg.match(/class="er entityBox"/g) || []).length,
                 rels: (svg.match(/class="er relationshipLine"/g) || []).length };
      } catch (e) {
        return { ok: false, error: String(e && e.message || e) };
      }
    }, code);
    console.log('\n=== 实际渲染 ===');
    console.log('  ' + JSON.stringify(rendered));

    if (rendered.ok) {
      const svg = await page.evaluate(async (src) => {
        const mermaid = window.__mermaid;
        const { svg } = await mermaid.render('r' + Date.now(), src);
        return svg;
      }, code);
      fs.writeFileSync(
        'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/screenshots/er_mermaid_render.svg',
        svg, 'utf8'
      );
      console.log('  Mermaid 渲染结果已保存: screenshots/er_mermaid_render.svg');
    }
  }

  console.log('\n页面 JS 错误:', errors.length ? errors : '无');
  await browser.close();
})();
