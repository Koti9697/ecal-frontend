// In src/utils/dateFormatter.ts

import { formatInTimeZone } from 'date-fns-tz';

interface FormatDateOptions {
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
}

const formatMap: { [key: string]: string } = {
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'DD-MMM-YYYY': 'dd-MMM-yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  '24_HOUR': 'HH:mm:ss',
  '12_HOUR': 'hh:mm:ss a',
};

export function formatDate(dateString: string, options: FormatDateOptions): string {
  if (!dateString) return '';
  
  const { timeZone, dateFormat, timeFormat } = options;
  const formatString = `${formatMap[dateFormat]} ${formatMap[timeFormat]}`;

  try {
    const date = new Date(dateString);
    return formatInTimeZone(date, timeZone, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}