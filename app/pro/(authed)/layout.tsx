import { requirePro } from "@/lib/pro/auth";
import { isMaintenanceMode } from "@/lib/admin/maintenance";
import { loadSettings } from "@/lib/admin/settings";
import { ProShell } from "@/components/pro/pro-shell";
import { MaintenanceScreen } from "@/components/app/maintenance-screen";

export default async function ProAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifies signed-in Pro membership; redirects to /pro/login otherwise.
  const user = await requirePro();

  // Maintenance gate (§7.5). /pro/login lives outside this (authed) group, so
  // staff can still reach the sign-in screen to see status messaging while the
  // rest of the Pro surface is blocked.
  if (await isMaintenanceMode()) {
    const { support_email } = await loadSettings();
    return <MaintenanceScreen variant="pro" supportEmail={support_email} />;
  }

  return <ProShell user={user}>{children}</ProShell>;
}
