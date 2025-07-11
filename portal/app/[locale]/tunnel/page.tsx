'use client'

import { PageLayout } from 'components/pageLayout'
import { Suspense } from 'react'

import { Deposit } from './_components/deposit'
import { Withdraw } from './_components/withdraw'
import { useTunnelOperation } from './_hooks/useTunnelOperation'
import { useTunnelState } from './_hooks/useTunnelState'

const Tunnel = function () {
  const { operation } = useTunnelOperation()
  const tunnelState = useTunnelState()

  const props = {
    state: tunnelState,
  }

  return (
    <div className="h-fit-rest-screen">
      {operation === 'withdraw' ? (
        <Withdraw {...props} />
      ) : (
        <Deposit {...props} />
      )}
    </div>
  )
}

export default function Page() {
  return (
    <PageLayout variant="center">
      <Suspense>
        <Tunnel />
      </Suspense>
    </PageLayout>
  )
}
