const schedule = require('../lib/setSchedules')
const cron = require('node-cron');

module.exports = robot => {
  // 毎日09:15に実行する（UTS基準なので 9-9=0）
  cron.schedule('15 0 * * *', () => {
    schedule.setSchedules(robot);
  });
}

