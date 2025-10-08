import { TASK_STATUS } from './constants';

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
