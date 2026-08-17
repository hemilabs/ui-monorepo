import { secondsPerHour } from 'utils/time'

// Governance-controlled and rarely changes; cache for hours to avoid refetch on every focus/reconnect.
export const cooldownStaleTimeMs = 4 * secondsPerHour * 1000
