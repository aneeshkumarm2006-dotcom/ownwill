import { loadSettings } from "@/lib/admin/settings";

/**
 * Returns true when ops has flipped the `maintenance_mode` switch in
 * `app_settings`. Layouts call this to gate customer + Pro authed surfaces;
 * the login/marketing entry points stay open so status messaging is visible.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const s = await loadSettings();
    return s.maintenance_mode === true;
  } catch {
    // Never let a settings-table outage take down the whole site — fail open.
    return false;
  }
}
