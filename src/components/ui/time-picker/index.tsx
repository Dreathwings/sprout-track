'use client';

import React from 'react';
import { Input } from '@/src/components/ui/input';
import { useLocalization } from '@/src/context/localization';
import { getLocalePreference, getTimeFormatPreference, getTimeInputLocale, TimeFormatPreference } from '@/src/lib/time-format';

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  timeFormat?: TimeFormatPreference;
  id?: string;
  name?: string;
  required?: boolean;
}

export default function TimePicker({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className,
  timeFormat,
  id,
  name,
  required,
}: TimePickerProps) {
  const { t, language } = useLocalization();
  const resolvedLocale = getLocalePreference(language);
  const resolvedTimeFormat = timeFormat || getTimeFormatPreference();
  const inputLocale = getTimeInputLocale(resolvedTimeFormat, resolvedLocale);

  return (
    <Input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      id={id}
      name={name}
      required={required}
      aria-label={ariaLabel || t('timePicker.ariaLabel')}
      className={className}
      lang={inputLocale}
      step={60}
    />
  );
}
