import { createClient } from 'redis'

export type RedisOptions = { url: string }

function createRedisCache({ url }: RedisOptions) {
  const client = createClient({ url })
  client.connect()

  async function getTokenPrices() {
    const data: { prices: Record<string, string | null>; time?: string } = {
      prices: {},
    }
    const prefix = 'price:'
    // Even when it is not recommended to use KEYS in production, it is used
    // here because the number of keys is expected to be small and the solution
    // is simple. The alternative would have been to SCAN the keys, walk through
    // the cursor and fetch the values for each key. This would have been more
    // complex.
    const keys = await client.keys(`${prefix}*`)
    const values = await client.mGet(keys.concat('time'))
    const time = values.pop()
    if (time) {
      data['time'] = new Date(Number.parseInt(time)).toISOString()
    }
    keys.forEach(function (key, i) {
      data.prices[key.slice(prefix.length)] = values[i]
    })
    return data
  }

  async function getPriceHistory(symbol: string) {
    const stored = await client.get(`daily-prices:${symbol}`)
    return stored === null
      ? null
      : (JSON.parse(stored) as Record<string, string>)
  }

  return {
    getPriceHistory,
    getTokenPrices,
  }
}

export type Cache = ReturnType<typeof createRedisCache>

export { createRedisCache }
