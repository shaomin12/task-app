import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma/adapter imports here, so this can run inside
// Next.js middleware (Edge runtime). The full config in lib/auth.ts extends
// this for use in API routes and server components (Node.js runtime).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = request.nextUrl.pathname.startsWith("/login");

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
};
