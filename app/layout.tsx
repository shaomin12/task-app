import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { getCurrentUser } from "@/lib/current-user";
import { DEFAULT_ACCENT, deriveAccentShades } from "@/lib/accent-color";
import { UserPrefsProvider } from "@/lib/user-prefs-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "To-Do List",
  description: "A personal task management workspace.",
};

// Every page reads live, mutable data straight from the database via
// Prisma (not `fetch`), which Next.js can't detect as "dynamic" on its own —
// left alone, it silently prerenders these pages once at build time and
// serves that frozen snapshot forever. This is a live single-user app with
// no static content at all, so every request must hit the database fresh.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const themeAttr = user.theme === "SYSTEM" ? undefined : user.theme.toLowerCase();
  const { light, dark } = deriveAccentShades(user.accentColor ?? DEFAULT_ACCENT);

  return (
    <html
      lang="en"
      data-theme={themeAttr}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          :root {
            --color-accent: ${light.accent} !important;
            --color-accent-hover: ${light.accentHover} !important;
            --color-accent-soft: ${light.accentSoft} !important;
          }
          @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
              --color-accent: ${dark.accent} !important;
              --color-accent-hover: ${dark.accentHover} !important;
              --color-accent-soft: ${dark.accentSoft} !important;
            }
          }
          :root[data-theme="dark"] {
            --color-accent: ${dark.accent} !important;
            --color-accent-hover: ${dark.accentHover} !important;
            --color-accent-soft: ${dark.accentSoft} !important;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <UserPrefsProvider
            prefs={{
              dateFormat: user.dateFormat,
              weekStartsOn: user.weekStartsOn === 0 ? 0 : 1,
            }}
          >
            {children}
          </UserPrefsProvider>
        </Providers>
      </body>
    </html>
  );
}
