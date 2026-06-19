export type MonthInfo = {
  value: string;
  label: string;
  start: Date;
  end: Date;
  previous: string;
  next: string;
};

// Validates YYYY-MM format where month is 01-12
const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

const toMonthValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const shiftMonth = (value: string, delta: number) => {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(year, month - 1 + delta, 1);
  return toMonthValue(date);
};

const buildMonthRange = (value: string) => {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getMonthInfo = (monthParam?: string): MonthInfo => {
  const fallback = toMonthValue(new Date());
  const value =
    monthParam && MONTH_FORMAT.test(monthParam) ? monthParam : fallback;
  const { start, end } = buildMonthRange(value);

  return {
    value,
    label: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
    start,
    end,
    previous: shiftMonth(value, -1),
    next: shiftMonth(value, 1),
  };
};

export const isInMonthRange = (timestamp: number, month: MonthInfo) => {
  return timestamp >= month.start.getTime() && timestamp <= month.end.getTime();
};

export const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Splits a "YYYY-MM" value into its numeric year and 1-12 month.
export const monthValueParts = (value: string) => {
  const [yearText, monthText] = value.split("-");
  return { year: Number(yearText), month: Number(monthText) };
};

export const buildMonthValue = (year: number, month: number) =>
  toMonthValue(new Date(year, month - 1, 1));

export const getCurrentMonthValue = () => toMonthValue(new Date());
