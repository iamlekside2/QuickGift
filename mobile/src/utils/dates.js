// Calendar-day helpers. A "day" here is a plain YYYY-MM-DD with no time or
// time zone attached (a delivery day, a birthday), so it is never run through
// `new Date(string)`, which would shift it by the phone's UTC offset.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Longest each month can be (29 Feb is a real birthday).
export const MONTH_MAX = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const pad = (n) => String(n).padStart(2, '0');

/** A local Date as YYYY-MM-DD. */
export const toDay = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** [year, month, day] from YYYY-MM-DD (or an ISO timestamp), else null. */
const parts = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** "Fri, 14 Nov 2026" (or "Fri, 14 Nov" without the year). '' if not a day. */
export const formatDay = (value, { year = true } = {}) => {
  const p = parts(value);
  if (!p) return '';
  const [y, m, d] = p;
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${weekday}, ${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ''}`;
};

/** The next `count` days starting tomorrow, for a "pick a day" strip. */
export const upcomingDays = (count) => {
  const today = new Date();
  const out = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    out.push({
      value: toDay(d),
      top: i === 1 ? 'Tomorrow' : WEEKDAYS[d.getDay()],
      bottom: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
    });
  }
  return out;
};
