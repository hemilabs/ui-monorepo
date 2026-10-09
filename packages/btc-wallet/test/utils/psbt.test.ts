import * as bitcoin from 'bitcoinjs-lib'
import { describe, expect, it, vi } from 'vitest'

import {
  getOutputScript,
  removeDustChange,
  sendBitcoin,
} from '../../utils/psbt'

const esplora = vi.hoisted(() => ({
  getAddressTxsUtxo: vi.fn(),
  getFeesRecommended: vi.fn(),
  getTxHex: vi.fn(),
}))

vi.mock('esplora-client', () => ({
  esploraClient: () => ({
    bitcoin: {
      addresses: { getAddressTxsUtxo: esplora.getAddressTxsUtxo },
      fees: { getFeesRecommended: esplora.getFeesRecommended },
      transactions: { getTxHex: esplora.getTxHex },
    },
  }),
}))

const { bitcoin: mainnet, testnet } = bitcoin.networks

// Addresses from the BIP173 and BIP350 test vectors
const p2trMainnet =
  'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0'
const p2trTestnet =
  'tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c'
const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
const p2wpkhTestnet = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'
const p2pkh = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
const p2sh = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'

describe('getOutputScript', function () {
  it('builds a P2TR script on mainnet', function () {
    expect(getOutputScript(p2trMainnet, mainnet).toString('hex')).toBe(
      '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    )
  })

  it('builds a P2TR script on testnet', function () {
    expect(getOutputScript(p2trTestnet, testnet).toString('hex')).toBe(
      '5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433',
    )
  })

  it('builds a P2TR script from an uppercase address', function () {
    expect(
      getOutputScript(p2trMainnet.toUpperCase(), mainnet).toString('hex'),
    ).toBe(
      '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    )
  })

  it('throws for an address of another network', function () {
    expect(() => getOutputScript(p2trMainnet, testnet)).toThrow(
      /invalid prefix/,
    )
  })

  it('throws for a v1 address with a program that is not 32 bytes', function () {
    const address =
      'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y'
    expect(() => getOutputScript(address, mainnet)).toThrow(
      `Invalid taproot address ${address}`,
    )
  })

  it("throws for a taproot address whose prefix is not the network's", function () {
    const address =
      'tb1p1qqurswpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8qursne2yjr'
    expect(() => getOutputScript(address, testnet)).toThrow(
      `Invalid taproot address ${address}`,
    )
  })

  it('builds a P2WPKH script', function () {
    expect(getOutputScript(p2wpkh, mainnet).toString('hex')).toBe(
      '0014751e76e8199196d454941c45d1b3a323f1433bd6',
    )
  })
})

describe('removeDustChange', function () {
  const target = { address: p2wpkh, value: 100 }
  const cases = [
    { address: p2trMainnet, dustLimit: 330, network: mainnet, type: 'P2TR' },
    {
      address: p2trTestnet,
      dustLimit: 330,
      network: testnet,
      type: 'testnet P2TR',
    },
    { address: p2wpkh, dustLimit: 294, network: mainnet, type: 'P2WPKH' },
    { address: p2pkh, dustLimit: 546, network: mainnet, type: 'P2PKH' },
    { address: p2sh, dustLimit: 540, network: mainnet, type: 'P2SH' },
  ]

  it.each(cases)(
    'drops $type change just below $dustLimit sats',
    function ({ address, dustLimit, network }) {
      expect(
        removeDustChange({
          address,
          network,
          outputs: [target, { value: dustLimit - 1 }],
        }),
      ).toEqual([target])
    },
  )

  it.each(cases)(
    'keeps $type change at and just above $dustLimit sats',
    function ({ address, dustLimit, network }) {
      ;[dustLimit, dustLimit + 1].forEach(function (value) {
        const outputs = [target, { value }]
        expect(removeDustChange({ address, network, outputs })).toEqual(outputs)
      })
    },
  )
})

describe('sendBitcoin', function () {
  const custody = p2wpkhTestnet
  const memo = '0390B85A9E3DC8F1C8C3A2E9A7B0D4E5F6A7B8C9'

  const setup = function (sender: string) {
    const fundingTx = new bitcoin.Transaction()
    fundingTx.addInput(Buffer.alloc(32), 0)
    fundingTx.addOutput(Buffer.alloc(22), 1000)
    fundingTx.addOutput(getOutputScript(sender, testnet), 8000)
    fundingTx.addOutput(getOutputScript(sender, testnet), 6000)
    esplora.getAddressTxsUtxo.mockResolvedValue([
      { txid: fundingTx.getId(), value: 8000, vout: 1 },
      { txid: fundingTx.getId(), value: 6000, vout: 2 },
    ])
    esplora.getFeesRecommended.mockResolvedValue({ fastestFee: 1 })
    esplora.getTxHex.mockResolvedValue(fundingTx.toHex())
    const provider = {
      getAccounts: vi.fn().mockResolvedValue([sender]),
      getNetwork: vi.fn().mockResolvedValue('testnet'),
      // stop before the signed transaction is extracted and pushed
      signPsbt: vi.fn().mockRejectedValue(new Error('signed')),
    }
    return { fundingTx, provider }
  }

  const getSignRequest = async function (sender: string) {
    const { fundingTx, provider } = setup(sender)
    await expect(
      sendBitcoin(provider, custody, 10000, { memo }),
    ).rejects.toThrow('signed')
    const [psbtHex, options] = provider.signPsbt.mock.calls[0]
    const psbt = bitcoin.Psbt.fromHex(psbtHex, { network: testnet })
    return { fundingTx, options, psbt }
  }

  it('adds witnessUtxo to the inputs of a taproot sender', async function () {
    const { fundingTx, psbt } = await getSignRequest(p2trTestnet)

    expect(psbt.data.inputs).toHaveLength(2)
    expect(psbt.data.inputs.map(input => input.witnessUtxo)).toEqual(
      psbt.txInputs.map(input => fundingTx.outs[input.index]),
    )
    psbt.data.inputs.forEach(input =>
      expect(input.nonWitnessUtxo).toEqual(fundingTx.toBuffer()),
    )
  })

  it('does not add witnessUtxo for a non-taproot sender', async function () {
    const { fundingTx, psbt } = await getSignRequest(p2wpkhTestnet)

    expect(psbt.data.inputs).toHaveLength(2)
    psbt.data.inputs.forEach(function (input) {
      expect(input.witnessUtxo).toBeUndefined()
      expect(input.nonWitnessUtxo).toEqual(fundingTx.toBuffer())
    })
  })

  it('asks the wallet to sign and finalize every input', async function () {
    const { options } = await getSignRequest(p2trTestnet)

    expect(options).toEqual({
      autoFinalized: true,
      toSignInputs: [
        { address: p2trTestnet, index: 0 },
        { address: p2trTestnet, index: 1 },
      ],
    })
  })

  it('pays the target, returns the change and adds the memo', async function () {
    const { psbt } = await getSignRequest(p2trTestnet)
    const outputs = psbt.txOutputs.map(({ script, value }) => ({
      script: script.toString('hex'),
      value,
    }))

    expect(outputs).toEqual([
      {
        script: getOutputScript(custody, testnet).toString('hex'),
        value: 10000,
      },
      {
        script: getOutputScript(p2trTestnet, testnet).toString('hex'),
        value: 3626,
      },
      {
        script: bitcoin.script
          .compile([bitcoin.opcodes.OP_RETURN, Buffer.from(memo)])
          .toString('hex'),
        value: 0,
      },
    ])
  })
})
