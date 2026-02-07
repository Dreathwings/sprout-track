'use client';

import React, { useState, useEffect } from 'react';
import './date-time-picker.css';
import { Calendar } from '@/src/components/ui/calendar';
import { TimeEntry } from '@/src/components/ui/time-entry';
import { cn } from '@/src/lib/utils';
import { isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import { useTimezone } from '@/app/context/timezone';
import { useLocalization } from '@/src/context/localization';
import { TimeFormat } from '@/src/lib/date-time';

// Import types and styles
import { DateTimePickerProps } from './date-time-picker.types';
import {
  dateTimePickerContainerStyles,
  dateTimePickerButtonStyles,
  dateTimePickerPopoverContentStyles,
  dateTimePickerCalendarContainerStyles,
} from './date-time-picker.styles';

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
}: DateTimePickerProps) {
  const { formatDateOnly } = useTimezone();
  const { t } = useLocalization();
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
  
  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return t('Select date');
    return formatDateOnly(date.toISOString()) || t('Select date');
  };

  const timeFormatPreference = (typeof window !== 'undefined' && localStorage.getItem('timeFormat') === '12h')
    ? '12h'
    : '24h';
  
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
      
      <TimeEntry
        value={date}
        onChange={handleTimeChange}
        disabled={disabled}
        className="w-full"
        format={timeFormatPreference as TimeFormat}
        ariaLabel={t('Select time')}
      />
    </div>
  );
}

export default DateTimePicker;
