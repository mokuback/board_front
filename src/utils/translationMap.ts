/**
 * 屬性名稱中英文轉換表
 * 用於 JSON 導出和 HTML 排版時將英文屬性轉換為中文標籤
 */

export const translationMap = {
  // ========== 頂層屬性 ==========
  category: '分類',
  exportTime: '匯出時間',
  stats: '統計',

  // ========== 分類屬性 ==========
  id: 'ID',
  category_name: '分類名稱',
  content: '內容',
  items: '項目列表',

  // ========== 項目屬性 ==========
  item_name: '項目名稱',
  item_at: '項目日期',
  progresses: '進度列表',

  // ========== 進度屬性 ==========
  progress_name: '進度名稱',
  progress_at: '進度日期',
  status: '狀態',
  notifies: '通知列表',

  // ========== 通知屬性 ==========
  start_at: '開始時間',
  stop_at: '結束時間',
  run_mode: '執行模式',
  run_code: '執行程式碼',
  time_at: '執行時間',
  week_at: '執行週間',
  last_executed: '最後執行時間',

  // ========== 統計屬性 ==========
  itemCount: '項目數量',
  progressCount: '進度數量',
  notifyCount: '通知數量',
} as const;

/**
 * 狀態值轉換表
 * 將進度的狀態代碼轉換為中文描述
 */
export const statusMap = {
  0: '進行中',
  1: '已完成',
  2: '暫停中',
} as const;

/**
 * 執行模式轉換表
 * 將通知的執行模式代碼轉換為中文描述
 */
export const runModeMap = {
  0: '單次執行',
  1: '每日執行',
  2: '每週執行',
} as const;

/**
 * 執行週間轉換表
 * 將週間數字轉換為中文星期描述
 */
export const weekMap = {
  0: '星期一',
  1: '星期二',
  2: '星期三',
  3: '星期四',
  4: '星期五',
  5: '星期六',
  6: '星期日',
} as const;

/**
 * 根據鍵名獲取中文標籤
 * @param key - 英文屬性名稱
 * @returns 對應的中文標籤，若不存在則返回原鍵名
 */
export function getLabel(key: string): string {
  return translationMap[key as keyof typeof translationMap] || key;
}

/**
 * 根據狀態代碼獲取中文描述
 * @param status - 狀態代碼 (0, 1, 2)
 * @returns 對應的中文描述
 */
export function getStatusLabel(status: number): string {
  return statusMap[status as keyof typeof statusMap] || '未知狀態';
}

/**
 * 根據執行模式代碼獲取中文描述
 * @param mode - 執行模式代碼 (0, 1, 2)
 * @returns 對應的中文描述
 */
export function getRunModeLabel(mode: number): string {
  return runModeMap[mode as keyof typeof runModeMap] || '未知模式';
}

/**
 * 根據週間數字獲取中文星期描述
 * @param week - 週間數字 (0-6)
 * @returns 對應的中文星期描述
 */
export function getWeekLabel(week: number): string {
  return weekMap[week as keyof typeof weekMap] || '未知週間';
}
