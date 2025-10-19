// 先頭に追加
import { listPlots, addPlot, updatePlot, deletePlot, upsertPlots, Plot } from './db';

// 置き換え：読み込み
async function loadRows(): Promise<any[]> {
  // 例：全件
  const rows = await listPlots({ order: 'desc' });
  // 既存UIのフィールド名に合わせてマッピング（row_no → row, start_date → startDate など）
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? '',
    area: r.area,
    row: r.row_no,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status
  }));
}

// 置き換え：保存（“全件をサーバに反映”したい場合の upsert 例）
// FIX: The 'rows' variable was not defined in this function's scope. It is now passed as a parameter.
async function saveRows(rows: any[]): Promise<void> {
  // UI配列 → DBスキーマへ
  const payload: Plot[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? null,
    area: r.area,
    row_no: Number(r.row),
    start_date: r.startDate,
    end_date: r.endDate || null,
    status: r.status
  }));
  await upsertPlots(payload);
}
