const Axios = require('axios').default;
const HTMLParser = require('node-html-parser');

const AxiosCookiejarSupport = require('axios-cookiejar-support').default;

AxiosCookiejarSupport(Axios); // Axiosにプラグイン注入
const baseUrl = "https://c.np.fm/cgi-bin/cbgrn/grn.cgi/schedule/group_day"

const client = Axios.create({
  jar: true,             // cookiejarを有効化する
  withCredentials: true, // よくわからないけど必要w
});

const params = {
  params: {
    _system: 1,
    _account: process.env.GAROON_ACCOUNT,   // Garoonのアカウント名
    _password: process.env.GAROON_PASSWORD, // Garoonのパスワード
    "login-submit": "ログイン"
  },
  auth: {
    username: process.env.BASIC_USERNAME, // basic認証のユーザー名
    password: process.env.BASIC_PASSWORD, // basic認証のパスワード
  }
}
// --------------------------- config --------------------------- //




const getHTMLElement = async () => {
  let html;

  await client.get(baseUrl, params).then(async res => {
    // console.log(res.headers['set-cookie'])
    const COOKIE = `${res.headers['set-cookie'][1].split(' ')[0]} ${res.headers['set-cookie'][0].split(' ')[0]}`
    // console.log(COOKIE)

    await client.get(
      baseUrl,
      {
        headers: {
          Cookie: COOKIE
        }
      }
    )
    .then(res => html = HTMLParser.parse(res.data))
    .catch(err => html = HTMLParser.parse(res.data))
  });

  // console.log(html.querySelectorAll('.js_customization_schedule_user_id_1707')); // 取得できているかの確認用
  return html;
}

// https://c.np.fm/cgi-bin/cbgrn/grn.cgi/schedule/group_day
const getSchedules = async () => {
  const html        = await getHTMLElement();
  const mySchedules = Array.from(html.querySelector('.js_customization_schedule_user_id_1707').querySelectorAll('.normalEventElement')); // 自分のユーザーID(田之上は1707)に依存する
  // console.log(mySchedules);

  const formattedMySchedules = mySchedules
    .filter(schedule => schedule.rawAttrs.match(/data-event/)) // 時間指定のないものは「data-event」が存在しないのでfilterで除去
    .map(schedule => {
      const start   = schedule.rawAttrs.match(/data-event_start_date=".*?"/)[0].split('=')[1].replace(/"/g, '');
      const content = schedule.rawAttrs.match(/data-event_data=".*?"/)[0].split('=')[1].replace(/"/g, '');
      const url     = "https://c.np.fm" + schedule.childNodes[0].rawAttrs.replace(/href=/, '').replace(/"/g, '').replace(/amp;/g, '').trim();

      // console.log({ start, content, url });
      return { start, content, url };
    });

  return formattedMySchedules
}

module.exports = {
  getSchedules
}
