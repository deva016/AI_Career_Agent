import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Export explicit GET and POST handlers for Next.js 16
export async function GET(request: Request, context: any) {
  return handler(request, context);
}

export async function POST(request: Request, context: any) {
  return handler(request, context);
}

// Re-export authOptions for use in other API routes
export { authOptions };
