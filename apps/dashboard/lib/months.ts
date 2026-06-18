import {
  getCollectionMonthRange,
  isCollectionMonth,
  shiftCollectionMonth,
  toCollectionMonthValue,
} from "@mailtobills/types";

export type MonthInfo = {
  value: string;
  label: string;
  start: Date;
  end: Date;
  previous: string;
  next: string;
};

const buildMonthRange = (value: string) => {
  const { startMs, endExclusiveMs } = getCollectionMonthRange(value);
  const start = new Date(startMs);
  const end = new Date(endExclusiveMs - 1);
  return { start, end };
};

export const getMonthInfo = (monthParam?: string): MonthInfo => {
  const fallback = toCollectionMonthValue(new Date());
  const value = monthParam && isCollectionMonth(monthParam) ? monthParam : fallback;
  const { start, end } = buildMonthRange(value);

  return {
    value,
    label: start.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }),
    start,
    end,
    previous: shiftCollectionMonth(value, -1),
    next: shiftCollectionMonth(value, 1),
  };
};

export const isInMonthRange = (timestamp: number, month: MonthInfo) => {
  return timestamp >= month.start.getTime() && timestamp <= month.end.getTime();
};
