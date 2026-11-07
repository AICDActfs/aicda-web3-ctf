import requests
import json
import time

BASE_URL = "http://127.0.0.1:8080"
STUDENT_ID = "test_operative_007"

def run_tests():
    print("=== Testing AICDA Web3 Pentesting CTF Backend ===")
    
    # 0. Health
    res = requests.get(f"{BASE_URL}/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check:", res.json()["status"], "Memory Profile:", res.json()["memory_profile"])

    # 1. Auth Access Code
    res = requests.post(f"{BASE_URL}/api/v1/auth/verify-code", json={"access_code": "AICDAWEB3CTF", "student_id": STUDENT_ID})
    assert res.status_code == 200 and res.json()["valid"] == True
    print("[PASS] Access Code Verification")

    # Challenge 1: Reentrancy
    res = requests.post(f"{BASE_URL}/api/v1/challenge1/exploit", json={"student_id": STUDENT_ID, "iterations": 10})
    assert res.status_code == 200 and "flag" in res.json()
    flag1 = res.json()["flag"]
    print("[PASS] Challenge 1 (Reentrancy):", flag1)

    # Challenge 2: Access Control
    res = requests.post(f"{BASE_URL}/api/v1/challenge2/mint", json={"student_id": STUDENT_ID, "amount": 1000000})
    assert res.status_code == 200 and "flag" in res.json()
    flag2 = res.json()["flag"]
    print("[PASS] Challenge 2 (Access Control):", flag2)

    # Challenge 3: Delegatecall Storage Clash
    res = requests.post(f"{BASE_URL}/api/v1/challenge3/exploit", json={"student_id": STUDENT_ID, "target_address": "0x1111111111111111111111111111111111111111"})
    assert res.status_code == 200 and "flag" in res.json()
    flag3 = res.json()["flag"]
    print("[PASS] Challenge 3 (Delegatecall Collision):", flag3)

    # Challenge 4: Weak Randomness
    blk = requests.get(f"{BASE_URL}/api/v1/challenge4/block").json()
    import hashlib
    seed = hashlib.sha256(f"{blk['prev_blockhash'][2:]}:{blk['block_timestamp']}".encode()).hexdigest()
    winning_number = int(seed, 16) % 1000
    res = requests.post(f"{BASE_URL}/api/v1/challenge4/bet", json={"student_id": STUDENT_ID, "predicted_number": winning_number})
    assert res.status_code == 200 and "flag" in res.json()
    flag4 = res.json()["flag"]
    print("[PASS] Challenge 4 (Weak Randomness):", flag4)

    # Challenge 5: Signature Malleability (Proving Double Spend)
    # Secp256k1 n
    SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
    voucher_info = requests.get(f"{BASE_URL}/api/v1/challenge5/voucher?student_id={STUDENT_ID}").json()
    orig_s = int(voucher_info["initial_voucher"]["s"], 16)
    malleable_s = hex(SECP256K1_N - orig_s)
    res = requests.post(f"{BASE_URL}/api/v1/challenge5/claim", json={
        "student_id": STUDENT_ID,
        "r": voucher_info["initial_voucher"]["r"],
        "s": malleable_s,
        "v": 28
    })
    assert res.status_code == 200 and res.json()["replay_proven"] == True and "flag" in res.json()
    flag5 = res.json()["flag"]
    print("[PASS] Challenge 5 (Signature Malleability Replay):", flag5)

    # Challenge 6: Frontend Key Leak
    res = requests.post(f"{BASE_URL}/api/v1/challenge6/verify", json={
        "student_id": STUDENT_ID,
        "private_key": "0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3"
    })
    assert res.status_code == 200 and "flag" in res.json()
    flag6 = res.json()["flag"]
    print("[PASS] Challenge 6 (Frontend Key Leak):", flag6)

    # Challenge 7: Exchange Hot Wallet Leak
    metrics = requests.get(f"{BASE_URL}/api/v1/exchange/internal/metrics?debug=true").json()
    hot_key = metrics["system_env"]["INTERNAL_SIGNER_KEY"]
    res = requests.post(f"{BASE_URL}/api/v1/exchange/withdraw", json={"student_id": STUDENT_ID, "signer_key": hot_key})
    assert res.status_code == 200 and "flag" in res.json()
    flag7 = res.json()["flag"]
    print("[PASS] Challenge 7 (Exchange Hot Wallet):", flag7)

    # Challenge 8: P2P Sybil / Eclipse (Exempt from burst filter!)
    for i in range(50):
        requests.post(f"{BASE_URL}/api/v1/p2p/peer/register", json={"student_id": STUDENT_ID, "peer_id": f"peer_{i}"})
    res = requests.post(f"{BASE_URL}/api/v1/p2p/verify", json={"student_id": STUDENT_ID})
    assert res.status_code == 200 and "flag" in res.json()
    flag8 = res.json()["flag"]
    print("[PASS] Challenge 8 (P2P Sybil Eclipse):", flag8)

    # Challenge 9: Permit2 Phishing
    res = requests.post(f"{BASE_URL}/api/v1/challenge9/report", json={
        "student_id": STUDENT_ID,
        "drainer_address": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    })
    assert res.status_code == 200 and "flag" in res.json()
    flag9 = res.json()["flag"]
    print("[PASS] Challenge 9 (Permit2 Phishing):", flag9)

    # Challenge 10: Cross-Chain Replay
    tx_info = requests.get(f"{BASE_URL}/api/v1/challenge10/tx?student_id={STUDENT_ID}").json()
    res = requests.post(f"{BASE_URL}/api/v1/challenge10/claim", json={
        "student_id": STUDENT_ID,
        "chain_id": 56,
        "nonce": 101,
        "signature": tx_info["ethereum_tx"]["signature"]
    })
    assert res.status_code == 200 and "flag" in res.json()
    flag10 = res.json()["flag"]
    print("[PASS] Challenge 10 (Cross-Chain Replay):", flag10)

    # Submit All 10 Flags and Verify 1000 PTS
    flags = [
        ("reentrancy", flag1),
        ("access-control", flag2),
        ("delegatecall-collision", flag3),
        ("weak-randomness", flag4),
        ("signature-malleability", flag5),
        ("frontend-key-leak", flag6),
        ("exchange-hot-wallet", flag7),
        ("p2p-eclipse", flag8),
        ("permit2-phishing", flag9),
        ("cross-chain-replay", flag10)
    ]
    for slug, f in flags:
        sub_res = requests.post(f"{BASE_URL}/api/v1/flags/submit", json={"student_id": STUDENT_ID, "challenge_slug": slug, "flag": f})
        assert sub_res.status_code == 200
    
    prog = requests.get(f"{BASE_URL}/api/v1/student/progress?student_id={STUDENT_ID}").json()
    assert prog["score"] == 1000 and prog["solved_count"] == 10
    print("[PASS] Student Progress: 10/10 Solved, 1000/1000 PTS!")

    # Verify Admin Stats (Without exposing raw flags)
    admin_res = requests.get(f"{BASE_URL}/api/v1/admin/stats", headers={"X-Admin-Key": "AICDAadmin"}).json()
    assert admin_res["total_submissions"] >= 10
    print("[PASS] Admin Stats Verified. Submissions Count:", admin_res["total_submissions"])

    print("\n=======================================================")
    print("ALL 10 WEB3 CHALLENGES & ADMIN SYSTEM VERIFIED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
