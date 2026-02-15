import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);
const isTeacherRoute = createRouteMatcher(['/dashboard/teacher(.*)']);
const isStudentRoute = createRouteMatcher(['/dashboard/student(.*)']);
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEnrollmentRoute = createRouteMatcher(['/api/enrollment(.*)']);
const isTeacherApiRoute = createRouteMatcher(['/api/teacher(.*)']);
const isStudentApiRoute = createRouteMatcher(['/api/student(.*)']);
const isWebhookRoute = createRouteMatcher(['/api/webhooks/(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isWebhookRoute(req)) {
    return NextResponse.next();
  }

  if (isDashboardRoute(req) || isEnrollmentRoute(req) || isTeacherApiRoute(req) || isStudentApiRoute(req)) {
    const { userId, sessionClaims } = auth() as any;

    if (!userId) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

    if (!role && !req.nextUrl.pathname.startsWith('/dashboard/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard/onboarding', req.url));
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
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
