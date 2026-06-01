'use client'

import { useContext } from 'react'

import { LocalEarnOperationsContext } from '../_context/localEarnOperationsContext'

export const useLocalEarnOperations = function () {
  const ctx = useContext(LocalEarnOperationsContext)
  if (!ctx) {
    throw new Error(
      'useLocalEarnOperations must be used inside <LocalEarnOperationsProvider>',
    )
  }
  return ctx
}
