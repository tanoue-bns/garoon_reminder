const cron = require('node-cron');
const garoon = require('./getSchedules');

const setSchedules = robot => {
  const today = new Date();
  if (today.getDay() === 0 || today.getDay() === 6) {
    return; // 休日なら何もしない
  }

  const envelope = { room: process.env.NOTIFICATION_CHANNEL }; // 通知先チャンネル

  garoon
    .getSchedules()
    .then(schedules => {

      const day    = today.getDate();
      const month  = today.getMonth() + 1;

      if (schedules.length === 0) { // 予定がない場合
        return cron.schedule(`30 0 ${day} ${month} *`, () => robot.send(envelope, "本日の予定は...ありませぬ(。。)"));
      }

      let text = "本日の予定は...\n\n";

      schedules.forEach(schedule => {
        const scheduleDate = new Date(new Date(schedule.start).setMinutes(new Date(schedule.start).getMinutes() - 1)); // 1分前にリマインドしたいので
        const minute       = scheduleDate.getMinutes();
        const hour         = scheduleDate.getHours();

        const originalHour    = new Date(schedule.start).getHours();
        const formattedMinute = new Date(schedule.start).getMinutes() < 10 // 3
                                ? '0' + new Date(schedule.start).getMinutes() // 03
                                : new Date(schedule.start).getMinutes(); // そのまま

        // console.log('schedule: ', schedule);
        cron.schedule(`${minute} ${hour - 9} ${day} ${month} *`, () => {
          const remindText = `【予定リマインダー】\n [${originalHour}:${formattedMinute}〜] ${schedule.content}\n${schedule.url}`
          // console.log('remindText:', remindText);
          robot.send(envelope, `<!channel>\n${remindText}`) // TODO: メンションにしたい
        });

        text += `[${originalHour}:${formattedMinute}〜] ${schedule.content}\n`
      });

      cron.schedule(`30 0 ${day} ${month} *`, () => robot.send(envelope, `<!channel>\n${text}`));
    })
    .catch(err => {
      robot.send(envelope, `<!channel>\nエラー発生...\nログインまたはスケジュール取得に失敗しました`)
      robot.send(envelope, String(err))
    })
}

module.exports = {
  setSchedules
}
