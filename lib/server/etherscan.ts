import { getEthUsdFallback } from "@/lib/opensea";
import type { WalletApiResponse, WalletTransaction } from "@/lib/types";

const ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api";
const ETHEREUM_CHAIN_ID = "1";

export class EtherscanApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "EtherscanApiError";
    this.status = status;
  }
}

function getApiKey() {
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    throw new EtherscanApiError("Missing ETHERSCAN_API_KEY", 500);
  }

  return apiKey;
}

function weiToEth(value: string) {
  if (!/^\d+$/.test(value)) {
    return 0;
  }

  const padded = value.padStart(19, "0");
  const whole = padded.slice(0, -18);
  const fraction = padded.slice(-18).replace(/0+$/, "");
  const decimal = fraction ? `${whole}.${fraction}` : whole;
  const parsed = Number(decimal);

  return Number.isFinite(parsed) ? parsed : 0;
}

async function callEtherscan(params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    apikey: getApiKey(),
    chainid: ETHEREUM_CHAIN_ID,
    module: "account",
    ...params,
  });
  const response = await fetch(`${ETHERSCAN_BASE_URL}?${searchParams.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 45 },
  });

  if (!response.ok) {
    throw new EtherscanApiError(`Etherscan request failed with status ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: unknown;
  };

  if (payload.status === "0" && typeof payload.result === "string") {
    if (payload.result.toLowerCase().includes("no transactions")) {
      return { ...payload, result: [] };
    }

    throw new EtherscanApiError(payload.result, 502);
  }

  return payload;
}

type EtherscanTx = {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  timeStamp?: string;
};

function normalizeTransaction(tx: EtherscanTx, address: string): WalletTransaction {
  const lowerAddress = address.toLowerCase();
  const from = tx.from ?? "";
  const to = tx.to ?? "";
  const valueEth = weiToEth(tx.value ?? "0");
  const fromMatches = from.toLowerCase() === lowerAddress;
  const toMatches = to.toLowerCase() === lowerAddress;
  const direction = fromMatches && toMatches ? "self" : fromMatches ? "out" : "in";
  const timestampSeconds = Number(tx.timeStamp ?? "0");

  return {
    direction,
    from,
    hash: tx.hash ?? "",
    timestamp: Number.isFinite(timestampSeconds)
      ? new Date(timestampSeconds * 1000).toISOString()
      : new Date(0).toISOString(),
    to,
    valueEth,
  };
}

export async function fetchWalletAnalytics(address: string): Promise<WalletApiResponse> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new EtherscanApiError("Invalid Ethereum address.", 400);
  }

  const [balancePayload, txPayload] = await Promise.all([
    callEtherscan({
      action: "balance",
      address,
      tag: "latest",
    }),
    callEtherscan({
      action: "txlist",
      address,
      endblock: "999999999",
      offset: "25",
      page: "1",
      sort: "desc",
      startblock: "0",
    }),
  ]);
  const balanceEth = weiToEth(typeof balancePayload.result === "string" ? balancePayload.result : "0");
  const rawTransactions = Array.isArray(txPayload.result) ? (txPayload.result as EtherscanTx[]) : [];
  const recentTransactions = rawTransactions.map((tx) => normalizeTransaction(tx, address));
  const netEthFlow = recentTransactions.reduce((total, tx) => {
    if (tx.direction === "in") {
      return total + tx.valueEth;
    }

    if (tx.direction === "out") {
      return total - tx.valueEth;
    }

    return total;
  }, 0);
  const ethUsd = getEthUsdFallback();

  return {
    address,
    balanceEth,
    balanceUsd: Number((balanceEth * ethUsd).toFixed(2)),
    lastTxAt: recentTransactions[0]?.timestamp ?? null,
    netEthFlow: Number(netEthFlow.toFixed(8)),
    recentTransactions,
    txCount: rawTransactions.length,
  };
}
