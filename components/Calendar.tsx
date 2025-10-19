// src/components/Calendar.tsx
import React, { useState, useEffect } from 'react';

type Props = {
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

// YYYY-MM-DD形式の日付文字列をDateオブジェクトに変換（UTC基準）
const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const todayStr = new Date().toISOString().split('T')[0];

export function Calendar({ selectedDate, onDateSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false); // Default: week view
  const [displayMonth, setDisplayMonth] = useState(() => parseDate(selectedDate));

  useEffect(() => {
    // 選択された日付が変わったら、カレンダーの表示月もそれに合わせる
    setDisplayMonth(parseDate(selectedDate));
  }, [selectedDate]);

  const handlePeriodChange = (amount: number) => {
    if (isOpen) {
      // 月表示の時: 表示月のみを更新する
      setDisplayMonth(prev => {
        const newDate = new Date(prev);
        newDate.setUTCMonth(newDate.getUTCMonth() + amount);
        return newDate;
      });
    } else {
      // 週表示の時: 選択日を更新し、useEffectで表示月が追従するようにする
      const currentDate = parseDate(selectedDate);
      currentDate.setUTCDate(currentDate.getUTCDate() + (7 * amount));
      onDateSelect(currentDate.toISOString().split('T')[0]);
    }
  };

  const handleGoToToday = () => {
    // 表示月を現在の月に設定する
    setDisplayMonth(parseDate(todayStr));
    // 選択日を今日に設定する
    onDateSelect(todayStr);
  };

  const renderDays = () => {
    if (!isOpen) { // Week view
      const selected = parseDate(selectedDate);
      const startOfWeek = new Date(selected);
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() - selected.getUTCDay()); // Sunday start
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setUTCDate(dayDate.getUTCDate() + i);

        const day = dayDate.getUTCDate();
        const dateStr = dayDate.toISOString().split('T')[0];

        const classes = ['day-cell'];
        if (dateStr === selectedDate) classes.push('selected');
        if (dayDate.getUTCMonth() !== displayMonth.getUTCMonth()) classes.push('other-month');
        if (dateStr === todayStr) classes.push('is-today');
        
        days.push(
          <button
            key={dateStr}
            className={classes.join(' ')}
            onClick={() => onDateSelect(dateStr)}
          >
            {day}
          </button>
        );
      }
      return days;
    }

    // Month view
    const year = displayMonth.getUTCFullYear();
    const month = displayMonth.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    
    const days = [];
    
    for (let i = firstDay; i > 0; i--) {
      const day = daysInPrevMonth - i + 1;
      days.push(<div key={`prev-${day}`} className="day-cell other-month">{day}</div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const classes = ['day-cell'];
      if (dateStr === selectedDate) classes.push('selected');
      if (dateStr === todayStr) classes.push('is-today');

      days.push(
        <button
          key={dateStr}
          className={classes.join(' ')}
          onClick={() => onDateSelect(dateStr)}
        >
          {day}
        </button>
      );
    }
    
    const totalCells = firstDay + daysInMonth;
    const nextDays = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= nextDays; i++) {
      days.push(<div key={`next-${i}`} className="day-cell other-month">{i}</div>);
    }
    
    return days;
  };

  const displayDate = isOpen ? displayMonth : parseDate(selectedDate);
  const title = displayDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-arrow" onClick={() => handlePeriodChange(-1)} aria-label={isOpen ? "前の月へ" : "前の週へ"}>&lt;</button>
        <button className="nav-arrow" onClick={() => handlePeriodChange(1)} aria-label={isOpen ? "次の月へ" : "次の週へ"}>&gt;</button>
        <h3 className="calendar-title">{title}</h3>
        <div className="calendar-header-actions">
          <button className="calendar-today-btn" onClick={handleGoToToday}>
            今日
          </button>
          <button className="calendar-toggle" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "週表示に切り替え" : "月表示に切り替え"}>
            📅
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => <div key={d} className="day-name">{d}</div>)}
        {renderDays()}
      </div>
    </div>
  );
}