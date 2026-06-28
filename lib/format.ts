export function formatNumber(value: number | null | undefined, maximumFractionDigits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatEth(value: number | null | undefined, fallback = "Unknown") {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const fractionDigits = value > 0 && value < 0.001 ? 6 : 4;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: value > 0 && value < 0.001 ? 6 : 0,
  }).format(value)} ETH`;
}

export function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }

  return `${formatNumber(value, 2)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function formatAddress(address: string) {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatRatio(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Unknown";
  }

  return `${formatNumber(value * 100, 0)}%`;
}
