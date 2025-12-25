const puppeteer = require('puppeteer');
const { authenticator } = require('otplib');

// 設定
const LOGIN_URL = 'https://beenos.cybozu.com/login';
const SCHEDULE_URL = 'https://beenos.cybozu.com/g/schedule/personal_day';

const getSchedules = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // ログインページにアクセス
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

    // ログイン名とパスワードを入力
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.type('input[name="username"]', process.env.GAROON_ACCOUNT);
    await page.type('input[name="password"]', process.env.GAROON_PASSWORD);
    await page.click('input[type="submit"]');

    // MFA画面を待つ
    await page.waitForSelector('input[name="tfaPassword"]', { timeout: 10000 });
    const otpCode = authenticator.generate(process.env.MFA_SECRET);

    // JavaScriptで直接値を設定してイベントを発火
    await page.evaluate((code) => {
      const input = document.querySelector('input[name="tfaPassword"]');
      if (input) {
        input.value = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, otpCode);

    // MFAログインボタンをクリック
    await page.evaluate(() => {
      const btn = document.querySelector('input[type="button"].login-button');
      if (btn) btn.click();
    });

    // ログイン完了を待つ
    await new Promise(r => setTimeout(r, 3000));

    // スケジュールページに移動
    await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle0' });

    // スケジュールを抽出
    const schedules = await page.evaluate(() => {
      const timePattern = /^(\d{1,2}:\d{2})(?:-\d{1,2}:\d{2})?$/;
      const eventMap = new Map();

      // 自分の予定（uid=数字）を探す
      const links = document.querySelectorAll('a[href*="schedule/view.csp"][href*="uid="]');

      links.forEach(link => {
        const href = link.href;
        // uid=& (空) は除外
        if (href.includes('uid=&')) return;

        // event IDを抽出
        const eventMatch = href.match(/event=(\d+)/);
        if (!eventMatch) return;
        const eventId = eventMatch[1];

        const text = link.textContent.trim();

        if (!eventMap.has(eventId)) {
          eventMap.set(eventId, { time: null, title: null, url: href });
        }

        const entry = eventMap.get(eventId);

        // 時間かタイトルかを判定
        if (timePattern.test(text)) {
          entry.time = text;
        } else if (text) {
          entry.title = text;
        }
      });

      // 結果を配列に変換
      const events = [];
      eventMap.forEach(entry => {
        if (entry.time && entry.title) {
          const today = new Date();
          const [hours, minutes] = entry.time.split(':');
          today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

          events.push({
            start: today.toISOString(),
            content: entry.title,
            url: entry.url
          });
        }
      });

      return events;
    });

    return schedules;

  } finally {
    await browser.close();
  }
};

module.exports = {
  getSchedules
};
