// src/components/FieldView.tsx
import React, { useMemo } from 'react';
import { UIPlot } from '../types';

type Props = {
  plots: UIPlot[];
  selectedDate: string;
  onSelectPlot: (id: string) => void;
  onSelectEmptyRow: (area: string, row: number) => void;
  areas: string[];
  activeArea: string;
  rowsPerArea?: number;
};

const ROWS_PER_AREA = 10;

export function FieldView({
  plots,
  selectedDate,
  onSelectPlot,
  onSelectEmptyRow,
  areas,
  activeArea,
  rowsPerArea = ROWS_PER_AREA,
}: Props) {
  // 選択された日に該当する作付け計画のみをフィルタリングし、エリアと畝番号でグループ化する
  const plotsByRow = useMemo(() => {
    const map = new Map<string, UIPlot[]>();
    
    plots
      .filter(p => {
        // 栽培中の作物のみ表示する
        if (p.status !== 'growing') {
          return false;
        }
        const start = p.startDate;
        const end = p.endDate ?? '9999-12-31';
        return selectedDate >= start && selectedDate <= end;
      })
      .forEach(p => {
        const key = `${p.area}-${p.row}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        const rowPlots = map.get(key)!;
        rowPlots.push(p);
      });

    // 各畝の作物を開始日でソート
    for (const rowPlots of map.values()) {
      rowPlots.sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
    
    return map;
  }, [plots, selectedDate]);


  return (
    <div className="field-container">
      {areas.map(area => (
        <div 
          key={area} 
          className={`field-area ${area === activeArea ? 'active' : ''}`}
        >
          <h2>{area}</h2>
          <div className="field-rows">
            {Array.from({ length: rowsPerArea }, (_, i) => i + 1).map(rowNum => {
              const key = `${area}-${rowNum}`;
              const plotsInRow = plotsByRow.get(key);
              const isOccupied = plotsInRow && plotsInRow.length > 0;

              if (isOccupied) {
                // 選択日に1つ以上の作物が植えられている畝
                return (
                  <div
                    key={key}
                    className="field-row occupied"
                    onClick={() => onSelectEmptyRow(area, rowNum)}
                    aria-label={`${area} ${rowNum}番畝に作物を追加`}
                  >
                    <span className="row-number">{rowNum}</span>
                    <div className="crops-wrapper">
                      {plotsInRow.map(plot => (
                        <button
                          key={plot.id}
                          className="crop-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPlot(plot.id);
                          }}
                          aria-label={`${plot.name} (${plot.startDate}) を編集`}
                        >
                          {plot.icon ? (
                            <span className="icon">{plot.icon}</span>
                          ) : plot.svg ? (
                            <span className="icon svg-icon" dangerouslySetInnerHTML={{ __html: plot.svg }} />
                          ) : (
                            <span className="icon"></span>
                          )}
                          <span className="date">{plot.startDate.substring(5).replace('-', '/')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else {
                // 選択日に空きの畝
                return (
                  <button
                    key={key}
                    className="field-row empty"
                    onClick={() => onSelectEmptyRow(area, rowNum)}
                    aria-label={`${area} ${rowNum}番畝に作物を追加`}
                  >
                    <span className="row-number">{rowNum}</span>
                  </button>
                );
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
}