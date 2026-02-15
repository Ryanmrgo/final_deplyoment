import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

  if (isDashboardRoute(req) || isEnrollmentRoute(req) || isTeacherApiRoute(req) || isStudentApiRoute(req) || isAdminApiRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    let role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

    // When role is missing in session, allow dashboard routes through - dashboard page will check MongoDB
    if (!role) {
      const path = req.nextUrl.pathname;
      const allowWithoutRole = path === '/dashboard' || path.startsWith('/dashboard/onboarding') || path.startsWith('/dashboard/teacher') || path.startsWith('/dashboard/student') || path.startsWith('/dashboard/admin');
      if (!allowWithoutRole && path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/dashboard/onboarding', req.url));
      }
    }

    if (isTeacherRoute(req) && role && role !== 'teacher') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isStudentRoute(req) && role && role !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isAdminRoute(req) && role && role !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role ?? 'student'}`, req.url));
    }

    if (isEnrollmentRoute(req) && (!role || role !== 'student')) {
      return NextResponse.json({ error: 'Student role required' }, { status: 403 });
    }

    // When role is missing from session (e.g. after onboarding, claims not yet refreshed),
    // allow through so API routes can verify role from MongoDB via getEffectiveRole.
    if (isTeacherApiRoute(req) && role != null && role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
    }

    if (isStudentApiRoute(req) && role != null && role !== 'student') {
      return NextResponse.json({ error: 'Student role required' }, { status: 403 });
    }

    if (isAdminApiRoute(req) && role != null && role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
