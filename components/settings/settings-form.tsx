"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ACCENT_SWATCHES } from "@/lib/accent-color";
import { DATE_FORMAT_OPTIONS } from "@/lib/date-format";
import type { ProjectDTO } from "@/lib/types";

interface Settings {
  name: string;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  defaultPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  defaultView: string;
  accentColor: string | null;
  defaultProjectId: string | null;
  dateFormat: string;
  weekStartsOn: 0 | 1;
}

const VIEW_OPTIONS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "inbox", label: "Inbox" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "calendar", label: "Calendar" },
  { value: "tasks", label: "All Tasks" },
  { value: "completed", label: "Completed" },
  { value: "kanban", label: "Kanban" },
];

export function SettingsForm({
  initialSettings,
  projects,
  version,
}: {
  initialSettings: Settings;
  projects: ProjectDTO[];
  version: string;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Unable to save settings. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      setSavedAt(Date.now());
      router.refresh();
      setTimeout(() => setSavedAt(null), 2000);
    },
  });

  const importData = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Unable to import data. Please try again.");
      return body as { projectsCreated: number; tasksCreated: number };
    },
    onSuccess: (result) => {
      setImportResult(
        `Imported ${result.projectsCreated} project(s) and ${result.tasksCreated} task(s).`
      );
      router.refresh();
    },
    onError: (err: Error) => setImportResult(err.message),
  });

  const resetData = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Unable to reset data. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      setResetResult("All tasks, projects, and tags have been deleted.");
      router.refresh();
    },
    onError: (err: Error) => setResetResult(err.message),
  });

  function apply(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
    save.mutate(patch);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-5 items-center gap-3 text-sm">
        {save.isPending && <span className="text-muted">Saving…</span>}
        {savedAt && !save.isPending && <span className="text-accent">Saved</span>}
        {save.isError && <span className="text-high">{(save.error as Error).message}</span>}
      </div>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">General</h2>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
          Name
          <input
            value={settings.name}
            onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
            onBlur={(e) => {
              if (e.target.value !== initialSettings.name) apply({ name: e.target.value });
            }}
            className="w-full max-w-xs rounded-md border border-rule bg-surface px-3 py-2 text-sm normal-case text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">Appearance</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Theme</span>
            <div className="flex gap-2">
              {(["LIGHT", "DARK", "SYSTEM"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => apply({ theme })}
                  className={`rounded-md border px-3 py-1.5 text-sm capitalize ${settings.theme === theme ? "border-accent bg-accent text-surface" : "border-rule text-muted hover:text-ink"}`}
                >
                  {theme.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
              Accent color
            </span>
            <div className="flex gap-1.5 pb-1.5">
              {ACCENT_SWATCHES.map((swatch) => {
                const isSelected = (settings.accentColor ?? ACCENT_SWATCHES[0].hex) === swatch.hex;
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => apply({ accentColor: swatch.hex })}
                    aria-label={`Choose accent color ${swatch.name}`}
                    title={swatch.name}
                    className={`h-6 w-6 rounded-full ring-offset-2 ${isSelected ? "ring-2 ring-accent" : ""}`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">Task Defaults</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
            Default priority
            <select
              value={settings.defaultPriority}
              onChange={(e) =>
                apply({ defaultPriority: e.target.value as Settings["defaultPriority"] })
              }
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm normal-case text-ink"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
            Default project
            <select
              value={settings.defaultProjectId ?? ""}
              onChange={(e) => apply({ defaultProjectId: e.target.value || null })}
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm normal-case text-ink"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
            Default view (on sign-in)
            <select
              value={settings.defaultView}
              onChange={(e) => apply({ defaultView: e.target.value })}
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm normal-case text-ink"
            >
              {VIEW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
            Date format
            <select
              value={settings.dateFormat}
              onChange={(e) => apply({ dateFormat: e.target.value })}
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm normal-case text-ink"
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
            Week starts on
            <select
              value={settings.weekStartsOn}
              onChange={(e) => apply({ weekStartsOn: Number(e.target.value) === 0 ? 0 : 1 })}
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm normal-case text-ink"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">Data</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => window.open("/api/export", "_blank")}>
              Export data (JSON)
            </Button>
            <span className="text-xs text-muted">
              Downloads all your projects, tags, and tasks as a JSON file.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importData.mutate(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              disabled={importData.isPending}
              onClick={() => importInputRef.current?.click()}
            >
              {importData.isPending ? "Importing…" : "Import data (JSON)"}
            </Button>
            <span className="text-xs text-muted">
              Adds projects/tasks from a previously exported file — never deletes or overwrites
              anything existing.
            </span>
          </div>
          {importResult && <p className="text-xs text-muted">{importResult}</p>}

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
            <Button
              variant="danger"
              disabled={resetData.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete ALL your tasks, projects, and tags? This cannot be undone. Your account and settings will be kept."
                  )
                ) {
                  resetData.mutate();
                }
              }}
            >
              {resetData.isPending ? "Resetting…" : "Reset all data"}
            </Button>
            <span className="text-xs text-muted">
              Permanently deletes every task, project, and tag. Cannot be undone.
            </span>
          </div>
          {resetResult && <p className="text-xs text-muted">{resetResult}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">About</h2>
        <p className="text-sm text-ink">To-Do List — a personal task management workspace.</p>
        <p className="mt-1 text-xs text-muted">Version {version}</p>
        <p className="mt-1 text-xs text-muted">
          Data is stored in a local PostgreSQL database on this machine — no external servers, no
          account required.
        </p>
      </section>
    </div>
  );
}
