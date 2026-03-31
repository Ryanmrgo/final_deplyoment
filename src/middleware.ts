import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

type AppRole = 'teacher' | 'student' | 'admin';

function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'teacher' || value === 'student' || value === 'admin') return value;
  return undefined;
}

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);
const isTeacherRoute = createRouteMatcher(['/dashboard/teacher(.*)']);
const isStudentRoute = createRouteMatcher(['/dashboard/student(.*)']);
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEnrollmentRoute = createRouteMatcher(['/api/enrollment(.*)']);
const isTeacherApiRoute = createRouteMatcher(['/api/teacher(.*)']);
const isStudentApiRoute = createRouteMatcher(['/api/student(.*)']);
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)']);
const isWebhookRoute = createRouteMatcher(['/api/webhooks/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req)) {
    return NextResponse.next();
  }

  if (
    isDashboardRoute(req) ||
    isEnrollmentRoute(req) ||
    isTeacherApiRoute(req) ||
    isStudentApiRoute(req) ||
    isAdminApiRoute(req)
  ) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    // Fetch user data directly from Clerk to get publicMetadata
    let role: AppRole | undefined;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role =
        normalizeRole(user.publicMetadata?.role) ||
        normalizeRole(user.unsafeMetadata?.role);
    } catch (error) {
      console.error('[Middleware] Error fetching user:', error);
    }

    // Debug logging
    console.log('[Middleware Debug]', {
      pathname: req.nextUrl.pathname,
      userId,
      role
    });

    if (!role && !req.nextUrl.pathname.startsWith('/dashboard/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard/onboarding', req.url));
    }

    if (role && req.nextUrl.pathname.startsWith('/dashboard/onboarding')) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    if (isTeacherRoute(req) && role !== 'teacher') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isStudentRoute(req) && role !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isAdminRoute(req) && role !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isEnrollmentRoute(req) && role !== 'student') {
      return NextResponse.json({ error: 'Student role required' }, { status: 403 });
    }

    if (isTeacherApiRoute(req) && role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
    }

    if (isStudentApiRoute(req) && role !== 'student') {
      return NextResponse.json({ error: 'Student role required' }, { status: 403 });
    }

    if (isAdminApiRoute(req) && role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
