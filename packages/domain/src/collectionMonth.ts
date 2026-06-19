export type CollectionMonthRange = {
  startMs: number;
  endExclusiveMs: number;
};

export const COLLECTION_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isCollectionMonth(value: string) {
  return COLLECTION_MONTH_PATTERN.test(value);
}

export function toCollectionMonthValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function shiftCollectionMonth(value: string, delta: number) {
  if (!isCollectionMonth(value)) {
    throw new Error("INVALID_COLLECTION_MONTH");
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));

  return toCollectionMonthValue(date);
}

export function getCollectionMonthRange(
  value: string,
): CollectionMonthRange {
  if (!isCollectionMonth(value)) {
    throw new Error("INVALID_COLLECTION_MONTH");
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const startMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const endExclusiveMs = Date.UTC(year, month, 1, 0, 0, 0, 0);

  return { startMs, endExclusiveMs };
}

export function isTimestampInCollectionMonth(
  timestamp: number,
  month: string,
) {
  const range = getCollectionMonthRange(month);
  return timestamp >= range.startMs && timestamp < range.endExclusiveMs;
}
