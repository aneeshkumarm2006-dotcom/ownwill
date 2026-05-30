import { createClient } from "@/lib/supabase/server";
import { getFirmStaffViewHistory, getManagedByOrg } from "@/lib/pro/customer";
import { AppPage } from "@/components/app/app-page";
import { ProfileForm, ProfileRail } from "@/components/profile/profile-form";
import { FirmAccessCard } from "@/components/profile/firm-access-card";

export const metadata = { title: "Your profile — OwnWill" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The (app) layout already redirects unauthenticated visitors, but guard
  // anyway so the type narrowing for `user!` below is honest.
  const managedBy = user ? await getManagedByOrg(user.id) : null;
  const events = user && managedBy ? await getFirmStaffViewHistory(user.id, 10) : [];

  return (
    <AppPage breadcrumb="Account" title="Your profile" rail={<ProfileRail />} narrow>
      <div className="stack g-4">
        {managedBy && (
          <FirmAccessCard
            orgName={managedBy.name}
            acceptedAt={managedBy.acceptedAt}
            events={events}
          />
        )}
        <ProfileForm />
      </div>
    </AppPage>
  );
}
