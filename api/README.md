# AgentPermit API for Rayls Vault

Minimal MVP of the AgentPermit API adapted for Rayls vault operations.

## Architecture

```
┌─────────────────────────────────────────────┐
│       AgentPermit API (Fastify)             │
│  ┌──────────────────────────────────┐       │
│  │  Intent Management               │       │
│  │  Policy Evaluation               │       │
│  │  TEE Signing                     │       │
│  │  Evidence Tracking               │       │
│  └──────────────────────────────────┘       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│       SQLite Database (Prisma)              │
│  - Intents, Decisions, Approvals            │
│  - Policies, Agents, API Keys               │
│  - Audit Log, Signer Config                 │
└─────────────────────────────────────────────┘
```

## Features

- **Intent Management**: Create, decide, approve intents
- **Policy Engine**: Rule evaluation (amount, asset, chain, purpose codes)
- **TEE Signing**: Mock or FCC mode for cryptographic signing
- **Agent Management**: Register bank agents and Daily Rebalancer
- **Policy Tiers**: Conservative, Standard, Institutional, Rebalancer
- **Multi-sig Approvals**: Threshold-based approval system
- **Audit Trail**: Full activity logging per organization
- **Evidence Tracking**: Onchain transaction registration

## Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Database

```bash
npm run db:push
```

### 3. Configure Environment

```bash
cp ../.env.vault .env
# Edit with your values
```

Required variables:
```env
DATABASE_URL=file:./dev.db
PORT=3001
FRONTEND_URL=http://localhost:3000
PRIVACY_NODE_RPC_URL=http://localhost:8545
SIGNER_MODE=mock
MOCK_SIGNER_PRIVATE_KEY=<your-key>
```

### 4. Start API Server

```bash
npm run dev
```

API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "ts": 17116871234567
}
```

### API Key Management

#### Bootstrap First Key (No Auth Required)

```http
POST /admin/api-keys/bootstrap
Content-Type: application/json

{
  "orgId": "swiss_consortium",
  "name": "Admin Key"
}
```

Response (201):
```json
{
  "id": "uuid",
  "key": "ap_3f8a1b2c9d4e...",
  "prefix": "ap_3f8a1b",
  "orgId": "swiss_consortium",
  "name": "Admin Key",
  "message": "Save this key — it will not be shown again."
}
```

#### Create Additional Key (Authenticated)

```http
POST /admin/api-keys
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "name": "CI/CD Key",
  "scopes": "read,write"
}
```

#### List Keys

```http
GET /admin/api-keys
Authorization: Bearer ap_xxxx
```

#### Revoke Key

```http
DELETE /admin/api-keys/:id
Authorization: Bearer ap_xxxx
```

### Policies

#### List All Policies

```http
GET /policies
Authorization: Bearer ap_xxxx
```

#### Get Policy

```http
GET /policies/:policyId
Authorization: Bearer ap_xxxx
```

#### Create Policy

```http
POST /policies
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "policyId": "pol_conservative_bank",
  "name": "Conservative Bank Policy",
  "perTxLimit": "5000000000000",
  "dailyLimit": "20000000000000",
  "allowedAssets": ["USDC"],
  "allowedChains": [99999],
  "allowedPurposeCodes": ["inter_bank_lending", "yield_accrual", "rebalance_add", "rebalance_remove"],
  "approvalRule": {
    "thresholdAmount": "2000000000000",
    "required": 2,
    "approvers": ["0xCFO...", "0xCRO..."]
  }
}
```

#### Update Policy

```http
PUT /policies/:policyId
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "perTxLimit": "10000000000000"
}
```

### Agents

#### List Agents

```http
GET /agents
Authorization: Bearer ap_xxxx
```

#### Get Agent

```http
GET /agents/:agentId
Authorization: Bearer ap_xxxx
```

#### Register Agent

```http
POST /agents
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "agentId": "bank_standard_01",
  "name": "Standard Bank 01",
  "walletAddr": "0x1234...",
  "privateKey": "0xdead...",
  "policyId": "pol_standard_bank",
  "orgId": "swiss_consortium",
  "chainId": 99999,
  "tokenAddr": "0xUSDC...",
  "gateAddr": "0xGate..."
}
```

#### Update Agent

```http
PUT /agents/:agentId
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "active": false
}
```

#### Get Agent Intents

```http
GET /agents/:agentId/intents?status=APPROVED&limit=20
Authorization: Bearer ap_xxxx
```

#### Get Agent Stats

```http
GET /agents/:agentId/stats
Authorization: Bearer ap_xxxx
```

Response:
```json
{
  "total": 47,
  "approved": 38,
  "denied": 6,
  "needsApproval": 3,
  "totalVolume": "15760000000"
}
```

#### Run Agent (Autonomous Execution)

```http
POST /agents/:agentId/run
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "amount": "1000000",
  "to": "0xRecipient...",
  "asset": "USDC",
  "purposeCode": "vendor_payment"
}
```

Response (Success):
```json
{
  "intentId": "uuid",
  "intentHash": "0x...",
  "decisionStatus": "APPROVED",
  "reasons": [],
  "executed": true,
  "txHash": "0x...",
  "blockNumber": 12345678,
  "gasUsed": "85432"
}
```

Response (Denied):
```json
{
  "intentId": "uuid",
  "intentHash": "0x...",
  "decisionStatus": "DENIED",
  "reasons": ["Amount exceeds per-transaction limit"],
  "executed": false
}
```

### Intents

#### Create Intent

```http
POST /intents
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "requestId": "req_unique_123",
  "orgId": "swiss_consortium",
  "agentId": "bank_standard_01",
  "actionType": "TRANSFER",
  "asset": "USDC",
  "amount": "1000000",
  "to": "0xRecipient...",
  "purposeCode": "inter_bank_lending",
  "chainId": 99999,
  "expiry": 1711690723,
  "nonce": "nonce_abc123",
  "createdAt": 1711687123
}
```

Response (201):
```json
{
  "intentId": "uuid",
  "intentHash": "0x..."
}
```

#### List Intents

```http
GET /intents?agentId=bank_standard_01&status=APPROVED&limit=50
Authorization: Bearer ap_xxxx
```

#### Get Intent

```http
GET /intents/:intentId
Authorization: Bearer ap_xxxx
```

#### Decide Intent

```http
POST /intents/:intentId/decide
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "policyId": "pol_standard_bank"
}
```

Response:
```json
{
  "intentHash": "0x...",
  "policyHash": "0x...",
  "codeHash": "0x...",
  "decisionStatus": "APPROVED",
  "decisionHash": "0x...",
  "expiry": 1711690723,
  "nonce": "0x...",
  "signerType": "MOCK",
  "teeSignature": "0x...",
  "teeIdentity": null,
  "approvalsRequired": 0,
  "reasons": null
}
```

Decision Statuses:
- `APPROVED` - All rules passed, ready for execution
- `DENIED` - One or more rules failed
- `NEEDS_APPROVAL` - Amount exceeds threshold, requires human signatures

#### Submit Approval

```http
POST /intents/:intentId/approve
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "approver": "0xCFO...",
  "signature": "0xSignedDecisionHash..."
}
```

Response:
```json
{
  "approvalId": "uuid",
  "approvalHash": "0x...",
  "approvalsCollected": 1,
  "approvalsRequired": 2,
  "thresholdMet": false
}
```

### Evidence

#### Register Evidence

```http
POST /evidence
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "intentId": "uuid",
  "txHash": "0xTransactionHash...",
  "chain": "99999",
  "amount": "1000000",
  "asset": "USDC",
  "from": "0xSender...",
  "to": "0xRecipient..."
}
```

#### Get Evidence

```http
GET /evidence/:evidenceId
Authorization: Bearer ap_xxxx
```

#### Check Anchor Status

```http
GET /evidence/:evidenceId/anchor-status
Authorization: Bearer ap_xxxx
```

### ProofPacks

#### Get ProofPack

```http
GET /proofpacks/:intentId
Authorization: Bearer ap_xxxx
```

Response:
```json
{
  "id": "uuid",
  "intentId": "uuid",
  "intentHash": "0x...",
  "policyHash": "0x...",
  "codeHash": "0x...",
  "decisionHash": "0x...",
  "teeSignature": "0x...",
  "teeIdentity": null,
  "signerType": "MOCK",
  "executionTxHash": "0x...",
  "bundleUrl": null,
  "anchorHash": null,
  "anchorTxHash": null,
  "status": "settled",
  "evidenceRefs": [...],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Admin

#### Organization Stats

```http
GET /admin/org-stats
Authorization: Bearer ap_xxxx
```

Response:
```json
{
  "agents": 3,
  "intents": 47,
  "approved": 38,
  "denied": 6,
  "needsApproval": 3,
  "totalVolume": "15760000000",
  "agentList": [...]
}
```

#### Audit Log

```http
GET /admin/audit-log?limit=50&action=intent.created
Authorization: Bearer ap_xxxx
```

#### Signer Configuration

```http
GET /admin/signer-config
Authorization: Bearer ap_xxxx
```

```http
PUT /admin/signer-config
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "mode": "fcc",
  "endpoint": "https://tee-service.example.com:8001",
  "codeHash": "0x..."
}
```

#### Test TEE Connection

```http
POST /admin/signer-config/test
Authorization: Bearer ap_xxxx
Content-Type: application/json

{
  "endpoint": "https://tee-service.example.com:8001"
}
```

Response:
```json
{
  "status": "Connected"
}
```

Status values:
- `Connected` - TEE health check passed
- `Reachable` - Service responds but no health endpoint
- `Unreachable` - Cannot reach endpoint

## Policy Evaluation Order

Rules are evaluated in strict order. First failing rule (except approval) → `DENIED`.

| Step | Rule | Outcome on Fail |
|-------|-------|-----------------|
| 1 | Denylist check | DENIED immediately |
| 2 | Allowlist check | DENIED if allowlist set and recipient absent |
| 3 | Asset check | DENIED |
| 4 | Chain check | DENIED |
| 5 | Purpose code check | DENIED |
| 6 | Per-transaction limit | DENIED |
| 7 | Approval threshold | NEEDS_APPROVAL |
| 8 | All rules pass | APPROVED |

## Error Responses

All errors return JSON with `error` field:

```json
{
  "error": "Error message",
  "message": "Additional details (optional)"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (revoked key, insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

## Database Schema

| Model | Purpose |
|-------|---------|
| `Intent` | Declared agent actions |
| `Decision` | Policy evaluation results with TEE signatures |
| `Approval` | Human approval signatures for multi-sig |
| `Evidence` | On-chain execution proofs |
| `ProofPack` | Bundled cryptographic evidence |
| `Policy` | Spending rules and limits |
| `Agent` | Registered AI agents |
| `ApiKey` | Authentication keys |
| `AuditLog` | Activity tracking |
| `SignerConfig` | TEE/signer mode configuration |

## Development

### Generate Prisma Client

```bash
npm run db:generate
```

### Push Schema Changes

```bash
npm run db:push
```

### Reset Database

```bash
npx prisma db push --force-reset
```

### Build TypeScript

```bash
npm run build
```

## Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Bootstrap API Key

```bash
curl -X POST http://localhost:3001/admin/api-keys/bootstrap \
  -H "Content-Type: "application/json" \
  -d '{"orgId": "test_org", "name": "Test Key"}'
```

### Create Intent

```bash
curl -X POST http://localhost:3001/intents \
  -H "Authorization: Bearer ap_xxxx" \
  -H "Content-Type: "application/json" \
  -d '{
    "requestId": "test_001",
    "orgId": "test_org",
    "agentId": "agent_test",
    "actionType": "TRANSFER",
    "asset": "USDC",
    "amount": "1000000",
    "to": "0xRecipient...",
    "purposeCode": "vendor_payment",
    "chainId": 99999,
    "expiry": 9999999999,
    "nonce": "nonce_test"
  }'
```

### Decide Intent

```bash
curl -X POST http://localhost:3001/intents/<intentId>/decide \
  -H "Authorization: Bearer ap_xxxx" \
  -H "Content-Type: "application/json" \
  -d '{"policyId": "pol_standard_bank"}'
```

## License

MIT