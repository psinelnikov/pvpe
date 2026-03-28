import type { Policy, Intent } from '../types/schemas.js';

export interface EvaluationResult {
  status: 'APPROVED' | 'DENIED' | 'NEEDS_APPROVAL';
  approvalsRequired: number;
  reasons: string[];
}

export function evaluate(intent: Intent, policy: Policy): EvaluationResult {
  const reasons: string[] = [];
  const amount = BigInt(intent.amount);
  const perTxLimit = BigInt(policy.perTxLimit);

  if (policy.deniedRecipients && policy.deniedRecipients.includes(intent.to)) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Recipient ${intent.to} is in denylist`],
    };
  }

  if (policy.allowedRecipients && policy.allowedRecipients.length > 0 && !policy.allowedRecipients.includes(intent.to)) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Recipient ${intent.to} is not in allowlist`],
    };
  }

  if (!policy.allowedAssets.includes(intent.asset)) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Asset ${intent.asset} is not allowed`],
    };
  }

  if (!policy.allowedChains.includes(intent.chainId)) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Chain ${intent.chainId} is not allowed`],
    };
  }

  if (!policy.allowedPurposeCodes.includes(intent.purposeCode)) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Purpose code ${intent.purposeCode} is not allowed`],
    };
  }

  if (amount > perTxLimit) {
    return {
      status: 'DENIED',
      approvalsRequired: 0,
      reasons: [`Amount ${intent.amount} exceeds per-transaction limit ${policy.perTxLimit}`],
    };
  }

  const thresholdAmount = BigInt(policy.approvalRule.thresholdAmount);
  if (amount > thresholdAmount) {
    return {
      status: 'NEEDS_APPROVAL',
      approvalsRequired: policy.approvalRule.required,
      reasons: [],
    };
  }

  return {
    status: 'APPROVED',
    approvalsRequired: 0,
    reasons: [],
  };
}

export async function getPolicy(policyId: string): Promise<Policy> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const policyRecord = await prisma.policy.findUnique({ where: { policyId } });
  if (!policyRecord) {
    throw new Error(`Policy not found: ${policyId}`);
  }

  return JSON.parse(policyRecord.rulesJson) as Policy;
}