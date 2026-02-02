'use client';

import React, { useState, useEffect, useRef } from 'react';
import './date-time-picker.css';
import { Calendar } from '@/src/components/ui/calendar';
import TimePicker from '@/src/components/ui/time-picker';
import { cn } from '@/src/lib/utils';
import { isValid } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';

// Import types and styles
import { DateTimePickerProps } from './date-time-picker.types';
import {
  dateTimePickerContainerStyles,
  dateTimePickerButtonStyles,
  dateTimePickerPopoverContentStyles,
  dateTimePickerCalendarContainerStyles,
  dateTimePickerTimeContainerStyles,
  dateTimePickerFooterStyles, // Keep footer style for potential future use or spacing
} from './date-time-picker.styles';
import { useLocalization } from '@/src/context/localization';
import { applyTimeInputToDate, formatDateValue, formatTimeInputValue, formatTimeValue, getLocalePreference, getTimeFormatPreference, TimeFormatPreference } from '@/src/lib/time-format';

/**
 * DateTimePicker Component
 * 
 * A component that combines the Calendar for date selection and TimeEntry for time selection,
 * using two separate buttons with popovers.
 * 
 * Features:
 * - Two buttons for date and time selection
 * - Calendar component for date selection in a popover
 * - TimeEntry component for time selection in a popover with a done button
 * - Fixed dimensions for both popovers (360px height, 350px width)
 * - Bottom-aware positioning with margin
 */
export function DateTimePicker({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = "Select date and time...",
  timeFormat,
}: DateTimePickerProps) {
  const { t, language } = useLocalization();
  const resolvedLocale = getLocalePreference(language);
  const resolvedTimeFormat: TimeFormatPreference = timeFormat || getTimeFormatPreference();

  // Allow for null date value
  const [date, setDate] = useState<Date | null>(() => {
    // Check if value is a valid Date
    if (value instanceof Date && isValid(value)) {
      return value;
    }
    // Return null if value is null
    if (value === null) {
      return null;
    }
    // Fallback to current date for invalid dates
    return new Date();
  });
  
  // State for popovers
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  
  // Update the date when the value prop changes
  useEffect(() => {
    if (value === null) {
      setDate(null);
    } else if (value instanceof Date && isValid(value)) {
      setDate(value);
    }
  }, [value]);
  
  // Handle date selection from Calendar
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    // Create a new date with the selected date but keep the time from the current value if it exists
    const updatedDate = new Date(newDate);
    
    if (date) {
      updatedDate.setHours(date.getHours());
      updatedDate.setMinutes(date.getMinutes());
    } else {
      // Default to midnight if no previous time
      updatedDate.setHours(0);
      updatedDate.setMinutes(0);
    }
    updatedDate.setSeconds(0);
    updatedDate.setMilliseconds(0);
    
    setDate(updatedDate);
    onChange(updatedDate);
    
    // Close the date popover when a date is selected
    setDateOpen(false);
  };
  
  // Handle time change from TimeEntry
  const handleTimeChange = (newDate: Date) => {
    setDate(newDate);
    onChange(newDate);
  };
  
  // Format the date for display
  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return t('datetimePicker.datePlaceholder');
    return formatDateValue(date, {
      locale: resolvedLocale,
      formatOptions: { month: 'short', day: 'numeric', year: 'numeric' },
    });
  };
  
  // Format the time for display
  const formatTime = (date: Date | null): string => {
    if (!date || !isValid(date)) return t('datetimePicker.timePlaceholder');
    return formatTimeValue(date, { locale: resolvedLocale, timeFormat: resolvedTimeFormat });
  };
  
  // The time popover will now close when clicking outside, removing the need for a "Done" button.
  
  return (
    <div className={cn(dateTimePickerContainerStyles, "date-time-picker-container", className)}>
      {/* Date Button with Popover */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(dateTimePickerButtonStyles, "date-time-picker-button")}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4 date-time-picker-calendar-icon" />
            <span>{formatDate(date)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(dateTimePickerPopoverContentStyles, "date-time-picker-popover")}
          align="start"
          sideOffset={4}
        >
          <div className={dateTimePickerCalendarContainerStyles}>
            <Calendar
              selected={date}
              onSelect={handleDateSelect}
              isDateDisabled={disabled ? () => true : undefined}
              initialFocus
              variant="date-time-picker"
              className="mx-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Time Button with Popover */}
      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(dateTimePickerButtonStyles, "date-time-picker-button")}
            disabled={disabled}
          >
            <Clock className="h-4 w-4 date-time-picker-clock-icon" />
            <span>{formatTime(date)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(dateTimePickerPopoverContentStyles, "date-time-picker-popover")}
          align="start"
          sideOffset={4}
        >
          <div className={dateTimePickerTimeContainerStyles}>
            <TimePicker
              value={formatTimeInputValue(date)}
              onChange={(newValue) => {
                if (!newValue) return;
                const baseDate = date && isValid(date) ? date : new Date();
                const updated = applyTimeInputToDate(baseDate, newValue);
                handleTimeChange(updated);
              }}
              disabled={disabled}
              className="mx-auto w-full"
              timeFormat={resolvedTimeFormat}
              ariaLabel={t('datetimePicker.timeInputLabel')}
            />
          </div>
          {/* Removed Footer with done button */}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateTimePicker;
