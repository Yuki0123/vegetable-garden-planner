// /src/components/FieldPanel.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { UIPlot, PlotStatus, Crop } from '../types'

type Props = {
  value: UIPlot
  onSave: (v: UIPlot) => void
  onCancel: () => void
  crops: Crop[]
}

export function FieldPanel({ value, onSave, onCancel, crops }: Props) {
  const [v, setV] = useState<UIPlot>(value);

  const cropGroups = useMemo(() => {
    const groups = new Map<string, string>();
    crops.forEach(crop => {
      if (crop.group?.id && crop.group?.name) {
        groups.set(crop.group.id, crop.group.name);
      }
    });
    return Array.from(groups.entries()).map(([id, name]) => ({ id, name: name! }));
  }, [crops]);

  const getInitialGroupId = () => {
    if (value.cropId) {
      const selectedCrop = crops.find(c => c.id === value.cropId);
      if (selectedCrop?.group?.id) {
        return selectedCrop.group.id;
      }
    }
    return cropGroups.length > 0 ? cropGroups[0].id : undefined;
  };

  const [activeGroupId, setActiveGroupId] = useState(getInitialGroupId);

  const filteredCrops = useMemo(() => {
    if (!activeGroupId) {
      return [];
    }
    return crops.filter(c => c.group?.id === activeGroupId);
  }, [crops, activeGroupId]);


  useEffect(() => {
    setV(value);
  }, [value]);

  const handleCropSelect = (selectedCrop: Crop) => {
    setV({
      ...v,
      cropId: selectedCrop.id,
      name: selectedCrop.name ?? '',
      icon: selectedCrop.icon ?? null,
      svg: selectedCrop.svg ?? null,
    });
  };

  return (
    <form className="panel" onSubmit={e => { e.preventDefault(); onSave(v); }}>
      <div className="plot-info">
        {v.area} / {v.row}番畝
      </div>
      <div className="form-group">
        <label>作物</label>
        <div className="crop-selector">
          <div className="crop-group-tabs">
            {cropGroups.map(group => (
              <button
                type="button"
                key={group.id}
                className={`crop-group-tab ${activeGroupId === group.id ? 'active' : ''}`}
                onClick={() => setActiveGroupId(group.id)}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="crop-selector-grid">
            {filteredCrops.map(crop => (
              <button
                type="button"
                key={crop.id}
                className={`crop-selector-item ${v.cropId === crop.id ? 'selected' : ''}`}
                onClick={() => handleCropSelect(crop)}
                title={crop.name ?? ''}
              >
                {crop.icon ? (
                  <span className="icon">{crop.icon}</span>
                ) : crop.svg ? (
                  <span className="icon svg-icon" dangerouslySetInnerHTML={{ __html: crop.svg }} />
                ) : (
                  <span className="icon"></span>
                )}
                <span className="name">{crop.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label>開始日</label>
        <input type="date" required value={v.startDate} onChange={e=>setV({...v, startDate:e.target.value})}/>
      </div>
      <div className="form-group">
        <label>終了日</label>
        <input type="date" value={v.endDate ?? ''} onChange={e=>setV({...v, endDate:e.target.value || null})}/>
      </div>
      <div className="form-group">
        <label>状態</label>
        <select value={v.status} onChange={e=>setV({...v, status:e.target.value as PlotStatus})}>
          <option value="growing">栽培中</option>
          <option value="harvested">収穫済</option>
          <option value="discarded">撤去</option>
        </select>
      </div>

      <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn" onClick={onCancel}>キャンセル</button>
          <button type="submit" className="btn btn-primary" disabled={!v.name || !v.startDate}>保存</button>
        </div>
      </div>
    </form>
  )
}