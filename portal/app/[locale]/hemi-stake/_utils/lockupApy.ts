import { maxDays, oneYear, sixMonths, twoYears } from './lockCreationTimes'

export const lockupApy: Record<number, number> = {
  [maxDays]: 80,
  [oneYear]: 20,
  [sixMonths]: 10,
  [twoYears]: 40,
}
