/* 前端投稿功能实测：打开工作台 → 社群投稿页 → 提交投稿 → 点赞 → 评论 → 读取 localStorage 验证元数据 */
const { chromium } = require('playwright-core');

const URL = 'file:///C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/补位急救站_workbench.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  const logs = [];
  page.on('console', m => logs.push('[console] ' + m.text()));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));

  await page.goto(URL, { waitUntil: 'load' });

  // 1. 切到社群投稿 tab
  await page.click('.tab[data-page="community"]');
  await page.waitForTimeout(400);

  // 2. 填投稿表单并提交（类型=英雄技巧，目标默认第一个=捷风）
  await page.selectOption('#cType', 'hero');
  await page.fill('#cText', '实测投稿：捷风大招切刀瞬间可以先用 Q 位移拉身位再出刀，命中率明显更高');
  await page.fill('#cAuthor', '自动化测试员');
  await page.click('#cSubmit');
  await page.waitForTimeout(400);

  // 3. 找到刚提交的投稿（列表顶部第一项）点赞
  const likeBtns = await page.$$('[data-like]');
  if (likeBtns.length) { await likeBtns[0].click(); await page.waitForTimeout(300); }

  // 4. 对第一条投稿展开评论并发送
  const cmtBtns = await page.$$('[data-cmt]');
  if (cmtBtns.length) { await cmtBtns[0].click(); await page.waitForTimeout(200); }
  const cmtInput = await page.$('input[data-cid]');
  if (cmtInput) {
    await cmtInput.fill('自动化测试评论：这条投稿来自端到端测试');
    await page.click('[data-add]');
    await page.waitForTimeout(300);
  }

  // 5. 读取 localStorage 中的投稿数据（完整元数据）
  const data = await page.evaluate(() => {
    const tips = JSON.parse(localStorage.getItem('communityTips') || '[]');
    const liked = JSON.parse(localStorage.getItem('communityLiked') || '[]');
    const vuid = localStorage.getItem('vuid');
    const status = document.getElementById('cStatus') ? document.getElementById('cStatus').textContent : '';
    // 收集投稿流第一项的渲染文本
    const first = document.querySelector('.feed-item');
    return {
      vuid,
      liked,
      status,
      total: tips.length,
      firstTip: tips[0],
      firstFeedHTML: first ? first.innerText.slice(0, 300) : '(无投稿流)'
    };
  });

  await page.screenshot({ path: 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43/ima_export/投稿功能实测_社群页.png', fullPage: true });

  console.log('=== 投稿功能实测结果 ===');
  console.log('匿名用户ID vuid:', data.vuid);
  console.log('提交状态提示:', data.status);
  console.log('投稿总数:', data.total);
  console.log('已点赞ID集合:', JSON.stringify(data.liked));
  console.log('--- 最新投稿完整数据（含元数据） ---');
  console.log(JSON.stringify(data.firstTip, null, 2));
  console.log('--- 投稿流首条渲染文本 ---');
  console.log(data.firstFeedHTML);
  console.log('--- 控制台/错误 ---');
  console.log(logs.length ? logs.join('\n') : '(无)');

  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
