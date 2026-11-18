export const toPrice = function (value: string | undefined) {
  const price = Number(value)
  return value !== undefined && Number.isFinite(price) && price > 0
    ? price
    : undefined
}
