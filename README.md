# AICDA Web3 & Cryptocurrency Security Cyber Range (CTF)

[![Indian Cyber Defence Wing](https://img.shields.io/badge/AICDA-National%20Cyber%20Defence-00ff41.svg?style=flat-square)](https://aicda-crypto-ctf.vercel.app)
[![Solidity Exploits](https://img.shields.io/badge/Security-Smart%20Contracts%20%7C%20DeFi-00ffff.svg?style=flat-square)](#)
[![Python & Next.js](https://img.shields.io/badge/Stack-Python%20Flask%20%7C%20Next.js%2014-ff9933.svg?style=flat-square)](#)

A national-grade Web3, Smart Contract, and Cryptocurrency penetration testing lab and Capture-The-Flag (CTF) platform built for the **Anonymous India Cyber Defence Academy (AICDA)**.

---

## 🎯 Architecture & Monorepo Layout

```
aicda-web3-ctf/
├── api/                             # Python Flask Simulation Engine (Deploy on Render)
│   ├── app.py                       # Core API: 10 Web3 simulation engines, SQLite, Anti-bot
│   ├── config.py                    # Rate limits, flags loaded from env, memory profile (<300MB)
│   ├── requirements.txt             # Flask, Flask-Cors, web3, eth-account, gunicorn, etc.
│   ├── Dockerfile                   # Python 3.11 container blueprint
│   ├── render.yaml                  # 1-click Render web service deployment configuration
│   └── test_challenges.py           # Automated test suite verifying 100% of challenges
└── frontend/                        # Next.js 14 App Router (Deploy on Vercel)
    ├── package.json                 # Next.js 14.2.3, React 18, Tailwind, Lucide
    ├── next.config.js               # Strict production Next config
    ├── tailwind.config.ts           # Cyberpunk theme: Neon Green, Cyan, Saffron
    ├── public/
    │   ├── logo.jpg                 # AICDA official badge
    │   ├── og-image.jpg             # Optimized WhatsApp OpenGraph banner (<80KB)
    │   └── dapp-config.js           # Client-side bundle leaking seed phrase (Challenge 6)
    ├── components/
    │   ├── Header.tsx               # Responsive header, operative call-sign, live score
    │   ├── LabCard.tsx              # Dynamic lab card with "+100 PTS" and "✓ PWNED" badge
    │   ├── ProgressBar.tsx          # 0 to 1000 PTS progress tracker
    │   └── FlagSubmitModal.tsx      # Modal verifying crypto{...} flags against backend
    └── app/
        ├── page.tsx                 # Login with Access Code & Anti-Automation Warning banner
        ├── labs/
        │   ├── page.tsx             # 10 Challenges matrix with category filters & reset
        │   └── [slug]/page.tsx      # 3 Tabs: Theory, Exploitation Methodology, Live Terminal
        └── admin/
            └── aicda/page.tsx       # Admin Command Center: auto-refresh, leaderboard, CSV
```

---

## 🛡️ The 10 Web3 Pentesting Challenges

| ID | Challenge Slug | Attack Surface & Vulnerability | Points | Verification Endpoint |
|---|---|---|:---:|---|
| **1** | `reentrancy` | **Smart Contract Reentrancy**: `withdraw()` executes external call before updating balance mapping. Attacker re-enters 10 times to drain vault from 10 ETH to 0. | 100 PTS | `POST /api/v1/challenge1/exploit` |
| **2** | `access-control` | **Access Control Failure**: `mint(address, uint256)` lacks `onlyOwner` modifier. Attacker mints >= 1,000,000 tokens. | 100 PTS | `POST /api/v1/challenge2/mint` |
| **3** | `delegatecall-collision` | **Storage Slot Collision**: Proxy (Slot 0 = owner) vs Library (Slot 0 = candidate). Invoking `init(address)` via delegatecall overwrites Proxy's owner. | 100 PTS | `POST /api/v1/challenge3/exploit` |
| **4** | `weak-randomness` | **On-Chain Pseudo-Randomness**: Lottery uses `keccak256(prev_blockhash:timestamp) % 1000`. Attacker queries block state and submits precomputed roll. | 100 PTS | `POST /api/v1/challenge4/bet` |
| **5** | `signature-malleability` | **ECDSA secp256k1 Signature Malleability**: Relayer tracks raw signature hash without enforcing $s \le n/2$. Attacker computes $s' = n - s, v' = 28$ to double-spend remaining 100 ETH. | 100 PTS | `POST /api/v1/challenge5/claim` |
| **6** | `frontend-key-leak` | **Client-Side Key Exposure**: dApp client-side configuration (`/dapp-config.js`) leaks 12-word seed phrase deriving to operator address `0x9A3B...B89`. | 100 PTS | `POST /api/v1/challenge6/verify` |
| **7** | `exchange-hot-wallet` | **Exchange API Key Leak**: Internal monitoring route `/api/v1/exchange/internal/metrics?debug=true` exposes `INTERNAL_SIGNER_KEY`. Attacker drains 5,000,000 USDT. | 100 PTS | `POST /api/v1/exchange/withdraw` |
| **8** | `p2p-eclipse` | **P2P Sybil & Eclipse Isolation**: Validator node lacks IP diversity checks with 50 peer capacity. Whitelisted from burst limits to allow rapid registration of 50 Sybil peers. | 100 PTS | `POST /api/v1/p2p/verify` |
| **9** | `permit2-phishing` | **Permit2 Spender Phishing**: Phishing airdrop portal prompts EIP-712 offline authorization. Attacker discovers unverified malicious drainer contract in `spender` field. | 100 PTS | `POST /api/v1/challenge9/report` |
| **10** | `cross-chain-replay` | **Cross-Chain Replay & Nonce Reuse**: Multi-chain bridge hashes `keccak256(recipient, amount, nonce)` without `chainId`. Ethereum signature is replayed on BSC (Chain ID 56). | 100 PTS | `POST /api/v1/challenge10/claim` |

**Total Score: 1000 PTS (10 Flags @ 100 PTS each)**

---

## ⚡ Anti-Automation & Rate Limiter Configuration

To protect Render free-tier instances from crashing under heavy automated scanner load:
- **Prohibited Tools**: Burp Suite Active Scanner, DirBuster, FFUF, Gobuster, SQLmap. Mentioned on login page and enforced via backend middleware.
- **Global Limit**: 30 requests / minute per IP.
- **Burst Filter**: 10 invalid requests in 2 seconds triggers a temporary 60-second firewall hold.
- **Challenge 8 Exemption**: Endpoints under `/api/v1/p2p/*` are **EXEMPT** from burst drops and granted a dedicated limit of **100 requests / minute** so the 50-peer Sybil registration script executes seamlessly.

---

## 🚀 Local Deployment on Kali Linux

### 1. Run the Python API Backend (Port 8080)
```bash
cd /home/akash/aicda-web3-ctf/api

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
python3 app.py
```
*API runs on `http://127.0.0.1:8080`*

### 2. Verify All 10 Challenges Automatically
In a separate terminal:
```bash
cd /home/akash/aicda-web3-ctf/api
source venv/bin/activate
python3 test_challenges.py
```
*Expected Output:*
```
[PASS] Health Check: ONLINE Memory Profile: render-free-tier (<300MB)
[PASS] Access Code Verification
[PASS] Challenge 1 (Reentrancy)
[PASS] Challenge 2 (Access Control)
[PASS] Challenge 3 (Delegatecall Collision)
[PASS] Challenge 4 (Weak Randomness)
[PASS] Challenge 5 (Signature Malleability Replay)
[PASS] Challenge 6 (Frontend Key Leak)
[PASS] Challenge 7 (Exchange Hot Wallet)
[PASS] Challenge 8 (P2P Sybil Eclipse)
[PASS] Challenge 9 (Permit2 Phishing)
[PASS] Challenge 10 (Cross-Chain Replay)
[PASS] Student Progress: 10/10 Solved, 1000/1000 PTS!
[PASS] Admin Stats Verified.
ALL 10 WEB3 CHALLENGES & ADMIN SYSTEM VERIFIED 100%!
```

### 3. Run the Next.js Frontend (Port 3000)
```bash
cd /home/akash/aicda-web3-ctf/frontend

# Install node dependencies
npm install

# Start local Next.js dev server
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 🌐 Production Deployment Guide

### A. Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect repository: `https://github.com/AICDActfs/aicda-web3-ctf`.
4. Configure service:
   - **Root Directory**: `api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 app:app`
   - **Environment Variables**:
     - `PYTHON_VERSION`: `3.11.9`
     - `ADMIN_PASSWORD`: `AICDAadmin`
     - `STUDENT_ACCESS_CODE`: `AICDAWEB3CTF`
     - `SECRET_KEY`: `your-production-secret-key`
5. Note your backend URL: e.g. `https://aicda-web3-api.onrender.com`.

### B. Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import `AICDActfs/aicda-web3-ctf`.
4. Configure project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: `https://aicda-web3-api.onrender.com` (Your Render URL)
5. Click **Deploy**.

---

## 🔑 Access Codes & Credentials

| Role | Access URL | Credentials | Features |
|---|---|---|---|
| **Recruit / Student** | `/` | Access Code: `AICDAWEB3CTF` | Interactive lab matrix, live exploit terminals, flag submission, self-reset |
| **Administrator** | `/admin/aicda` | Password: `AICDAadmin` | Real-time leaderboard, 5s auto-polling, individual student reset, global wipe, CSV export |
