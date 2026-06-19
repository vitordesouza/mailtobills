import { notFound } from "next/navigation";

import { getMonthInfo } from "@/lib/months";

export function getCollectionMonthRoute(month: string) {
  const monthInfo = getMonthInfo(month);

  if (monthInfo.value !== month) {
    notFound();
  }

  return monthInfo;
}
