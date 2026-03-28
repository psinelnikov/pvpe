import type { Intent, Policy } from '../types/schemas.js';

export interface SignerResponse {
  signerType: 'MOCK' | 'FCC';
  codeHash: `0x${string}`;
  decisionHash: `0x${string}`;
  teeSignature: `0x${string}`;
  teeIdentity?: string;
}

export interface SignerOptions {
  endpoint?: string;
  codeHash?: `0x${string}`;
}

export function createSigner(
  mode: 'mock' | 'fcc',
  options?: SignerOptions
) {
  if (mode === 'mock') {
    return new MockSigner();
  }

  return new FCCSigner(options);
}

export interface Signer {
  getCodeHash(): `0x${string}`;
  sign(params: SignParams): Promise<SignerResponse>;
}

export interface SignParams {
  mode: 'SIGN_HASH' | 'FULL_COMPUTE';
  intent?: Intent;
  policy?: Policy;
  intentHash?: `0x${string}`;
  policyHash?: `0x${string}`;
  decisionHash?: `0x${string}`;
  codeHash?: `0x${string}`;
}

class MockSigner implements Signer {
  private codeHash: `0x${string}`;

  constructor() {
    this.codeHash = '0x' + 'a'.repeat(64);
  }

  getCodeHash(): `0x${string}` {
    return this.codeHash;
  }

  async sign(params: SignParams): Promise<SignerResponse> {
    const decisionHash = params.decisionHash || this._hashDecision(params);
    const signature = this._sign(decisionHash);

    return {
      signerType: 'MOCK',
      codeHash: this.codeHash,
      decisionHash: decisionHash as `0x${string}`,
      teeSignature: signature,
    };
  }

  private _hashDecision(params: SignParams): string {
    const data = params.decisionHash || JSON.stringify(params);
    const encoded = new TextEncoder().encode(data);
    const hash = crypto.subtle.digestSync('SHA-256', encoded);
    return `0x${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  private _sign(data: string): `0x${string}` {
    const encoded = new TextEncoder().encode(data);
    const hash = crypto.subtle.digestSync('SHA-256', encoded);
    const hashBytes = new Uint8Array(hash);
    
    const privateKey = process.env.MOCK_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('MOCK_SIGNER_PRIVATE_KEY not set');
    }

    return `0x${Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }
}

class FCCSigner implements Signer {
  private endpoint: string;
  private codeHash: `0x${string}`;

  constructor(options?: SignerOptions) {
    this.endpoint = options?.endpoint || process.env.TEE_SERVICE_URL || 'http://localhost:8001';
    this.codeHash = options?.codeHash || process.env.FCC_CODE_HASH || '0x' + 'a'.repeat(64);
  }

  getCodeHash(): `0x${string}` {
    return this.codeHash;
  }

  async sign(params: SignParams): Promise<SignerResponse> {
    if (params.mode === 'FULL_COMPUTE') {
      return this._fullCompute(params);
    }

    if (!params.decisionHash || !params.codeHash) {
      throw new Error('decisionHash and codeHash required for SIGN_HASH mode');
    }

    const signature = await this._callTEE({
      mode: 'SIGN_HASH',
      decisionHash: params.decisionHash,
      codeHash: params.codeHash,
    });

    return {
      signerType: 'FCC',
      codeHash: this.codeHash,
      decisionHash: params.decisionHash as `0x${string}`,
      teeSignature: signature.signature,
      teeIdentity: signature.identity,
    };
  }

  private async _fullCompute(params: SignParams): Promise<SignerResponse> {
    if (!params.intent || !params.policy || !params.intentHash || !params.policyHash) {
      throw new Error('intent, policy, intentHash, and policyHash required for FULL_COMPUTE mode');
    }

    const result = await this._callTEE({
      mode: 'FULL_COMPUTE',
      intent: params.intent,
      policy: params.policy,
      intentHash: params.intentHash,
      policyHash: params.policyHash,
    });

    return {
      signerType: 'FCC',
      codeHash: this.codeHash,
      decisionHash: result.decisionHash,
      teeSignature: result.signature,
      teeIdentity: result.identity,
    };
  }

  private async _callTEE(params: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.endpoint}/v1/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TEE service error: ${error}`);
    }

    return response.json();
  }
}