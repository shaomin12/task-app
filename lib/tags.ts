import { prisma } from "@/lib/prisma";

// Distinct from the project "candy" palette and the priority colors, so a
// tag pill never gets mistaken for a project pill or a priority indicator.
const TAG_PALETTE = [
  "#5b8a72", // sage
  "#7a6c9e", // dusty purple
  "#c17a4d", // terracotta
  "#4d7ea8", // steel blue
  "#a85d7a", // mauve
  "#8a8a4d", // olive
  "#4d9a9a", // teal
  "#9e6c4d", // clay
];

function colorForTagName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

// Resolves tag names to ids for a user, creating any that don't exist yet.
// Lets task forms accept free-text tags without a separate "create tag" step.
// New tags get a deterministic color from a fixed palette (same name always
// gets the same color) so tag pills are visually distinct at a glance.
export async function ensureTagIds(userId: string, names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  return Promise.all(
    unique.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name, color: colorForTagName(name) },
        select: { id: true },
      })
    )
  ).then((tags) => tags.map((t) => t.id));
}
