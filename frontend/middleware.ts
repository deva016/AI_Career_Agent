import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for session cookie
  const sessionToken = request.cookies.get("next-auth.session-token")?.value || 
                       request.cookies.get("__Secure-next-auth.session-token")?.value;

  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const protectedPaths = ["/dashboard", "/settings", "/resumes"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // CASE 1: Trying to access protected route WITHOUT session -> Redirect to Signin
  if (isProtected && !sessionToken) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // CASE 2: Trying to access Signin page WITH session -> Redirect to Dashboard
  if (pathname === "/auth/signin" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all protected routes AND the signin page
     */
    "/dashboard/:path*", 
    "/settings/:path*", 
    "/resumes/:path*",
    "/auth/signin"
  ],
};
