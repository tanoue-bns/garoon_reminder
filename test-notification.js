// 通知テキストの確認用スクリプト
require('dotenv').config();
const { getSchedules } = require('./lib/getSchedules');

async function main() {
  console.log('スケジュール取得中...\n');

  try {
    const schedules = await getSchedules();
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    console.log('=== 朝の通知 (09:30 JST) ===');
    if (schedules.length === 0) {
      console.log('本日の予定は...ありませぬ(。。)');
    } else {
      let text = '本日の予定は...\n\n';
      schedules.forEach(schedule => {
        const originalHour = new Date(schedule.start).getHours();
        const formattedMinute = new Date(schedule.start).getMinutes() < 10
          ? '0' + new Date(schedule.start).getMinutes()
          : new Date(schedule.start).getMinutes();
        text += `[${originalHour}:${formattedMinute}〜] ${schedule.content}\n`;
      });
      console.log(text);
    }

    console.log('\n=== 各予定のリマインダー ===');
    schedules.forEach(schedule => {
      const scheduleDate = new Date(new Date(schedule.start).setMinutes(new Date(schedule.start).getMinutes() - 1));
      const minute = scheduleDate.getMinutes();
      const hour = scheduleDate.getHours();

      const originalHour = new Date(schedule.start).getHours();
      const formattedMinute = new Date(schedule.start).getMinutes() < 10
        ? '0' + new Date(schedule.start).getMinutes()
        : new Date(schedule.start).getMinutes();

      console.log(`--- ${originalHour}:${formattedMinute} の1分前 (${hour}:${minute < 10 ? '0' + minute : minute}) に通知 ---`);
      const remindText = `【予定リマインダー】\n [${originalHour}:${formattedMinute}〜] ${schedule.content}\n${schedule.url}`;
      console.log(remindText);
      console.log('');
    });

  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();
