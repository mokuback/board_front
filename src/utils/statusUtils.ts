import { TASK_STATUS, TASK_STATUS_TEXT, type TaskStatus } from './constants';

export const getStatusIcon = (status: string | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case TASK_STATUS.NORMAL:
      return '🕐';
    case TASK_STATUS.COMPLETED:
      return '✅';
    case TASK_STATUS.DISABLED:
      return '⏸️';
    default:
      return '❓';
  }
};

export const getStatusText = (status: TaskStatus) => {
  return TASK_STATUS_TEXT[status];
};

/**
 * 验证LINE ID格式是否正确
 * @param id 需要验证的LINE ID字符串
 * @returns 验证结果，如果格式正确返回true，否则返回false
 */
export const validateLineId = (id: string): boolean => {
  // LINE ID 格式验证规则：
  // 1. 必须以 'U' 开头
  // 2. 总长度为 33 个字符
  // 3. 只包含字母和数字
  const lineIdPattern = /^U[a-zA-Z0-9]{32}$/; // 定义正则表达式，用于验证LINE ID格式
  return lineIdPattern.test(id); // 使用正则表达式测试输入的id是否符合要求
};
