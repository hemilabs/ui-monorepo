import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'

const tvlUrl = process.env.NEXT_PUBLIC_TVL_URL

type Item = {
  value: number
}

type Data = {
  items: Array<Item>
}

type DsData = {
  data: Array<Data>
}

type SampleData = {
  id: number
  dsData: Array<DsData>
}

type Sample = {
  id: number
  sampledata: SampleData
}

export const useTvl = () =>
  useQuery({
    // If the URL is not set, tvl are not returned. Consumers of the hook
    // should consider this scenario
    enabled: tvlUrl !== undefined && isValidUrl(tvlUrl),
    async queryFn() {
      const data = (await fetch(tvlUrl).then(
        ({ samples }) => samples,
      )) as Array<Sample>
      const sampleData = data.find(x => x.id === 101171633).sampledata.dsData[0]
        .data
      const tvl = sampleData.reduce((sum, item) => sum + item.items[0].value, 0)
      return tvl
    },
    queryKey: ['tvl'],
    // refetch every 60 min
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
  })
