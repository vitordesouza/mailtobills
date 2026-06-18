import "server-only";

const lemonSqueezyApiBase = "https://api.lemonsqueezy.com/v1";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getLemonSqueezyApiKey() {
  return requiredEnv("LEMONSQUEEZY_API_KEY");
}

export function getLemonSqueezyConfig() {
  return {
    storeId: requiredEnv("LEMONSQUEEZY_STORE_ID"),
    proVariantId: requiredEnv("LEMONSQUEEZY_PRO_VARIANT_ID"),
    proPriceLabel: process.env.LEMONSQUEEZY_PRO_PRICE_LABEL ?? "Pro",
  };
}

async function lemonSqueezyFetch(path: string, init: RequestInit) {
  const response = await fetch(`${lemonSqueezyApiBase}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
      authorization: `Bearer ${getLemonSqueezyApiKey()}`,
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    console.error("Lemon Squeezy API request failed", {
      path,
      status: response.status,
      body,
    });
    throw new Error("LEMONSQUEEZY_API_ERROR");
  }

  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getCheckoutUrl(response: unknown) {
  if (!isRecord(response)) return null;
  if (!isRecord(response.data)) return null;
  if (!isRecord(response.data.attributes)) return null;
  const url = response.data.attributes.url;
  return typeof url === "string" ? url : null;
}

function getCustomerPortalUrl(response: unknown) {
  if (!isRecord(response)) return null;
  if (!isRecord(response.data)) return null;
  if (!isRecord(response.data.attributes)) return null;
  const urls = response.data.attributes.urls;
  if (!isRecord(urls)) return null;
  const customerPortal = urls.customer_portal;
  return typeof customerPortal === "string" ? customerPortal : null;
}

export async function createProCheckout({
  origin,
  userId,
  email,
  name,
}: {
  origin: string;
  userId: string;
  email: string;
  name?: string;
}) {
  const { storeId, proVariantId } = getLemonSqueezyConfig();
  const response = await lemonSqueezyFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: `${origin}/settings?upgraded=1`,
            enabled_variants: [Number(proVariantId)],
          },
          checkout_data: {
            email,
            name,
            custom: {
              user_id: userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: proVariantId,
            },
          },
        },
      },
    }),
  });
  const checkoutUrl = getCheckoutUrl(response);

  if (!checkoutUrl) {
    throw new Error("LEMONSQUEEZY_CHECKOUT_URL_MISSING");
  }

  return checkoutUrl;
}

export async function getCustomerPortalUrlForSubscription(
  lemonSqueezySubscriptionId: string
) {
  const response = await lemonSqueezyFetch(
    `/subscriptions/${encodeURIComponent(lemonSqueezySubscriptionId)}`,
    { method: "GET" }
  );
  const portalUrl = getCustomerPortalUrl(response);

  if (!portalUrl) {
    throw new Error("LEMONSQUEEZY_CUSTOMER_PORTAL_URL_MISSING");
  }

  return portalUrl;
}
