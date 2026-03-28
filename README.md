# Private Vault Policy Engine - Complete Implementation

A TEE-enforced vault system for Swiss Bank Consortium lending, built on **Rayls Privacy Node** with AgentPermit policy enforcement. All lending operations execute privately while maintaining full regulatory compliance.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Rayls Public Chain            │
│  ┌──────────────────┐                          │
│  │  PublicVault     │  Public deposit/withdraw surface  │
│  │  (SCVS Token)   │  NAV visible to all                │
│  └──────────────────┘                          │
└────────────────┬────────────────────────────────────┘
               │ teleportToPrivacyNode()
               ▼
┌─────────────────────────────────────────────────────┐
│               Rayls Privacy Node                 │
│  ┌──────────────────┐                          │
│  │  PrivacyVault   │  Private lending operations      │
│  │  Coordinator    │  Yield accrual & accounting      │
│  │  ActionGate     │  TEE-signed permit verification │
│  │  TEERegistry    │  TEE signer registry            │
│  └──────────────────┘                          │
└────────────────┬────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│          AgentPermit API (MVP)                │
│  - Intent management                           │
│  - Policy evaluation (TEE-signed)                │
│  - Agent registration                          │
│  - Evidence tracking                           │
│  - Audit trail                                 │
│  - SQLite database (Prisma)                   │
└─────────────────────────────────────────────────────┘
```

## What's Included

### Smart Contracts
1. **PublicVault.sol** - Public chain vault with USDC deposits/withdrawals
2. **PrivacyVaultCoordinator.sol** - Private lending manager with yield accrual
3. **TEERegistry.sol** - TEE signer registry
4. **ActionGate.sol** - TEE permit verifier
5. **PolicyRegistry.sol** - On-chain policy hash storage

### Deployment Scripts
- `DeployVaultInfra.s.sol` - Privacy Node infrastructure
- `DeployPublicVault.s.sol` - Public chain vault
- `RegisterTEE.s.sol` - TEE signer registration

### AgentPermit API (MVP)
- Fastify server with SQLite database
- Intent management and decision flow
- Policy evaluation with TEE signing
- Agent registration and management
- Four policy tiers (Conservative, Standard, Institutional, Rebalancer)
- Multi-sig approval support
- Full audit trail

### Operational Agents
- `dailyRebalancer.js` - Cron job for automated daily settlement
- `lendingAgent.js` - CLI tool for vault operations

## Quick Start

### 1. Install Dependencies

```bash
# Install main dependencies
forge install
npm install

# Install API dependencies
cd api && npm install && cd ..

# Set up Prisma
npm run api:db:generate
npm run api:db:push
```

### 2. Configure Environment

```bash
cp .env.vault .env
cp api/.env.example api/.env
# Edit both files with your values
```

### 3. Deploy Infrastructure

```bash
source .env

# Deploy Privacy Node contracts
forge script script/DeployVaultInfra.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy

# Deploy Public Chain vault
forge script script/DeployPublicVault.s.sol \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --broadcast --legacy

# Register TEE signer
forge script script/RegisterTEE.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

Save contract addresses to `.env`.

### 4. Start AgentPermit API

```bash
cd api
npm run dev
```

API will be available at `http://localhost:3001`

### 5. Bootstrap API Key

```bash
curl -X POST http://localhost:3001/admin/api-keys/bootstrap \
  -H "Content-Type: "application/json" \
  -d '{"orgId": "swiss_consortium", "name": "Admin Key"}'
```

Save the API key to `.env`.

### 6. Configure Policies

```bash
node scripts/configurePolicies.js
```

### 7. Register Agents

```bash
node scripts/registerAgents.js
```

### 8. Set Up Daily Rebalancer

```bash
# Add to crontab
0 0 * * * cd /path/to/rayls-hackathon-starter && node scripts/dailyRebalancer.js
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Intent Management
```bash
POST /intents                    # Create intent
GET  /intents                    # List intents
GET  /intents/:id                 # Get intent
POST /intents/:id/decide          # Evaluate policy & sign
POST /intents/:id/approve        # Submit approval
```

### Agents
```bash
GET  /agents                       # List agents
GET  /agents/:id                    # Get agent
POST /agents                       # Register agent
PUT  /agents/:id                    # Update agent
GET  /agents/:id/intents             # Agent's intents
GET  /agents/:id/stats              # Agent stats
POST /agents/:id/run                # Autonomous execution
```

### Policies
```bash
GET  /policies                     # List policies
GET  /policies/:policyId            # Get policy
POST /policies                     # Create policy
PUT  /policies/:policyId            # Update policy
```

### Evidence
```bash
POST /evidence                     # Register evidence
GET  /evidence/:id                 # Get evidence
GET  /evidence/:id/anchor-status    # Check anchor status
```

### ProofPacks
```bash
GET  /proofpacks/:intentId          # Get proof pack
```

### Admin
```bash
POST /admin/api-keys/bootstrap       # Create first API key
GET  /admin/api-keys                # List API keys
POST /admin/api-keys                # Create additional key
DELETE /admin/api-keys/:id           # Revoke key
GET  /admin/org-stats              # Organization stats
GET  /admin/audit-log              # Audit log
GET  /admin/signer-config          # Get signer config
PUT  /admin/signer-config          # Update signer config
POST /admin/signer-config/test     # Test TEE connection
```

## Usage Examples

### Open Lending Position

```bash
node scripts/lendingAgent.js open \
  0xLenderAddress \
  0xBorrowerAddress \
  1000000 \
  50
```

### Close Lending Position

```bash
node scripts/lendingAgent.js close \
  0xLenderAddress \
  0xBorrowerAddress
```

### Accrue Yield

```bash
node scripts/lendingAgent.js accrue \
  0xLenderAddress \
  0xBorrowerAddress
```

### Deposit to Public Vault

```bash
cast send <PUBLIC_VAULT_ADDRESS> \
  "deposit(uint256)" \
  <amount_usdc> \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --private-key <your-key> --legacy
```

### Run Daily Rebalancer

```bash
node scripts/dailyRebalancer.js
```

## Project Structure

```
rayls-hackathon-starter/
├── api/                          # AgentPermit API MVP
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── src/
│   │   ├── routes/                 # API endpoints
│   │   │   ├── agents.ts
│   │   │   ├── intets.ts
│   │   │   ├── policies.ts
│   │   │   ├── admin.ts
│   │   │   ├── evidence.ts
│   │   │   └── proofpacks.ts
│   │   ├── services/
│   │   │   ├── policy.service.ts
│   │   │   └── signer.service.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── types/
│   │   │   └── schemas.ts
│   │   ├── server.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── src/                           # Smart contracts
│   ├── PublicVault.sol
│   ├── PrivacyVaultCoordinator.sol
│   ├── PolicyRegistry.sol
│   ├── TEERegistry.sol
│   ├── ActionGate.sol
│   └── interfaces/
│
├── script/                        # Deployment scripts
│   ├── DeployVaultInfra.s.sol
│   ├── DeployPublicVault.s.sol
│   └── RegisterTEE.s.sol
│
├── scripts/                       # Operational agents
│   ├── configurePolicies.js
│   ├── registerAgents.js
│   ├── dailyRebalancer.js
│   └── lendingAgent.js
│
├── .env.vault                    # Environment template
├── VAULT_README.md               # User documentation
└── package.json
```

## Policy Tiers

### Conservative Bank
- Per-Tx: 5M USDC
- Daily: 20M USDC
- Approval: >2M requires 2 signatures

### Standard Bank
- Per-Tx: 10M USDC
- Daily: 50M USDC
- Approval: >5M requires 1 signature

### Institutional Bank
- Per-Tx: 50M USDC
- Daily: 200M USDC
- Approval: >20M requires 2 signatures

### Daily Rebalancer
- Per-Tx: 100M USDC
- Daily: 500M USDC
- Approval: >50M requires 3 signatures

## Security

- All private operations on Rayls Privacy Node
- TEE-signed permits required for all transfers
- Nonce-based replay protection
- Multi-sig approvals for large transfers
- Full audit trail via AgentPermit
- Vault state never exposed on public chain
- API key authentication with organization scoping

The system operates purely on Rayls chains with local SQLite database.

## License

MIT