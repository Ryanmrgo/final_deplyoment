export const DEFAULT_MAX_ENROLLMENTS = 20;

export function getCourseMaxEnrollments(course: { maxEnrollments?: number | null }): number {
  const n = Number(course?.maxEnrollments);
  if (Number.isFinite(n) && n >= 1) return Math.min(1000, Math.floor(n));
  return DEFAULT_MAX_ENROLLMENTS;
}
