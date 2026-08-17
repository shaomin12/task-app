import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { listTasksForUser } from "@/lib/tasks";
import { ProjectDescription } from "@/components/project/project-description";
import { ProjectActions } from "@/components/project/project-actions";
import { ProjectTitle } from "@/components/project/project-title";
import { ProjectTags } from "@/components/project/project-tags";
import { ProjectColor } from "@/components/project/project-color";
import { ProjectProgress } from "@/components/project/project-progress";
import { ProjectTaskViews } from "@/components/project/project-task-views";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: { projectTags: { include: { tag: true } } },
  });
  if (!project || project.userId !== user.id) {
    notFound();
  }

  const [tasks, kanbanTasks, projects] = await Promise.all([
    listTasksForUser(user.id, { projectId: id }),
    listTasksForUser(user.id, { projectId: id, sort: "manual" }),
    listProjectsForUser(user.id),
  ]);

  const completedTaskCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ProjectColor projectId={id} initialColor={project.color} />
          <ProjectTitle projectId={id} initialName={project.name} />
        </div>
        <ProjectActions projectId={id} projectName={project.name} />
      </div>
      <ProjectDescription projectId={id} initialDescription={project.description} />
      <ProjectTags projectId={id} initialTags={project.projectTags.map((pt) => pt.tag)} />
      <ProjectProgress completedTaskCount={completedTaskCount} taskCount={tasks.length} />
      <Suspense>
        <ProjectTaskViews
          projectId={id}
          tasks={tasks}
          kanbanTasks={kanbanTasks}
          projects={projects}
          defaultPriority={user.defaultPriority}
        />
      </Suspense>
    </div>
  );
}
