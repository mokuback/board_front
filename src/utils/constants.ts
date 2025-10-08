export type TaskStatus = 0 | 1 | 2;

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
