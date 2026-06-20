"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mailtobills/ui/components/breadcrumb";

export function BreadcrumbComponent() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const pathnames = pathname.split("/").filter(Boolean);
  const breadcrumb = pathnames.map((name, index) => {
    const href = `/${pathnames.slice(0, index + 1).join("/")}`;
    const label =
      name === "reports"
        ? t("reports")
        : name === "settings"
          ? t("settings")
          : name.charAt(0).toUpperCase() + name.slice(1);
    return {
      href,
      label,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>{t("dashboard")}</BreadcrumbPage>
        </BreadcrumbItem>
        {breadcrumb.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {breadcrumb.map((item) => (
          <BreadcrumbItemComponent
            key={item.href}
            href={item.href}
            label={item.label}
          />
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const BreadcrumbItemComponent = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => {
  return (
    <BreadcrumbItem className="hidden md:block">
      <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
    </BreadcrumbItem>
  );
};
