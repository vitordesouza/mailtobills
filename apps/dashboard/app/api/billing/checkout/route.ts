import { readCurrentCustomer } from "@/features/customer/read-model/getCurrentCustomer";
import { createProCheckout } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const session = await readCurrentCustomer();
  const customer = session?.customer;

  if (!customer?.email) {
    return Response.redirect(new URL("/signin", request.url), 303);
  }

  const checkoutUrl = await createProCheckout({
    origin: new URL(request.url).origin,
    userId: customer.id,
    email: customer.email,
    name: customer.name,
  });

  return Response.redirect(checkoutUrl, 303);
}
