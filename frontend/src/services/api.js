const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getAuthHeaders() {
    const apiKey = localStorage.getItem('api_key');
    return apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return response.status === 204 ? null : await response.json();
    } catch (error) {
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(query ? `${endpoint}?${query}` : endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  async put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  healthCheck() {
    return this.get('/health');
  }

  bootstrapApiKey(data) {
    return this.post('/admin/api-keys/bootstrap', data);
  }

  getApiKeys() {
    return this.get('/admin/api-keys');
  }

  createApiKey(data) {
    return this.post('/admin/api-keys', data);
  }

  deleteApiKey(id) {
    return this.delete(`/admin/api-keys/${id}`);
  }

  getOrgStats() {
    return this.get('/admin/org-stats');
  }

  getAuditLog(params) {
    return this.get('/admin/audit-log', params);
  }

  getSignerConfig() {
    return this.get('/admin/signer-config');
  }

  updateSignerConfig(data) {
    return this.put('/admin/signer-config', data);
  }

  testTEEConnection(data) {
    return this.post('/admin/signer-config/test', data);
  }

  getPolicies() {
    return this.get('/policies');
  }

  getPolicy(policyId) {
    return this.get(`/policies/${policyId}`);
  }

  createPolicy(data) {
    return this.post('/policies', data);
  }

  updatePolicy(policyId, data) {
    return this.put(`/policies/${policyId}`, data);
  }

  getAgents() {
    return this.get('/agents');
  }

  getAgent(agentId) {
    return this.get(`/agents/${agentId}`);
  }

  registerAgent(data) {
    return this.post('/agents', data);
  }

  updateAgent(agentId, data) {
    return this.put(`/agents/${agentId}`, data);
  }

  getAgentIntents(agentId, params = {}) {
    return this.get(`/agents/${agentId}/intents`, params);
  }

  getAgentStats(agentId) {
    return this.get(`/agents/${agentId}/stats`);
  }

  runAgent(agentId, data) {
    return this.post(`/agents/${agentId}/run`, data);
  }

  getIntents(params = {}) {
    return this.get('/intents', params);
  }

  getIntent(intentId) {
    return this.get(`/intents/${intentId}`);
  }

  createIntent(data) {
    return this.post('/intents', data);
  }

  decideIntent(intentId, data) {
    return this.post(`/intents/${intentId}/decide`, data);
  }

  approveIntent(intentId, data) {
    return this.post(`/intents/${intentId}/approve`, data);
  }

  getEvidence(evidenceId) {
    return this.get(`/evidence/${evidenceId}`);
  }

  getEvidenceAnchorStatus(evidenceId) {
    return this.get(`/evidence/${evidenceId}/anchor-status`);
  }

  registerEvidence(data) {
    return this.post('/evidence', data);
  }

  getProofPack(intentId) {
    return this.get(`/proofpacks/${intentId}`);
  }

  depositToVault(data) {
    return this.post('/lending/deposit', data);
  }

  waitForBridge() {
    return this.post('/lending/bridge', {});
  }

  openLendingPosition(data) {
    return this.post('/lending/position', data);
  }

  waitForYieldAccrual() {
    return this.post('/lending/yield/wait', {});
  }

  accrueYieldViaPolicy() {
    return this.post('/lending/yield/accrue', {});
  }

  runDailyRebalancer() {
    return this.post('/lending/rebalance', {});
  }

  verifyNAV() {
    return this.get('/lending/nav/verify');
  }

  getLendingStatus() {
    return this.get('/lending/status');
  }
}

export const api = new ApiService();
export default api;
