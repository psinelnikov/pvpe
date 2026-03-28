import { z } from 'zod';

export const IntentSchema = z.object({
  intentId: z.string(),
  requestId: z.string(),
  orgId: z.string(),
  agentId: z.string(),
  actionType: z.enum(['TRANSFER']),
  asset: z.string().default('USDC'),
  amount: z.string(),
  to: z.string(),
  purposeCode: z.string(),
  chainId: z.number(),
  expiry: z.number(),
  nonce: z.string(),
  createdAt: z.number(),
});

export type Intent = z.infer<typeof IntentSchema>;

export const PolicySchema = z.object({
  policyId: z.string(),
  name: z.string(),
  perTxLimit: z.string(),
  dailyLimit: z.string(),
  allowedAssets: z.array(z.string()),
  allowedChains: z.array(z.number()),
  allowedPurposeCodes: z.array(z.string()),
  allowedRecipients: z.array(z.string()).optional(),
  deniedRecipients: z.array(z.string()).optional(),
  approvalRule: z.object({
    thresholdAmount: z.string(),
    required: z.number(),
    approvers: z.array(z.string()),
  }),
});

export type Policy = z.infer<typeof PolicySchema>;

export function hashIntent(intent: Intent): `0x${string}` {
  const encoded = new TextEncoder().encode(JSON.stringify(intent));
  const hash = crypto.subtle.digestSync('SHA-256', encoded);
  return `0x${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export function hashPolicy(policy: Policy): `0x${string}` {
  const encoded = new TextEncoder().encode(JSON.stringify(policy));
  const hash = crypto.subtle.digestSync('SHA-256', encoded);
  return `0x${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export function hashDecision(params: {
  intentHash: `0x${string}`;
  policyHash: `0x${string}`;
  codeHash: `0x${string}`;
  decisionStatus: 'APPROVED' | 'DENIED' | 'NEEDS_APPROVAL';
  expiry: number;
  nonce: string;
}): `0x${string}` {
  const encoded = new TextEncoder().encode(JSON.stringify(params));
  const hash = crypto.subtle.digestSync('SHA-256', encoded);
  return `0x${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}