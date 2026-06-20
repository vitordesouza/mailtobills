import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutDashboard, Settings2 } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "@/messages/en/common.json";
import { SidebarProvider } from "@mailtobills/ui/components/sidebar";

import { NavMain } from "./nav-main";

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe("dashboard navigation accessibility", () => {
  it("exposes the active route and follows keyboard focus order", async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SidebarProvider>
          <NavMain
            items={[
              {
                title: "Dashboard",
                url: "/m/2026-06",
                icon: LayoutDashboard,
                isActive: true,
              },
              {
                title: "Settings",
                url: "/settings",
                icon: Settings2,
              },
            ]}
          />
        </SidebarProvider>
      </NextIntlClientProvider>,
    );

    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const settings = screen.getByRole("link", { name: "Settings" });

    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(settings).not.toHaveAttribute("aria-current");

    await user.tab();
    expect(dashboard).toHaveFocus();
    await user.tab();
    expect(settings).toHaveFocus();
  });
});
