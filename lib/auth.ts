import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}


export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "lucovsky.com",
        },
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // Set ADMIN role on first sign-in for designated admin emails
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (user.email && adminEmails.includes(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith("@lucovsky.com")) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      const t = token as typeof token & { id: string; role: Role };
      // On first sign-in, user object is present — fetch role from DB
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        t.id = user.id;
        t.role = dbUser?.role ?? "USER";
      }
      // Auth.js always sets token.sub = user.id; use it as fallback if token.id missing
      if (!t.id && token.sub) {
        t.id = token.sub;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        t.role = dbUser?.role ?? "USER";
      }
      // On explicit session update, re-fetch role in case it changed
      if (trigger === "update" && t.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: t.id },
          select: { role: true },
        });
        if (dbUser) t.role = dbUser.role;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & { id: string; role: Role };
      if (t) {
        session.user.id = t.id ?? token.sub!;
        session.user.role = t.role;
      }
      return session;
    },
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
