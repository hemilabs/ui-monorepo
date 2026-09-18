export const dayMs = 24 * 60 * 60 * 1000

export const startOfDay = (date: string) => Date.parse(`${date}T00:00:00Z`)

export const toDate = (time: number) =>
  new Date(time).toISOString().slice(0, 10)
