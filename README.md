## これ何？

Garoon を無理やりスクレイピングして、特定の Slack チャンネルに予定の１分前に通知してくれる Bot アプリ

## 注意点

- 個人用なのでパスワードの取り扱いに注意！
- `hubot-heroku-keepalive`の導入&設定が必要。(Heroku の無料プランは 30 分アクセスがないと落ちるため、ローカルに保存中のリマインド情報が消えてしまう為)
- Garoon 上でスクレイピングするので、ご自分の予定の DOM を確認し、適宜コードを変更してください(ex: `js_customization_schedule_user_id_1707`)
- 予定が被っていると通知に失敗することがあります

## 技術スタック

- Node.js
- Hubot
- Slack API
- Heroku
