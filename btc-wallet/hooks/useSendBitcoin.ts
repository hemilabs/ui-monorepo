import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'
import { Account, BtcTransaction, Satoshis } from '../unisat'

import { useAccount } from './useAccount'

type SendBitcoinArgs = {
  to: Account
  satoshis: Satoshis
  options?: object
}

export const useSendBitcoin = function (
  mutationOptions: Omit<
    UseMutationOptions<BtcTransaction, Error, SendBitcoinArgs>,
    'mutationFn'
  > = {},
) {
  const { isConnected } = useAccount()
  const { currentConnector } = useContext(GlobalContext)

  const {
    data: txId,
    mutate,
    ...rest
  } = useMutation({
    ...mutationOptions,
    mutationFn: ({ to, satoshis, options }: SendBitcoinArgs) =>
      currentConnector.sendBitcoin(
        to,
        satoshis,
        options,
      ) as Promise<BtcTransaction>,
  })

  const sendBitcoin = function (args: SendBitcoinArgs) {
    if (!isConnected) {
      throw new Error('Wallet is not connected')
    }
    if (args.satoshis <= 0) {
      throw new Error('Satoshis must be greater than 0')
    }

    mutate(args)
  }

  return { sendBitcoin, txId, ...rest }
}
