export const formatAddress = (address) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (amount, decimals = 6) => {
  if (amount === null || amount === undefined) return '0';
  const num = parseFloat(amount) / 10 ** decimals;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const formatUSD = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  const num = parseFloat(amount);
  
  // Handle very small numbers
  if (num < 0.01 && num > 0) {
    return `$${num.toFixed(6)}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    APPROVED: 'text-green-400',
    DENIED: 'text-red-400',
    NEEDS_APPROVAL: 'text-yellow-400',
    PENDING: 'text-yellow-400',
    ACTIVE: 'text-green-400',
    INACTIVE: 'text-gray-400',
    settled: 'text-green-400',
    pending: 'text-yellow-400',
    0: 'text-yellow-400',
    1: 'text-green-400',
    2: 'text-red-400',
  };
  return colors[status] || 'text-gray-400';
};

export const getStatusLabel = (status) => {
  const labels = {
    APPROVED: 'Approved',
    DENIED: 'Denied',
    NEEDS_APPROVAL: 'Needs Approval',
    PENDING: 'Pending',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    settled: 'Settled',
    pending: 'Pending',
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected',
  };
  return labels[status] || status;
};
