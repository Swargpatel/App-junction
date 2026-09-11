import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Zap,
  Check,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'TODAY' | 'CUSTOM'>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'MENU' | 'CALENDAR'>('MENU');
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection state while calendar is open
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');

  // Month and year currently displayed in calendar view
  const baseDate = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(baseDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(baseDate.getMonth());

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync mode with props
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilterMode('ALL');
      setTempStart('');
      setTempEnd('');
    } else if (startDate === todayStr && endDate === todayStr && filterMode !== 'CUSTOM') {
      setFilterMode('TODAY');
      setTempStart(todayStr);
      setTempEnd(todayStr);
    } else {
      setTempStart(startDate);
      setTempEnd(endDate);
    }
  }, [startDate, endDate]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parts[2];
    const monthShort = MONTH_NAMES[m]?.slice(0, 3) || '';
    return `${d} ${monthShort} ${y}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Begin new range selection
      setTempStart(dateStr);
      setTempEnd('');
    } else {
      // Pick end of range
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleSelectMenuOption = (mode: 'ALL' | 'TODAY' | 'CUSTOM') => {
    if (mode === 'ALL') {
      setFilterMode('ALL');
      onChange('', '');
      setIsOpen(false);
    } else if (mode === 'TODAY') {
      setFilterMode('TODAY');
      onChange(todayStr, todayStr);
      setIsOpen(false);
    } else if (mode === 'CUSTOM') {
      // Open the Calendar view only when Custom Date Range is clicked
      if (!tempStart) {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        setTempStart(formatDate(past));
        setTempEnd(todayStr);
      }
      setView('CALENDAR');
    }
  };

  const handleApplyCustom = () => {
    const finalStart = tempStart || todayStr;
    const finalEnd = tempEnd || finalStart;
    setFilterMode('CUSTOM');
    onChange(finalStart, finalEnd);
    setIsOpen(false);
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFilterMode('ALL');
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    setIsOpen(false);
  };

  // Build days for current calendar view
  const getCalendarDays = () => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }> = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: prevDay,
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true
      });
    }

    // Leading days for next month to complete the row
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: d,
          isCurrentMonth: false
        });
      }
    }

    return days;
  };

  const isFiltered = Boolean(startDate || endDate || filterMode !== 'ALL');

  // Trigger button label
  const getTriggerLabel = () => {
    if (filterMode === 'ALL') {
      return 'All Time';
    }
    if (filterMode === 'TODAY') {
      return 'Today';
    }
    if (startDate) {
      if (startDate === endDate || !endDate) {
        return formatDisplayDate(startDate);
      }
      return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }
    return 'Custom Range';
  };

  const calendarDays = getCalendarDays();

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {/* Date Filter Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setView('MENU'); // Always open clean compact menu first
        }}
        className={`date-dropdown-trigger ${isOpen || isFiltered ? 'active' : ''}`}
        style={{
          height: '36px',
          padding: '0 14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}
      >
        {filterMode === 'ALL' && <Globe size={14} color="var(--primary)" />}
        {filterMode === 'TODAY' && <Zap size={14} color="#F59E0B" />}
        {filterMode === 'CUSTOM' && <Calendar size={14} color="var(--primary)" />}

        <span style={{ fontSize: '0.82rem' }}>{getTriggerLabel()}</span>

        <ChevronDown
          size={14}
          color="var(--text-muted)"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          onClick={handleReset}
          title="Reset Date Filter to All Time"
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#E11D48',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            height: '36px',
            transition: 'all 0.15s ease'
          }}
        >
          <X size={13} />
          <span>Reset</span>
        </button>
      )}

      {/* Popover Content */}
      {isOpen && (
        <>
          {/* View 1: Clean, Compact 3-option Dropdown */}
          {view === 'MENU' && (
            <div className="date-dropdown-menu" role="listbox">
              <button
                type="button"
                className={`date-dropdown-item ${filterMode === 'ALL' ? 'selected' : ''}`}
                onClick={() => handleSelectMenuOption('ALL')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={14} color={filterMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>All Time</span>
                </div>
                {filterMode === 'ALL' && <Check size={14} color="var(--primary)" />}
              </button>

              <button
                type="button"
                className={`date-dropdown-item ${filterMode === 'TODAY' ? 'selected' : ''}`}
                onClick={() => handleSelectMenuOption('TODAY')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={14} color={filterMode === 'TODAY' ? 'var(--primary)' : '#F59E0B'} />
                  <span>Today</span>
                </div>
                {filterMode === 'TODAY' && <Check size={14} color="var(--primary)" />}
              </button>

              <button
                type="button"
                className={`date-dropdown-item ${filterMode === 'CUSTOM' ? 'selected' : ''}`}
                onClick={() => handleSelectMenuOption('CUSTOM')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={14} color={filterMode === 'CUSTOM' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>Custom Date Range...</span>
                </div>
                <ArrowRight size={13} color="var(--text-dim)" />
              </button>
            </div>
          )}

          {/* View 2: Calendar Popover (Shown ONLY when Custom Date Range is selected) */}
          {view === 'CALENDAR' && (
            <div className="custom-calendar-popover">
              {/* Back button & Title header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="calendar-back-btn"
                  onClick={() => setView('MENU')}
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Custom Range
                </span>
                <div style={{ width: '40px' }} />
              </div>

              {/* Month & Year Navigation Header */}
              <div className="calendar-month-header">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="calendar-month-title">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>

                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handleNextMonth}
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Days of Week Header */}
              <div className="calendar-weekdays">
                {WEEK_DAYS.map((wd) => (
                  <div key={wd} className="calendar-weekday">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="calendar-grid">
                {calendarDays.map((item, idx) => {
                  const isStart = item.dateStr === tempStart;
                  const isEnd = item.dateStr === tempEnd;
                  const isSingle = isStart && (!tempEnd || tempStart === tempEnd);
                  const inRange =
                    tempStart &&
                    tempEnd &&
                    item.dateStr > tempStart &&
                    item.dateStr < tempEnd;
                  const isToday = item.dateStr === todayStr;

                  let cellClasses = 'calendar-day-cell';
                  if (!item.isCurrentMonth) cellClasses += ' other-month';
                  if (isSingle) cellClasses += ' range-single';
                  else if (isStart) cellClasses += ' range-start';
                  else if (isEnd) cellClasses += ' range-end';
                  else if (inRange) cellClasses += ' in-range';
                  if (isToday) cellClasses += ' today-marker';

                  return (
                    <button
                      key={`${item.dateStr}-${idx}`}
                      type="button"
                      disabled={!item.isCurrentMonth}
                      onClick={() => handleDayClick(item.dateStr)}
                      className={cellClasses}
                      title={item.dateStr}
                    >
                      {item.dayNumber}
                    </button>
                  );
                })}
              </div>

              {/* Selected Range Summary */}
              <div className="calendar-range-summary">
                <span style={{ color: 'var(--text-muted)' }}>
                  {tempStart ? (
                    <>
                      <strong style={{ color: 'var(--text-main)' }}>{tempStart}</strong>
                      {tempEnd && tempEnd !== tempStart ? (
                        <> to <strong style={{ color: 'var(--text-main)' }}>{tempEnd}</strong></>
                      ) : ''}
                    </>
                  ) : (
                    'Click to select range'
                  )}
                </span>

                {tempStart && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempStart('');
                      setTempEnd('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#E11D48',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="calendar-actions">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <Check size={13} />
                  <span>Apply Range</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
