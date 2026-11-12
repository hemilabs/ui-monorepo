export function computeCooldownRemaining(
  claimableAt: bigint | number | undefined,
  nowSec: number,
) {
  if (claimableAt === undefined) return undefined
  const remaining = Number(claimableAt) - nowSec
  return remaining > 0 ? remaining : 0
}
