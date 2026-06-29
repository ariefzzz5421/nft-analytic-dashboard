# NFT Sweep Depth

Read-only NFT analytics dashboard for estimating sweep cost to target floors.

This app does not execute purchases, connect wallets, sign transactions, or expose API keys in frontend code. OpenSea and Etherscan calls run through server-side API routes only.

## Features

- Local browser watchlist with collection notes, target floors, and tracked wallet labels.
- Dashboard overview with watchlist cards and global risk summaries.
- Collection detail route at `/collection/[slug]`.
- Smart target floors generated from the current floor.
- Sweep ladder, next meaningful target card, sweep cost chart, listing distribution chart, bid support card, and compact risk warnings.
- Custom target floors, range builder, and target-floor range filtering.
- Collection activity table with sales, transfers, mints, listings, offers, tx hashes, order hashes, OpenSea links, and Etherscan links.
- Manual creator/dev/treasury wallet tracking per collection.
- Wallet API route at `/api/wallet/[address]` using Etherscan when `ETHERSCAN_API_KEY` is configured.
- BTC, ETH, HYPE, BNB, and SOL running price ticker from backend route `/api/market/prices`.
- CoinGecko price source first, Yahoo Finance fallback where available.
- User-selectable OpenSea refresh interval with conservative server caching.

## Quick Start

```bash
git clone https://github.com/ariefzzz5421/nft-analytic-dashboard.git
cd nft-analytic-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` and add your own keys:

```bash
OPENSEA_API_KEY=your_opensea_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
ETH_USD_FALLBACK=1730
```

`OPENSEA_API_KEY` is required for collection analysis. `ETHERSCAN_API_KEY` is optional and only needed for wallet tracking.

Do not add `NEXT_PUBLIC_OPENSEA_API_KEY`, `NEXT_PUBLIC_ETHERSCAN_API_KEY`, or any frontend API key. Server keys must stay server-side.

## Example Slugs

- `the-plimpo`
- `trollols-`
- `normies`
- `npc-on-chain`

## Routes

- `/` - dashboard and watchlist overview
- `/collection/[slug]` - detailed collection analytics
- `/wallets` - tracked wallet overview
- `/settings` - API status and deployment notes
- `/api/sweep/[slug]` - server-side OpenSea sweep analytics
- `/api/activity/[slug]` - server-side OpenSea collection activity
- `/api/wallet/[address]` - server-side Etherscan wallet analytics
- `/api/market/prices` - server-side market price feed
- `/api/watchlist` - placeholder for future database-backed watchlist
- `/api/collection-wallets/[slug]` - placeholder for future server-side wallet labels

## API Sources

`GET /api/sweep/[slug]` uses OpenSea API v2 server-side:

- `GET https://api.opensea.io/api/v2/collections/{slug}`
- `GET https://api.opensea.io/api/v2/collections/{slug}/stats`
- `GET https://api.opensea.io/api/v2/listings/collection/{slug}/all?limit=200`
- `GET https://api.opensea.io/api/v2/offers/collection/{slug}/all?limit=200`

Sweep targets are generated dynamically from the current floor. Targets less than or equal to the current floor are skipped.

`GET /api/activity/[slug]` uses OpenSea events server-side:

- `GET https://api.opensea.io/api/v2/events/collection/{slug}`

Supported query params:

- `event_type`
- `limit`
- `after`
- `before`
- `next`

Activity rows normalize sales, transfers, mints, listings, offers, tx hashes, and order hashes defensively because OpenSea fields can differ by event type.

`GET /api/wallet/[address]` uses Etherscan API server-side:

- `GET https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance`
- `GET https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist`

`GET /api/market/prices` uses public market data server-side:

- Primary: CoinGecko Simple Price API for BTC, ETH, HYPE, BNB, and SOL.
- Fallback: Yahoo Finance chart endpoint where the ticker is available.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the project to Vercel.
3. Add environment variables in Vercel Project Settings:
   - `OPENSEA_API_KEY`
   - `ETHERSCAN_API_KEY` optional
   - `ETH_USD_FALLBACK`
4. Deploy.

No private API key is included in this repository. Every user must add their own keys locally or in Vercel.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Safety Notes

- Higher floor does not guarantee exit liquidity.
- Floor without bid support may be floor theater.
- Listings can change quickly. Refresh before making decisions.
- This is not financial advice. This tool estimates orderbook depth only.
- Tracked wallet balance does not prove intent to sweep. It only shows capacity.
- Local watchlist data is stored in the current browser. Add database/auth later to sync across devices.
