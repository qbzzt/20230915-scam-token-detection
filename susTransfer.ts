import { Address, TransactionReceipt, createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'
import { config } from 'dotenv'
config()

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.URL),
})

const testedAddress = '0xb047c8032b99841713b8e3872f06cf32beb27b82'
const fromBlock = 16859812n
const toBlock = 16873372n

const transferEvents = await client.getLogs({
    address: testedAddress,
    fromBlock,
    toBlock,
    event: parseAbiItem('event Transfer(address indexed _from, address indexed _to, uint256 _value)'),
})

let balances = {}

for(var i=0; i<transferEvents.length; i++) {
    console.log(i)
    const ev = transferEvents[i]

    // Mints are transfers from the zero address and are legit
    if (ev.args._from != '0x0000000000000000000000000000000000000000') {
        balances[ev.args._from] = balances[ev.args._from]-ev.args._value
        if (balances[ev.args._from] < 0)
            console.log("Bad balance for ${ev.args._from}")
    }
    if (balances[ev.args._to] == undefined)
        balances[ev.args._to] = 0n
    balances[ev.args._to] += ev.args._value
}
