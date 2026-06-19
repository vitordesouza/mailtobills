type AccountantDeliverySettings = {
  accountantEmail?: string;
  accountantName?: string;
  exportScheduleDay?: number;
};

export function normalizedOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateAccountantEmail(accountantEmail: string | undefined) {
  if (accountantEmail && !isPlausibleEmail(accountantEmail)) {
    throw new Error("INVALID_ACCOUNTANT_EMAIL");
  }
}

function validateExportScheduleDay(exportScheduleDay: number | undefined) {
  if (exportScheduleDay === undefined) {
    return;
  }

  if (
    !Number.isInteger(exportScheduleDay) ||
    exportScheduleDay < 1 ||
    exportScheduleDay > 28
  ) {
    throw new Error("EXPORT_SCHEDULE_DAY_OUT_OF_RANGE");
  }
}

export function buildAccountantAddressPatch(
  {
    accountantEmail,
    accountantName,
  }: Pick<AccountantDeliverySettings, "accountantEmail" | "accountantName">,
  current?: Pick<AccountantDeliverySettings, "exportScheduleDay"> | null,
) {
  const normalizedEmail = normalizedOptionalString(accountantEmail);
  const normalizedName = normalizedOptionalString(accountantName);

  validateAccountantEmail(normalizedEmail);

  if (current?.exportScheduleDay !== undefined && !normalizedEmail) {
    throw new Error("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");
  }

  return {
    accountantEmail: normalizedEmail,
    accountantName: normalizedName,
  };
}

export function buildExportSchedulePatch(
  current: Pick<AccountantDeliverySettings, "accountantEmail"> | null,
  { exportScheduleDay }: Pick<AccountantDeliverySettings, "exportScheduleDay">,
) {
  validateExportScheduleDay(exportScheduleDay);

  if (exportScheduleDay !== undefined && !current?.accountantEmail) {
    throw new Error("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");
  }

  return { exportScheduleDay };
}

export function buildAccountantDeliverySettingsPatch({
  accountantEmail,
  accountantName,
  exportScheduleDay,
}: AccountantDeliverySettings) {
  const addressPatch = buildAccountantAddressPatch({
    accountantEmail,
    accountantName,
  });

  validateExportScheduleDay(exportScheduleDay);

  if (exportScheduleDay !== undefined && !addressPatch.accountantEmail) {
    throw new Error("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");
  }

  return {
    ...addressPatch,
    exportScheduleDay,
  };
}
