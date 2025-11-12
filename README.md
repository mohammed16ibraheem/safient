# Safient – Recover What Others Lose

Safient wraps Algorand transfers in an AI-guarded protection window so hacked or phished funds snap back to the rightful owner. A flat **0.1 ALGO Safient fee** protects every transfer, and after the window ends the money reaches the intended recipient automatically.

## Project Overview
- **Goal:** give Algorand users a reversible, AI-protected transfer window so they can claw back funds if a transaction looks suspicious.
- **What it does:** every outgoing payment is parked inside a Safient **SafeHold** vault, scanned by our AI risk engine, and either reclaimed by the sender or auto-released to the recipient when the timer expires.

## Setup & Installation Instructions
1. **Clone & install**
   ```bash
   git clone https://github.com/<your-org>/safient.git
   cd safient-main
   npm install
   ```
   The hosted Vercel preview is rate-limited; for a full walkthrough run `npm run dev` locally. A short demo video is available under `Images/video sample.mp4`.
2. **Configure environment**  
   Create `.env.local` (copy `.env.example` if available) and add any Algorand API keys you need (`ALGOD_TOKEN`, `ALGOD_SERVER`, `ALGOD_PORT`). Defaults target Algonode TestNet, so you can leave them empty while testing.
3. **Run locally**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to explore the dashboard, create a wallet, and simulate protected transfers.
4. **Optional** – set `VERCEL=1` and Vercel KV credentials if you plan to deploy the API on Vercel and keep transaction history persistent.

## Links to Deployed Smart Contracts or Assets on the Testnet
- **Safient AI Transfer Contract (Algorand TestNet App ID `749279083`)**  
    (https://testnet.algo.surf/application/749279083/transactions)
  - App address: `DEDG2KY4MPS2RRVAUYYJZOWCK6QMQJSYROOIJPNAMZJCOKFEWAGGAHC33U`  
  - Deployment tx: `SXAWS6YDUVBGMKJBDPQYD7K4Y5PZQY4U3R2MVXGUHHSAPREOLNQA`

## Architecture & Components
- **Next.js 14 frontend** – marketing site, wallet onboarding, and the Algorand dashboard (`src/app/`).
- **Safient AI components** – reusable UI + logic for SafeHold creation, verification, and timers under `src/app/Algorand/Algo-smart/`.
- **API routes** – server actions that call Algorand SDK, manage SafeHold lifecycle, persist testnet data, and interact with storage (`src/app/Algorand/api/` and `Algo-smart/api/`).
- **Storage layer** – wraps local filesystem, Vercel KV, or in-memory fallback to record transactions and wallet snapshots (`src/app/Algorand/utils/storage.ts`).
- **Smart contracts** – TEAL source, compiled bytecode, and deployment metadata in `src/app/Algorand/Algo-smart/contracts/`.

## Why Safient
- **Undo a breach** – If a wallet is compromised, the sender reclaims the transfer instantly.
- **Zero babysitting** – When the protection window closes, Safient releases the funds to the recipient without human intervention.
- **Signal for partners** – Exchanges, wallets, and dApps embed Safient’s APIs to give their users the same safety net.
- **Always learning** – AI threat analysis, address intelligence, and real-time scoring keep improving with every incident.

## Why We Built Safient
I lost everything to a single phishing link. Watching a trusted wallet get emptied with zero recourse changed me — I refused to accept that as the final answer. Safient exists so others don’t have to face that helplessness. Whether funds are stolen by a scam, sent to the wrong address by accident, or taken through coercion, even a small chance to recover assets matters. Safient gives people that chance — a safety net, a second shot, and hope when it matters most.

## What Problem Do We Solve?
Once a blockchain transaction is confirmed, the funds are usually gone forever. Scams, phishing links, wrong-address transfers, and forced transactions leave victims with no path to recovery. Most users only realize the mistake after it is too late.
Safient changes that. We introduce a short AI-supervised protection window before the final settlement. During this window, the system analyzes the transaction behavior, checks for risk patterns, and allows recovery if suspicious activity is detected. This gives users a real chance to reverse harmful or accidental transfers.
No other consumer-facing protection layer on Algorand offers live monitoring, reversible transfers, and automated fund recovery. Safient becomes the missing safety net in crypto.


For Exchanges, Wallets, and Platforms !

We provide an easy API that can be integrated into any wallet, exchange, or transaction service. Platforms can offer their users fund protection without changing their core infrastructure.
This also opens a clear revenue model:
A micro-fee on each protected transaction
Premium AI threat monitoring plans
Enterprise-level recovery support for exchanges and DeFi apps
Every transaction that passes through Safient becomes a revenue opportunity while improving user safety and trust.

## AI Security Scan Workflow
During the protection window, Safient runs a staged AI-driven security scan. The system is already functional, but due to hosting limits on Vercel, the full deep analysis model is currently replaced with a partial simulation. The core algorithm is completed and operational. Once the VPS model nodes are funded and deployed, the full workflow will run live in real time.

1. Initializing AI Security Scan
2. Connecting to Blockchain Nodes
3. Querying Safient AI Database
4. Analyzing Transaction History
5. Cross-referencing Security Networks
6. Verifying Address Integrity
7. Deep Learning Analysis
8. Calculating Risk Assessment

I have already developed the main algorithm that powers this system using AI, especially for transaction behavior detection and anomaly scoring. At the moment, only 60% of the full model is deployed due to resource limits. The logic is complete and production-ready, and the next step is to host the model on a dedicated VPS server so the full analysis can process live data at real scale.


MIT © Safient Labs – safeguard mnemonics and keep crypto users whole.




----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

reciver : FGNISGOLAKHLKOPSD6PXE65WNGJBOLQUI6HDRPHT65THAGM3AH74XCMQSU


 wallet phareses :  emerge clock ancient pen involve acid demand source uphold silver awesome aim produce rude good creek token draw arrange warm gloom jacket child abandon beach



//////////////////////////////////////////////////////////////////////////////////////

sender :  ZV7DKE6UH6RTHB3OKA5JS23IBBE7JOT3QWILX4W2GI6F6XYUFIVO3O4E3U


wallet phareses : worry nominee spy lava member gym whale used palace genre diamond crowd online pave erupt smooth athlete decline foam sun script chaos usual ability track


-----------------------------------------------------------------------------------------


Check the screenshots and demo video in the `Images/` folder.
