import os

targets = ['app/labs/[slug]/page.tsx', 'app/labs/%5Bslug%5D/page.tsx']

for target in targets:
    if not os.path.exists(target):
        continue
    with open(target, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if "delegatecall on contract B" in line:
            lines[i] = '      overview: "When contract A invokes delegatecall on contract B, B\'s code executes within A\'s storage context. If the storage layouts of contract A and contract B do not match identically, writes to slot N in B will corrupt slot N in A.",\n'
        elif "AdminProxy defines Slot 0" in line:
            lines[i] = '      vulnerabilityDetails: "AdminProxy defines Slot 0 = address public owner, Slot 1 = address public implementation. Meanwhile, StorageLib defines Slot 0 = address public candidate, Slot 1 = uint256 public lastUpdated. When StorageLib.init() writes candidate into Slot 0, it directly overwrites AdminProxy\'s owner!",\n'
        elif "curve order is n" in line:
            lines[i] = '      overview: "In ECDSA over secp256k1, the curve order is n. For any valid signature (r, s, v), the flipped signature (r, s\' = n - s, v\' = 28 if v==27 else 27) represents the exact same point and validates successfully in ecrecover.",\n'
        elif "Calculate malleable s'" in line:
            lines[i] = '        "Calculate malleable s\' = secp256k1_n - s in Python.",\n'
        elif "Submit (r, s', v=28)" in line:
            lines[i] = '        "Submit (r, s\', v=28) to /api/v1/challenge5/claim to drain the remaining 100 ETH vault reserve.",\n'
        elif "Calculate s' =" in line:
            lines[i] = '        "Calculate s\' = secp256k1_n - s",\n'
        elif "m/44" in line:
            lines[i] = '        "Derive the private key corresponding to path m/44\'/60\'/0\'/0/0 or standard test key.",\n'

    with open(target, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"✅ Successfully sanitized: {target}")

