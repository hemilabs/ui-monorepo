import { secondsPerDay, secondsPerHour } from './time'

const second = 1000
const minute = 60 * second
const hour = secondsPerHour * second
const day = secondsPerDay * second

const bands = [
  { interval: second, upTo: minute },
  { interval: 30 * second, upTo: 10 * minute },
  { interval: minute, upTo: hour },
  { interval: hour, upTo: 2 * day },
  { interval: day, upTo: Infinity },
]

export const getTimeoutInterval = function (
  targetTimestamp: number,
  now: number,
) {
  const difference = Math.abs(now - targetTimestamp)
  const index = bands.findIndex(({ upTo }) => difference <= upTo)
  return bands[index].interval
}
