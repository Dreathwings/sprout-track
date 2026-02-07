'use client';

import React, { useMemo } from 'react';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import { formatTime, parseTimeInput, TimeFormat } from '@/src/lib/date-time';
import { useLocalization } from '@/src/context/localization';

interface TimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
  ariaLabel: string;
  format: TimeFormat;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  format,
  className,
}: TimePickerProps) {
  const { language } = useLocalization();

  const timeValue = useMemo(() => {
    if (!value || Number.isNaN(value.getTime())) return '';
    const hours = value.getHours().toString().padStart(2, '0');
    const minutes = value.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [value]);

  const formattedPreview = useMemo(() => {
    if (!value || Number.isNaN(value.getTime())) return '';
    return formatTime(value, { timeFormat: format }, { language });
  }, [format, language, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTimeInput(event.target.value, { timeFormat: format }, { language });
    if (!parsed) return;

    const nextDate = value ? new Date(value) : new Date();
    nextDate.setHours(parsed.hours, parsed.minutes, 0, 0);
    onChange(nextDate);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        type="time"
        value={timeValue}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-full"
      />
      {format === '12h' && formattedPreview ? (
        <span className="text-sm text-muted-foreground min-w-fit" aria-hidden="true">
          {formattedPreview}
        </span>
      ) : null}
    </div>
  );
}

export default TimePicker;
