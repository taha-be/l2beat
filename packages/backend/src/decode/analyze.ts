import { assert } from '@l2beat/shared-pure'
import { ethers } from 'ethers'

export async function analyzeTransaction(alchemyKey: string, txHash: string) {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`,
  )
  const tx = await provider.getTransaction(txHash)
  assert(tx.blockNumber, 'Block number not found')
  const block = await provider.getBlock(tx.blockNumber)

  return {
    data: tx.data,
    timestamp: block.timestamp,
  }
}