import { getEnv } from '@l2beat/backend-tools'
import { CoingeckoClient, HttpClient } from '@l2beat/shared'
import { assert, EthereumAddress, Token } from '@l2beat/shared-pure'
import chalk from 'chalk'
import { providers } from 'ethers'
import { writeFileSync } from 'fs'

import { getCanonicalTokens } from '../../../src'
import { getTokenInfo } from './getTokenInfo'

async function main() {
  const [address, category] = handleCLIParameters()
  if (!address) {
    return
  }
  const env = getEnv()
  const alchemyApiKey = env.string('CONFIG_ALCHEMY_API_KEY')
  const etherscanApiKey = env.string('ETHERSCAN_API_KEY')
  const coingeckoApiKey = env.optionalString('COINGECKO_API_KEY')

  const http = new HttpClient()
  const coingeckoClient = new CoingeckoClient(http, coingeckoApiKey)
  const provider = new providers.AlchemyProvider('homestead', alchemyApiKey)

  const token: Token = await getTokenInfo(
    provider,
    coingeckoClient,
    address,
    category,
    etherscanApiKey,
  )

  const tokens = getCanonicalTokens()
  const newList = [...tokens, token].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  const comment =
    'This file was autogenerated. You can modify it by hand or use the handy script for a quicker way to add new tokens: yarn tokens:add <address> <category>'
  writeFileSync(
    'src/tokens/tokenList.json',
    JSON.stringify({ comment, tokens: newList }, null, 2) + '\n',
  )
}

main().catch((e) => {
  console.error(e)
})

function handleCLIParameters(): [
  EthereumAddress | undefined,
  'ether' | 'stablecoin' | 'other',
] {
  if (process.argv.length < 4) {
    console.log(chalk.red('!!! Missing arguments !!!'))
    console.log(`Usage: yarn tokens:add <address> <category>`)
  }

  let address: EthereumAddress | undefined

  try {
    address = EthereumAddress(process.argv[2])
  } catch {
    console.log(chalk.red('!!! Ethereum address is invalid !!!'))
    console.log(
      `Did you pass the address as the first argument? Did you copy it correctly?`,
    )
  }

  const categoryTypes = ['ether', 'stablecoin', 'other']

  if (!categoryTypes.includes(process.argv[3])) {
    console.log(chalk.red('!!! Invalid token category !!!'))
    console.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `category must be one of: ${categoryTypes}`,
    )
  }

  const category = process.argv[3] as 'ether' | 'stablecoin' | 'other'

  assert(categoryTypes.includes(category), 'Invalid token category')

  return [address, category]
}
