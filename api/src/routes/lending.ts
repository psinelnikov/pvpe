import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';

let lendingStatus = {
  deposited: false,
  bridged: false,
  positionOpened: false,
  yieldAccrued: false,
  yieldClaimed: false,
  rebalanced: false,
  navUpdated: false,
};

let navValue = '1000000.00';

export const lendingRoutes: FastifyPluginAsync = async (app) => {
  app.post('/deposit', async (req, reply) => {
    const body = req.body as { amount: string; asset: string };

    if (!body.amount || parseFloat(body.amount) <= 0) {
      return reply.code(400).send({ error: 'Invalid deposit amount' });
    }

    lendingStatus.deposited = true;

    return reply.code(200).send({
      success: true,
      amount: body.amount,
      asset: body.asset,
      vaultAddress: '0x1234567890abcdef1234567890abcdef12345678',
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  });

  app.post('/bridge', async (req, reply) => {
    if (!lendingStatus.deposited) {
      return reply.code(400).send({ error: 'Please deposit first' });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    lendingStatus.bridged = true;

    return reply.code(200).send({
      success: true,
      status: 'completed',
      bridgeTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      privacyNodeAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    });
  });

  app.post('/position', async (req, reply) => {
    const body = req.body as { bankA: string; bankB: string };

    if (!body.bankA || !body.bankB) {
      return reply.code(400).send({ error: 'Both banks must be specified' });
    }

    if (body.bankA === body.bankB) {
      return reply.code(400).send({ error: 'Banks must be different' });
    }

    if (!lendingStatus.bridged) {
      return reply.code(400).send({ error: 'Please wait for bridge to complete' });
    }

    lendingStatus.positionOpened = true;

    return reply.code(200).send({
      success: true,
      positionId: `pos_${Date.now()}`,
      bankA: body.bankA,
      bankB: body.bankB,
      amount: '1000000',
      interestRate: '0.05',
      term: '30d',
      positionTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  });

  app.post('/yield/wait', async (req, reply) => {
    if (!lendingStatus.positionOpened) {
      return reply.code(400).send({ error: 'Please open a lending position first' });
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    lendingStatus.yieldAccrued = true;

    return reply.code(200).send({
      success: true,
      daysAccrued: 1,
      yieldAmount: '1369.86',
      apy: '0.05',
      timestamp: Date.now(),
    });
  });

  app.post('/yield/accrue', async (req, reply) => {
    if (!lendingStatus.yieldAccrued) {
      return reply.code(400).send({ error: 'Please wait for yield to accrue first' });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    lendingStatus.yieldClaimed = true;
    const currentNAV = parseFloat(navValue);
    const yieldAmount = 1369.86;
    navValue = (currentNAV + yieldAmount).toFixed(2);

    return reply.code(200).send({
      success: true,
      yieldAccrued: yieldAmount.toString(),
      newNAV: navValue,
      policyId: 'pol_standard_bank',
      accrualTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  });

  app.post('/rebalance', async (req, reply) => {
    if (!lendingStatus.yieldClaimed) {
      return reply.code(400).send({ error: 'Please accrue yield first' });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    lendingStatus.rebalanced = true;

    const rebalancedPositions = [
      { bankA: 'bank_alpha', bankB: 'bank_beta', amount: '500000' },
      { bankA: 'bank_beta', bankB: 'bank_gamma', amount: '300000' },
      { bankA: 'bank_gamma', bankB: 'bank_alpha', amount: '200000' },
    ];

    return reply.code(200).send({
      success: true,
      rebalancedPositions,
      totalValue: navValue,
      rebalanceTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: Date.now(),
    });
  });

  app.get('/nav/verify', async (req, reply) => {
    if (!lendingStatus.rebalanced) {
      return reply.code(400).send({ error: 'Please run rebalancer first' });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    lendingStatus.navUpdated = true;

    const currentNAV = parseFloat(navValue);
    const updatedNAV = (currentNAV * 1.001).toFixed(2);
    navValue = updatedNAV;

    return reply.code(200).send({
      success: true,
      previousNAV: currentNAV.toFixed(2),
      updatedNAV,
      change: ((parseFloat(updatedNAV) - currentNAV)).toFixed(2),
      changePercent: '0.10',
      publicVaultAddress: '0x1234567890abcdef1234567890abcdef12345678',
      verificationTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  });

  app.get('/status', async (req, reply) => {
    return reply.send({
      status: lendingStatus,
      navValue,
    });
  });
};
