/* 截图脚本：打开工作台 HTML，对四个界面分别全页截图（复用系统 Chrome + playwright-core） */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright-core');

const ROOT = 'C:/Users/11278/WorkBuddy/2026-08-25-14-34-43';
const htmlPath = path.join(ROOT, '补位急救站_workbench.html');
const outDir = path.join(ROOT, 'screenshots');

const TABS = [
  ['station', '01_补位急救站.png'],
  ['heroes', '02_英雄技巧讲解.png'],
  ['maps', '03_地图点位.png'],
  ['community', '04_社群投稿.png'],
];

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // 默认页 = station
  await page.screenshot({ path: path.join(outDir, TABS[0][1]), fullPage: true });
  console.log('captured:', TABS[0][1]);

  for (let i = 1; i < TABS.length; i++) {
    const [pageName, fname] = TABS[i];
    await page.click(`.tab[data-page="${pageName}"]`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, fname), fullPage: true });
    console.log('captured:', fname);
  }

  await browser.close();
  console.log('ALL DONE');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
