import React, { useMemo } from 'react';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval, endOfWeek } from 'date-fns';
import { TimelineView } from '@/types/timeline';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  view: TimelineView;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ startDate, endDate, view }) => {
  // Generate headers based on the current view
  const headers = useMemo(() => {
    switch (view) {
      case 'week':
        return eachDayOfInterval({ start: startDate, end: endDate });
      case 'month':
        return eachWeekOfInterval(
          { start: startDate, end: endDate },
          { weekStartsOn: 0 }
        );
      case 'quarter':
        return eachMonthOfInterval({ start: startDate, end: endDate });
      case 'year':
        return eachQuarterOfInterval({ start: startDate, end: endDate });
      default:
        return eachDayOfInterval({ start: startDate, end: endDate });
    }
  }, [view, startDate, endDate]);

  // Format header label based on view
  const formatHeaderLabel = (date: Date) => {
    switch (view) {
      case 'week':
        return (
          <>
            <div className="text-xs text-muted-foreground">{format(date, 'EEE')}</div>
            <div className={`text-sm ${
              date.toDateString() === new Date().toDateString() 
                ? 'text-primary font-bold' 
                : 'text-foreground'
            }`}>
              {date.getDate()}
            </div>
          </>
        );
      case 'month':
        return (
          <div className="text-center">
            <div className="text-xs text-muted-foreground">
              {format(date, 'MMM d')}
            </div>
            <div className="text-sm">
              {format(date, 'd')} - {format(endOfWeek(date), 'MMM d')}
            </div>
          </div>
        );
      case 'quarter':
        return (
          <div className="text-center">
            <div className="text-sm">{format(date, 'MMM yyyy')}</div>
          </div>
        );
      case 'year':
        return (
          <div className="text-center">
            <div className="text-sm">
              Q{Math.floor(date.getMonth() / 3) + 1} {format(date, 'yyyy')}
            </div>
          </div>
        );
      default:
        return format(date, 'MMM d');
    }
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    if (view === 'week') {
      return date.toDateString() === today.toDateString();
    } else if (view === 'month') {
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } else if (view === 'quarter') {
      return (
        Math.floor(date.getMonth() / 3) === Math.floor(today.getMonth() / 3) &&
        date.getFullYear() === today.getFullYear()
      );
    } else if (view === 'year') {
      return date.getFullYear() === today.getFullYear();
    }
    return false;
  };

  // Check if a date is in the current period
  const isCurrentPeriod = (date: Date) => {
    const today = new Date();
    if (view === 'week') {
      return date.toDateString() === today.toDateString();
    } else if (view === 'month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    } else if (view === 'quarter') {
      return (
        Math.floor(date.getMonth() / 3) === Math.floor(today.getMonth() / 3) &&
        date.getFullYear() === today.getFullYear()
      );
    } else if (view === 'year') {
      return date.getFullYear() === today.getFullYear();
    }
    return false;
  };

  return (
    <div className="relative">
      <div className="flex">
        {headers.map((date, index) => {
          const isWeekend = view === 'week' && (date.getDay() === 0 || date.getDay() === 6);
          const isTodayHighlighted = isToday(date);
          const isCurrent = isCurrentPeriod(date);
          
          return (
            <div 
              key={index}
              className={`flex-1 text-center py-2 border-r border-b ${
                isWeekend ? 'bg-muted/50' : 'bg-background'
              } ${
                isTodayHighlighted ? 'border-t-2 border-t-primary' : ''
              }`}
            >
              {formatHeaderLabel(date)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineHeader;
