import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "aicda-web3-super-secret-key-prod")
    _raw_admin = os.getenv("ADMIN_PASSWORD", "AICDA#Crypt0@Admin!2026")
    _raw_admin = os.getenv("ADMIN_PASSWORD", "AICDA#Crypt0@Admin!2026")
    ADMIN_PASSWORD = "AICDA#Crypt0@Admin!2026" if _raw_admin in ("AICDAadmin", "admin", "admin123", "") else _raw_admin
    STUDENT_ACCESS_CODE = os.getenv("STUDENT_ACCESS_CODE", "AICDAWEB3CTF")
    
    # Render Free-Tier Memory & RPC Fallback Profile
    # In-memory Python EVM state is kept <150MB RAM.
    # If SEPOLIA_RPC_URL is provided, backend can optionally bridge verification to live testnet.
    SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL", "")
    MEMORY_PROFILE = "render-free-tier (<300MB)"

    # Rate Limiting & Anti-Automation Specs:
    # Strict limits prevent automated tools (Burp Scanner, FFUF, DirBuster) from crashing container.
    RATE_LIMIT_GLOBAL = int(os.getenv("RATE_LIMIT_GLOBAL", "30")) # 30 requests / minute
    BURST_THRESHOLD = int(os.getenv("BURST_THRESHOLD", "10"))     # max 10 failed reqs in 2 seconds triggers temporary ban
    
    # SPECIAL EXEMPTION: Challenge 8 (P2P Sybil / Eclipse Simulation)
    # The /api/v1/p2p/* endpoints require registering 50 peers. They are EXEMPT from burst drop
    # and have a higher rate limit of 100 requests / minute.
    RATE_LIMIT_P2P = int(os.getenv("RATE_LIMIT_P2P", "100"))      # 100 requests / minute for /api/v1/p2p/*

    # Deterministic Flag Configuration loaded securely from environment variables
    FLAGS = {
        "reentrancy": os.getenv("FLAG_CHALLENGE_1", "crypto{r33ntr4ncy_dr41n_th3_v4ult_91f8}"),
        "access-control": os.getenv("FLAG_CHALLENGE_2", "crypto{4cc3ss_c0ntr0l_m1ss1ng_0wn3r_82d1}"),
        "delegatecall-collision": os.getenv("FLAG_CHALLENGE_3", "crypto{d3l3g4t3c4ll_st0r4g3_cl4sh_39b2}"),
        "weak-randomness": os.getenv("FLAG_CHALLENGE_4", "crypto{w34k_r4nd0mn3ss_pr3d1ct3d_71c4}"),
        "signature-malleability": os.getenv("FLAG_CHALLENGE_5", "crypto{s1gn4tur3_m4ll34b1l1ty_d0ubl3_sp3nd_65a3}"),
        "frontend-key-leak": os.getenv("FLAG_CHALLENGE_6", "crypto{fr0nt3nd_s33d_phr4s3_3xp0s3d_44f1}"),
        "exchange-hot-wallet": os.getenv("FLAG_CHALLENGE_7", "crypto{3xch4ng3_h0t_w4ll3t_k3y_l34k_58e9}"),
        "p2p-eclipse": os.getenv("FLAG_CHALLENGE_8", "crypto{p2p_syb1l_3cl1ps3_c0mpl3t3_19c8}"),
        "permit2-phishing": os.getenv("FLAG_CHALLENGE_9", "crypto{p3rm1t2_sp3nd3r_dr41n3r_1d3nt1f13d_83d2}"),
        "cross-chain-replay": os.getenv("FLAG_CHALLENGE_10", "crypto{cr0ss_ch41n_r3pl4y_n0nc3_r3us3_72b5}")
    }
