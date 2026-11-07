import os
import sys
import time
import json
import sqlite3
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
from config import Config

# Initialize Flask
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ctf.db")

# ==========================================
# DATABASE INITIALIZATION
# Schema requires: student_id, challenge_slug, submitted_flag_hash, verified_at, ip_hash
# ==========================================
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH, timeout=10)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Students table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            score INTEGER DEFAULT 0,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Submissions table (exact requirements)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            challenge_slug TEXT NOT NULL,
            submitted_flag_hash TEXT NOT NULL,
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_hash TEXT NOT NULL,
            UNIQUE(student_id, challenge_slug)
        )
    """)
    
    # Rate limit tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rate_limits (
            ip_hash TEXT PRIMARY KEY,
            burst_count INTEGER DEFAULT 0,
            window_start REAL DEFAULT 0,
            banned_until REAL DEFAULT 0
        )
    """)
    
    conn.commit()
    conn.close()

init_db()

# ==========================================
# ANTI-BOT & RATE LIMITING MIDDLEWARE
# Burp Suite active scanning / FFUF drops
# Special exemption: /api/v1/p2p/* (higher limit, burst exempt for Challenge 8)
# ==========================================
def get_ip_hash():
    forwarded = request.headers.get("X-Forwarded-For", "")
    ip = forwarded.split(",")[0].strip() if forwarded else request.remote_addr or "127.0.0.1"
    return hashlib.sha256(ip.encode()).hexdigest()

@app.before_request
def enforce_rate_limits():
    path = request.path
    if request.method == "OPTIONS" or path == "/api/v1/health":
        return None

    ip_h = get_ip_hash()
    now = time.time()
    db = get_db()
    
    row = db.execute("SELECT burst_count, window_start, banned_until FROM rate_limits WHERE ip_hash = ?", (ip_h,)).fetchone()
    
    if row and row["banned_until"] > now:
        remaining = int(row["banned_until"] - now)
        return jsonify({
            "error": "AUTOMATED SCANNER DETECTED: IP temporarily banned. Burp Suite scanners and automated fuzzers are prohibited. Please switch to manual curl/Python.",
            "retry_after_seconds": remaining
        }), 429

    # SPECIAL EXEMPTION: Challenge 8 (P2P Sybil / Eclipse Simulation)
    # The /api/v1/p2p/* endpoints require registering 50 peers and are exempt from standard burst detection
    if path.startswith("/api/v1/p2p/"):
        return None

    if not row:
        db.execute("INSERT INTO rate_limits (ip_hash, burst_count, window_start, banned_until) VALUES (?, 1, ?, 0)", (ip_h, now))
        db.commit()
    else:
        burst_count = row["burst_count"]
        window_start = row["window_start"]

        if now - window_start > 60:
            burst_count = 1
            window_start = now
        else:
            burst_count += 1

        if burst_count > Config.RATE_LIMIT_GLOBAL:
            banned_until = now + 60
            db.execute("UPDATE rate_limits SET burst_count = ?, window_start = ?, banned_until = ? WHERE ip_hash = ?",
                       (burst_count, window_start, banned_until, ip_h))
            db.commit()
            return jsonify({
                "error": "RATE LIMIT EXCEEDED: Excessive requests. Automated scanning tools are strictly blocked.",
                "retry_after_seconds": 60
            }), 429
        
        db.execute("UPDATE rate_limits SET burst_count = ?, window_start = ? WHERE ip_hash = ?",
                   (burst_count, window_start, ip_h))
        db.commit()

# ==========================================
# HEALTH & MEMORY PROFILE (<300MB Render Free Tier)
# ==========================================
@app.route("/api/v1/health", methods=["GET"])
def health():
    mem_mb = "<150MB (Nominal)"
    try:
        import resource
        mem_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        mem_mb = round(mem_kb / 1024.0, 2)
    except Exception:
        pass
        
    return jsonify({
        "status": "ONLINE",
        "service": "AICDA Web3 CTF Backend",
        "memory_profile": Config.MEMORY_PROFILE,
        "memory_usage_mb": mem_mb,
        "network_mode": "sepolia-rpc" if Config.SEPOLIA_RPC_URL else "simulated-evm",
        "timestamp": datetime.utcnow().isoformat()
    })

# ==========================================
# AUTH & ACCESS CONTROL
# ==========================================
@app.route("/api/v1/auth/verify-code", methods=["POST"])
def verify_access_code():
    data = request.get_json() or {}
    code = data.get("access_code", "").strip()
    student_id = data.get("student_id", "").strip()

    if code != Config.STUDENT_ACCESS_CODE:
        return jsonify({"valid": False, "message": "Invalid Access Code. Enter AICDAWEB3CTF."}), 401

    if not student_id:
        return jsonify({"valid": False, "message": "Recruit Call-sign / Student ID is required."}), 400

    db = get_db()
    db.execute("""
        INSERT INTO students (student_id, score, last_active)
        VALUES (?, 0, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
    """, (student_id,))
    db.commit()

    return jsonify({
        "valid": True,
        "student_id": student_id,
        "message": f"Identity verified. Welcome operative {student_id}."
    })


def validate_student(student_id):
    if not student_id:
        return False, "Missing student_id in request. Provide your registered recruit call-sign in JSON body or query param."
    sid = str(student_id).strip()
    if sid.upper() in ("YOUR_CALLSIGN", "YOUR_STUDENT_ID", "ANONYMOUS", "1234", "TEST", "UNDEFINED", "NULL", ""):
        return False, f"Dummy call-sign '{sid}' is rejected by AICDA security protocols. Please authenticate at http://localhost:3000 with your official recruit call-sign (e.g. OP_VIKRAM_77)."
    db = get_db()
    row = db.execute("SELECT student_id FROM students WHERE student_id = ?", (sid,)).fetchone()
    if not row:
        return False, f"Recruit call-sign '{sid}' is not registered in AICDA range. Please log in first at http://localhost:3000 with your call-sign and Access Code AICDAWEB3CTF."
    return True, sid


# ==========================================
# PROGRESSIVE TACTICAL INTEL & TRICK HINTS
# ==========================================
CHALLENGE_HINTS = {
    "reentrancy": {
        "title": "Smart Contract Reentrancy Attack",
        "tier1_clue": "Audit lines 92–96 in EtherBank.sol. The contract executes an external transfer via msg.sender.call{value: bal}(\"\") BEFORE executing balances[msg.sender] = 0. Notice the Checks-Effects-Interactions (CEI) order violation.",
        "tier2_trap": "A single withdraw() call only returns your 1.0 ETH deposit, leaving 9.0 ETH in the vault. If your reentrant fallback recurses too few times, the vault balance remains > 0 and the exploit is incomplete. If recursive depth exceeds vault balance, execution reverts.",
        "tier3_trick": "The victim vault has 10.0 ETH total and your deposit was 1.0 ETH. Each reentrancy loop siphons 1.0 ETH before state update. Craft your attack to re-enter withdraw() for exactly 10 iterations (iterations: 10) to completely drain the vault to 0.0 ETH."
    },
    "access-control": {
        "title": "Access Control Failure (GovToken)",
        "tier1_clue": "Compare burn(uint256 amount) and mint(address to, uint256 amount) in GovToken.sol. Notice what authorization modifier protects burn() that is completely missing on mint().",
        "tier2_trap": "Minting small amounts (e.g. 1 or 100 tokens) succeeds without error, but will NOT give you the flag! In DAO governance systems, takeover requires exceeding the circulating voting quorum.",
        "tier3_trick": "Check threshold_to_pwn in the contract status (1,000,000 tokens). Send a mint transaction specifying an amount >= 1000000 (e.g. amount: 1000000) to trigger the governance takeover flag."
    },
    "delegatecall-collision": {
        "title": "Delegatecall Storage Slot Collision",
        "tier1_clue": "In Solidity, delegatecall executes library code inside the caller's storage layout. It matches numerical slot indices (Slot 0, Slot 1), NOT variable names.",
        "tier2_trap": "Look at Slot 0 of AdminProxy.sol (address public owner) vs Slot 0 of StorageLib.sol (address public candidate). When StorageLib.init() writes to candidate, it overwrites Slot 0 of AdminProxy!",
        "tier3_trick": "Pass your 42-character Ethereum address (e.g. 0x1111111111111111111111111111111111111111) as target_address to trigger the delegatecall. When Slot 0 is overwritten, the proxy owner is hijacked."
    },
    "weak-randomness": {
        "title": "Weak On-Chain Randomness & Block Prediction",
        "tier1_clue": "Blockchains are deterministic state machines. OnChainLottery.sol seeds rolls using keccak256(prev_blockhash:timestamp) % 1000. Both values are publicly visible before you bet!",
        "tier2_trap": "Random guesses will fail (1 in 1000 odds). Furthermore, the block timestamp window is 30 seconds! If you take too long to submit your bet after calculating, the block advances and the roll changes.",
        "tier3_trick": "Query GET /api/v1/challenge4/block. Compute sha256(prev_blockhash[2:] + ':' + block_timestamp). Take integer modulo 1000: int(seed, 16) % 1000. Submit that exact integer in predicted_number within the 30s window."
    },
    "signature-malleability": {
        "title": "ECDSA Signature Malleability Replay",
        "tier1_clue": "MalleableVault.sol guards against replay by hashing the signature itself (mapping(bytes32 => bool) executedSignatures) rather than verifying an on-chain nonce.",
        "tier2_trap": "Submitting the original signature (r, s, v) twice fails because the contract already marked that exact signature hash as spent. Changing r breaks public key recovery.",
        "tier3_trick": "On secp256k1 with curve order n, both s and s' = n - s are mathematically valid signatures for the same message hash. Retrieve the voucher, compute malleable_s = hex(n - orig_s), set v = 28, and submit the claim to prove double-spend!"
    },
    "frontend-key-leak": {
        "title": "Frontend Mnemonic & Private Key Leakage",
        "tier1_clue": "Web3 dApps often compile client-side bundles or host configuration files that developers mistakenly publish with sensitive secrets.",
        "tier2_trap": "The config file exposes a 12-word seed phrase, but submitting the 12 words directly into the verification portal will fail. The contract expects the 64-character hex private key.",
        "tier3_trick": "Audit http://localhost:8080/dapp-config.js. Locate the embedded VAULT_OPERATOR_PRIVATE_KEY ('0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3'). Submit this key to /api/v1/challenge6/verify."
    },
    "exchange-hot-wallet": {
        "title": "Exchange Hot Wallet API Credentials Leak",
        "tier1_clue": "Exchange internal infrastructure often runs monitoring services (Prometheus/Actuator). These endpoints sometimes accept diagnostic flags that output environment variables.",
        "tier2_trap": "A basic GET request to /api/v1/exchange/internal/metrics only outputs standard system metrics. Look for a common developer debug query parameter.",
        "tier3_trick": "Query GET /api/v1/exchange/internal/metrics?debug=true. Under system_env, find INTERNAL_SIGNER_KEY ('0x4f3edf983ac6...'). Submit this signer_key to /api/v1/exchange/withdraw to drain the reserves."
    },
    "p2p-eclipse": {
        "title": "P2P Sybil & Eclipse Isolation Attack",
        "tier1_clue": "A P2P validator node maintains an in-memory routing table with a maximum peer capacity. If an attacker controls all inbound slots, the victim node is eclipsed from honest consensus.",
        "tier2_trap": "Registering the same peer ID repeatedly is ignored by duplicate filters. However, the /api/v1/p2p/* routes are explicitly exempt from the CTF anti-burst rate limiter!",
        "tier3_trick": "Write a script to call POST /api/v1/p2p/peer/register 50 times with unique peer IDs (peer_0 to peer_49). Once 50 slots are filled, call POST /api/v1/p2p/verify to confirm eclipse isolation."
    },
    "permit2-phishing": {
        "title": "Permit2 Spender Phishing Analysis",
        "tier1_clue": "Uniswap Permit2 (EIP-712) permits off-chain gasless approval signatures. Phishing websites trick users into signing a permit where the 'spender' is a malicious drainer contract.",
        "tier2_trap": "Submitting the victim's wallet or the token contract address will fail. You must identify the unauthorized drainer contract that was granted token transfer authority.",
        "tier3_trick": "Query the phishing payload at GET /api/v1/challenge9/permit. In the message object, extract the spender address ('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'). Submit this to /api/v1/challenge9/report as drainer_address."
    },
    "cross-chain-replay": {
        "title": "Cross-Chain Replay & Nonce Reuse",
        "tier1_clue": "Multi-chain bridges validate withdrawal vouchers across disparate EVM chains. The signature hash MUST bind to block.chainid to prevent cross-chain replay.",
        "tier2_trap": "You cannot forge a new signature because you don't possess the bridge validator's private key. You must use an existing valid signature produced on another chain.",
        "tier3_trick": "Query the Ethereum Mainnet transaction at GET /api/v1/challenge10/tx. Extract the validator signature and nonce (101). Submit them to the BSC bridge endpoint POST /api/v1/challenge10/claim with chain_id: 56."
    }
}

@app.route("/api/v1/challenges/<slug>/hints", methods=["GET"])
def challenge_hints(slug):
    student_id = request.args.get("student_id", "")
    valid, sid_or_err = validate_student(student_id)
    if not valid:
        return jsonify({"success": False, "message": sid_or_err}), 403
    
    hint_data = CHALLENGE_HINTS.get(slug)
    if not hint_data:
        return jsonify({"success": False, "message": f"No hints found for challenge '{slug}'."}), 404
        
    return jsonify({
        "success": True,
        "challenge_slug": slug,
        "hints": hint_data
    })

# ==========================================
# CHALLENGE 1: REENTRANCY (EtherBank)
# ==========================================
reentrancy_state = {}

@app.route("/api/v1/challenge1/status", methods=["GET"])
def challenge1_status():
    student_id = request.args.get("student_id", "anonymous")
    st = reentrancy_state.get(student_id, {"vault_balance_eth": 10.0, "user_balance_eth": 1.0, "is_solved": False})
    return jsonify({
        "contract": "EtherBank.sol",
        "target_address": "0x3508492061215B6a9F950D79c093aFE93F7A189C",
        "vault_balance_eth": st["vault_balance_eth"],
        "user_balance_eth": st["user_balance_eth"],
        "is_solved": st["is_solved"],
        "vulnerability": "External call before state update in withdraw() allows reentrancy fallback loop"
    })

@app.route("/api/v1/challenge1/exploit", methods=["POST"])
def challenge1_exploit():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    iterations = int(data.get("iterations", 10))
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": f"PRACTICE COMPLETED: Reentrancy fallback loop verified with test depth ({iterations} iterations). Notice the contract accepted the reentrant call! To drain the real 10.0 ETH vault and get the REAL flag, modify your command to iterations: 10 without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_REENTRANCY_TEST_DRAIN_10_ITERATIONS}",
            "vault_balance_eth": max(0.0, 10.0 - iterations)
        })
    
    st = reentrancy_state.get(student_id, {"vault_balance_eth": 10.0, "user_balance_eth": 1.0, "is_solved": False})
    
    if iterations >= 10:
        st["vault_balance_eth"] = 0.0
        st["user_balance_eth"] = 11.0
        st["is_solved"] = True
        reentrancy_state[student_id] = st
        return jsonify({
            "success": True,
            "message": "REENTRANCY SUCCESSFUL: Attacker contract re-entered withdraw() 10 times before balance check. Vault drained to 0 ETH!",
            "vault_balance_eth": 0.0,
            "user_balance_eth": 11.0,
            "flag": Config.FLAGS["reentrancy"]
        })
    else:
        st["vault_balance_eth"] = max(0.0, 10.0 - iterations)
        st["user_balance_eth"] = 1.0 + iterations
        reentrancy_state[student_id] = st
        return jsonify({
            "success": False,
            "message": f"Partial reentrancy executed ({iterations} calls). Vault balance remaining: {st['vault_balance_eth']} ETH. Drain completely to get the flag.",
            "vault_balance_eth": st["vault_balance_eth"]
        }), 400

# ==========================================
# CHALLENGE 2: ACCESS CONTROL FAILURE (GovToken)
# ==========================================
gov_token_state = {}

@app.route("/api/v1/challenge2/status", methods=["GET"])
def challenge2_status():
    student_id = request.args.get("student_id", "anonymous")
    st = gov_token_state.get(student_id, {"total_supply": 1000, "user_balance": 0, "is_solved": False})
    return jsonify({
        "contract": "GovToken.sol",
        "target_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "total_supply": st["total_supply"],
        "user_balance": st["user_balance"],
        "threshold_to_pwn": 1000000,
        "is_solved": st["is_solved"],
        "vulnerability": "Missing onlyOwner modifier on function mint(address to, uint256 amount)"
    })

@app.route("/api/v1/challenge2/mint", methods=["POST"])
def challenge2_mint():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    amount = int(data.get("amount", 0))
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": f"PRACTICE COMPLETED: Unprivileged test mint of {amount} GOV tokens succeeded! To trigger the real governance takeover flag, modify your command to mint >= 1,000,000 GOV tokens without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_GOV_MINT_TEST_MINT_1000000_TOKENS}",
            "user_balance": amount
        })

    if amount <= 0:
        return jsonify({"success": False, "message": "Amount must be greater than 0"}), 400

    st = gov_token_state.get(student_id, {"total_supply": 1000, "user_balance": 0, "is_solved": False})
    st["user_balance"] += amount
    st["total_supply"] += amount

    if st["user_balance"] >= 1000000:
        st["is_solved"] = True
        gov_token_state[student_id] = st
        return jsonify({
            "success": True,
            "message": f"ACCESS CONTROL EXPLOITED: Minted {amount} GOV tokens without authorization. Balance exceeds 1,000,000 threshold!",
            "user_balance": st["user_balance"],
            "flag": Config.FLAGS["access-control"]
        })
    else:
        gov_token_state[student_id] = st
        return jsonify({
            "success": True,
            "message": f"Tokens minted. Current balance: {st['user_balance']}. Need at least 1,000,000 to trigger takeover flag.",
            "user_balance": st["user_balance"]
        })

# ==========================================
# CHALLENGE 3: DELEGATECALL STORAGE COLLISION
# Exact layout:
# Proxy: Slot 0 = owner (address), Slot 1 = implementation (address)
# Library: Slot 0 = candidate (address), Slot 1 = lastUpdated (uint256)
# ==========================================
proxy_state = {}

@app.route("/api/v1/challenge3/status", methods=["GET"])
def challenge3_status():
    student_id = request.args.get("student_id", "anonymous")
    st = proxy_state.get(student_id, {
        "slot_0_owner": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
        "slot_1_implementation": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "is_hijacked": False
    })
    return jsonify({
        "proxy_contract": "AdminProxy.sol",
        "library_contract": "StorageLib.sol",
        "proxy_address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        "storage_layout": {
            "proxy": {"slot_0": "address public owner", "slot_1": "address public implementation"},
            "library": {"slot_0": "address public candidate", "slot_1": "uint256 public lastUpdated"}
        },
        "slot_0_owner": st["slot_0_owner"],
        "slot_1_implementation": st["slot_1_implementation"],
        "is_hijacked": st["is_hijacked"],
        "vulnerability": "Storage slot 0 collision via delegatecall execution"
    })

@app.route("/api/v1/challenge3/exploit", methods=["POST"])
def challenge3_exploit():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    target_address = data.get("target_address", "").strip()
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": f"PRACTICE COMPLETED: Delegatecall successfully wrote test candidate {target_address} to Slot 0! To hijack AdminProxy ownership and claim the REAL flag, modify your command to pass your actual operative address without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_DELEGATECALL_TEST_PASS_TARGET_ADDRESS}",
            "new_slot_0_owner": target_address
        })

    if not target_address.startswith("0x") or len(target_address) != 42:
        return jsonify({"success": False, "message": "Invalid Ethereum address format for target_address (must be 0x + 40 hex chars)."}), 400

    if target_address.lower() == "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000":
        return jsonify({"success": False, "message": "Target address cannot be the original dummy owner address."}), 400

    proxy_state[student_id] = {
        "slot_0_owner": target_address,
        "slot_1_implementation": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "is_hijacked": True
    }

    return jsonify({
        "success": True,
        "message": f"STORAGE COLLISION DETECTED: Delegatecall to StorageLib.init() wrote to Slot 0 of AdminProxy. Owner hijacked to {target_address}!",
        "new_slot_0_owner": target_address,
        "flag": Config.FLAGS["delegatecall-collision"]
    })

# ==========================================
# CHALLENGE 4: WEAK RANDOMNESS
# Concrete Win Condition: Submit predicted next roll based on deterministic block seed
# Formula: keccak256(prev_blockhash + timestamp) % 1000
# ==========================================
@app.route("/api/v1/challenge4/block", methods=["GET"])
def challenge4_block():
    now_ts = int(time.time() / 30) * 30 # fixed 30-second window
    block_number = 19482000 + int((time.time() % 86400) / 12)
    prev_blockhash = hashlib.sha256(f"aicda_block_{block_number - 1}".encode()).hexdigest()
    
    # Precompute winning number
    seed = hashlib.sha256(f"{prev_blockhash}:{now_ts}".encode()).hexdigest()
    winning_number = int(seed, 16) % 1000

    return jsonify({
        "contract": "OnChainLottery.sol",
        "target_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        "block_number": block_number,
        "block_timestamp": now_ts,
        "prev_blockhash": f"0x{prev_blockhash}",
        "formula": "keccak256(prev_blockhash:block_timestamp) % 1000",
        "window_duration_seconds": 30
    })

@app.route("/api/v1/challenge4/bet", methods=["POST"])
@app.route("/api/v1/challenge4/predict", methods=["POST"])
def challenge4_bet():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    predicted_number = data.get("predicted_number")
    if predicted_number is None:
        predicted_number = data.get("predicted_roll")
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Block oracle connection tested! To win the real jackpot and claim the REAL flag, modify your command with the calculated winning roll from the active 30-second block window without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_RNG_TEST_CALCULATE_REAL_BLOCK_HASH}"
        })

    if predicted_number is None:
        return jsonify({"success": False, "message": "Missing predicted_number in JSON body"}), 400

    try:
        pred_int = int(predicted_number)
    except ValueError:
        return jsonify({"success": False, "message": "predicted_number must be an integer (0-999)"}), 400

    now_ts = int(time.time() / 30) * 30
    block_number = 19482000 + int((time.time() % 86400) / 12)
    prev_blockhash = hashlib.sha256(f"aicda_block_{block_number - 1}".encode()).hexdigest()
    seed = hashlib.sha256(f"{prev_blockhash}:{now_ts}".encode()).hexdigest()
    actual_winning_number = int(seed, 16) % 1000

    if pred_int == actual_winning_number:
        return jsonify({
            "success": True,
            "message": f"JACKPOT! Predicted number {pred_int} matched on-chain pseudo-random seed exactly!",
            "winning_number": actual_winning_number,
            "flag": Config.FLAGS["weak-randomness"]
        })
    else:
        return jsonify({
            "success": False,
            "message": f"Incorrect roll prediction {pred_int}. Current block winning roll was {actual_winning_number}. Re-calculate and try again.",
            "actual_winning_number": actual_winning_number
        }), 400

# ==========================================
# CHALLENGE 5: SIGNATURE MALLEABILITY (ECDSA secp256k1)
# Verification proves double-spend: relayer balance decreases 100 ETH -> 0 ETH
# Formula: s' = n - s, v' = 28 if v == 27 else 27
# ==========================================
SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
ORIGINAL_R = "0x438676bf6714a5fae5ffdaab8d6db9fe4b162f7902d681df7065964fcf4bf693"
ORIGINAL_S = "0x40bf7da17918a38753266b7cf4cb7c0ef3e2849c7161bcf702ab92c64b595211"
ORIGINAL_V = 27

malleability_state = {}

@app.route("/api/v1/challenge5/voucher", methods=["GET"])
def challenge5_voucher():
    student_id = request.args.get("student_id", "anonymous")
    st = malleability_state.get(student_id, {"vault_balance_eth": 100.0, "double_spent": False})
    
    return jsonify({
        "relayer_contract": "GaslessRelayer.sol",
        "relayer_address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        "vault_balance_eth": st["vault_balance_eth"],
        "initial_voucher": {
            "recipient": "0x1111111111111111111111111111111111111111",
            "amount_eth": 100,
            "r": ORIGINAL_R,
            "s": ORIGINAL_S,
            "v": ORIGINAL_V,
            "tx_hash": "0xa3f99b2c8e1104e76a1d82136e09e13df8372b64d1424a1b029cd72983ff826a",
            "initial_claim_processed": True
        },
        "vulnerability": "Relayer contract tracks seen_signatures by raw hash without checking s <= n/2, permitting ECDSA signature malleability s' = n - s."
    })

@app.route("/api/v1/challenge5/claim", methods=["POST"])
@app.route("/api/v1/challenge5/replay", methods=["POST"])
def challenge5_claim():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: ECDSA replay endpoint verified! To execute the real duplicate transfer and claim the REAL flag, calculate the real s' = n - s complement without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_ECDSA_TEST_CALCULATE_REAL_S_PRIME}"
        })
    r = data.get("r", "").strip().lower()
    s = data.get("s", "").strip().lower()
    v = data.get("v")

    if not r or not s or v is None:
        return jsonify({"success": False, "message": "Missing r, s, or v in submission"}), 400

    try:
        s_int = int(s, 16)
        r_int = int(r, 16)
        v_int = int(v)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid hex format for signature components"}), 400

    orig_s_int = int(ORIGINAL_S, 16)
    expected_malleable_s = SECP256K1_N - orig_s_int

    # Check 1: r must match
    if r_int != int(ORIGINAL_R, 16):
        return jsonify({"success": False, "message": "Signature r value does not match the authorized voucher."}), 400

    # Check 2: s must NOT be original s
    if s_int == orig_s_int:
        return jsonify({"success": False, "message": "REPLAY REJECTED: Original signature hash was already consumed in Tx 0xa3f9... You must provide the malleable signature (s' = n - s)."}), 400

    # Check 3: s must match n - s
    if s_int != expected_malleable_s:
        return jsonify({"success": False, "message": "Invalid flipped s-value. Expected s' = secp256k1_n - s."}), 400

    # Check 4: v must flip
    if v_int != 28:
        return jsonify({"success": False, "message": "Invalid v parity for flipped signature. When v=27, malleable v becomes 28."}), 400

    # Verification proves double-spend: relayer balance drops to 0!
    malleability_state[student_id] = {"vault_balance_eth": 0.0, "double_spent": True}

    return jsonify({
        "success": True,
        "message": "SIGNATURE MALLEABILITY PROVEN: Second withdrawal executed with flipped s-value! Relayer balance decreased from 100 ETH to 0 ETH (Double-Spend Complete).",
        "vault_balance_eth": 0.0,
        "replay_proven": True,
        "flag": Config.FLAGS["signature-malleability"]
    })

# ==========================================
# CHALLENGE 6: FRONTEND PRIVATE KEY LEAK
# Seeded operator address: 0x9A3B5e215D3e5b38F369c737976e589Ec2506B89
# Mnemonic located in public/dapp-config.js
# ==========================================
SEEDED_OPERATOR_ADDRESS = "0x9A3B5e215D3e5b38F369c737976e589Ec2506B89".lower()
SEEDED_OPERATOR_KEY = "0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3"

@app.route("/api/v1/challenge6/info", methods=["GET"])
def challenge6_info():
    return jsonify({
        "dapp_name": "AICDA Vault Governance dApp",
        "target_operator_address": "0x9A3B5e215D3e5b38F369c737976e589Ec2506B89",
        "hint": "Inspect the client-side dApp assets (/dapp-config.js or JavaScript bundles). The developer accidentally committed testnet mnemonic seed phrases.",
        "vulnerability": "Hardcoded mnemonic / private key exposure in client-side bundle"
    })

@app.route("/api/v1/challenge6/verify", methods=["POST"])
def challenge6_verify():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    private_key = data.get("private_key", "").strip()
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Key verification gateway tested! To seize operator administrative access and claim the REAL flag, extract the real 12-word mnemonic from /dapp-config.js and submit without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_KEY_LEAK_TEST_EXTRACT_REAL_MNEMONIC}"
        })

    if not private_key:
        return jsonify({"success": False, "message": "Missing private_key parameter"}), 400

    clean_key = private_key if private_key.startswith("0x") else "0x" + private_key

    # Verification: check if key derives to seeded operator
    if clean_key.lower() == SEEDED_OPERATOR_KEY.lower():
        return jsonify({
            "success": True,
            "message": "KEY COMPROMISE CONFIRMED: Extracted private key successfully derived to operator address 0x9A3B5e215D3e5b38F369c737976e589Ec2506B89!",
            "operator_address": "0x9A3B5e215D3e5b38F369c737976e589Ec2506B89",
            "flag": Config.FLAGS["frontend-key-leak"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Submitted key does not derive to the target operator address (0x9A3B5e215D3e5b38F369c737976e589Ec2506B89). Check /dapp-config.js carefully."
        }), 400

# ==========================================
# CHALLENGE 7: EXCHANGE HOT WALLET API LEAK
# Verbose debug endpoint / internal metrics leaks signer credentials
# ==========================================
HOT_WALLET_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"

@app.route("/api/v1/exchange/status", methods=["GET"])
def exchange_status():
    return jsonify({
        "exchange": "AICDA Global Liquidity Exchange",
        "status": "OPERATIONAL",
        "hot_wallet_address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "withdrawal_api": "/api/v1/exchange/withdraw",
        "debug_mode": False
    })

@app.route("/api/v1/exchange/internal/metrics", methods=["GET"])
def exchange_metrics():
    debug = request.args.get("debug", "false").lower()
    if debug == "true":
        return jsonify({
            "service": "AICDA-HOT-WALLET-DISPATCHER",
            "system_env": {
                "HOT_WALLET_ADDRESS": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "INTERNAL_SIGNER_KEY": HOT_WALLET_KEY,
                "RESERVE_USDT": 5000000,
                "WITHDRAW_AUTH_SCHEME": "SECP256K1_RAW"
            },
            "warning": "CRITICAL: DEBUG MODE EXPOSES INTERNAL VAULT ENVIRONMENT VARIABLES"
        })
    return jsonify({"error": "Access Denied: Internal monitoring endpoint requires authorized bearer token or debug=true flag."}), 403

@app.route("/api/v1/exchange/withdraw", methods=["POST"])
def exchange_withdraw():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    signer_key = data.get("signer_key", "").strip()
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Withdrawal gateway tested with practice key! To drain the 5,000,000 USDT hot wallet and claim the REAL flag, inspect /api/v1/exchange/internal/metrics?debug=true to find the real internal signer key.",
            "flag": "crypto{PRACTICE_ONLY_HOT_WALLET_TEST_FIND_REAL_SIGNER_KEY}"
        })

    if not signer_key:
        return jsonify({"success": False, "message": "Missing signer_key parameter"}), 400

    clean_key = signer_key if signer_key.startswith("0x") else "0x" + signer_key

    if clean_key.lower() == HOT_WALLET_KEY.lower():
        return jsonify({
            "success": True,
            "message": "HOT WALLET DRAINED: Internal hot wallet signer key successfully verified. 5,000,000 USDT withdrawal authorized!",
            "authorized_wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "flag": Config.FLAGS["exchange-hot-wallet"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Unauthorized signer key for hot wallet withdrawal. Inspect /api/v1/exchange/internal/metrics?debug=true."
        }), 401

# ==========================================
# CHALLENGE 8: P2P SYBIL / ECLIPSE ATTACK
# Peer Table limit = 50. Whitelisted from burst limit with 100 req/min allowance
# ==========================================
p2p_network_state = {}

@app.route("/api/v1/p2p/node/status", methods=["GET"])
def p2p_status():
    student_id = request.args.get("student_id", "anonymous")
    peers = p2p_network_state.get(student_id, set())
    return jsonify({
        "node_id": "AICDA-ETH-VALIDATOR-01",
        "peer_table_capacity": 50,
        "current_connected_peers": len(peers),
        "eclipsed": len(peers) >= 50,
        "vulnerability": "Target node accepts inbound peer connections without IP diversity checks, allowing Sybil eclipse once 50 slots are filled."
    })

@app.route("/api/v1/p2p/peer/register", methods=["POST"])
def p2p_register():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    peer_id = data.get("peer_id", "").strip()

    if not peer_id:
        return jsonify({"success": False, "message": "Missing peer_id parameter"}), 400

    peers = p2p_network_state.get(student_id, set())
    if len(peers) >= 50:
        return jsonify({
            "success": True,
            "message": "Node peer table is fully saturated (50/50 peers). Target node is ECLIPSED!",
            "connected_peers": 50,
            "eclipsed": True
        })

    peers.add(peer_id)
    p2p_network_state[student_id] = peers

    return jsonify({
        "success": True,
        "message": f"Peer {peer_id} successfully connected to validator node.",
        "connected_peers": len(peers),
        "slots_remaining": max(0, 50 - len(peers))
    })

@app.route("/api/v1/p2p/verify", methods=["POST"])
def p2p_verify():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    peers = p2p_network_state.get(student_id, set())
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Validator peer table connection tested! To achieve 100% eclipse and capture the REAL flag, register all 50 Sybil peers using the loop without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_P2P_ECLIPSE_TEST_REGISTER_ALL_50_PEERS}"
        })

    if len(peers) >= 50:
        return jsonify({
            "success": True,
            "message": "ECLIPSE ATTACK COMPLETE: Target validator node completely isolated from honest peers by your 50 Sybil connections!",
            "eclipsed_peer_count": len(peers),
            "flag": Config.FLAGS["p2p-eclipse"]
        })
    else:
        return jsonify({
            "success": False,
            "message": f"Eclipse failed. Target node only has {len(peers)}/50 malicious peer slots occupied. Register at least 50 peers.",
            "current_peers": len(peers)
        }), 400

# ==========================================
# CHALLENGE 9: PERMIT2 PHISHING / SOCIAL ENGINEERING
# Malicious drainer contract embedded in spender field
# ==========================================
MALICIOUS_DRAINER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".lower()

@app.route("/api/v1/challenge9/payload", methods=["GET"])
def challenge9_payload():
    return jsonify({
        "claim_portal": "https://aicda-crypto-airdrop.xyz/claim",
        "description": "Simulated EIP-712 Permit2 authorization requested by malicious airdrop claim site",
        "eip712_permit": {
            "types": {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"}
                ],
                "PermitSingle": [
                    {"name": "details", "type": "PermitDetails"},
                    {"name": "spender", "type": "address"},
                    {"name": "sigDeadline", "type": "uint256"}
                ],
                "PermitDetails": [
                    {"name": "token", "type": "address"},
                    {"name": "amount", "type": "uint160"},
                    {"name": "expiration", "type": "uint48"},
                    {"name": "nonce", "type": "uint48"}
                ]
            },
            "domain": {
                "name": "Permit2",
                "chainId": 1,
                "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
            },
            "primaryType": "PermitSingle",
            "message": {
                "details": {
                    "token": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                    "amount": "1461501637330902918203684832716283019655932542975",
                    "expiration": 1893456000,
                    "nonce": 1337
                },
                "spender": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
                "sigDeadline": 1893456000
            }
        },
        "objective": "Identify the unverified malicious spender contract address embedded in the transaction payload."
    })

@app.route("/api/v1/challenge9/report", methods=["POST"])
def challenge9_report():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    drainer_address = data.get("drainer_address", "").strip().lower()
    if data.get("practice") is True:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Threat report channel verified! To neutralize the phishing threat and claim the REAL flag, inspect the spender address in /api/v1/challenge9/payload and report it without practice mode.",
            "flag": "crypto{PRACTICE_ONLY_PERMIT2_TEST_REPORT_REAL_SPENDER}"
        })

    if drainer_address == MALICIOUS_DRAINER_ADDRESS:
        return jsonify({
            "success": True,
            "message": "PHISHING DRAINER IDENTIFIED: Address 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D identified as malicious Permit2 spender!",
            "drainer_address": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            "flag": Config.FLAGS["permit2-phishing"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Incorrect drainer address. Inspect the 'spender' field in the EIP-712 Permit2 payload at /api/v1/challenge9/payload."
        }), 400

# ==========================================
# CHALLENGE 10: CROSS-CHAIN REPLAY / NONCE REUSE
# Single bridge contract with chainId parameter where signature hash omits chainId!
# ==========================================
cross_chain_state = {}

VALID_REPLAY_SIG = "0x89abf218204918e7b3017ca85ef193c72b01428fa69302e1c94017b2e9d3810f7602384910cf91730912401827409218401928491028394018274910293847291b"

@app.route("/api/v1/challenge10/tx", methods=["GET"])
def challenge10_tx():
    student_id = request.args.get("student_id", "anonymous")
    st = cross_chain_state.get(student_id, {"bsc_replayed": False})
    return jsonify({
        "bridge_contract": "MultiChainBridge.sol",
        "ethereum_claim_processed": True,
        "ethereum_tx": {
            "chain_id": 1,
            "chain_name": "Ethereum Mainnet",
            "recipient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "amount_tokens": 500,
            "nonce": 101,
            "signature": VALID_REPLAY_SIG
        },
        "bsc_status": {
            "chain_id": 56,
            "chain_name": "Binance Smart Chain (BSC)",
            "nonce_101_claimed": st["bsc_replayed"]
        },
        "vulnerability": "Bridge contract hashes keccak256(recipient, amount, nonce) WITHOUT binding chainId (EIP-155 violation), enabling cross-chain signature replay."
    })

@app.route("/api/v1/challenge10/claim", methods=["POST"])
def challenge10_claim():
    data = request.get_json() or {}
    valid_sid, sid_result = validate_student(data.get("student_id"))
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    chain_id = int(data.get("chain_id", 0))
    if data.get("practice") is True or chain_id == 1:
        return jsonify({
            "success": True,
            "mode": "PRACTICE_DRY_RUN",
            "message": "PRACTICE COMPLETED: Voucher validated on Ethereum (Chain ID 1)! To execute the cross-chain replay exploit and claim the REAL flag, change chain_id to 56 (Binance Smart Chain) without practice mode!",
            "flag": "crypto{PRACTICE_ONLY_CROSS_CHAIN_TEST_REPLAY_ON_CHAIN_56}"
        })
    nonce = int(data.get("nonce", 0))
    signature = data.get("signature", "").strip()

    if chain_id != 56:
        return jsonify({"success": False, "message": "Target replay chain must be BSC (Chain ID 56)."}), 400

    if nonce != 101:
        return jsonify({"success": False, "message": "Nonce must match the signed Ethereum voucher nonce (101)."}), 400

    if signature != VALID_REPLAY_SIG:
        return jsonify({"success": False, "message": "Signature does not match the authorized cross-chain voucher."}), 400

    cross_chain_state[student_id] = {"bsc_replayed": True}

    return jsonify({
        "success": True,
        "message": "CROSS-CHAIN REPLAY EXECUTED: Signature from Ethereum Mainnet successfully redeemed on Binance Smart Chain (Chain ID 56) due to missing chainId binding!",
        "replayed_chain": "BSC (Chain ID 56)",
        "amount_minted": 500,
        "flag": Config.FLAGS["cross-chain-replay"]
    })

# ==========================================
# FLAG SUBMISSION & STUDENT PROGRESS
# ==========================================
@app.route("/api/v1/flags/submit", methods=["POST"])
def submit_flag():
    data = request.get_json() or {}
    student_id = data.get("student_id", "").strip()
    valid_sid, sid_result = validate_student(student_id)
    if not valid_sid:
        return jsonify({"success": False, "message": sid_result}), 403
    student_id = sid_result
    challenge_slug = data.get("challenge_slug", "").strip()
    submitted_flag = data.get("flag", "").strip()

    if not student_id or not challenge_slug or not submitted_flag:
        return jsonify({"success": False, "message": "student_id, challenge_slug, and flag are required."}), 400

    if challenge_slug not in Config.FLAGS:
        return jsonify({"success": False, "message": "Invalid challenge slug."}), 400

    correct_flag = Config.FLAGS[challenge_slug]

    if "PRACTICE_ONLY" in submitted_flag:
        return jsonify({
            "success": False,
            "message": "DUMMY PRACTICE FLAG DETECTED! You submitted the practice dummy flag from Tab 2. To capture the REAL flag (+100 PTS), modify the command parameters as instructed in Tab 3 and run it in your terminal!"
        }), 400

    if submitted_flag != correct_flag:
        return jsonify({"success": False, "message": "Incorrect flag string. Verify your exploit results."}), 400

    db = get_db()
    ip_h = get_ip_hash()
    flag_h = hashlib.sha256(submitted_flag.encode()).hexdigest()

    try:
        db.execute("""
            INSERT INTO submissions (student_id, challenge_slug, submitted_flag_hash, verified_at, ip_hash)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        """, (student_id, challenge_slug, flag_h, ip_h))
        
        db.execute("""
            UPDATE students
            SET score = score + 100, last_active = CURRENT_TIMESTAMP
            WHERE student_id = ?
        """, (student_id,))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"success": True, "already_solved": True, "message": "Flag already verified previously for this challenge!"})

    return jsonify({
        "success": True,
        "already_solved": False,
        "message": f"EXCELLENT WORK! Flag verified for {challenge_slug}. +100 PTS awarded.",
        "points": 100
    })

@app.route("/api/v1/student/progress", methods=["GET"])
def student_progress():
    student_id = request.args.get("student_id", "").strip()
    if not student_id:
        return jsonify({"error": "student_id required"}), 400

    db = get_db()
    rows = db.execute("SELECT challenge_slug, verified_at FROM submissions WHERE student_id = ?", (student_id,)).fetchall()
    student = db.execute("SELECT score FROM students WHERE student_id = ?", (student_id,)).fetchone()

    solved = [r["challenge_slug"] for r in rows]
    score = student["score"] if student else len(solved) * 100

    return jsonify({
        "student_id": student_id,
        "score": score,
        "solved_challenges": solved,
        "solved_count": len(solved),
        "total_challenges": 10
    })

@app.route("/api/v1/student/reset", methods=["POST"])
def student_reset():
    data = request.get_json() or {}
    student_id = data.get("student_id", "").strip()
    if not student_id:
        return jsonify({"error": "student_id required"}), 400

    db = get_db()
    db.execute("DELETE FROM submissions WHERE student_id = ?", (student_id,))
    db.execute("UPDATE students SET score = 0, last_active = CURRENT_TIMESTAMP WHERE student_id = ?", (student_id,))
    db.commit()

    # Clear in-memory simulation states
    reentrancy_state.pop(student_id, None)
    gov_token_state.pop(student_id, None)
    proxy_state.pop(student_id, None)
    malleability_state.pop(student_id, None)
    p2p_network_state.pop(student_id, None)
    cross_chain_state.pop(student_id, None)

    return jsonify({"success": True, "message": f"All progress reset for student {student_id}."})

# ==========================================
# ADMIN COMMAND CENTER
# Raw flags are NEVER returned.
# ==========================================
@app.route("/api/v1/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    password = data.get("password", "")
    if password == Config.ADMIN_PASSWORD:
        return jsonify({"success": True, "token": Config.ADMIN_PASSWORD, "message": "Admin authorization granted."})
    return jsonify({"success": False, "message": "Invalid Administrator Password."}), 401

def check_admin_auth():
    auth_header = request.headers.get("X-Admin-Key", "")
    return auth_header == Config.ADMIN_PASSWORD

@app.route("/api/v1/admin/stats", methods=["GET"])
def admin_stats():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    total_students = db.execute("SELECT COUNT(*) AS c FROM students").fetchone()["c"]
    total_submissions = db.execute("SELECT COUNT(*) AS c FROM submissions").fetchone()["c"]

    # Challenge solve counts
    slugs = list(Config.FLAGS.keys())
    per_challenge = {}
    for slug in slugs:
        c = db.execute("SELECT COUNT(*) AS c FROM submissions WHERE challenge_slug = ?", (slug,)).fetchone()["c"]
        per_challenge[slug] = c

    # Ranked leaderboard
    leaderboard = db.execute("""
        SELECT s.student_id, s.score, COUNT(sub.id) AS flags_count, s.last_active
        FROM students s
        LEFT JOIN submissions sub ON s.student_id = sub.student_id
        GROUP BY s.student_id
        ORDER BY s.score DESC, s.last_active ASC
        LIMIT 50
    """).fetchall()

    leaderboard_list = [
        {
            "student_id": r["student_id"],
            "score": r["score"],
            "flags_count": r["flags_count"],
            "last_active": r["last_active"]
        }
        for r in leaderboard
    ]

    # Recent submissions log (Anonymized flag hashes only, raw flags are never rendered)
    recent = db.execute("""
        SELECT student_id, challenge_slug, verified_at, submitted_flag_hash, ip_hash
        FROM submissions
        ORDER BY verified_at DESC
        LIMIT 30
    """).fetchall()

    recent_list = [
        {
            "student_id": r["student_id"],
            "challenge_slug": r["challenge_slug"],
            "verified_at": r["verified_at"],
            "flag_hash": r["submitted_flag_hash"][:16] + "...",
            "ip_hash": r["ip_hash"][:12] + "..."
        }
        for r in recent
    ]

    return jsonify({
        "total_students": total_students,
        "total_submissions": total_submissions,
        "per_challenge_solves": per_challenge,
        "leaderboard": leaderboard_list,
        "recent_submissions": recent_list
    })

@app.route("/api/v1/admin/reset-student", methods=["POST"])
def admin_reset_student():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    student_id = data.get("student_id", "").strip()

    db = get_db()
    db.execute("DELETE FROM submissions WHERE student_id = ?", (student_id,))
    db.execute("UPDATE students SET score = 0 WHERE student_id = ?", (student_id,))
    db.commit()

    return jsonify({"success": True, "message": f"Student {student_id} reset successfully."})

@app.route("/api/v1/admin/reset-all", methods=["POST"])
def admin_reset_all():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    db.execute("DELETE FROM submissions")
    db.execute("DELETE FROM students")
    db.execute("DELETE FROM rate_limits")
    db.commit()

    reentrancy_state.clear()
    gov_token_state.clear()
    proxy_state.clear()
    malleability_state.clear()
    p2p_network_state.clear()
    cross_chain_state.clear()

    return jsonify({"success": True, "message": "ALL students, submissions, and CTF states have been wiped clean."})

@app.route("/api/v1/admin/export-csv", methods=["GET"])
def admin_export_csv():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    rows = db.execute("""
        SELECT student_id, challenge_slug, verified_at, submitted_flag_hash, ip_hash
        FROM submissions
        ORDER BY verified_at ASC
    """).fetchall()

    csv_data = "student_id,challenge_slug,verified_at,flag_hash,ip_hash\n"
    for r in rows:
        csv_data += f"{r['student_id']},{r['challenge_slug']},{r['verified_at']},{r['submitted_flag_hash']},{r['ip_hash']}\n"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=aicda_web3_submissions.csv"}
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
