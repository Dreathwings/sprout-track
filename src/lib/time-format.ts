import type { Settings } from '@prisma/client';

export type TimeFormatPreference = '24h' | '12h';

const DEFAULT_TIME_FORMAT: TimeFormatPreference = '24h';
const DEFAULT_LOCALE = 'en-US';

export const getTimeFormatPreference = (settings?: Pick<Settings, 'timeFormat'> | null): TimeFormatPreference => {
  if (settings?.timeFormat === '12h' || settings?.timeFormat === '24h') {
    return settings.timeFormat;
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('timeFormat');
    if (stored === '12h' || stored === '24h') {
      return stored;
    }
  }

  return DEFAULT_TIME_FORMAT;
};

export const getLocalePreference = (language?: string | null): string => {
  if (language) return language;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || navigator.language || DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
};

export const getTimeInputLocale = (timeFormat: TimeFormatPreference, locale: string): string => {
  const hourCycle = timeFormat === '24h' ? 'h23' : 'h12';
  return `${locale}-u-hc-${hourCycle}`;
};

const getDateObject = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const formatTimeInputValue = (value: Date | null | undefined): string => {
  if (!value) return '';
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const applyTimeInputToDate = (baseDate: Date, timeValue: string): Date => {
  const [hourStr, minuteStr] = timeValue.split(':');
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  const updated = new Date(baseDate);
  if (!Number.isNaN(hours)) updated.setHours(hours);
  if (!Number.isNaN(minutes)) updated.setMinutes(minutes);
  updated.setSeconds(0);
  updated.setMilliseconds(0);
  return updated;
};

const getDefaultTimeOptions = (timeFormat: TimeFormatPreference, includeSeconds = false): Intl.DateTimeFormatOptions => ({
  hour: 'numeric',
  minute: '2-digit',
  second: includeSeconds ? '2-digit' : undefined,
  hour12: timeFormat === '12h',
});

export const formatTimeValue = (
  value: Date | string | null | undefined,
  options?: {
    locale?: string;
    timeZone?: string;
    timeFormat?: TimeFormatPreference;
    includeSeconds?: boolean;
  }
): string => {
  const date = getDateObject(value);
  if (!date) return '';

  const locale = options?.locale || getLocalePreference();
  const timeFormat = options?.timeFormat || getTimeFormatPreference();

  const formatter = new Intl.DateTimeFormat(locale, {
    ...getDefaultTimeOptions(timeFormat, options?.includeSeconds),
    timeZone: options?.timeZone,
  });

  return formatter.format(date);
};

export const formatDateValue = (
  value: Date | string | null | undefined,
  options?: {
    locale?: string;
    timeZone?: string;
    formatOptions?: Intl.DateTimeFormatOptions;
  }
): string => {
  const date = getDateObject(value);
  if (!date) return '';

  const locale = options?.locale || getLocalePreference();

  const formatter = new Intl.DateTimeFormat(locale, {
    ...(options?.formatOptions || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    timeZone: options?.timeZone,
  });

  return formatter.format(date);
};

export const formatDateTimeValue = (
  value: Date | string | null | undefined,
  options?: {
    locale?: string;
    timeZone?: string;
    timeFormat?: TimeFormatPreference;
  }
): string => {
  const date = getDateObject(value);
  if (!date) return '';

  const locale = options?.locale || getLocalePreference();
  const timeFormat = options?.timeFormat || getTimeFormatPreference();

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...getDefaultTimeOptions(timeFormat),
    timeZone: options?.timeZone,
  });

  return formatter.format(date);
};

const isSameCalendarDay = (
  target: Date,
  comparison: Date,
  locale: string,
  timeZone?: string
): boolean => {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone,
  });

  return formatter.format(target) === formatter.format(comparison);
};

export const formatDateTimeWithRelativeLabel = (
  value: Date | string | null | undefined,
  options: {
    locale?: string;
    timeZone?: string;
    timeFormat?: TimeFormatPreference;
    includeDate?: boolean;
    t: (key: string) => string;
  }
): string => {
  const date = getDateObject(value);
  if (!date) return options.t('datetime.invalid');

  const locale = options.locale || getLocalePreference();
  const timeFormat = options.timeFormat || getTimeFormatPreference();

  const timeStr = formatTimeValue(date, { locale, timeZone: options.timeZone, timeFormat });
  if (options.includeDate === false) return timeStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let dateLabel: string;
  if (isSameCalendarDay(date, today, locale, options.timeZone)) {
    dateLabel = options.t('datetime.today');
  } else if (isSameCalendarDay(date, yesterday, locale, options.timeZone)) {
    dateLabel = options.t('datetime.yesterday');
  } else {
    dateLabel = formatDateValue(date, {
      locale,
      timeZone: options.timeZone,
      formatOptions: { month: 'short', day: 'numeric' },
    });
  }

  return `${dateLabel} ${timeStr}`;
};

export const formatDurationMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.abs(minutes % 60);
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
};

export const formatDurationSeconds = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};
