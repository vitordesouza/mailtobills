"use client";

import { usePathname } from "next/navigation";

export function MonthPageTitle() {
  const pathname = usePathname();
  const title = pathname.includes("/reports") ? "Reports" : "Dashboard";

  return <span className="text-sm font-medium">{title}</span>;
}
