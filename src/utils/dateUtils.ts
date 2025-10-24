/**
 * 格式化日期时间
 * @param dateTimeString 日期时间字符串
 * @returns 格式化后的本地日期时间字符串
 */
export const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString(import.meta.env.VITE_LOCALE, {
    timeZone: import.meta.env.VITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// export const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('zh-TW');
// };

export const getDefaultDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getDefaultTime = () => {
  return '09:00'; // 返回早上9点
};
