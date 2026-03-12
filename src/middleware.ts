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
    const isApiRequest = req.nextUrl.pathname.startsWith('/api');

    if (!userId) {
      if (isApiRequest) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    const roleClaim = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
    let role = typeof roleClaim === 'string' ? roleClaim.trim().toLowerCase() : undefined;

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

    // Do not enforce API role checks from session claims in middleware because claims can be stale.
    // API routes enforce role with getEffectiveRole() using DB fallback.
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
