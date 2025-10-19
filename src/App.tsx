// src/App.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FieldView } from '../components/FieldView';
import { FieldPanel } from '../components/Fieldpanel';
import { Calendar } from '../components/Calendar';
import * as db from './db';
import { Plot, UIPlot, PlotStatus, Crop } from './types';

// DBデータ(Plot)をUI用データ(UIPlot)に変換するマッパー
const toUIPlot = (p: Plot): UIPlot => ({
  id: p.id,
  name: p.name,
  icon: p.icon ?? null,
  svg: p.svg ?? null,
  area: p.area,
  row: p.row_no,
  startDate: p.start_date,
  endDate: p.end_date ?? null,
  status: p.status,
  cropId: p.crop_id ?? undefined,
});

// UI用データ(UIPlot)をDBデータ(Plot)に変換するマッパー
const fromUIPlot = (p: UIPlot): Omit<Plot, 'created_at' | 'updated_at' | 'svg' | 'icon'> => ({
  id: p.id,
  name: p.name,
  area: p.area,
  row_no: p.row,
  start_date: p.startDate,
  end_date: p.endDate,
  status: p.status,
  crop_id: p.cropId,
});

// 新規登録用の初期値を生成するヘルパー関数
const getInitialValue = (defaults: Partial<UIPlot> = {}): UIPlot => ({
  id: crypto.randomUUID(),
  name: '',
  icon: null,
  svg: null,
  area: 'エリアA',
  row: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  status: 'growing' as PlotStatus,
  cropId: undefined,
  ...defaults,
});

const today = new Date().toISOString().split('T')[0];
const AREAS = ['エリアA', 'エリアB']; // タブの表示順を A -> B に変更

export function App() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [editingPlot, setEditingPlot] = useState<UIPlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeArea, setActiveArea] = useState<string>('エリアB'); // 初期表示はエリアBのまま

  const fetchPlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await db.listPlots({ order: 'asc' });
      setPlots(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'データの読み込みに失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [plotsData, cropsData] = await Promise.all([
          db.listPlots({ order: 'asc' }),
          db.listCrops(),
        ]);
        setPlots(plotsData);
        setAllCrops(cropsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'データの読み込みに失敗しました。';
        setError(message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);
  
  const uiPlots = useMemo(() => plots.map(toUIPlot), [plots]);

  const handleSave = async (uiPlot: UIPlot) => {
    const plotToSave = fromUIPlot(uiPlot);
    try {
      const exists = plots.some(p => p.id === uiPlot.id);
      if (exists) {
        await db.updatePlot(uiPlot.id, plotToSave);
      } else {
        await db.addPlot(plotToSave);
      }
      await fetchPlots(); // Re-fetch plots to get the latest joined data
      setEditingPlot(null); // モーダルを閉じる
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました。';
      setError(message);
      console.error(err);
    }
  };

  // 栽培中の畝を選択したときのハンドラ
  const handleSelectPlot = (id: string) => {
    const plot = uiPlots.find(p => p.id === id);
    if (plot) {
      setEditingPlot(plot);
    }
  };
  
  // 空きの畝を選択したときのハンドラ
  const handleSelectEmptyRow = (area: string, row: number) => {
    setEditingPlot(getInitialValue({ area, row, startDate: selectedDate }));
  };
  
  const closeModal = () => {
    setEditingPlot(null);
  }

  const isNewPlot = editingPlot ? !plots.some(p => p.id === editingPlot.id) : false;

  return (
    <div id="app">
      <header>
        <h1>Vegetable Garden Planner</h1>
      </header>
      <main>
        {isLoading && <div className="loading">読み込み中...</div>}
        {error && <div className="error">エラー: {error}</div>}
        {!isLoading && !error && (
          <div className="main-container">
            <div className="widget-container">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            <div className="field-view-wrapper">
              <div className="tabs">
                {AREAS.map(area => (
                  <button
                    key={area}
                    className={`tab-button ${activeArea === area ? 'active' : ''}`}
                    onClick={() => setActiveArea(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <FieldView
                plots={uiPlots}
                selectedDate={selectedDate}
                areas={AREAS}
                activeArea={activeArea}
                onSelectPlot={handleSelectPlot}
                onSelectEmptyRow={handleSelectEmptyRow}
              />
            </div>
          </div>
        )}
        
        {editingPlot && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{isNewPlot ? '新規栽培計画' : '計画の編集'}</h2>
              <FieldPanel
                key={editingPlot.id}
                value={editingPlot}
                onSave={handleSave}
                onCancel={closeModal}
                crops={allCrops}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}