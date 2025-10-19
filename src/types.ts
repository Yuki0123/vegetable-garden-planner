// /src/types.ts
export type PlotStatus = 'growing' | 'harvested' | 'discarded';

export type Plot = {
  id: string;          // uuid
  area: string;        // 例: 'エリアA'
  row_no: number;      // 畝番号
  name: string;        // 既存UI互換（crop名が入っているケースもある）
  start_date: string;  // YYYY-MM-DD
  end_date?: string | null;
  status: PlotStatus;
  crop_id?: string | null; // ← 重要: リレーションキー
  icon?: string | null;     // 表示用にcropsテーブルからJOINした絵文字データ
  svg?: string | null;      // 表示用にiconsテーブルからJOINしたSVGデータ
};

export type CropGroup = {
  id: string;
  name?: string | null;
};

export type Crop = {
  id: string;
  name?: string | null;
  icon?: string | null;     // 絵文字
  svg?: string | null;      // iconsテーブルからJOINしたSVGデータ
  group_id?: string | null;
  group?: CropGroup | null; // join結果
};

// plot + join 結果の型
export type PlotJoined = Plot & {
  crops?: Crop | null;
};

// UI 用（表示に便利な形）
export type UIPlot = {
  id:string;
  name:string;
  icon?: string | null;     // 絵文字データ
  svg?: string | null;      // SVGデータ
  area:string;
  row:number;
  startDate:string;
  endDate?: string | null;
  status: PlotStatus;
  cropId?: string;         // どの作物と紐づくか（編集拡張用）
};