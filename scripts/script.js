const schedule = require('../lib/setSchedules')
const cron = require('node-cron');

module.exports = robot => {
  // 毎日09:15に実行する
  cron.schedule('15 9 * * *', () => {
    schedule.setSchedules(robot);
  });
}

