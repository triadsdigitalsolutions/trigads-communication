import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const role = (req.auth?.user as any)?.role;

    // Protection for all dashboard routes
    if (nextUrl.pathname.startsWith('/dashboard')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/login", nextUrl));
        }

        // Specific Admin Protection
        if (nextUrl.pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
            return NextResponse.redirect(new URL("/dashboard/chat", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
