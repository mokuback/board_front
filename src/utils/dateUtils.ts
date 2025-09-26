// src/utils/dateUtils.ts
/**
 * 格式化日期时间
 * @param dateTimeString 日期时间字符串
 * @returns 格式化后的本地日期时间字符串
 */
export const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    date.setHours(date.getHours() + Number(import.meta.env.VITE_TIME_OFFSET));
    return date.toLocaleString(import.meta.env.VITE_LOCALE, {
        timeZone: import.meta.env.VITE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};
