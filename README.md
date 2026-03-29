# Private Vault Policy Engine - Cross-Chain Minting System

🏆 **Hackathon Project** - A revolutionary TEE-enforced vault system for Swiss Bank Consortium lending with **cross-chain minting from private to public chain**. Built on **Rayls Privacy Node** with AgentPermit policy enforcement, enabling private lending operations with public chain liquidity transparency.

## 🚀 Key Innovation: Private-to-Public Minting

This system introduces a groundbreaking cross-chain architecture where **vault shares are minted from the private chain to the public chain**, ensuring:

- 🔐 **Private Control**: All minting decisions made on the privacy node
- 🌐 **Public Liquidity**: Shares visible and tradable on public chain
- ⚡ **Instant Settlement**: Cross-chain minting via secure bridges
- 🛡️ **TEE Security**: Trusted Execution Environment enforces all policies

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Rayls Public Chain            │
│  ┌──────────────────┐                          │
│  │  PublicVault     │  USDC deposits → No direct minting  │
│  │  (SCVS Token)   │  Shares minted by private chain     │
│  │  NAV visible    │  Full transparency on public chain  │
│  └──────────────────┘                          │
└────────────────┬────────────────────────────────────┘
               │ deposit() + bridgeToPrivate()
               ▼
┌─────────────────────────────────────────────────────┐
│               Rayls Privacy Node                 │
│  ┌──────────────────┐                          │
│  │  PrivacyVault   │  Receives bridged USDC              │
│  │  Coordinator    │  Calculates shares based on NAV     │
│  │  ActionGate     │  Calls mintFromPrivate() on public   │
│  │  TEERegistry    │  TEE-signed permit verification     │
│  └──────────────────┘  Cross-chain minting authority    │
└────────────────┬────────────────────────────────────┘
               │ mintFromPrivate() → PublicVault
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

## 🎯 Hackathon Highlights

### 🏦 Swiss Banking Meets DeFi
- **Regulatory Compliance**: TEE-enforced policies meet traditional banking standards
- **Privacy-Preserving**: All lending operations executed privately on Rayls Privacy Node
- **Public Liquidity**: Vault shares minted on public chain for transparency and accessibility

### 🔗 Cross-Chain Innovation
- **Private→Public Minting**: First-of-its-kind architecture where private chain controls public token minting
- **Secure Bridging**: USDC flows from public to private, shares flow back to public
- **Real-time NAV**: Net Asset Value calculated on private chain, reflected on public chain

### 🛡️ Enterprise Security
- **TEE Enforcement**: All operations require Trusted Execution Environment signatures
- **Multi-Sig Approvals**: Tiered approval system for different transaction sizes
- **Audit Trail**: Complete transaction history via AgentPermit API
- **Policy Tiers**: Four distinct policy levels for different bank types

## What's Included

### 🎨 Frontend Interface
A modern React + Vite + Tailwind CSS web interface:
- **Bridge Page**: Cross-chain USDC deposits with private→public minting
- **Dashboard**: Real-time vault statistics and NAV tracking
- **Agent Management**: Register and monitor AI lending agents
- **Intent Management**: Policy evaluation with TEE signing
- **TEE Demo**: Interactive Trusted Execution Environment demonstration

### 🔧 Smart Contracts
1. **PublicVault.sol** - Public vault with cross-chain minting capabilities
2. **PrivacyVaultCoordinator.sol** - Private chain minting authority
3. **TEERegistry.sol** - TEE signer registry
4. **ActionGate.sol** - TEE permit verifier
5. **PolicyRegistry.sol** - On-chain policy storage

### 🚀 Deployment & Operations
- **Cross-chain deployment scripts** for both public and private chains
- **Daily rebalancer** for automated settlement
- **Lending agents** for private banking operations
- **Policy configuration** for different bank tiers

### 🌐 AgentPermit API
- Fastify server with SQLite database
- Intent management and TEE decision flow
- Multi-tier policy evaluation
- Agent registration and monitoring
- Complete audit trail system

## 🏆 Competitive Advantages

### 1. **True Privacy with Public Benefits**
- Private lending operations protect sensitive financial data
- Public vault shares provide liquidity and transparency
- Best of both worlds: privacy + accessibility

### 2. **Regulatory Ready**
- TEE enforcement provides cryptographic proof of compliance
- Multi-sig approvals meet traditional banking controls
- Complete audit trail for regulatory reporting

### 3. **Scalable Architecture**
- Cross-chain design separates concerns efficiently
- Agent-based system enables automated operations
- Policy-driven approach allows easy configuration

### 4. **Developer Friendly**
- Comprehensive API with clear documentation
- Modern frontend with intuitive UX
- Extensible smart contract architecture

## Quick Start

### 1. Install Dependencies

```bash
# Install main dependencies
forge install
npm install

# Install API dependencies
cd api && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

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

### 3. Deploy Cross-Chain Infrastructure

```bash
source .env

# Deploy Privacy Node contracts (minting authority)
forge script script/DeployVaultInfra.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy

# Deploy Public Chain vault (receives private minting)
forge script script/DeployPublicVault.s.sol \
  --rpc-url $PUBLIC_CHAIN_RPC_URL \
  --broadcast --legacy

# Register TEE signer
forge script script/RegisterTEE.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

### 4. Start Services

```bash
# Start AgentPermit API
cd api && npm run dev

# Start Frontend (new terminal)
cd frontend && npm run dev
```

### 5. Experience Cross-Chain Minting

1. Navigate to `http://localhost:5173`
2. Go to the **Bridge** page
3. Select **"Deposit to Vault"**
4. Deposit USDC and watch as shares are **minted from private chain to public chain**

## 🎯 Use Cases

### 🏦 Swiss Banking Consortium
- **Private Lending**: Banks can lend privately while maintaining public liquidity
- **Regulatory Compliance**: TEE enforcement provides cryptographic proof
- **Capital Efficiency**: Public vault shares enable secondary markets

### 💰 DeFi Integration
- **Yield Farming**: Private lending strategies with public token representation
- **Liquidity Pools**: Vault shares can be used in public DeFi protocols
- **Cross-chain Arbitrage**: Price discovery across private and public markets

### 🤖 AI Agent Operations
- **Autonomous Lending**: AI agents can operate privately with public accountability
- **Policy Enforcement**: TEE ensures agents follow predefined rules
- **Risk Management**: Multi-tier policies prevent excessive exposure

## 📊 Technical Specifications

### 🔗 Cross-Chain Flow
1. **User deposits USDC** → PublicVault.deposit()
2. **USDC bridges to private** → PrivacyVaultCoordinator.receiveDepositFromPublic()
3. **Private calculates shares** → Based on NAV and deposit amount
4. **Private mints shares** → PublicVault.mintFromPrivate()
5. **User receives SCVS** → Vault shares on public chain

### 🛡️ Security Features
- **TEE-signed permits** for all operations
- **Nonce-based replay protection**
- **Multi-sig approvals** for large transactions
- **Complete audit trail** via AgentPermit
- **Cross-chain validation** between chains

### 📈 Performance Metrics
- **Sub-second cross-chain minting**
- **Real-time NAV calculation**
- **High-throughput private operations**
- **Scalable agent architecture**

## 🏆 Hackathon Impact

This project demonstrates the future of regulated DeFi by:

1. **Bridging Traditional Finance & DeFi**: Swiss banking standards meet blockchain innovation
2. **Enabling True Privacy**: Sensitive financial operations remain private
3. **Providing Public Benefits**: Liquidity and transparency on public chain
4. **Ensuring Compliance**: TEE enforcement provides regulatory-ready solutions
5. **Scalable Architecture**: Built for enterprise deployment

## 📚 Documentation

- **VAULT_README.md**: Detailed user guide
- **docs/integration-guide.md**: Technical integration documentation
- **docs/api-reference.md**: Complete API documentation

## 🎉 Get Started

Ready to experience the future of private banking with public liquidity?

```bash
git clone https://github.com/psinelnikov/pvpe.git
cd pvpe
# Follow the Quick Start guide above
```

**See the cross-chain minting in action at the Bridge page!**

---

## License

MIT