// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const ProgressStatus = {
  NOT_READY: 0,
  READY: 1,
  PROGRESS: 2,
  COMPLETED: 3,
  FAILED: 4,
  REJECTED: 5,
} as const
/* eslint-enable sort-keys */

export type ProgressStatusType =
  (typeof ProgressStatus)[keyof typeof ProgressStatus]
