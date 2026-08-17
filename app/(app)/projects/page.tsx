import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser, listArchivedProjectsForUser } from "@/lib/projects";
import { ProjectsTabs } from "@/components/project/projects-tabs";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const [projects, archivedProjects] = await Promise.all([
    listProjectsForUser(user.id),
    listArchivedProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Projects</h1>
      <ProjectsTabs activeProjects={projects} archivedProjects={archivedProjects} />
    </div>
  );
}
