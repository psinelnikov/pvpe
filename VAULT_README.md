# Private Vault Policy Engine

A TEE-enforced vault system for Swiss Bank Consortium lending, built on **Rayls Privacy Node** with AgentPermit policy enforcement. All lending operations execute privately while maintaining full regulatory compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Rayls Public Chain                        │
│  ┌──────────────────┐                                       │
│  │  PublicVault     │  Public deposit/withdraw surface      │
│  │  (SCVS Token)    │  NAV visible to all                   │
│  └──────────────────┘                                       │
└────────────────────────┬────────────────────────────────────┘
                         │ teleportToPrivacyNode()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Rayls Privacy Node                           │
│  ┌──────────────────┐                                       │
│  │  PrivacyVault    │  Private lending operations           │
│  │  Coordinator     │  Yield accrual & accounting           │
│  │                  │  Net settlement tracking              │
│  └──────────────────┘                                       │
│         │                                                   │
│         ▼ ActionGate.verifyPermit()                         │
│  ┌──────────────────┐                                       │
│  │  ActionGate      │  TEE-signed permit verification       │
│  └──────────────────┘                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           AgentPermit (Offchain)                            │
│  - Intent creation & policy evaluation                      │
│  - TEE signing (mock or FCC)                                │
│  - Audit trail & logging                                    │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Private Lending**: All inter-bank lending executes on Rayls Privacy Node
- **TEE-Enforced Policies**: AgentPermit ensures all transfers comply with spending limits
- **Multi-Sig Approvals**: Large transfers require human approvers
- **Daily Rebalancing**: Automated net settlement between chains
- **Full Audit Trail**: Every operation logged with cryptographic proofs
- **Rayls Native**: Pure Rayls architecture

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- [Node.js](https://nodejs.org/) 18+ installed
- Rayls Privacy Node RPC URL (provided by hackathon organizers)
- Rayls Public Chain RPC URL (provided by hackathon organizers)
- USDC token contract addresses on both chains

### 1. Clone & Install

```bash
cd rayls-hackathon-starter
forge install
npm install
```

### 2. Configure Environment

```bash
cp .env.vault .env
# Edit .env with your values
```

Required variables:
```env
# Rayls RPC endpoints
PRIVACY_NODE_RPC_URL=https://privacy-node-5.rayls.com
PUBLIC_CHAIN_RPC_URL=https://testnet-rpc.rayls.com
RAYLS_CHAIN_ID=800005
PUBLIC_CHAIN_ID=7295799

# Deployer keys
DEPLOYER_PRIVATE_KEY=<your-deployer-key>
OWNER_ADDRESS=<your-owner-address>

# USDC token
USDC_TOKEN_ADDRESS=<usdc-on-privacy-node>

# Daily Rebalancer
DAILY_REBALANCER_ADDRESS=<rebalancer-wallet>
DAILY_REBALANCER_PRIVATE_KEY=<rebalancer-key>

# Deployment proxy registry
DEPLOYMENT_PROXY_REGISTRY=0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F

# Backend API configuration
BACKEND_URL=https://rayls-backend-privacy-node-5.rayls.com
USER_AUTH_KEY=ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327
OPERATOR_AUTH_KEY=ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327
```

### 3. Deploy Infrastructure (Privacy Node)

```bash
source .env

forge script script/DeployVaultInfra.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

Save the contract addresses to `.env`:
```env
TEE_REGISTRY_ADDRESS=<from-output>
ACTION_GATE_ADDRESS=<from-output>
DEMO_VAULT_ADDRESS=<from-output>
POLICY_REGISTRY_ADDRESS=<from-output>
PRIVACY_COORDINATOR_ADDRESS=<from-output>
```

### 4. Deploy Public Vault (Public Chain)

```bash
forge script script/DeployPublicVault.s.sol \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --broadcast --legacy
```

Save to `.env`:
```env
PUBLIC_VAULT_ADDRESS=<from-output>
```

### 5. Register TEE Signer

```bash
# Generate a TEE signer key
tee_key=$(cast wallet new)
TEE_SIGNER_ADDRESS=$(echo $tee_key | grep Address | awk '{print $2}')
TEE_SIGNER_PRIVATE_KEY=$(echo $tee_key | grep Private | awk '{print $3}')

# Update .env with these values
# Set FCC_CODE_HASH for your TEE measurement

forge script script/RegisterTEE.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

### 6. Start AgentPermit API (TODO: Implement)

```bash
cd api
pnpm install
cp .env.example apps/api/.env
# Edit .env with Privacy Node addresses

pnpm dev
```

### 7. Bootstrap API Key

```bash
curl -X POST http://localhost:3001/admin/api-keys/bootstrap \
  -H "Content-Type: "application/json" \
  -d '{"orgId": "swiss_consortium", "name": "Admin Key"}'
```

Save the API key to `.env`:
```env
AP_API_KEY=ap_your_key_here
```

### 8. Configure Policies

```bash
node scripts/configurePolicies.js
```

This creates four policy tiers:
- `pol_conservative_bank` - 5M USDC per tx, 20M daily
- `pol_standard_bank` - 10M USDC per tx, 50M daily
- `pol_institutional_bank` - 50M USDC per tx, 200M daily
- `pol_rebalancer` - 100M USDC per tx, 500M daily

### 9. Register Agents

```bash
node scripts/registerAgents.js
```

Set environment variables for bank agents:
```env
BANK_AGENT_ID=bank_standard_01
BANK_AGENT_PRIVATE_KEY=<bank-key>
BANK_AGENT_POLICY_ID=pol_standard_bank
```

Or configure multiple banks via JSON:
```env
BANK_AGENTS_CONFIG=[
  {
    "agentId": "bank_conservative_01",
    "name": "Conservative Bank 01",
    "walletAddr": "0x...",
    "privateKey": "0x...",
    "policyId": "pol_conservative_bank"
  }
]
```

### 10. Run Daily Rebalancer

Set up cron to run at 00:00 UTC:

```bash
# Add to crontab
0 0 * * * cd /path/to/rayls-hackathon-starter && node scripts/dailyRebalancer.js >> /var/log/rebalancer.log 2>&1
```

Or test manually:
```bash
node scripts/dailyRebalancer.js
```

## Network Configuration

### Privacy Node Configuration
- **RPC URL**: `https://privacy-node-5.rayls.com`
- **Chain ID**: `800005`
- **Deployment Proxy Registry**: `0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F`

### Backend API Configuration
- **Backend URL**: `https://rayls-backend-privacy-node-5.rayls.com`
- **User Auth Key**: `ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327`
- **Operator Auth Key**: `ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327`

### Public Chain Configuration
- **Network**: Rayls Testnet
- **Chain ID**: `7295799`
- **RPC Endpoint**: `https://testnet-rpc.rayls.com`
- **Explorer**: `https://testnet-explorer.rayls.com`
- **Gas Token**: PAVEL

## Usage

### Open a Lending Position

```bash
node scripts/lendingAgent.js open \
  <lender_address> \
  <borrower_address> \
  <amount_usdc> \
  <rate_basis_points>
```

Example:
```bash
node scripts/lendingAgent.js open \
  0x1234567890abcdef1234567890abcdef12345678 \
  0x0987654321fedcba0987654321fedcba09876543 \
  1000000 \
  50
```

This opens a 1M USDC position at 50 bps/day (0.5%).

### Close a Lending Position

```bash
node scripts/lendingAgent.js close \
  <lender_address> \
  <borrower_address>
```

### Accrue Yield

```bash
node scripts/lendingAgent.js accrue \
  <lender_address> \
  <borrower_address>
```

### Deposit to Public Vault

From a wallet with USDC on the Public Chain:

```bash
cast send <PUBLIC_VAULT_ADDRESS> \
  "deposit(uint256)" \
  <amount_usdc> \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --private-key <your-key> --legacy
```

### Withdraw from Public Vault

```bash
cast send <PUBLIC_VAULT_ADDRESS> \
  "withdraw(uint256)" \
  <shares_amount> \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --private-key <your-key> --legacy
```

## Smart Contracts

### PublicVault (Public Chain)

- Accepts USDC deposits and mints vault shares
- Bridges deposits to Privacy Vault Coordinator
- Receives net settlement from daily rebalancer
- Updates NAV after each rebalance

**Key Functions:**
- `deposit(uint256 amount)` - Deposit USDC, receive shares
- `withdraw(uint256 shares)` - Burn shares, receive USDC
- `rebalanceAdd(uint256 amount)` - Add USDC from rebalance
- `rebalanceRemove(uint256 amount)` - Remove USDC for rebalance
- `getVaultStats()` - Get total assets, shares, NAV

### PrivacyVaultCoordinator (Privacy Node)

- Manages all lending positions
- Tracks net settlement for daily rebalance
- Only executes TEE-signed transfers via ActionGate

**Key Functions:**
- `receiveDeposit(uint256 amount)` - Receive bridged USDC
- `openLendingPosition(lender, borrower, amount, rate)` - Open lending position
- `closeLendingPosition(lender, borrower)` - Close position
- `accrueYield(lender, borrower)` - Accrue interest
- `getNetSettlement()` - Get net settlement amount
- `resetNetSettlement()` - Reset after rebalance

### ActionGate (Privacy Node)

- Verifies TEE signatures before executing transfers
- Enforces spending limits and approval thresholds
- Maintains nonces for replay protection

### TEERegistry (Privacy Node)

- Maps TEE code hashes to signer addresses
- Stores approval thresholds per code hash

### PolicyRegistry (Privacy Node)

- Stores policy content hashes on-chain
- Enables TEE to verify policy integrity

## Policy Tiers

### Conservative Bank
- Per-Tx: 5M USDC
- Daily: 20M USDC
- Approval: >2M requires 2 signatures (CFO + CRO)

### Standard Bank
- Per-Tx: 10M USDC
- Daily: 50M USDC
- Approval: >5M requires 1 signature (CRO)

### Institutional Bank
- Per-Tx: 50M USDC
- Daily: 200M USDC
- Approval: >20M requires 2 signatures (Board members)

### Daily Rebalancer
- Per-Tx: 100M USDC
- Daily: 500M USDC
- Approval: >50M requires 3 signatures (multisig)

## Security

- All private operations execute on Rayls Privacy Node
- Every transfer requires TEE-signed permit
- Nonces prevent replay attacks
- Multi-sig approvals for large transfers
- Full audit trail via AgentPermit
- Vault state never exposed on public chain

## Testing

### Test Full Flow

1. Deposit USDC to PublicVault on Public Chain
2. Wait for bridge to Privacy Node
3. Open lending position between two banks
4. Wait for yield accrual (1+ day)
5. Accrue yield via policy
6. Run daily rebalancer
7. Verify NAV updated on PublicVault

### Manual Test

```bash
# Check vault stats
cast call <PUBLIC_VAULT_ADDRESS> \
  "getVaultStats()" \
  --rpc-url $PUBLIC_CHAIN_RPC_URL

# Check net settlement
cast call <PRIVACY_COORDINATOR_ADDRESS> \
  "getNetSettlement()" \
  --rpc-url $PRIVACY_NODE_RPC_URL

# View lending position
cast call <PRIVACY_COORDINATOR_ADDRESS> \
  "getLendingPosition(address,address)(uint256,uint256,uint256,uint256,uint256,uint256,bool)" \
  <lender> <borrower> \
  --rpc-url $PRIVACY_NODE_RPC_URL
```

## Troubleshooting

### "TEE connection test failed"
- Check TEE_SERVICE_URL in .env
- Verify TEE service is running
- For mock mode, ensure MOCK_SIGNER_PRIVATE_KEY is set

### "Intent denied"
- Check policy limits (per-tx, daily)
- Verify allowed assets, chains, purpose codes
- Review denial reasons in response

### "Insufficient approvals"
- Approver signatures required for this amount
- Use AgentPermit web UI to submit approvals
- Check approvers are registered in policy

### "Nonce used"
- Each intent can only be executed once
- Create a new intent with fresh nonce

### Daily rebalance fails
- Check TEE connection test
- Verify daily limit not exceeded
- Ensure rebalancer has sufficient USDC on source chain

## License

MIT