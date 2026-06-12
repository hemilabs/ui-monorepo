import { createClient } from 'redis'

function fromUnit(value: string) {
  const str = value.padStart(19, '0')
  return `${str.slice(0, -18)}.${str.slice(-18)}`
}

export type RedisOptions = { url: string }

function createRedisCache({ url }: RedisOptions) {
  const client = createClient({ url })
  client.connect()

  async function getCirculatingSupply() {
    const prefix = 'supply:'
    const keys = await client.keys(`${prefix}*`)
    const values = await client.mGet(keys)
    const data = Object.fromEntries(
      keys.map((key, i) => [key.slice(prefix.length), values[i] || '0']),
    ) as Record<string, string>
    const { time: _time, total, ...rest } = data
    const circulatingSupply =
      BigInt(total) -
      Object.values(rest).reduce((acc, value) => acc + BigInt(value), 0n)
    return fromUnit(circulatingSupply.toString())
  }

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

  return {
    getCirculatingSupply,
    getTokenPrices,
  }
}

export type Cache = ReturnType<typeof createRedisCache>

export { createRedisCache }
