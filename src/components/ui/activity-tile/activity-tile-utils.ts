import { ActivityType } from './activity-tile.types';
import { BathLogResponse, PumpLogResponse, MeasurementResponse, MilestoneResponse, MedicineLogResponse } from '@/app/api/types';
import { useTimezone } from '@/app/context/timezone';
import { useLocalization } from '@/src/context/localization';
import { formatDuration as formatDurationWithPreferences, getDateTimePreferences } from '@/src/lib/date-time';

/**
 * Gets the activity time from different activity types
 */
export const getActivityTime = (activity: ActivityType): string => {
  if ('time' in activity && activity.time) {
    return activity.time;
  }
  if ('startTime' in activity && activity.startTime) {
    if ('duration' in activity && activity.endTime) {
      return String(activity.endTime);
    }
    return String(activity.startTime);
  }
  return new Date().toISOString();
};

/**
 * Determines the variant based on the activity type
 */
export const getActivityVariant = (activity: ActivityType): 'sleep' | 'feed' | 'diaper' | 'note' | 'bath' | 'pump' | 'measurement' | 'milestone' | 'medicine' | 'default' => {
  if ('type' in activity) {
    if ('duration' in activity) return 'sleep';
    if ('amount' in activity) return 'feed';
    if ('condition' in activity) return 'diaper';
    if ('soapUsed' in activity || 'shampooUsed' in activity) return 'bath';
    if ('value' in activity && 'unit' in activity) return 'measurement';
  }
  if ('doseAmount' in activity && 'medicineId' in activity) return 'medicine';
  if ('title' in activity && 'category' in activity) return 'milestone';
  if ('leftAmount' in activity || 'rightAmount' in activity) return 'pump';
  if ('content' in activity) return 'note';
  return 'default';
};

/**
 * Generates a description for the activity
 * This is a React hook that uses the timezone context
 */
export const useActivityDescription = () => {
  const { formatDateTime, formatTime, formatDuration: formatDurationTime } = useTimezone();
  const { language, t } = useLocalization();
  const preferences = getDateTimePreferences(
    typeof window !== 'undefined'
      ? {
          timeFormat: (localStorage.getItem('timeFormat') as '24h' | '12h' | null) ?? undefined,
          dateFormat: (localStorage.getItem('dateFormat') as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | null) ?? undefined,
        }
      : undefined,
    language
  );
  
  /**
   * Formats duration in minutes to HH:MM format with parentheses
   */
  const formatDuration = (minutes: number): string => {
    return `(${formatDurationTime(minutes)})`;
  };
  
  /**
   * Gets the description for an activity
   */
  const getActivityDescription = (activity: ActivityType) => {
    if ('type' in activity) {
      if ('duration' in activity) {
        const startTimeFormatted = activity.startTime ? formatDateTime(activity.startTime) : 'unknown';
        const endTimeFormatted = activity.endTime ? formatDateTime(activity.endTime) : 'ongoing';
        const duration = activity.duration ? ` ${formatDuration(activity.duration)}` : '';
        const location = activity.location === 'OTHER' ? 'Other' : activity.location?.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        // Extract just the time part from the end time
        const endTimeOnly = activity.endTime ? formatTime(activity.endTime) : 'ongoing';
        
        return {
          type: `${activity.type === 'NAP' ? 'Nap' : 'Night Sleep'}${location ? ` - ${location}` : ''}`,
          details: `${startTimeFormatted} - ${endTimeOnly}${duration}`
        };
      }
      if ('amount' in activity) {
        const formatFeedType = (type: string) => {
          switch (type) {
            case 'BREAST': return 'Breast';
            case 'BOTTLE': return 'Bottle';
            case 'SOLIDS': return 'Solid Food';
            default: return type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        };
        const formatBreastSide = (side: string) => {
          switch (side) {
            case 'LEFT': return 'Left';
            case 'RIGHT': return 'Right';
            default: return side.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        };
        
        let details = '';
        if (activity.type === 'BREAST') {
          const side = activity.side ? `Side: ${formatBreastSide(activity.side)}` : '';
          const duration = activity.amount ? `${activity.amount} min` : '';
          details = [side, duration].filter(Boolean).join(', ');
        } else if (activity.type === 'BOTTLE') {
          details = `${activity.amount || 'unknown'} oz`;
        } else if (activity.type === 'SOLIDS') {
          details = `${activity.amount || 'unknown'} g`;
          if (activity.food) {
            details += ` of ${activity.food}`;
          }
        }
        
        const time = formatDateTime(activity.time);
        return {
          type: formatFeedType(activity.type),
          details: `${details} - ${time}`
        };
      }
      if ('condition' in activity) {
        const formatDiaperType = (type: string) => {
          switch (type) {
            case 'WET': return 'Wet';
            case 'DIRTY': return 'Dirty';
            case 'BOTH': return 'Wet and Dirty';
            default: return type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        };
        const formatDiaperCondition = (condition: string) => {
          switch (condition) {
            case 'NORMAL': return 'Normal';
            case 'LOOSE': return 'Loose';
            case 'FIRM': return 'Firm';
            case 'OTHER': return 'Other';
            default: return condition.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        };
        const formatDiaperColor = (color: string) => {
          switch (color) {
            case 'YELLOW': return 'Yellow';
            case 'BROWN': return 'Brown';
            case 'GREEN': return 'Green';
            case 'OTHER': return 'Other';
            default: return color.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        };
        
        let details = '';
        if (activity.type !== 'WET') {
          const conditions = [];
          if (activity.condition) conditions.push(formatDiaperCondition(activity.condition));
          if (activity.color) conditions.push(formatDiaperColor(activity.color));
          if (conditions.length > 0) {
            details = ` (${conditions.join(', ')}) - `;
          }
        }
        
        const time = formatDateTime(activity.time);
        return {
          type: formatDiaperType(activity.type),
          details: `${details}${time}`
        };
      }
    }
    if ('content' in activity) {
      const time = formatDateTime(activity.time);
      const truncatedContent = activity.content.length > 50 ? activity.content.substring(0, 50) + '...' : activity.content;
      return {
        type: activity.category || 'Note',
        details: `${time} - ${truncatedContent}`
      };
    }
    // Type guard for BathLogResponse
    const isBathLog = (activity: ActivityType): activity is BathLogResponse => {
      return 'soapUsed' in activity || 'shampooUsed' in activity;
    };
    
    if (isBathLog(activity)) {
      const time = formatDateTime(activity.time);
      const notes = activity.notes ? ` - ${activity.notes}` : '';
      return {
        type: 'Bath',
        details: `${time}${notes}`
      };
    }
    
    // Type guard for PumpLogResponse
    const isPumpLog = (activity: ActivityType): activity is PumpLogResponse => {
      return 'leftAmount' in activity || 'rightAmount' in activity;
    };
    
    if (isPumpLog(activity)) {
      let durationMinutes = 0;
      if (activity.duration) {
        durationMinutes = activity.duration;
      } else if (activity.startTime && activity.endTime) {
        const start = new Date(activity.startTime).getTime();
        const end = new Date(activity.endTime).getTime();
        durationMinutes = Math.floor((end - start) / 60000);
      }

      const endTimeLabel = activity.endTime
        ? formatTime(activity.endTime)
        : activity.startTime
        ? formatTime(activity.startTime)
        : '';
      const durationLabel = durationMinutes > 0
        ? formatDurationWithPreferences(durationMinutes * 60000, preferences, {
            style: 'auto',
            minuteLabel: t('min'),
          })
        : '';

      return {
        type: t('Pump'),
        details: [endTimeLabel, durationLabel].filter(Boolean).join(' • ')
      };
    }
    
    return {
      type: 'Activity',
      details: 'logged'
    };
  };
  
  return { getActivityDescription };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use useActivityDescription().getActivityDescription() instead
 */
export const getActivityDescription = (activity: ActivityType) => {
  // This is a placeholder that will show a warning in the console
  console.warn('getActivityDescription is deprecated. Use useActivityDescription().getActivityDescription() instead.');
  
  return {
    type: getActivityVariant(activity),
    details: 'Please update to use useActivityDescription hook'
  };
};
