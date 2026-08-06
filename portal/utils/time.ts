export const secondsPerDay = 60 * 60 * 24
export const secondsPerHour = 60 * 60

const secondsToDays = (seconds: number) => seconds / secondsPerDay

export const secondsToWholeDays = (seconds: number) =>
  Math.round(secondsToDays(seconds))

export const secondsToHours = (seconds: number) => seconds / secondsPerHour

export const secondsToDaysAndHours = function (seconds: number) {
  const days = Math.floor(secondsToDays(seconds))
  const hours = Math.floor(secondsToHours(seconds - days * secondsPerDay))
  return { days, hours }
}

export const secondsToMinutes = (seconds: number) => seconds / 60

export const unixNowTimestamp = () => BigInt(Math.floor(Date.now() / 1000))
