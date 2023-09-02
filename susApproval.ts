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

const approvalEvents = await client.getLogs({
    address: testedAddress,
    fromBlock,
    toBlock,
    event: parseAbiItem('event Approval(address indexed _owner, address indexed _spender, uint256 _value)'),
})

const isContract = async (addr : Address) : boolean => (await client.getBytecode({address: addr}))
const getEventTxn = async (ev : Event) : TransactionReceipt => (await client.getTransactionReceipt({hash: ev.transactionHash}))

const suspiciousApprovalEvent = async (ev : Event) : (Event | null) => {
    const owner = ev.args._owner

    // Approvals by contracts are not suspicious
    if (await isContract(owner))
        return null

    const txn = await getEventTxn(ev)

    // The approval is suspicious if it comes an EOA owner that isn't the transaction's `from`
    if (owner.toLowerCase() != txn.from.toLowerCase())
        return ev

        // It is also suspicious if the transaction destination isn't the ERC-20 contract we are
    // investigating
    if (txn.to != testedAddress)
        return ev

    // If there is no reason to be suspicious, return null.
    return null
}

const testPromises = approvalEvents.map(ev => suspiciousApprovalEvent(ev))
const testResults = (await Promise.all(testPromises)).filter(x => x != null)

console.log(testResults)