type ForwardingAddressCustomer = {
  email?: string;
  isPro?: boolean;
  forwardingEmails?: string[];
};

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function isPlausibleEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizedForwardingEmails(customer: ForwardingAddressCustomer) {
  return (customer.forwardingEmails ?? [])
    .map((email) => normalizeEmailAddress(email))
    .filter(Boolean);
}

export function addForwardingAddress(
  customer: ForwardingAddressCustomer | null,
  inputEmail: string,
) {
  const email = normalizeEmailAddress(inputEmail);

  if (!isPlausibleEmailAddress(email)) {
    throw new Error("INVALID_FORWARDING_EMAIL");
  }

  if (customer?.email && normalizeEmailAddress(customer.email) === email) {
    throw new Error("FORWARDING_EMAIL_IS_PRIMARY");
  }

  const forwardingEmails = normalizedForwardingEmails(customer ?? {});

  if (forwardingEmails.includes(email)) {
    return forwardingEmails;
  }

  return [...forwardingEmails, email];
}

export function removeForwardingAddress(
  customer: ForwardingAddressCustomer | null,
  inputEmail: string,
) {
  const email = normalizeEmailAddress(inputEmail);

  return normalizedForwardingEmails(customer ?? {}).filter(
    (forwardingEmail) => forwardingEmail !== email,
  );
}

export function matchesPrimaryForwardingAddress(
  customer: ForwardingAddressCustomer,
  inputEmail: string,
) {
  return (
    !!customer.email &&
    normalizeEmailAddress(customer.email) === normalizeEmailAddress(inputEmail)
  );
}

export function matchesAdditionalForwardingAddress(
  customer: ForwardingAddressCustomer,
  inputEmail: string,
) {
  if (!customer.isPro) {
    return false;
  }

  const email = normalizeEmailAddress(inputEmail);

  // MVP behavior: configured Additional Forwarding Addresses are trusted for
  // ingest while the future verification flow remains out of scope.
  return normalizedForwardingEmails(customer).includes(email);
}

export function findCustomerByForwardingAddress<
  T extends ForwardingAddressCustomer,
>(customers: T[], inputEmail: string) {
  const byPrimary = customers.find((customer) =>
    matchesPrimaryForwardingAddress(customer, inputEmail),
  );

  if (byPrimary) {
    return byPrimary;
  }

  return (
    customers.find((customer) =>
      matchesAdditionalForwardingAddress(customer, inputEmail),
    ) ?? null
  );
}
