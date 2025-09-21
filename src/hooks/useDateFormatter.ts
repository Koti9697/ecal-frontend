// In src/hooks/useDateFormatter.ts

import { useAppSelector } from '../store/hooks';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';
import { type RootState } from '../store/store';

export function useDateFormatter() {
  const settings = useAppSelector((state: RootState) => state.auth.settings);

  const formatDate = (dateString: string): string => {
    if (!settings) {
      // Fallback for when settings are not yet loaded
      return new Date(dateString).toLocaleString();
    }
    
    return formatDateUtil(dateString, {
      timeZone: settings.time_zone,
      dateFormat: settings.date_format,
      timeFormat: settings.time_format,
    });
  };

  return formatDate;
}