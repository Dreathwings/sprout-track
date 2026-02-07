'use client';

import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TimeEntryProps } from './time-entry.types';
import { useLocalization } from '@/src/context/localization';
import { formatTime, parseTimeInput } from '@/src/lib/date-time';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

import './time-entry.css';

const TIME_STEP_MINUTES = 5;

const toTimeValue = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export function TimeEntry({
  value,
  onChange,
  className,
  disabled = false,
  minTime,
  maxTime,
  format = '24h',
  ariaLabel,
}: TimeEntryProps) {
  const { t, language } = useLocalization();

  const options = useMemo(() => {
    const generated: { value: string; label: string }[] = [];

    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += TIME_STEP_MINUTES) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);

        const optionValue = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        const optionLabel = formatTime(date, { timeFormat: format }, { language });

        generated.push({ value: optionValue, label: optionLabel || optionValue });
      }
    }

    return generated;
  }, [format, language]);

  const selectedValue = toTimeValue(value);

  const handleChange = (nextValue: string) => {
    const parsed = parseTimeInput(nextValue, { timeFormat: '24h' });
    if (!parsed) return;

    const baseDate = value && !Number.isNaN(value.getTime()) ? new Date(value) : new Date();
    baseDate.setHours(parsed.hours, parsed.minutes, 0, 0);

    if (minTime && baseDate < minTime) return;
    if (maxTime && baseDate > maxTime) return;

    onChange(baseDate);
  };

  return (
    <div className={cn('time-entry-container', className)}>
      <Select disabled={disabled} value={selectedValue} onValueChange={handleChange}>
        <SelectTrigger
          className="time-entry-trigger w-full"
          aria-label={ariaLabel || t('Select time')}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <SelectValue placeholder={t('Select time')} />
          </div>
        </SelectTrigger>
        <SelectContent className="time-entry-content max-h-64">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="time-entry-item">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default TimeEntry;
