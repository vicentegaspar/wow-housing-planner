const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    // The API that WoWDB uses to get the model metadata
    if (url.includes('api/v1/model') || url.includes('api/modelviewer')) {
      try {
          const text = await response.text();
          console.log('API RESPONSE for', url, ':', text);
      } catch (e) {}
    }
  });

  console.log('Navigating...');
  await page.goto('https://housing.wowdb.com/decor/399/abandoned-bookcase-399/', { waitUntil: 'networkidle2' });
  
  console.log('Clicking 3D Model button...');
  try {
    const input = await page.$('[data-filedata-id]');
    if (input) {
        const id = await page.evaluate(el => el.getAttribute('data-filedata-id'), input);
        console.log('Found internal ID:', id);
    }

    await page.evaluate(() => {
        const btn = document.querySelector('[aria-label="View 3D Model"]');
        if (btn) btn.click();
    });
    // Wait for requests
    await new Promise(r => setTimeout(r, 4000));
  } catch (e) {
      console.log('Error clicking:', e);
  }

  await browser.close();
})();
