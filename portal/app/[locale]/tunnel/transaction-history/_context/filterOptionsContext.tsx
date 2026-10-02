import { createContext, useContext } from 'react'

import { type FilterOptions } from '../_components/topBar'

type FilterOptionsContextValue = {
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}

export const FilterOptionsContext = createContext<
  FilterOptionsContextValue | undefined
>(undefined)

export const useFilterOptions = function () {
  const ctx = useContext(FilterOptionsContext)
  if (!ctx) {
    throw new Error('useFilterOptions must be used inside FilterOptionsContext')
  }
  return ctx
}
