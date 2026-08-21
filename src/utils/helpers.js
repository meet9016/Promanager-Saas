export const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatToDDMMYYYY = (date) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const convertToTimeObject = (dateTimeStr) => {
  if (!dateTimeStr) return { hours: "", minutes: "", period: "AM" };
  const match = dateTimeStr.match(/^(\d{2}-\d{2}-\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hours: "", minutes: "", period: "AM" };
  const hours = match[2].padStart(2, '0');
  const minutes = match[3].padStart(2, '0');
  const period = match[4].toUpperCase();
  return { hours, minutes, period };
};

export const timeToMinutes = (timeObj, dateObj) => {
  if (!timeObj.hours || !timeObj.minutes || !dateObj) return null;
  let hours = parseInt(timeObj.hours, 10);
  const minutes = parseInt(timeObj.minutes, 10);
  if (timeObj.period === "PM" && hours !== 12) hours += 12;
  if (timeObj.period === "AM" && hours === 12) hours = 0;
  const date = new Date(dateObj);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

export const formatDisplayTime = (timeObj) => {
  if (!timeObj.hours || !timeObj.minutes) return "--:-- --";
  return `${timeObj.hours}:${timeObj.minutes} ${timeObj.period}`;
};

export const formatDateTimeForAPI = (dateObj, timeObj) => {
  if (!dateObj || !timeObj.hours || !timeObj.minutes) return "";
  const dateStr = formatToDDMMYYYY(dateObj);
  return `${dateStr} ${timeObj.hours}:${timeObj.minutes} ${timeObj.period}`;
};

export const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const localDateFromYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const getDaysInMonth = (yyyyMm) => {
    if (!yyyyMm) return 31;
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m, 0).getDate();
};

export const getDayOfWeek = (yyyyMm, day) => {
    if (!yyyyMm) return -1;
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m - 1, day).getDay();
};

export const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const normalizeCode = (rawShort, rawStatus, isLate) => {
    const s = (rawShort || '').toString().trim().toUpperCase();
    if (s === 'P') return 'P'; if (s === 'A') return 'A';
    if (s === 'WO') return 'WO'; if (s === 'H') return 'H';
    if (s === 'L') return 'L';
    if (s === '½P' || s === '1/2P' || s === 'HP') return '½P';
    if (s === 'INC' || s === 'INCOMPLETE') return 'INC';
    if (s === 'OT') return 'OT';
    const st = (rawStatus || '').toLowerCase();
    if (st.includes('incomplete')) return 'INC';
    if (st.includes('week') && st.includes('off')) return 'WO';
    if (st.includes('half') && st.includes('present')) return '½P';
    if (st === 'late' || isLate) return 'L';
    if (st.includes('present')) return 'P';
    if (st.includes('absent')) return 'A';
    if (st.includes('holiday')) return 'H';
    return '';
};

export const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'done') {
        return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower === 'pending' || statusLower === 'scheduled') {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (statusLower === 'cancelled' || statusLower === 'failed') {
        return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const formatToDDMMYYYYSlash = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

export const apiDateToFormattedSlash = (raw) => {
    if (!raw) return null;
    const parts = raw.split('-');
    if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    }
    return null;
};

export const MONTH_NAMES_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const DAY_NAMES_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Force reload

export const getCalendarDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
};

