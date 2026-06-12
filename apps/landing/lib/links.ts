const dashboardBaseUrl =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000/signin";

export const signInUrl = dashboardBaseUrl;
export const signUpUrl = `${dashboardBaseUrl}${
  dashboardBaseUrl.includes("?") ? "&" : "?"
}mode=signup`;
