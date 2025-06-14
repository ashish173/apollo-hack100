import React from 'react';
import { format, addDays, isSameDay } from 'date-fns';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ startDate, endDate }) => {
  // Generate an array of dates from start to end
  const dates = React.useMemo(() => {
    const days = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  }, [startDate, endDate]);

  // Group dates by week
  const weeks = React.useMemo(() => {
    const grouped: Date[][] = [];
    let currentWeek: Date[] = [];
    
    dates.forEach((date, index) => {
      currentWeek.push(date);
      
      // If it's Sunday or the last date, start a new week
      if (date.getDay() === 0 || index === dates.length - 1) {
        grouped.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return grouped;
  }, [dates]);

  return (
    <div className="relative">
      {/* Week numbers */}
      <div className="flex">
        {weeks.map((week, weekIndex) => {
          const weekStart = week[0];
          const weekEnd = week[week.length - 1];
          const weekNumber = Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000));
          
          return (
            <div 
              key={`week-${weekIndex}`} 
              className="flex-1 text-center text-xs font-medium text-muted-foreground border-b py-1"
              style={{ minWidth: '100px' }}
            >
              Week {weekNumber}
            </div>
          );
        })}
      </div>
      
      {/* Days */}
      <div className="flex border-b">
        {dates.map((date, index) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isToday = isSameDay(date, new Date());
          
          return (
            <div 
              key={`day-${index}`}
              className={`flex-1 text-center text-xs py-1 ${isWeekend ? 'bg-muted/30' : ''} ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}
              style={{ minWidth: '40px' }}
            >
              <div>{format(date, 'd')}</div>
              <div className="text-[10px] opacity-70">{format(date, 'EEE')}</div>
              {isToday && <div className="h-1 w-1 mx-auto mt-1 rounded-full bg-primary"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineHeader;
