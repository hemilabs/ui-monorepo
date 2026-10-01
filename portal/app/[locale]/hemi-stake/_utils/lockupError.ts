import { maxDays, minDays, step } from './lockCreationTimes'

type LockupErrorMessage = {
  key:
    | 'hemi-stake.form.lockup-increment-warning'
    | 'hemi-stake.form.max-days'
    | 'hemi-stake.form.min-days'
  values: Record<string, number>
}

export const getLockupErrorMessage = function ({
  minLocked = minDays,
  value,
}: {
  minLocked?: number
  value: number
}): LockupErrorMessage | undefined {
  if (Number.isNaN(value) || value < minLocked) {
    return { key: 'hemi-stake.form.min-days', values: { days: minLocked } }
  }

  if (value > maxDays) {
    return { key: 'hemi-stake.form.max-days', values: { days: maxDays } }
  }

  if (value % step !== 0 && value !== maxDays) {
    return { key: 'hemi-stake.form.lockup-increment-warning', values: {} }
  }

  return undefined
}
