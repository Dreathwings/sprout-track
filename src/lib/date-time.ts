export type TimeFormat = '24h' | '12h';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface DateTimePreferences {
  timeFormat?: TimeFormat;
  dateFormat?: DateFormat;
}

export interface DateTimeFormatOptions {
  locale?: string;
  timeZone?: string;
  language?: string;
}

export interface DurationFormatOptions {
  style?: 'auto' | 'clock' | 'long';
  minuteLabel?: string;
  hourLabel?: string;
  padHours?: boolean;
}

export const DEFAULT_TIME_FORMAT: TimeFormat = '24h';
export const DEFAULT_DATE_FORMAT: DateFormat = 'MM/DD/YYYY';

export const getDefaultDateFormat = (language?: string): DateFormat => {
  if (!language) return DEFAULT_DATE_FORMAT;
  return language.toLowerCase().startsWith('fr') ? 'DD/MM/YYYY' : DEFAULT_DATE_FORMAT;
};

export const getDateTimePreferences = (
  preferences?: DateTimePreferences | null,
  language?: string
): Required<DateTimePreferences> => ({
  timeFormat: preferences?.timeFormat ?? DEFAULT_TIME_FORMAT,
  dateFormat: preferences?.dateFormat ?? getDefaultDateFormat(language),
});

const toDate = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getDateParts = (date: Date, locale?: string, timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat(locale ?? 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  const parts = formatter.formatToParts(date);
  return {
    year: parts.find(part => part.type === 'year')?.value ?? '',
    month: parts.find(part => part.type === 'month')?.value ?? '',
    day: parts.find(part => part.type === 'day')?.value ?? '',
  };
};

export const formatTime = (
  input: string | Date | null | undefined,
  preferences?: DateTimePreferences | null,
  options?: DateTimeFormatOptions
): string => {
  const date = toDate(input);
  if (!date) return '';

  const { timeFormat } = getDateTimePreferences(preferences, options?.language);
  const formatter = new Intl.DateTimeFormat(options?.locale ?? 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
    timeZone: options?.timeZone,
  });

  return formatter.format(date);
};

export const formatDate = (
  input: string | Date | null | undefined,
  preferences?: DateTimePreferences | null,
  options?: DateTimeFormatOptions
): string => {
  const date = toDate(input);
  if (!date) return '';

  const { dateFormat } = getDateTimePreferences(preferences, options?.language);
  const { year, month, day } = getDateParts(date, options?.locale, options?.timeZone);

  if (dateFormat === 'YYYY-MM-DD') {
    return [year, month, day].join('-');
  }

  const ordered = dateFormat === 'DD/MM/YYYY' ? [day, month, year] : [month, day, year];
  return ordered.join('/');
};

export const formatDateTime = (
  input: string | Date | null | undefined,
  preferences?: DateTimePreferences | null,
  options?: DateTimeFormatOptions
): string => {
  const date = toDate(input);
  if (!date) return '';

  const datePart = formatDate(date, preferences, options);
  const timePart = formatTime(date, preferences, options);
  if (!datePart) return timePart;
  if (!timePart) return datePart;
  return `${datePart} ${timePart}`;
};

export const formatDuration = (
  durationMs: number,
  _preferences?: DateTimePreferences | null,
  options?: DurationFormatOptions
): string => {
  if (!Number.isFinite(durationMs)) return '';
  const totalMinutes = Math.floor(durationMs / 60000);
  if (totalMinutes < 0) return '';

  const style = options?.style ?? 'auto';
  const minutesLabel = options?.minuteLabel ?? '';
  const hoursLabel = options?.hourLabel ?? '';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = options?.padHours ? hours.toString().padStart(2, '0') : `${hours}`;
  const minuteText = minutes.toString().padStart(2, '0');

  if (style === 'clock') {
    return `${hourText}:${minuteText}`;
  }

  if (style === 'long') {
    if (hours > 0 && minutes > 0) {
      return `${hours}${hoursLabel} ${minutes}${minutesLabel}`.trim();
    }
    if (hours > 0) {
      return `${hours}${hoursLabel}`.trim();
    }
    return `${minutes}${minutesLabel}`.trim();
  }

  if (totalMinutes < 60) {
    return minutesLabel ? `${totalMinutes} ${minutesLabel}` : `${totalMinutes}`;
  }
  return `${hourText}:${minuteText}`;
};

export const parseDateInput = (
  value: string | null | undefined,
  preferences?: DateTimePreferences | null,
  options?: DateTimeFormatOptions
): Date | null => {
  if (!value) return null;
  const { dateFormat } = getDateTimePreferences(preferences, options?.language);

  const separator = dateFormat === 'YYYY-MM-DD' ? '-' : '/';
  const parts = value.split(separator).map(part => part.trim());
  if (parts.length !== 3) return null;

  let year: number;
  let month: number;
  let day: number;

  if (dateFormat === 'YYYY-MM-DD') {
    [year, month, day] = parts.map(Number);
  } else if (dateFormat === 'DD/MM/YYYY') {
    [day, month, year] = parts.map(Number);
  } else {
    [month, day, year] = parts.map(Number);
  }

  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return isNaN(parsed.getTime()) ? null : parsed;
};
