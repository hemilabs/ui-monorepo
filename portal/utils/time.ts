export const secondsToDays = (seconds: number) => seconds / 60 / 60 / 24

export const secondsToWholeDays = (seconds: number) =>
  Math.round(secondsToDays(seconds))

export const secondsToHours = (seconds: number) => seconds / 60 / 60

export const secondsToMinutes = (seconds: number) => seconds / 60

export const unixNowTimestamp = () => BigInt(Math.floor(Date.now() / 1000))
