//----------------------------------------------------
// 0: 正常 1: 完成 2: 停用
export type TaskStatus = 0 | 1 | 2;

// 無定時發通知的生命週期環境，也不使用SSE
export const NO_LIFESPAN_ENVS = ['vercel', 'test'];

export const TASK_STATUS = {
  NORMAL: 0,
  COMPLETED: 1,
  DISABLED: 2,
} as const;

export const TASK_STATUS_TEXT = {
  [TASK_STATUS.NORMAL]: '正常',
  [TASK_STATUS.COMPLETED]: '完成',
  [TASK_STATUS.DISABLED]: '停用',
} as const;
//----------------------------------------------------
// 0: 單次 1: 每日循環 2: 指定星期
export type NotifyRunMode = 0 | 1 | 2;

export const NOTIFY_RUN_MODE = {
  ONCE: 0,
  DAILY: 1,
  WEEKLY: 2,
} as const;

export const NOTIFY_RUN_MODE_TEXT = {
  [NOTIFY_RUN_MODE.ONCE]: '單次',
  [NOTIFY_RUN_MODE.DAILY]: '每日循環',
  [NOTIFY_RUN_MODE.WEEKLY]: '指定星期',
} as const;

export const WEEK_DAYS = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
} as const;

export const WEEK_DAYS_TEXT = {
  [WEEK_DAYS.MONDAY]: '星期一',
  [WEEK_DAYS.TUESDAY]: '星期二',
  [WEEK_DAYS.WEDNESDAY]: '星期三',
  [WEEK_DAYS.THURSDAY]: '星期四',
  [WEEK_DAYS.FRIDAY]: '星期五',
  [WEEK_DAYS.SATURDAY]: '星期六',
  [WEEK_DAYS.SUNDAY]: '星期日',
} as const;

// 将星期数字转换为星期文字
export const getWeekDaysText = (weekAt: number): string => {
  if (!weekAt) return '';

  const weekDays = weekAt.toString().split('').map(Number);
  const weekTexts = weekDays.map(day => {
    const weekDayText = WEEK_DAYS_TEXT[day as keyof typeof WEEK_DAYS_TEXT];
    return weekDayText ? weekDayText.slice(-1) : ''; // 取最后一个字
  });

  return weekTexts.join('、');
};
