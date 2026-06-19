import {
  getCollectionMonthRange,
  isCollectionMonth,
  shiftCollectionMonth,
  toCollectionMonthValue,
} from "@mailtobills/domain";

export type MonthInfo = {
  value: string;
  label: string;
  start: Date;
  end: Date;
  previous: string;
  next: string;
};

export const getMonthInfo = (monthParam?: string): MonthInfo => {
  const fallback = toCollectionMonthValue(new Date());
  const value = monthParam && isCollectionMonth(monthParam) ? monthParam : fallback;
  const { startMs, endExclusiveMs } = getCollectionMonthRange(value);
  const start = new Date(startMs);

  return {
    value,
    label: start.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }),
    start,
    end: new Date(endExclusiveMs - 1),
    previous: shiftCollectionMonth(value, -1),
    next: shiftCollectionMonth(value, 1),
  };
};
