import { MaxLockDurationSeconds, MinLockDurationSeconds } from 've-hemi-actions'

const daySeconds = 86_400
const yearSeconds = 365.25 * daySeconds

export const maxYears = Math.round(MaxLockDurationSeconds / yearSeconds)
export const minDays = Math.floor(MinLockDurationSeconds / daySeconds)
