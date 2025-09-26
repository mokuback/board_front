export const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);

    // 检查时间字符串是否包含时区信息
    // 如果已经是本地时间（不包含'Z'或时区偏移），则不再添加偏移
    if (!dateTimeString.includes('Z') && !dateTimeString.includes('+') && !dateTimeString.includes('-')) {
        // 已经是本地时间，不需要添加偏移
        return date.toLocaleString(import.meta.env.VITE_LOCALE, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    // 是UTC时间，需要添加偏移
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
