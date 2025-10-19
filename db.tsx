// db.ts — Supabase REST（PostgREST）薄ラッパー

// === 設定 ===
const SB_URL  = "https://srrwignhfrjfllpslolv.supabase.co";  // ← Project URL
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycndpZ25oZnJqZmxscHNsb2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTEyOTQsImV4cCI6MjA3NjE4NzI5NH0.ASZL4fBagqNz22Ax-oh1O69rDmZaXoyfp0b0_ZjVwYo";              // ← anon public key

// === 型 ===
export type PlotStatus = 'growing' | 'harvested' | 'discarded';
export type Plot = {
  id: string;          // uuid
  area: string;        // 'エリアA' など
  row_no: number;      // 畝番号
  name: string;        // 作物名
  icon?: string | null;
  start_date: string;  // 'YYYY-MM-DD'
  end_date?: string | null;
  status: PlotStatus;
  created_at?: string;
  updated_at?: string;
};

// === 内部ヘルパー ===
const REST = (path: string) => `${SB_URL}/rest/v1${path}`;
const baseHeaders = {
  apikey: SB_ANON,
  Authorization: `Bearer ${SB_ANON}`,
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  // 204 No Content の場合もある
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json() as Promise<T>;
  // @ts-ignore
  return undefined;
}

// === CRUD ===

// 一覧（フィルタは必要に応じて）
export async function listPlots(params?: {
  area?: string;
  status?: PlotStatus;
  limit?: number;
  order?: 'asc' | 'desc';
}): Promise<Plot[]> {
  const q = new URLSearchParams();
  q.set('select', '*');

  if (params?.area)   q.set('area', `eq.${params.area}`);
  if (params?.status) q.set('status', `eq.${params.status}`);
  if (params?.limit)  q.set('limit', String(params.limit));

  // 並び順（開始日の降順がデフォ）
  const order = params?.order ?? 'desc';
  q.set('order', `start_date.${order},row_no.asc`);

  const url = REST(`/plots?${q.toString()}`);
  const res = await fetch(url, { headers: baseHeaders });
  return handle<Plot[]>(res);
}

// 追加（1件）
export async function addPlot(p: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Promise<Plot> {
  const res = await fetch(REST('/plots'), {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // ← 追加後の行を返す
    },
    body: JSON.stringify(p),
  });
  const rows = await handle<Plot[]>(res);
  return rows[0];
}

// 更新（部分更新）
export async function updatePlot(id: string, patch: Partial<Omit<Plot, 'id'>>): Promise<Plot> {
  const res = await fetch(REST(`/plots?id=eq.${id}`), {
    method: 'PATCH',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(patch),
  });
  const rows = await handle<Plot[]>(res);
  return rows[0];
}

// 削除
export async function deletePlot(id: string): Promise<void> {
  const res = await fetch(REST(`/plots?id=eq.${id}`), {
    method: 'DELETE',
    headers: baseHeaders,
  });
  await handle<void>(res);
}

// バルク upsert（配列を主キー衝突時にマージ）
// ※ 同一 id があれば更新、なければ挿入
export async function upsertPlots(rows: Plot[]): Promise<Plot[]> {
  const res = await fetch(REST('/plots'), {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(rows),
  });
  return handle<Plot[]>(res);
}
