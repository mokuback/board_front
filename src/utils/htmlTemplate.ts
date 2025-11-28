import { getLabel, getStatusLabel, getRunModeLabel, getWeekLabel } from './translationMap';
import { formatDateTime } from './dateUtils';

/**
 * 將 generateCategoryJsonString 的 JSON 字符串轉為 HTML 模板
 * 返回完整的 HTML 字串（可插入到 document 或直接渲染）
 */
export function generateCategoryHtmlTemplate(jsonString: string): string {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

    const category = data.category || {};
    const stats = data.stats || {};

    const escapeHtml = (s: any) =>
      s === null || s === undefined ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 基本樣式（可擴充或改為 class）
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; color: #222; }
        .export-container { max-width: 900px; margin: 20px auto; padding: 20px; border: 1px solid #e6e6e6; }
        .header { text-align: center; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: 700; }
        .meta { font-size: 12px; color: #666; margin-top: 6px; }
        .stats { margin: 12px 0; display:flex; gap:12px; font-size:13px; }
        .section { margin-top: 14px; }
        .section h3 { font-size: 16px; margin-bottom: 8px; border-bottom: 1px dashed #ddd; padding-bottom: 6px; }
        .item { margin-left: 12px; margin-bottom: 8px; }
        .progress { margin-left: 22px; margin-bottom: 6px; }
        .notify { margin-left: 32px; font-size: 13px; color: #333; }
        .notify-section { margin-left: 32px; margin-bottom: 8px; }
        .notify-title { font-weight: 700; margin-bottom: 6px; }
        .emoji { margin-right: 6px; }
        .label { font-weight: 600; margin-right: 6px; }
        table.meta-table { width:100%; border-collapse: collapse; }
        table.meta-table td { padding:6px 4px; vertical-align: top; }
        .small { font-size: 12px; color:#666 }
      </style>
    `;

    const header = `
      <div class="header">
        <div class="title">${escapeHtml(category.category_name || '')}</div>
        <div class="meta small">${getLabel('exportTime')}: ${escapeHtml(
      data.exportTime ? formatDateTime(data.exportTime) : '',
    )}</div>
      </div>
    `;

    const statsHtml = `
      <div class="stats small">
        <div><span class="label">${getLabel('itemCount')}:</span> ${escapeHtml(stats.itemCount || 0)}</div>
        <div><span class="label">${getLabel('progressCount')}:</span> ${escapeHtml(stats.progressCount || 0)}</div>
        <div><span class="label">${getLabel('notifyCount')}:</span> ${escapeHtml(stats.notifyCount || 0)}</div>
      </div>
    `;

    const items = (category.items || []) as any[];

    const itemsHtml = items
      .map(item => {
        const progresses = item.progresses || [];
        const progressesHtml = (progresses as any[])
          .map(progress => {
            const notifies = progress.notifies || [];
            const notifiesHtml = (notifies as any[])
              .map(notify => {
                const runModeLabel =
                  typeof notify.run_mode === 'number' ? getRunModeLabel(notify.run_mode) : notify.run_mode;
                const weekLabel = Array.isArray(notify.week_at)
                  ? (notify.week_at as number[]).map(w => getWeekLabel(w)).join(', ')
                  : notify.week_at;

                return `
                      <div class="notify">
                        <div><span class="label">${getLabel('start_at')}:</span> ${escapeHtml(
                  notify.start_at ? formatDateTime(notify.start_at) : '',
                )}</div>
                        <div><span class="label">${getLabel('stop_at')}:</span> ${escapeHtml(
                  notify.stop_at ? formatDateTime(notify.stop_at) : '',
                )}</div>
                        <div><span class="label">${getLabel('run_mode')}:</span> ${escapeHtml(runModeLabel)}</div>
                        <div><span class="label">${getLabel('run_code')}:</span> ${escapeHtml(notify.run_code)}</div>
                        <div><span class="label">${getLabel('time_at')}:</span> ${escapeHtml(notify.time_at)}</div>
                        <div><span class="label">${getLabel('week_at')}:</span> ${escapeHtml(weekLabel)}</div>
                        <div><span class="label">${getLabel('last_executed')}:</span> ${escapeHtml(
                  notify.last_executed ? formatDateTime(notify.last_executed) : '',
                )}</div>
                      </div>
                    `;
              })
              .join('');

            const notifySectionHtml = notifiesHtml
              ? `<div class="notify-section"><div class="notify-title"><span class="emoji">🔔</span>通知設定</div>${notifiesHtml}</div>`
              : '';

            return `
              <div class="progress">
                <div><span class="emoji">📊</span><span class="label">${getLabel('progress_name')}:</span> ${escapeHtml(
              progress.progress_name,
            )}</div>
                <div class="small"><span class="label">${getLabel('content')}:</span> ${escapeHtml(
              progress.content,
            )}</div>
                <div class="small"><span class="label">${getLabel('status')}:</span> ${escapeHtml(
              getStatusLabel(progress.status || 0),
            )}</div>
                <div class="small"><span class="label">${getLabel('progress_at')}:</span> ${escapeHtml(
              progress.progress_at ? formatDateTime(progress.progress_at) : '',
            )}</div>
                ${notifySectionHtml}
              </div>
            `;
          })
          .join('');

        return `
          <div class="item">
            <div><span class="emoji">📁</span><span class="label">${getLabel('item_name')}:</span> ${escapeHtml(
          item.item_name,
        )}</div>
            <div class="small"><span class="label">${getLabel('item_at')}:</span> ${escapeHtml(
          item.item_at ? formatDateTime(item.item_at) : '',
        )}</div>
            ${progressesHtml}
          </div>
        `;
      })
      .join('');

    const body = `
      <div class="export-container">
        ${header}
        ${statsHtml}
        <div class="section">
          <h3>${getLabel('items')}</h3>
          ${itemsHtml}
        </div>
      </div>
    `;

    return `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${body}</body></html>`;
  } catch (err) {
    console.error('生成 HTML 模板失敗', err);
    return '<div>生成 HTML 模板失敗</div>';
  }
}
