import { differenceInDays, parseISO, isValid } from 'date-fns';

/**
 * Returns days until expiry. Negative = already expired.
 */
export function getDaysUntilExpiry(expiryDate) {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  if (!isValid(expiry)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

/**
 * Returns freshness percent 0-100 based on addedOn and expiryDate.
 */
export function getFreshnessPercent(addedOn, expiryDate) {
  const added = typeof addedOn === 'string' ? parseISO(addedOn) : addedOn;
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  if (!isValid(added) || !isValid(expiry)) return 0;
  const totalDays = differenceInDays(expiry, added);
  const daysLeft = getDaysUntilExpiry(expiryDate);
  if (totalDays <= 0) return 0;
  const percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  return Math.round(percent);
}

/**
 * Returns a freshness label and color based on daysLeft.
 */
export function getFreshnessInfo(addedOn, expiryDate) {
  const daysLeft = getDaysUntilExpiry(expiryDate);
  const percent = getFreshnessPercent(addedOn, expiryDate);

  if (daysLeft < 0) {
    return { label: 'EXPIRED', color: '#F44336', barColor: '#F44336', percent: 0 };
  }
  if (daysLeft === 0) {
    return { label: 'EXPIRES TODAY', color: '#F44336', barColor: '#F44336', percent: Math.max(percent, 5) };
  }
  if (daysLeft === 1) {
    return { label: 'EXPIRES TOMORROW', color: '#FF6B35', barColor: '#FF6B35', percent };
  }
  if (daysLeft <= 3) {
    return { label: `EXPIRES IN ${daysLeft} DAYS`, color: '#FF6B35', barColor: '#FF6B35', percent };
  }
  if (percent >= 60) {
    return { label: percent >= 80 ? 'PERFECT' : 'FRESH', color: '#4CAF50', barColor: '#4CAF50', percent };
  }
  return { label: `EXPIRES IN ${daysLeft} DAYS`, color: '#FF6B35', barColor: '#FF9800', percent };
}

/**
 * Adds N days to today and returns ISO date string.
 */
export function addDaysToToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display: "Oct 24, 2023"
 */
export function formatDateDisplay(isoDate) {
  if (!isoDate) return '';
  const date = typeof isoDate === 'string' ? parseISO(isoDate) : isoDate;
  if (!isValid(date)) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Today as ISO date string (YYYY-MM-DD)
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
