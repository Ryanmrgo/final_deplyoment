import mongoose from 'mongoose';

export const DEFAULT_MAX_ENROLLMENTS = 20;

export function getCourseMaxEnrollments(course: { maxEnrollments?: number | null }): number {
  const n = Number(course?.maxEnrollments);
  if (Number.isFinite(n) && n >= 1) return Math.min(1000, Math.floor(n));
  return DEFAULT_MAX_ENROLLMENTS;
}

/**
 * Clauses for enrollments that count toward capacity and public "enrolled" numbers:
 * Active, or legacy docs with missing/null status. Excludes Dropped/Completed.
 * Handles courseId stored as ObjectId or string.
 */
export function courseSeatEnrollmentAndClauses(courseId: string | mongoose.Types.ObjectId): object[] {
  const idStr = typeof courseId === 'string' ? courseId : String(courseId);
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    return [{ _id: { $exists: false } }];
  }
  const oid = new mongoose.Types.ObjectId(idStr);
  return [
    { $or: [{ courseId: oid }, { courseId: idStr }] },
    {
      $or: [{ status: 'Active' }, { status: { $exists: false } }, { status: null }],
    },
  ];
}

/** Student still has access (Active, Completed, legacy); excludes Dropped only. */
export function studentCourseEnrollmentClauses(courseId: string | mongoose.Types.ObjectId): object[] {
  const idStr = typeof courseId === 'string' ? courseId : String(courseId);
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    return [{ _id: { $exists: false } }];
  }
  const oid = new mongoose.Types.ObjectId(idStr);
  return [
    { $or: [{ courseId: oid }, { courseId: idStr }] },
    { status: { $ne: 'Dropped' } },
  ];
}
