import * as bitcoin from 'bitcoinjs-lib'
import coinSelect from 'coinselect'
import { esploraClient } from 'esplora-client'

import { type Unisat } from '../unisat'

/**
 * Manually construct, sign and push the transaction.
 */
// eslint-disable-next-line complexity
export async function sendBitcoin(
  provider: Unisat,
  toAddress: string,
  satoshis: number,
  options: { memo?: string } = {},
) {
  const [[address], network] = await Promise.all([
    provider.getAccounts(),
    provider.getNetwork(),
  ])
  const client = esploraClient({
    network: network === 'livenet' ? 'mainnet' : network,
  })
  let utxos = []
  if (provider.getBitcoinUtxos) {
    utxos = await provider.getBitcoinUtxos() // UniSat
  } else {
    utxos = await client.bitcoin.addresses.getAddressTxsUtxo({ address })
  }
  const targets = [{ address: toAddress, value: satoshis }]
  const feeRate = (await client.bitcoin.fees.getFeesRecommended()).fastestFee
  const { inputs, outputs } = coinSelect(utxos, targets, feeRate)
  if (!inputs || !outputs) {
    throw new Error('Insufficient funds')
  }

  const psbt = new bitcoin.Psbt({
    network: bitcoin.networks[network === 'livenet' ? 'bitcoin' : network],
  })
  for (const input of inputs) {
    const txHex = await client.bitcoin.transactions.getTxHex({
      txid: input.txid as string,
    })
    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      nonWitnessUtxo: Buffer.from(txHex, 'hex'),
    })
  }
  for (const output of outputs) {
    psbt.addOutput({
      address: output.address || address,
      value: output.value || 0,
    })
  }
  if (options.memo) {
    const data = Buffer.from(options.memo) // Must use UTF-8 encoding
    const script = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data])
    psbt.addOutput({ script, value: 0 })
  }
  const psbtHex = psbt.toHex()
  const signedPsbtHex = await provider.signPsbt(psbtHex, {
    autoFinalize: true,
    toSignInputs: inputs.map((_, index) => ({ address, index })),
  })
  const signedPsbt = bitcoin.Psbt.fromHex(signedPsbtHex)
  const rawTxHex = signedPsbt.extractTransaction().toHex()
  return provider.pushTx(rawTxHex)
}
