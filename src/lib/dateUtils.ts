const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns today's date in local calendar YYYY-MM-DD format
 * Avoiding UTC shifting
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a calendar YYYY-MM-DD date string into "dd MMM yyyy"
 * e.g., "2026-10-08" -> "08 Oct 2026"
 * Ensures NO timezone conversion occurs.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Direct split for YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    if (!isNaN(year) && monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      const dayPadded = String(day).padStart(2, '0');
      const monthName = MONTH_SHORT_NAMES[monthIndex];
      return `${dayPadded} ${monthName} ${year}`;
    }
  }

  // Fallback for non-standard formats
  const parsed = parseDateToYearMonthDay(dateStr);
  if (parsed) {
    const dayPadded = String(parsed.day).padStart(2, '0');
    const monthName = MONTH_SHORT_NAMES[parsed.month - 1];
    return `${dayPadded} ${monthName} ${parsed.year}`;
  }

  return dateStr;
}

/**
 * Formats year and month into "mmm-yyyy"
 * e.g., (2026, 10) -> "Oct-2026"
 */
export function formatMonthYearLabel(year: number, month: number): string {
  const monthName = MONTH_SHORT_NAMES[month - 1] || 'Jan';
  return `${monthName}-${year}`;
}

/**
 * Parses any date representation from budget table or inputs:
 * Handles:
 * - "2026-10-08"
 * - "1 Feb 2026", "15 Mar 2026", "20 May 2026"
 * - ISO string: "2026-02-01T00:00:00Z"
 */
export function parseDateToYearMonthDay(val: unknown): { year: number; month: number; day: number } | null {
  if (!val) return null;

  if (typeof val === 'string') {
    const trimmed = val.trim();

    // Check standard YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10),
        day: parseInt(isoMatch[3], 10),
      };
    }

    // Check format like "1 Feb 2026" or "15 Mar 2026" or "01-Feb-2026"
    const textMatch = trimmed.match(/^(\d{1,2})[\s\-_/]+([A-Za-z]+)[\s\-_/]+(\d{4})/);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthStr = textMatch[2].substring(0, 3).toLowerCase();
      const year = parseInt(textMatch[3], 10);

      const monthIndex = MONTH_SHORT_NAMES.findIndex(
        (m) => m.toLowerCase() === monthStr
      );
      if (monthIndex !== -1) {
        return {
          year,
          month: monthIndex + 1,
          day,
        };
      }
    }

    // Check format like "Feb 2026" or "February 2026"
    const monthYearMatch = trimmed.match(/^([A-Za-z]+)[\s\-_/]+(\d{4})/);
    if (monthYearMatch) {
      const monthStr = monthYearMatch[1].substring(0, 3).toLowerCase();
      const year = parseInt(monthYearMatch[2], 10);
      const monthIndex = MONTH_SHORT_NAMES.findIndex(
        (m) => m.toLowerCase() === monthStr
      );
      if (monthIndex !== -1) {
        return {
          year,
          month: monthIndex + 1,
          day: 1,
        };
      }
    }

    // General JS Date parse attempt
    const jsDate = new Date(trimmed);
    if (!isNaN(jsDate.getTime())) {
      return {
        year: jsDate.getFullYear(),
        month: jsDate.getMonth() + 1,
        day: jsDate.getDate(),
      };
    }
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    return {
      year: val.getFullYear(),
      month: val.getMonth() + 1,
      day: val.getDate(),
    };
  }

  return null;
}

/**
 * Returns date bounds [startDate, endDateExclusive] for a given "YYYY-MM"
 * e.g., "2026-03" -> ["2026-03-01", "2026-04-01"]
 */
export function getMonthDateRange(yearMonthKey: string): { start: string; endExclusive: string } {
  const [yearStr, monthStr] = yearMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const start = `${year}-${String(month).padStart(2, '0')}-01`;

  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  return { start, endExclusive };
}
