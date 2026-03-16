const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173');
  await page.waitForSelector('.draw-toggle-btn');
  await page.click('.draw-toggle-btn');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test_draw.png' });
  await browser.close();
})();
