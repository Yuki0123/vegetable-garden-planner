// /src/db.ts
import { Plot, PlotStatus, Crop } from './types'

// This app runs in a vanilla browser environment without a build tool like Vite.
// Therefore, `import.meta.env` is not available. The Supabase credentials are hardcoded below.
const SB_URL = "https://srrwignhfrjfllpslolv.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycndpZ25oZnJqZmxscHNsb2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTEyOTQsImV4cCI6MjA3NjE4NzI5NH0.ASZL4fBagqNz22Ax-oh1O69rDmZaXoyfp0b0_ZjVwYo";



const baseHeaders: Record<string, string> = {
  apikey: SB_ANON,
};

const REST = (p: string) => `${SB_URL}/rest/v1${p}`;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DB error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/**
 * plots を crops / crop_groups / icons と JOIN して取得。
 * 返す配列は Plot 型（svg は crops 経由で埋め込んだフラット構造）。
 */
export async function listPlots(opts?: { order?: 'asc' | 'desc' }): Promise<Plot[]> {
  const url = new URL(REST('/plots'));
  url.searchParams.set(
    'select',
    [
      // plots の列
      'id,area,row_no,name,start_date,end_date,status,crop_id,',
      // リレーション：plots.crop_id -> crops.id
      'crops!inner(',
      '  id,name,group_id,',
      '  group:group_id(id,name),',
      // リレーション：crops.icon_id -> icons.id
      '  icons(svg)',
      ')',
    ].join('')
  );
  url.searchParams.set('order', `start_date.${opts?.order ?? 'asc'}`);

  const res = await fetch(url.toString(), { headers: baseHeaders });
  const joined = await handle<any[]>(res); // Use any temporarily to handle added 'crops' object

  // ★ フラット化：crops, icons のデータを Plot にコピー
  const flattened: Plot[] = joined.map(j => ({
    id: j.id,
    area: j.area,
    row_no: j.row_no,
    name: j.crops?.name ?? j.name,            // crops.name があれば優先（任意）
    start_date: j.start_date,
    end_date: j.end_date ?? null,
    status: j.status,
    crop_id: j.crop_id ?? j.crops?.id ?? null,
    svg: j.crops?.icons?.svg ?? null,
  }));

  return flattened;
}

export async function listCrops(): Promise<Crop[]> {
  const url = new URL(REST('/crops'));
  url.searchParams.set('select', 'id,name,group:group_id(id,name),icons(svg)');
  url.searchParams.set('order', 'group_id.asc,name.asc');
  const res = await fetch(url.toString(), { headers: baseHeaders });
  // SupabaseのRPC/RESTはJOINした子のテーブルを複数形(icons)で返すため、ここで単数形にマッピングし直す
  const crops = await handle<any[]>(res);
  return crops.map(c => ({
    ...c,
    svg: c.icons?.svg ?? null,
  }));
}

// 以降の write 系は、plots テーブルの実列に合わせて安全に実装。
// svg は DB に送らない（表示用は JOINで解決するため）。
type PlotWrite = Omit<Plot, 'svg'>;

export async function addPlot(p: PlotWrite): Promise<Plot> {
  const res = await fetch(REST('/plots'), {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(p),
  });
  // 追加直後は svg が無いので、listPlots を呼ぶ方が確実だが、ここではそのまま返す
  const rows = await handle<Plot[]>(res);
  return rows[0];
}

export async function updatePlot(id: string, patch: Partial<PlotWrite>): Promise<Plot> {
  const res = await fetch(`${REST('/plots')}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...baseHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  const rows = await handle<Plot[]>(res);
  return rows[0];
}

export async function deletePlot(id: string): Promise<void> {
  const res = await fetch(`${REST('/plots')}?id=eq.${id}`, {
    method: 'DELETE',
    headers: baseHeaders,
  });
  if (!res.ok) throw new Error(`delete failed: ${res.status}`);
}

export async function upsertPlots(rows: PlotWrite[]): Promise<Plot[]> {
  const res = await fetch(REST('/plots'), {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  return handle<Plot[]>(res);
}