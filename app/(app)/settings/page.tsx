import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { SettingsForm } from "@/components/settings/settings-form";
import packageJson from "../../../package.json";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const projects = await listProjectsForUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Settings</h1>
      <SettingsForm
        projects={projects}
        version={packageJson.version}
        initialSettings={{
          name: user.name ?? "",
          theme: user.theme,
          defaultPriority: user.defaultPriority,
          defaultView: user.defaultView,
          accentColor: user.accentColor,
          defaultProjectId: user.defaultProjectId,
          dateFormat: user.dateFormat,
          weekStartsOn: user.weekStartsOn === 0 ? 0 : 1,
        }}
      />
    </div>
  );
}
