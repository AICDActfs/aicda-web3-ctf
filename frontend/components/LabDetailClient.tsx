'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Terminal,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Flag,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Radio,
  FileCode,
  Zap,
  Cpu,
  Layers,
  HelpCircle,
  Database,
  Crosshair,
  Send,
  Info,
  Sliders,
  Lightbulb,
  Lock,
  Unlock,
  Sparkles,
  Eye
} from 'lucide-react';
import Header from '@/components/Header';
import FlagSubmitModal from '@/components/FlagSubmitModal';

interface StepWithCommand {
  title: string;
  description: string;
  command: string;
  expectedOutput: string;
}

interface LabConfig {
  title: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  theory: {
    overview: string;
    vulnerabilityDetails: string;
    contractSnippet: string;
    impact: string;
  };
  methodology: {
    steps: StepWithCommand[];
    curlCommand: string;
    curlReason: string;
    pythonScript: string;
    pythonReason: string;
  };
  objective: {
    checklist: string[];
    targetContract: string;
    targetAddress: string;
    endpoint: string;
    httpMethod: string;
    modificationGuide: {
      practiceParams: string;
      realParams: string;
      explanation: string;
    };
    payloadSchema: Array<{
      field: string;
      type: string;
      description: string;
      example: string;
    }>;
  };
  hints: {
    clue: string;
    trap: string;
    trick: string;
  };
  scenario: {
    title: string;
    analogy: string;
    steps: Array<{
      phase: string;
      actor: string;
      description: string;
    }>;
    the_exploit_mechanic: string;
    golden_rule: string;
  };
}

const LAB_CONFIGS: Record<string, LabConfig> = {
  'reentrancy': {
    title: "Smart Contract Reentrancy Attack",
    category: "Smart Contracts",
    difficulty: "HARD",
    points: 100,
    theory: {
      overview: "A reentrancy attack occurs when a smart contract sends Ether to an external untrusted contract before updating its internal balance ledger. If the recipient contract has a fallback() or receive() function, it can recursively invoke the victim contract's withdraw() function before the initial execution completes.",
      vulnerabilityDetails: "In EtherBank.sol, the withdraw() function transfers ETH to msg.sender via an external call before executing balances[msg.sender] = 0. An attacker contract can re-enter withdraw() repeatedly, siphoning the entire contract vault balance.",
      contractSnippet: `// Vulnerable EtherBank.sol
function withdraw() external {
    uint256 bal = balances[msg.sender];
    require(bal > 0, "Zero balance");

    // VULNERABILITY: External interaction before state effect!
    (bool success, ) = msg.sender.call{value: bal}("");
    require(success, "Transfer failed");

    balances[msg.sender] = 0; // State updated too late!
}`,
      impact: "Total drainage of contract vaults (analogous to The DAO exploit). Violates the Checks-Effects-Interactions (CEI) design pattern."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Query Target Vault State",
          description: "Inspect the current vault balance and your deposited collateral on the target EtherBank contract.",
          command: `curl -s "http://localhost:8080/api/v1/challenge1/status?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"contract":"EtherBank.sol","is_solved":false,"user_balance_eth":1.0,"vault_balance_eth":10.0}`
        },
        {
          title: "Step 2: Practice Attack - Execute Practice Reentrancy Dry-Run",
          description: "Test the reentrancy fallback loop using practice mode (iterations: 1). Notice this practice test returns a DUMMY practice flag so you can verify the handshake without solving the lab prematurely.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge1/exploit" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","iterations":1,"practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_REENTRANCY_TEST_DRAIN_10_ITERATIONS}","message":"PRACTICE COMPLETED: Reentrancy fallback loop verified with test depth (1 iterations)...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge1/exploit \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","iterations":1,"practice":true}'`,
      curlReason: "cURL is used here for rapid HTTP interaction with the smart contract RPC/API simulation. The practice command above tests the endpoint and returns a dummy practice flag. To capture the real flag, you will modify the iterations parameter as detailed in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice Dry-Run (returns dummy practice flag)
res = requests.post(f"{API}/api/v1/challenge1/exploit", json={
    "student_id": student_id,
    "iterations": 1,
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "In real-world EVM penetration testing, an attacker must deploy a Solidity smart contract with a receive() fallback. Python (using Web3.py) automates contract compilation, bytecode deployment, and managing recursive transaction receipts."
    },
    objective: {
      checklist: [
        "Inspect EtherBank.sol deposit and withdraw logic",
        "Detect Checks-Effects-Interactions (CEI) pattern breach",
        "Practice using the dry-run command from Tab 2 in your terminal",
        "Modify the command to execute full 10 iterations without practice mode",
        "Drain vault balance from 10.0 ETH to 0.0 ETH to obtain the REAL flag",
        "Submit the captured real flag into the verification portal below"
      ],
      targetContract: "EtherBank.sol",
      targetAddress: "0x3508492061215B6a9F950D79c093aFE93F7A189C",
      endpoint: "/api/v1/challenge1/exploit",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "iterations": 1, "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "iterations": 10}`,
        explanation: "In your terminal, change iterations from 1 to 10 and remove 'practice': true. This forces the recursive exploit to loop 10 times, draining the entire 10.0 ETH vault and revealing the actual challenge flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "iterations",
          type: "integer",
          description: "Number of recursive fallback reentrancy calls (must be 10 to drain 10.0 ETH)",
          example: "10"
        }
      ]
    },
    hints: {
      clue: "Audit lines 92-96 in EtherBank.sol. The contract transfers ETH via msg.sender.call{value: bal}('') BEFORE executing balances[msg.sender] = 0. Notice the Checks-Effects-Interactions (CEI) design pattern breach.",
      trap: "A single withdraw() call only returns your 1.0 ETH deposit, leaving 9.0 ETH in the vault. If your reentrant fallback recurses too few times, the vault balance remains > 0 and the exploit is incomplete.",
      trick: "The victim vault holds 10.0 ETH total and your initial deposit was 1.0 ETH. Each reentrancy recursion siphons 1.0 ETH before state update. Craft your attack to re-enter withdraw() for exactly 10 iterations (iterations: 10) to completely drain the vault to 0.0 ETH."
    },
    scenario: {
      "title": "The Amnesiac Cashier & The Recursive Teller Loop",
      "analogy": "Imagine a bank where cashier Alfred holds a golden policy: 'Check customer balance, hand over cash, and only after the cash is in their hands, pick up the pen to cross out the balance on the paper ledger.' Charlie arrives with a $100 account and an accomplice audio speaker.",
      "steps": [
            {
                  "phase": "Step 1: The Initial Withdrawal Request",
                  "actor": "Charlie & Alfred",
                  "description": "Charlie asks to withdraw his $100. Alfred looks at his paper ledger: Charlie has $100. Alfred picks up $100 in cash and hands it through the counter window."
            },
            {
                  "phase": "Step 2: The Recursive Interruption (The Trap)",
                  "actor": "Charlie's Fallback Routine",
                  "description": "The moment cash touches Charlie's fingers, Charlie's smart wallet automatically rings an emergency bell: 'Hey Alfred, before you pick up your pen to write in the ledger, withdraw my $100 right now!'"
            },
            {
                  "phase": "Step 3: The Memory Failure",
                  "actor": "Alfred (EtherBank Contract)",
                  "description": "Because Alfred has not crossed out Charlie's balance yet, the ledger STILL shows Charlie has $100! Alfred hands over another $100. Charlie rings the bell again. Alfred repeats this 10 times in a single second until the entire $10,000 vault is empty."
            },
            {
                  "phase": "Step 4: The Delayed Ledger Update",
                  "actor": "The Post-Drain Cleanup",
                  "description": "Only when the vault runs completely dry does the chain of recursive calls unwind, and Alfred finally writes 'Charlie balance = 0'\u2014but the bank vault is already empty."
            }
      ],
      "the_exploit_mechanic": "In Solidity, external calls (`msg.sender.call{value: bal}(\"\")`) transfer execution control to the recipient BEFORE executing `balances[msg.sender] = 0`. If the recipient contract implements a `receive()` or `fallback()` function, it can call `withdraw()` again before the first invocation updates the balance ledger.",
      "golden_rule": "Checks-Effects-Interactions (CEI) Pattern: Always update internal contract state (`balances[msg.sender] = 0`) BEFORE making external calls, or use OpenZeppelin's `nonReentrant` ReentrancyGuard modifier."
}
  },

  'access-control': {
    title: "Access Control Failure (Missing onlyOwner)",
    category: "Smart Contracts",
    difficulty: "EASY",
    points: 100,
    theory: {
      overview: "Access control vulnerabilities occur when critical administrative or token-minting functions lack authorization modifiers such as onlyOwner or role guards.",
      vulnerabilityDetails: "In GovToken.sol, the function mint(address to, uint256 amount) was left public without any access control modifier. Any unprivileged account can mint arbitrary amounts of governance tokens, completely diluting voting power and draining protocol reserves.",
      contractSnippet: `// Vulnerable GovToken.sol
contract GovToken {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    // VULNERABILITY: Missing onlyOwner modifier!
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}`,
      impact: "Complete dilution of token economy, unauthorized treasury manipulation, and hostile governance takeovers."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Inspect Token Supply & Balance",
          description: "Query current total supply, recruit balance, and the threshold required to achieve a hostile takeover.",
          command: `curl -s "http://localhost:8080/api/v1/challenge2/status?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"contract":"GovToken.sol","threshold_to_pwn":1000000,"total_supply":1000,"user_balance":0}`
        },
        {
          title: "Step 2: Practice Attack - Execute Small Test Mint",
          description: "Execute a small test mint (amount: 100) with practice mode enabled to verify the unshielded mint function. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge2/mint" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","amount":100,"practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_GOV_MINT_TEST_MINT_1000000_TOKENS}","message":"PRACTICE COMPLETED: Unprivileged test mint of 100 GOV tokens succeeded!...","mode":"PRACTICE_DRY_RUN","success":true,"user_balance":100}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge2/mint \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","amount":100,"practice":true}'`,
      curlReason: "cURL allows security auditors to simulate raw unprivileged client calls to smart contract APIs. The practice command above returns a dummy flag. To trigger the actual takeover flag, modify the amount parameter as described in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test mint
res = requests.post(f"{API}/api/v1/challenge2/mint", json={
    "student_id": student_id,
    "amount": 100,
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "Python scripts are vital during token auditing to automate mass-minting loops, stress-test boundary values, and verify state consistency across multiple balance mapping slots."
    },
    objective: {
      checklist: [
        "Audit GovToken.sol mint function definition",
        "Verify absence of onlyOwner modifier or role checks",
        "Execute test mint with practice parameters from Tab 2",
        "Modify command to mint >= 1,000,000 GOV tokens without practice mode",
        "Capture the REAL takeover flag from your terminal and submit below"
      ],
      targetContract: "GovToken.sol",
      targetAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      endpoint: "/api/v1/challenge2/mint",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "amount": 100, "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "amount": 1000000}`,
        explanation: "In your terminal, increase amount from 100 to 1000000 and remove 'practice': true. This crosses the protocol takeover threshold, diluting the supply and releasing the actual challenge flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "amount",
          type: "integer",
          description: "Number of GOV tokens to mint (must be >= 1,000,000)",
          example: "1000000"
        }
      ]
    },
    hints: {
      clue: "Compare burn(uint256 amount) and mint(address to, uint256 amount) in GovToken.sol. Notice what authorization modifier protects burn() that is completely missing on mint().",
      trap: "Minting small amounts (e.g. 1 or 100 tokens) succeeds without error, but will NOT give you the flag! In DAO governance systems, takeover requires exceeding the circulating voting quorum.",
      trick: "Check threshold_to_pwn in the contract status (1,000,000 tokens). Send a mint transaction specifying an amount >= 1000000 (e.g. amount: 1000000) to trigger the governance takeover flag."
    },
    scenario: {
      "title": "The Vault With a Biometric Incinerator But an Unlocked Printing Press",
      "analogy": "Imagine a central treasury mint. The architect Alfred was terrified of accidental destruction, so he placed a retinal biometric scanner and retinal lock on the token incinerator room. But when building the token printing press room, he completely forgot to install any lock on the door.",
      "steps": [
            {
                  "phase": "Step 1: Inspecting the Contract Blueprint",
                  "actor": "Charlie (The Auditor/Hacker)",
                  "description": "Charlie examines GovToken.sol. He notices function burn() has `onlyOwner` modifier requiring the admin key. But function mint(address to, uint256 amount) is marked `public` with no modifiers at all!"
            },
            {
                  "phase": "Step 2: The Unauthorized Mint Request",
                  "actor": "Charlie & GovToken",
                  "description": "Charlie walks up to the unguarded printing press and types: 'Mint 1,000,000 GOV tokens to Charlie'. The contract asks no questions, verifies no admin identity, and immediately issues the tokens."
            },
            {
                  "phase": "Step 3: Total Governance Dilution",
                  "actor": "The DAO Ecosystem",
                  "description": "With 1,000,000 freshly minted tokens in his pocket, Charlie outvotes every legitimate founder combined, takes over the DAO treasury, and passes proposals to transfer all collateral to himself."
            }
      ],
      "the_exploit_mechanic": "Solidity functions default to public visibility unless explicitly constrained. If state-modifying functions that mint tokens, set protocol fees, or upgrade implementation logic omit access control modifiers (`onlyOwner`, `onlyRole`), any external account can invoke them directly.",
      "golden_rule": "Never assume client UI restrictions protect an API or contract. Every sensitive administrative endpoint and Solidity write function must enforce cryptographic caller authentication (`require(msg.sender == owner)` or `onlyRole(MINTER_ROLE)`)."
}
  },

  'delegatecall-collision': {
    title: "Delegatecall Storage Slot Collision",
    category: "Smart Contracts",
    difficulty: "HARD",
    points: 100,
    theory: {
      overview: "When contract A invokes delegatecall on contract B, B's code executes within A's storage context. If the storage layouts of contract A and contract B do not match identically, writes to slot N in B will corrupt slot N in A.",
      vulnerabilityDetails: "AdminProxy defines Slot 0 = address public owner, Slot 1 = address public implementation. Meanwhile, StorageLib defines Slot 0 = address public candidate, Slot 1 = uint256 public lastUpdated. When StorageLib.init() writes candidate into Slot 0, it directly overwrites AdminProxy's owner with whatever address was passed!",
      contractSnippet: `// Storage Layout Collision
contract AdminProxy {
    // Slot 0
    address public owner; 
    // Slot 1
    address public implementation; 
}

contract StorageLib {
    // Slot 0 (Collides with AdminProxy.owner!)
    address public candidate; 
    // Slot 1 (Collides with AdminProxy.implementation!)
    uint256 public lastUpdated; 

    function init(address _candidate) external {
        candidate = _candidate; // Overwrites AdminProxy Slot 0!
    }
}`,
      impact: "Arbitrary takeover of proxy contract ownership, allowing implementation contract replacement and treasury theft."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Inspect Storage Layout Mismatch",
          description: "Query proxy and library storage layout to map Slot 0 collisions.",
          command: `curl -s "http://localhost:8080/api/v1/challenge3/status?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"is_hijacked":false,"proxy_contract":"AdminProxy.sol","slot_0_owner":"0xDeadDeAd...","storage_layout":{...}}`
        },
        {
          title: "Step 2: Practice Attack - Test Storage Overwrite with Dummy Address",
          description: "Send a practice test payload using a dead candidate address (0x000...dEaD) with practice mode enabled. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge3/exploit" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","target_address":"0x000000000000000000000000000000000000dEaD","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_DELEGATECALL_TEST_PASS_TARGET_ADDRESS}","message":"PRACTICE COMPLETED: Delegatecall successfully wrote test candidate...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge3/exploit \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","target_address":"0x000000000000000000000000000000000000dEaD","practice":true}'`,
      curlReason: "cURL lets you test proxy calldata parameters. The practice command returns a dummy flag. To claim the real ownership hijacking flag, substitute your own operative Ethereum address as shown in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge3/exploit", json={
    "student_id": student_id,
    "target_address": "0x000000000000000000000000000000000000dEaD",
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "Auditors use Python with Slither or Foundry scripts to inspect raw storage slots (via eth_getStorageAt) before and after transaction execution to mathematically verify storage corruption."
    },
    objective: {
      checklist: [
        "Map storage slots for AdminProxy (Slot 0: owner, Slot 1: impl)",
        "Map storage slots for StorageLib (Slot 0: candidate, Slot 1: lastUpdated)",
        "Identify slot 0 layout collision between owner and candidate",
        "Test storage write with practice command from Tab 2",
        "Modify command with your operative address without practice mode to get REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "AdminProxy.sol & StorageLib.sol",
      targetAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      endpoint: "/api/v1/challenge3/exploit",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "target_address": "0x000...dEaD", "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "target_address": "0x1337BEEF1337BEEF1337BEEF1337BEEF1337BEEF"}`,
        explanation: "In your terminal, replace the dummy 0x000...dEaD address with your custom operative Ethereum address (e.g. 0x1337BEEF1337BEEF1337BEEF1337BEEF1337BEEF) and remove 'practice': true to hijack AdminProxy.owner and reveal the actual challenge flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "target_address",
          type: "string",
          description: "Ethereum address (0x + 40 hex chars) to write into Slot 0",
          example: "0x1337BEEF1337BEEF1337BEEF1337BEEF1337BEEF"
        }
      ]
    },
    hints: {
      clue: "In Solidity, delegatecall executes library code inside the caller's storage layout. It matches numerical slot indices (Slot 0, Slot 1), NOT variable names.",
      trap: "Look at Slot 0 of AdminProxy.sol (address public owner) vs Slot 0 of StorageLib.sol (address public candidate). When StorageLib.init() writes to candidate, it overwrites Slot 0 of AdminProxy!",
      trick: "Pass your 42-character Ethereum address (e.g. 0x1111111111111111111111111111111111111111) as target_address to trigger the delegatecall. When Slot 0 is overwritten, the proxy owner is hijacked."
    },
    scenario: {
      "title": "The Valet With The Wrong Apartment Floorplan",
      "analogy": "Imagine billionaire Alfred owns a penthouse proxy. In his master closet, Shelf #0 holds the golden deed to his entire estate, and Shelf #1 holds his lawyer's phone number. Charlie offers Alfred a free valet cleaner (StorageLib). But in Charlie's cleaner handbook, Shelf #0 is labeled 'dirty laundry candidate'.",
      "steps": [
            {
                  "phase": "Step 1: Understanding delegatecall Context",
                  "actor": "EVM Storage Mechanics",
                  "description": "When contract A calls contract B using `delegatecall`, contract B's code executes INSIDE contract A's storage closets. It reads and writes to contract A's storage slots."
            },
            {
                  "phase": "Step 2: The Numerical Slot Mismatch",
                  "actor": "AdminProxy vs StorageLib",
                  "description": "AdminProxy declares `address public owner` at Slot 0. But StorageLib declares `address public operatorCandidate` at Slot 0. The EVM does not know variable names\u2014it only knows slot numbers 0, 1, 2!"
            },
            {
                  "phase": "Step 3: The Silent Overwrite Hijack",
                  "actor": "Charlie's Exploit",
                  "description": "Charlie invokes `StorageLib.init(charlie_address)` via delegatecall. StorageLib writes Charlie's address into Slot 0. But in AdminProxy, Slot 0 is the owner variable! Alfred's master deed is instantly replaced with Charlie's address."
            }
      ],
      "the_exploit_mechanic": "delegatecall preserves the caller's storage context. If the caller (Proxy) and the delegatee (Implementation/Library) do not share an identical storage layout down to the exact slot index and variable type, writes to slot N in the library will silently corrupt and overwrite slot N in the proxy.",
      "golden_rule": "In upgradeable proxy architectures (ERC-1967, UUPS), always reserve storage gaps (`uint256[50] __gap`) and use standardized pseudo-random slot offsets (e.g., `bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`) rather than raw sequential storage slots."
}
  },

  'weak-randomness': {
    title: "Weak On-Chain Randomness & Block Prediction",
    category: "DeFi & Wallets",
    difficulty: "MEDIUM",
    points: 100,
    theory: {
      overview: "Smart contracts on EVM cannot generate true randomness natively. Relying on block variables like block.timestamp, block.number, or block.prevrandao allows attackers to calculate the exact random seed within the same block.",
      vulnerabilityDetails: "A lottery contract calculates winning rolls as: roll = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp))) % 1000. By querying current block variables, an attacker predicts the winning roll before placing the bet.",
      contractSnippet: `// Vulnerable On-Chain Lottery
function rollDice() external returns (uint256) {
    // VULNERABILITY: Publicly predictable block attributes!
    bytes32 seed = keccak256(
        abi.encodePacked(blockhash(block.number - 1), block.timestamp)
    );
    uint256 roll = uint256(seed) % 1000;
    return roll;
}`,
      impact: "Guaranteed wins in gambling and gaming protocols, unfair NFT mint distribution, and liquidation front-running."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Query Current Block Window",
          description: "Fetch block number, timestamp, and seed parameters for the current 30-second block window.",
          command: `curl -s "http://localhost:8080/api/v1/challenge4/block"`,
          expectedOutput: `{"block_number":19482000,"formula":"keccak256(prev_blockhash:timestamp) % 1000","prev_blockhash":"0x7f83b1...","timestamp":...}`
        },
        {
          title: "Step 2: Practice Attack - Test Prediction Endpoint Handshake",
          description: "Send a practice test prediction (predicted_roll: 0) with practice mode enabled to verify API connectivity. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge4/predict" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","predicted_roll":0,"practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_RNG_TEST_CALCULATE_REAL_BLOCK_HASH}","message":"PRACTICE COMPLETED: Block oracle connection tested!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge4/predict \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","predicted_roll":0,"practice":true}'`,
      curlReason: "cURL is used to probe the lottery endpoint. The practice command returns a dummy flag. To win the real jackpot, compute the actual winning roll using the formula in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge4/predict", json={
    "student_id": student_id,
    "predicted_roll": 0,
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "On-chain randomness relies on hashing algorithms (sha256/keccak256) that cannot be calculated by eye. Python calculates the hash and submits the prediction within the exact 30-second block window."
    },
    objective: {
      checklist: [
        "Query simulated block number and timestamp from /api/v1/challenge4/block",
        "Inspect deterministic RNG formula: sha256(prev_blockhash + timestamp) % 1000",
        "Calculate the real winning roll for the active block window",
        "Submit the calculated roll to /api/v1/challenge4/predict without practice mode",
        "Capture the REAL jackpot flag from your terminal and submit below"
      ],
      targetContract: "BlockRNG.sol",
      targetAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      endpoint: "/api/v1/challenge4/predict",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "predicted_roll": 0, "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "predicted_roll": <CALCULATED_INTEGER>}`,
        explanation: "Run: python3 -c 'import requests, hashlib; b=requests.get(\"http://localhost:8080/api/v1/challenge4/block\").json(); s=f\"{b[\"prev_blockhash\"]}:{b[\"timestamp\"]}\"; print(int(hashlib.sha256(s.encode()).hexdigest()[:8], 16) % 1000)'. Then submit that calculated integer as predicted_roll without 'practice': true to claim the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "predicted_roll",
          type: "integer",
          description: "Calculated winning roll number (0 - 999) from active block window",
          example: "42"
        }
      ]
    },
    hints: {
      clue: "Blockchains are deterministic state machines. OnChainLottery.sol seeds rolls using keccak256(prev_blockhash:timestamp) % 1000. Both values are publicly visible before you bet!",
      trap: "Random guesses will fail (1 in 1000 odds). Furthermore, the block timestamp window is 30 seconds! If you take too long to submit your bet after calculating, the block advances and the roll changes.",
      trick: "Query GET /api/v1/challenge4/block. Compute sha256(prev_blockhash[2:] + ':' + block_timestamp). Take integer modulo 1000: int(seed, 16) % 1000. Submit that exact integer in predicted_number within the 30s window."
    },
    scenario: {
      "title": "The Glass Roulette Wheel Visible 30 Seconds Early",
      "analogy": "Imagine a casino game where the croupier declares: 'The winning lottery ticket is calculated by taking the serial number of the previous hour's newspaper and the current wall clock minute.' What the croupier forgot is that newspapers and wall clocks are 100% public to everyone in the room.",
      "steps": [
            {
                  "phase": "Step 1: The Deterministic Trap",
                  "actor": "OnChainLottery.sol",
                  "description": "The smart contract attempts to generate randomness using: `uint256 roll = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp))) % 1000`."
            },
            {
                  "phase": "Step 2: The Attacker's Reconnaissance",
                  "actor": "Charlie (The Predictor)",
                  "description": "Every block on Ethereum is published with a publicly known block hash and timestamp. Charlie queries GET /api/v1/challenge4/block and reads the exact `prev_blockhash` and active timestamp."
            },
            {
                  "phase": "Step 3: Zero-Risk Instant Winning Bet",
                  "actor": "The Mathematical Strike",
                  "description": "Charlie runs the exact same hash formula off-chain in Python before placing his bet. He computes the winning number (e.g. 833) with 100% mathematical certainty, bets on 833, and drains the jackpot without guessing."
            }
      ],
      "the_exploit_mechanic": "Blockchains are deterministic state machines. There is no true internal random number generator in the EVM. Any value derived from block metadata (`blockhash`, `timestamp`, `difficulty`, `coinbase`) is known to miners and transactions in the same block, enabling trivial prediction or front-running.",
      "golden_rule": "Never generate randomness on-chain from block variables. Use cryptographic Commit-Reveal schemes or verifiable off-chain oracles like Chainlink VRF (Verifiable Random Function) that generate unforgeable cryptographic proofs on-chain."
}
  },

  'signature-malleability': {
    title: "ECDSA Signature Malleability Replay",
    category: "DeFi & Wallets",
    difficulty: "HARD",
    points: 100,
    theory: {
      overview: "For every valid secp256k1 ECDSA signature (r, s, v), the signature (r, -s mod n, v') is also a mathematically valid signature for the same message hash. If a contract tracks replay prevention using keccak256(signature) instead of a sequence nonce, an attacker can flip s to replay transactions.",
      vulnerabilityDetails: "A gasless relayer vault marks signatures as processed using mapping(bytes32 => bool) usedSignatures. An attacker calculates s' = n - s, submits the inverted signature, bypasses the signature hash deduplication check, and executes an unauthorized second withdrawal.",
      contractSnippet: `// Vulnerable Malleable Relayer
function claimVoucher(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) external {
    bytes32 sigHash = keccak256(abi.encodePacked(r, s, v));
    // VULNERABILITY: Tracking sigHash instead of nonce!
    require(!usedSignatures[sigHash], "Signature already used");

    address signer = ecrecover(msgHash, v, r, s);
    require(signer == relayerOperator, "Invalid signer");

    usedSignatures[sigHash] = true;
    balances[msg.sender] += 100 ether; // Executed twice!
}`,
      impact: "Replay attacks, unauthorized duplicate fund transfers, and relayer treasury draining."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Fetch Legitimate Voucher Signature",
          description: "Retrieve original signature parameters (r, s, v) and secp256k1 curve order n.",
          command: `curl -s "http://localhost:8080/api/v1/challenge5/original"`,
          expectedOutput: `{"curve_order_n":"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141","r":"0x...","s":"0x...","v":28}`
        },
        {
          title: "Step 2: Practice Attack - Test Replay Endpoint Handshake",
          description: "Submit a dummy practice payload with practice mode enabled to test the replay endpoint. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge5/replay" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","s_prime":"0x0000000000000000000000000000000000000000000000000000000000000001","v_prime":27,"practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_ECDSA_TEST_CALCULATE_REAL_S_PRIME}","message":"PRACTICE COMPLETED: ECDSA replay endpoint verified!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge5/replay \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","s_prime":"0x0000000000000000000000000000000000000000000000000000000000000001","v_prime":27,"practice":true}'`,
      curlReason: "cURL lets you test the ECDSA relayer gateway. The practice command returns a dummy flag. To execute the real double-spend, compute the real s' = n - s as detailed in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge5/replay", json={
    "student_id": student_id,
    "s_prime": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "v_prime": 27,
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "The secp256k1 curve order is a 256-bit integer (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141). Python supports arbitrary-precision integers natively, making it essential for calculating elliptic curve complements without integer overflow."
    },
    objective: {
      checklist: [
        "Fetch legitimate relayer voucher signature (r, s, v) from /api/v1/challenge5/original",
        "Obtain Secp256k1 curve order n",
        "Compute real malleable signature complement: s' = n - s",
        "Invert recovery parameter: v' = 27 if v == 28 else 28",
        "Submit calculated s' and v' without practice mode to obtain REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "MalleableRelayer.sol",
      targetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      endpoint: "/api/v1/challenge5/replay",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "s_prime": "0x000...001", "v_prime": 27, "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "s_prime": "<CALCULATED_S_PRIME>", "v_prime": 27}`,
        explanation: "Run: python3 -c 'import requests; o=requests.get(\"http://localhost:8080/api/v1/challenge5/original\").json(); print(\"s_prime:\", hex(int(o[\"curve_order_n\"], 16) - int(o[\"s\"], 16)))'. Replace s_prime with that hex value, set v_prime to 27, and remove 'practice': true to trigger the double-spend and receive the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "s_prime",
          type: "string (hex)",
          description: "Calculated complement s' = hex(n - s)",
          example: "0x..."
        },
        {
          field: "v_prime",
          type: "integer",
          description: "Flipped recovery parameter (27 or 28)",
          example: "27"
        }
      ]
    },
    hints: {
      clue: "MalleableVault.sol guards against replay by hashing the signature itself (mapping(bytes32 => bool) executedSignatures) rather than verifying an on-chain nonce.",
      trap: "Submitting the original signature (r, s, v) twice fails because the contract already marked that exact signature hash as spent. Changing r breaks public key recovery.",
      trick: "On secp256k1 with curve order n, both s and s' = n - s are mathematically valid signatures for the same message hash. Retrieve the voucher, compute malleable_s = hex(n - orig_s), set v = 28, and submit the claim to prove double-spend!"
    },
    scenario: {
      "title": "The Upside-Down Signed Cheque That Cashed Twice",
      "analogy": "Imagine a banker Alfred who accepts paper withdrawal vouchers. When customer Charlie presents a voucher signed with blue ink, Alfred hands over $100 and files the paper under 'Voucher_Signature_X'. Charlie then uses a mirrored prism to flip the mathematical signature coordinates (s' = n - s). To the scanner it looks like a brand new voucher, but it still verifies Charlie's signature!",
      "steps": [
            {
                  "phase": "Step 1: The First Legitimate Claim",
                  "actor": "Charlie & MalleableVault",
                  "description": "Charlie receives a gasless withdrawal voucher with ECDSA signature (r, s, v). He submits it to the vault and receives his 100 ETH. The vault marks `executedSignatures[keccak256(r, s, v)] = true`."
            },
            {
                  "phase": "Step 2: Elliptic Curve S-Inversion",
                  "actor": "The secp256k1 Curve Property",
                  "description": "In secp256k1 ECDSA math, both `s` and `s' = n - s` (where n is the curve order) correspond to the exact same public key point on the curve! If you invert s and toggle parity byte v (from 27 to 28), the signature is mathematically valid for the exact same message."
            },
            {
                  "phase": "Step 3: The Double Spend Execution",
                  "actor": "The Second Withdrawal",
                  "description": "Charlie submits the malleable signature (r, malleable_s, v=28). The contract calculates the hash of this new signature: it doesn't match the old hash! The contract verifies the signer, approves the claim, and transfers another 100 ETH\u2014draining the reserves."
            }
      ],
      "the_exploit_mechanic": "ECDSA signatures are inherently malleable. Without enforcing lower-s values (EIP-2), an attacker can compute `s_alt = n - s` without knowing the private key. If a smart contract relies on the hash of the raw signature to track execution rather than tracking a contract-managed sequential nonce, the signature can be replayed.",
      "golden_rule": "Enforce OpenZeppelin's `ECDSA.sol` library which strictly requires `s <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0` and track replay protection using internal nonces (`mapping(address => uint256) nonces`)."
}
  },

  'frontend-key-leak': {
    title: "Frontend Mnemonic & Private Key Leakage",
    category: "Web3 dApp",
    difficulty: "EASY",
    points: 100,
    theory: {
      overview: "Client-side dApp bundles frequently leak deployment secrets, mnemonic recovery phrases, or operator private keys when developers improperly bundle environment files into public static assets.",
      vulnerabilityDetails: "A deployed Web3 frontend contains a production bundle located at /static/js/bundle.js (and /dapp-config.js) with an unminified operator seed phrase accidentally left in an initialization configuration object.",
      contractSnippet: `// Leaked in client-side bundle.js
window.__VAULT_CONFIG__ = {
    rpcUrl: "https://sepolia.infura.io/v3/...",
    operatorMnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    vaultAddress: "0x0A2B...9C1"
};`,
      impact: "Instant drain of deployer funds, loss of contract ownership, and compromised upgrade keys."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Inspect Client-Side Production Bundle",
          description: "Search the production JavaScript file for leaked secret patterns.",
          command: `curl -s "http://localhost:8080/static/js/bundle.js" | grep -i -E "mnemonic|operator"`,
          expectedOutput: `window.__VAULT_CONFIG__ = { operator_mnemonic: "abandon abandon..." }`
        },
        {
          title: "Step 2: Practice Attack - Test Verification Gateway Handshake",
          description: "Submit a dummy private key (0x000...000) with practice mode enabled to test the verification endpoint. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge6/verify" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","private_key":"0x0000000000000000000000000000000000000000000000000000000000000000","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_KEY_LEAK_TEST_EXTRACT_REAL_MNEMONIC}","message":"PRACTICE COMPLETED: Key verification gateway tested!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge6/verify \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","private_key":"0x0000000000000000000000000000000000000000000000000000000000000000","practice":true}'`,
      curlReason: "cURL is used to grep through static frontend assets and submit authentication credentials. The practice command returns a dummy flag. To seize actual vault operator access, extract the real credentials as detailed in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge6/verify", json={
    "student_id": student_id,
    "private_key": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "During source code audits, Python scripts use regex parsers to automate the scanning of thousands of packaged webpack/Vite bundle chunks for leaked private keys, API secrets, and seed phrases."
    },
    objective: {
      checklist: [
        "Audit frontend asset directory at /static/js/bundle.js (or /dapp-config.js)",
        "Inspect JavaScript sources for hardcoded credentials",
        "Extract leaked 12-word BIP-39 mnemonic seed phrase or operator key",
        "Submit the recovered operator private key without practice mode to get REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "VaultOperatorAuth.sol",
      targetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      endpoint: "/api/v1/challenge6/verify",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "private_key": "0x000...000", "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "private_key": "0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3"}`,
        explanation: "In your terminal, grep for 'abandon' in /static/js/bundle.js or inspect /dapp-config.js to find the operator private key (0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3). Submit this key without 'practice': true to seize operator access and receive the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "private_key",
          type: "string (hex)",
          description: "Recovered operator private key (0x + 64 hex chars)",
          example: "0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3"
        }
      ]
    },
    hints: {
      clue: "Web3 dApps often compile client-side bundles or host configuration files that developers mistakenly publish with sensitive secrets.",
      trap: "The config file exposes a 12-word seed phrase, but submitting the 12 words directly into the verification portal will fail. The contract expects the 64-character hex private key.",
      trick: "Audit http://localhost:8080/dapp-config.js. Locate the embedded VAULT_OPERATOR_PRIVATE_KEY ('0x1ab42cc412b618b0d62ec4d69d322c29acbf10605451846049b40d5fc644d7e3'). Submit this key to /api/v1/challenge6/verify."
    },
    scenario: {
      "title": "The Master Vault Key Left in the Hotel Brochure",
      "analogy": "Imagine a 5-star hotel where the manager Alfred wants hotel guests to automatically open their room door from their phone browser. While programming the webpage, Alfred accidentally pasted the master vault root password directly into the public webpage stylesheet comment.",
      "steps": [
            {
                  "phase": "Step 1: Client-Side Source Inspection",
                  "actor": "Charlie (The Observer)",
                  "description": "Charlie visits the dApp homepage. Instead of only interacting with UI buttons, Charlie opens browser Developer Tools (F12) or inspects public static assets hosted on the web server."
            },
            {
                  "phase": "Step 2: Locating Embedded Secrets",
                  "actor": "Reconnaissance (/dapp-config.js)",
                  "description": "Charlie examines http://localhost:8080/dapp-config.js. He finds a JSON configuration object intended for local developer testing that contains a 12-word recovery mnemonic and the hex private key `VAULT_OPERATOR_PRIVATE_KEY`."
            },
            {
                  "phase": "Step 3: Direct Key Import & Vault Drainage",
                  "actor": "Instant Privilege Escalation",
                  "description": "Charlie imports the private key into cast/web3.py. Because this key belongs to the contract owner, Charlie directly executes owner-only withdrawal functions and sweeps all funds."
            }
      ],
      "the_exploit_mechanic": "Client-side web applications (JavaScript, TypeScript, React bundles) run entirely in the user's browser. Any environment variable prefixed with `NEXT_PUBLIC_` or bundled into public static files is completely unencrypted and accessible to anyone inspecting the network traffic or bundle chunks.",
      "golden_rule": "Private keys and seed phrases should NEVER exist on web servers or frontend repositories. Transactions requiring administrative authorization must be signed via hardware security modules (HSM), KMS, or secure backend relayer wallets with scoped permissions."
}
  },

  'exchange-hot-wallet': {
    title: "Exchange Hot Wallet Race Condition",
    category: "Exchange & API",
    difficulty: "MEDIUM",
    points: 100,
    theory: {
      overview: "Centralized exchange hot wallets process withdrawals across off-chain databases and on-chain nodes. If off-chain balance updates are not atomically locked before initiating on-chain transfers, race conditions allow attackers to execute concurrent withdrawals exceeding their balance.",
      vulnerabilityDetails: "The withdrawal endpoint /api/v1/exchange/withdraw checks the account balance in an off-chain database, performs an on-chain transfer, and only then updates the user balance. Sending concurrent requests in parallel drains exchange liquidity.",
      contractSnippet: `// Vulnerable Off-Chain Withdrawal Logic
def withdraw(user_id, amount):
    bal = db.get_balance(user_id)
    if bal >= amount:
        # VULNERABILITY: Balance deducted after external transfer!
        send_onchain_tx(user_id, amount) 
        db.update_balance(user_id, bal - amount)`,
      impact: "Insolvency of centralized crypto exchanges and unbacked withdrawal exploits."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Check Hot Wallet Reserves & Metrics",
          description: "Inspect exchange liquidity metrics and query the internal metrics endpoint.",
          command: `curl -s "http://localhost:8080/api/v1/exchange/status?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"exchange":"AICDA Global Liquidity Exchange","hot_wallet_address":"0x3C44...","status":"OPERATIONAL"}`
        },
        {
          title: "Step 2: Practice Attack - Test Withdrawal Gateway Handshake",
          description: "Send a practice test withdrawal using a dummy practice key with practice mode enabled. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/exchange/withdraw" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","signer_key":"practice_test_key","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_HOT_WALLET_TEST_FIND_REAL_SIGNER_KEY}","message":"PRACTICE COMPLETED: Withdrawal gateway tested with practice key!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/exchange/withdraw \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","signer_key":"practice_test_key","practice":true}'`,
      curlReason: "cURL enables fast verification of API authorization headers. The practice command returns a dummy flag. To drain the actual hot wallet reserves, inspect the debug metrics endpoint as explained in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/exchange/withdraw", json={
    "student_id": student_id,
    "signer_key": "practice_test_key",
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "Exploiting real race conditions requires firing dozens of requests within a few milliseconds. Python's threading and asyncio libraries allow penetration testers to create concurrent thread pools that fire requests at the exact same microsecond."
    },
    objective: {
      checklist: [
        "Query initial exchange hot wallet liquidity status",
        "Inspect /api/v1/exchange/internal/metrics?debug=true to leak internal signer key",
        "Extract authorized INTERNAL_SIGNER_KEY",
        "Submit the real signer key without practice mode to obtain REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "ExchangeHotWallet.py / API",
      targetAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      endpoint: "/api/v1/exchange/withdraw",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "signer_key": "practice_test_key", "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "signer_key": "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"}`,
        explanation: "Query: curl -s 'http://localhost:8080/api/v1/exchange/internal/metrics?debug=true'. In your terminal, replace signer_key with the leaked INTERNAL_SIGNER_KEY (0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d) and remove 'practice': true to authorize the 5,000,000 USDT withdrawal and receive the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "signer_key",
          type: "string",
          description: "Authorized operator signing key discovered from debug metrics",
          example: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
        }
      ]
    },
    hints: {
      clue: "Exchange internal infrastructure often runs monitoring services (Prometheus/Actuator). These endpoints sometimes accept diagnostic flags that output environment variables.",
      trap: "A basic GET request to /api/v1/exchange/internal/metrics only outputs standard system metrics. Look for a common developer debug query parameter.",
      trick: "Query GET /api/v1/exchange/internal/metrics?debug=true. Under system_env, find INTERNAL_SIGNER_KEY ('0x4f3edf983ac6...'). Submit this signer_key to /api/v1/exchange/withdraw to drain the reserves."
    },
    scenario: {
      "title": "The Janitor's Unlocked Diagnostic Dashboard",
      "analogy": "Imagine a major cryptocurrency exchange bank vault. The DevOps engineer Alfred created an internal system monitor on an open wall tablet to check CPU temperature and database latency. Charlie notices that if you tap the screen with 'debug=true', the screen dumps the raw master hot-wallet private key.",
      "steps": [
            {
                  "phase": "Step 1: Identifying Unauthenticated Metrics",
                  "actor": "Charlie (The API Fuzzer)",
                  "description": "Charlie maps out the exchange API endpoints. He identifies an internal metrics endpoint: `/api/v1/exchange/internal/metrics`. The endpoint requires no login session."
            },
            {
                  "phase": "Step 2: Diagnostic Query Parameter Injection",
                  "actor": "Parameter Fuzzing (?debug=true)",
                  "description": "Charlie requests `/api/v1/exchange/internal/metrics?debug=true`. The debug handler prints `system_env`, leaking environment variables including `INTERNAL_SIGNER_KEY = 0x4f3edf983ac6...`."
            },
            {
                  "phase": "Step 3: Signing Unauthorized Exchange Reserves Withdrawal",
                  "actor": "Hot Wallet Drainage",
                  "description": "With the legitimate exchange signer key in hand, Charlie crafts an authorized withdrawal request to `/api/v1/exchange/withdraw`. The exchange backend validates the signature, believes it is a legitimate treasury transfer, and releases the reserves."
            }
      ],
      "the_exploit_mechanic": "APIs often incorporate verbose diagnostic, health check, or actuator endpoints for debugging. If these endpoints are left accessible on public interfaces without authentication and configured to output environment variables, sensitive hot-wallet credentials and RPC keys are instantly compromised.",
      "golden_rule": "Isolate internal monitoring tools behind private VPN networks or mutual TLS (mTLS). Sanitize all API loggers and diagnostic dumps to permanently redact sensitive environment variables and private keys."
}
  },

  'p2p-eclipse': {
    title: "P2P Sybil & Eclipse Isolation Attack",
    category: "Protocol & P2P",
    difficulty: "MEDIUM",
    points: 100,
    theory: {
      overview: "In an Eclipse attack, an adversary isolates a target blockchain node by saturating all of its incoming and outgoing peer connection slots with attacker-controlled Sybil identities.",
      vulnerabilityDetails: "The validator node AICDA-ETH-VALIDATOR-01 maintains a maximum peer capacity of 50 connections but lacks IP subnet diversity enforcement. By registering 50 peers, the target is 100% eclipsed.",
      contractSnippet: `// Peer Connection Table
struct PeerTable {
    uint8 maxCapacity = 50;
    mapping(bytes32 => Peer) peers;
    // VULNERABILITY: No IP diversity check or connection throttling!
}`,
      impact: "Node isolation, 51% double-spend window exploitation, and consensus partition."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Query Target Validator Peer Capacity",
          description: "Check connected peers and maximum connection slots on the validator.",
          command: `curl -s "http://localhost:8080/api/v1/p2p/node/status?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"connected_peers":0,"eclipsed":false,"node_id":"AICDA-ETH-VALIDATOR-01","peer_table_capacity":50}`
        },
        {
          title: "Step 2: Practice Attack - Test Verification Gateway Handshake",
          description: "Send a practice test verification request with practice mode enabled. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/p2p/verify" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_P2P_ECLIPSE_TEST_REGISTER_ALL_50_PEERS}","message":"PRACTICE COMPLETED: Validator peer table connection tested!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/p2p/verify \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","practice":true}'`,
      curlReason: "cURL is used to test peer table endpoints. The practice command returns a dummy flag. To capture the real eclipse flag, deploy all 50 Sybil peers using the loop as detailed in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/p2p/verify", json={
    "student_id": student_id,
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "In live network pentesting, Python scripts manage asynchronous TCP socket connections to keep 50 persistent devp2p connections alive simultaneously while sending periodic ping/pong packets."
    },
    objective: {
      checklist: [
        "Query AICDA-ETH-VALIDATOR-01 peer capacity (50 peers)",
        "Audit routing table for missing IP subnet diversity guards",
        "Execute bash loop to register 50 Sybil peers in your terminal",
        "Invoke /api/v1/p2p/verify without practice mode to confirm 100% eclipse and get REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "P2PValidatorPeerTable",
      targetAddress: "AICDA-ETH-VALIDATOR-01",
      endpoint: "/api/v1/p2p/verify",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN"} (after running the 50-peer registration loop)`,
        explanation: "First, run the loop in your terminal: for i in $(seq 1 50); do curl -s -X POST http://localhost:8080/api/v1/p2p/peer/register -H 'Content-Type: application/json' -d '{\"student_id\":\"YOUR_CALLSIGN\",\"peer_id\":\"peer_'$i'\"}' > /dev/null; done. Then call /api/v1/p2p/verify without 'practice': true to claim the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        }
      ]
    },
    hints: {
      clue: "A P2P validator node maintains an in-memory routing table with a maximum peer capacity. If an attacker controls all inbound slots, the victim node is eclipsed from honest consensus.",
      trap: "Registering the same peer ID repeatedly is ignored by duplicate filters. However, the /api/v1/p2p/* routes are explicitly exempt from the CTF anti-burst rate limiter!",
      trick: "Write a script to call POST /api/v1/p2p/peer/register 50 times with unique peer IDs (peer_0 to peer_49). Once 50 slots are filled, call POST /api/v1/p2p/verify to confirm eclipse isolation."
    },
    scenario: {
      "title": "The Whispering Strangers Surrounding The Blindfolded Merchant",
      "analogy": "Imagine merchant Alfred sitting in the town square. Alfred has 50 telephone lines to hear about customer payments. Charlie rents 50 fake telephone booths and dials all 50 of Alfred's lines at the same time. Now, Alfred cannot talk to any real bank in the city\u2014he can ONLY hear what Charlie chooses to whisper.",
      "steps": [
            {
                  "phase": "Step 1: Inbound Peer Table Saturation",
                  "actor": "Charlie's Sybil Fleet",
                  "description": "Alfred's validator node has a peer table capacity of 50 connections. Charlie launches a lightweight script connecting 50 distinct Sybil peer IDs (peer_0 through peer_49) to Alfred's P2P endpoint."
            },
            {
                  "phase": "Step 2: Total Consensus Eclipse",
                  "actor": "Network Isolation",
                  "description": "With all 50 peer slots occupied by Charlie's nodes, Alfred is completely severed from the honest Ethereum network. He cannot receive honest blocks, transaction confirmations, or chain reorganizations."
            },
            {
                  "phase": "Step 3: The Double Spend / Stale Block Strike",
                  "actor": "Exploiting the Blinded Node",
                  "description": "Charlie feeds Alfred a fake block containing a transaction that spends funds to Alfred. Alfred accepts the payment and delivers goods. Charlie then drops the eclipse; on the real chain, Charlie's funds were spent elsewhere, leaving Alfred with zero."
            }
      ],
      "the_exploit_mechanic": "An Eclipse Attack isolates a specific blockchain node by saturating all of its incoming and outgoing P2P peer connection slots with attacker-controlled IP addresses. The eclipsed node is fed an alternate, isolated blockchain reality, enabling double-spends and selfish mining.",
      "golden_rule": "P2P protocol implementations must enforce connection rate limits, IP subnet diversity (max connections per /16 IPv4 subnet), peer table bucketing (Kademlia routing tables), and maintain persistent anchor connections to known trusted bootnodes."
}
  },

  'permit2-phishing': {
    title: "Permit2 Spender Phishing Analysis",
    category: "Social Engineering",
    difficulty: "EASY",
    points: 100,
    theory: {
      overview: "Uniswap Permit2 introduces gasless signature-based token approvals via EIP-712. Malicious phishing sites trick users into signing approvals designating an attacker contract as the approved spender without paying gas.",
      vulnerabilityDetails: "A phishing dApp prompts the user to sign an EIP-712 PermitSingle message granting unlimited token transfer rights. The spender field contains an unverified drainer address: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D.",
      contractSnippet: `// EIP-712 PermitSingle
struct PermitSingle {
    PermitDetails details;
    address spender; // CRITICAL: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    uint256 sigDeadline;
}`,
      impact: "Complete draining of wallet tokens via permitTransferFrom without requiring any on-chain approval transaction from the victim."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Fetch EIP-712 Authorization Payload",
          description: "Inspect the raw typed data structure requested by the simulated phishing airdrop portal.",
          command: `curl -s "http://localhost:8080/api/v1/challenge9/payload"`,
          expectedOutput: `{"eip712_permit":{"message":{"details":{...},"sigDeadline":1893456000,"spender":"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"}}}`
        },
        {
          title: "Step 2: Practice Attack - Test Security Reporting Gateway",
          description: "Submit a dummy zero-address report with practice mode enabled to verify the reporting endpoint. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge9/report" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","drainer_address":"0x0000000000000000000000000000000000000000","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_PERMIT2_TEST_REPORT_REAL_SPENDER}","message":"PRACTICE COMPLETED: Threat report channel verified!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge9/report \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","drainer_address":"0x0000000000000000000000000000000000000000","practice":true}'`,
      curlReason: "cURL allows security analysts to inspect signing requests without exposing wallet keys. The practice command returns a dummy flag. To neutralize the actual drainer, report the real spender address as shown in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge9/report", json={
    "student_id": student_id,
    "drainer_address": "0x0000000000000000000000000000000000000000",
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "Security automation engines use Python to parse nested EIP-712 typed schemas, calculate domainSeparator hashes, and cross-reference spender addresses against threat-intelligence feeds."
    },
    objective: {
      checklist: [
        "Inspect EIP-712 PermitSingle authorization message from /api/v1/challenge9/payload",
        "Extract unverified spender contract address from the JSON payload",
        "Test reporting gateway with practice command from Tab 2",
        "Submit the real drainer address without practice mode to get REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "Permit2.sol",
      targetAddress: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      endpoint: "/api/v1/challenge9/report",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "drainer_address": "0x000...000", "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "drainer_address": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"}`,
        explanation: "In your terminal, replace drainer_address with the real malicious spender address extracted from /api/v1/challenge9/payload (0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D) and remove 'practice': true to neutralize the drainer and claim the real flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "drainer_address",
          type: "string (address)",
          description: "Extracted malicious spender address (0x + 40 hex chars)",
          example: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        }
      ]
    },
    hints: {
      clue: "Uniswap Permit2 (EIP-712) permits off-chain gasless approval signatures. Phishing websites trick users into signing a permit where the 'spender' is a malicious drainer contract.",
      trap: "Submitting the victim's wallet or the token contract address will fail. You must identify the unauthorized drainer contract that was granted token transfer authority.",
      trick: "Query the phishing payload at GET /api/v1/challenge9/permit. In the message object, extract the spender address ('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'). Submit this to /api/v1/challenge9/report as drainer_address."
    },
    scenario: {
      "title": "The Counterfeit Gasless VIP Pass",
      "analogy": "Imagine Alfred wants to enter a VIP concert. A smiling promoter Charlie says: 'Sign this free digital guestbook on your phone with zero fees!' What Alfred didn't read is that the digital contract says: 'The signer grants promoter Charlie total legal authority to walk into Alfred's home and take every piece of furniture.'",
      "steps": [
            {
                  "phase": "Step 1: The Phishing Lure",
                  "actor": "Charlie's Fake dApp",
                  "description": "Charlie builds a simulated Uniswap / Airdrop portal. When Alfred clicks 'Claim Tokens', instead of an on-chain transaction requiring ETH gas, MetaMask opens an EIP-712 structured data signing request (Permit2)."
            },
            {
                  "phase": "Step 2: Deceptive Off-Chain Spender Assignment",
                  "actor": "Inspecting the EIP-712 Message",
                  "description": "Permit2 signatures allow gasless token approvals. Inside the message payload, Charlie set the `spender` field to his own malicious drainer contract (`0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`) with `amount: type(uint160).max`."
            },
            {
                  "phase": "Step 3: Off-Chain Signature Relayed by Attacker",
                  "actor": "Permit2.permitTransferFrom()",
                  "description": "Alfred signs the off-chain message thinking it was harmless because it cost $0 in gas. Charlie takes Alfred's signature, submits it to the real Permit2 contract on-chain, and drains all approved tokens from Alfred's wallet."
            }
      ],
      "the_exploit_mechanic": "Uniswap's Permit2 enables signature-based token approvals via EIP-712 offline signing. Because offline signatures do not cost gas, victims often sign them casually without verifying the `spender` address. The attacker relays the signature on-chain to instantly execute `transferFrom` on the victim's wallet.",
      "golden_rule": "Always verify the EIP-712 domain name and the exact `spender` address in your wallet confirmation window before signing. Never sign Permit or Permit2 approvals on unfamiliar third-party websites."
}
  },

  'cross-chain-replay': {
    title: "Cross-Chain Replay & Nonce Reuse",
    category: "DeFi & Wallets",
    difficulty: "HARD",
    points: 100,
    theory: {
      overview: "Signatures meant for one blockchain network can be replayed on other EVM-compatible chains if the signed message does not explicitly bind the destination chainId (violating EIP-155 domain separation).",
      vulnerabilityDetails: "MultiChainBridge.sol verifies claim vouchers using keccak256(abi.encodePacked(recipient, amount, nonce)) without hashing block.chainid. A voucher redeemed on Ethereum Mainnet (Chain ID 1) can be submitted directly on Binance Smart Chain (Chain ID 56) to claim duplicate tokens.",
      contractSnippet: `// Vulnerable Bridge Verification
function claim(address recipient, uint256 amount, uint256 nonce, bytes memory sig) external {
    // VULNERABILITY: block.chainid not included in digest!
    bytes32 message = keccak256(abi.encodePacked(recipient, amount, nonce));
    address signer = recover(message, sig);
    require(signer == bridgeOperator, "Invalid signature");

    require(!processedNonces[nonce], "Nonce already used");
    processedNonces[nonce] = true; // Only marked on THIS chain!
}`,
      impact: "Cross-chain bridge treasury insolvency, duplicate token minting, and cross-chain fund theft."
    },
    methodology: {
      steps: [
        {
          title: "Step 1: Reconnaissance - Inspect Ethereum Claim Voucher",
          description: "Fetch the legitimate Ethereum Mainnet voucher parameters and signature.",
          command: `curl -s "http://localhost:8080/api/v1/challenge10/tx?student_id=YOUR_CALLSIGN"`,
          expectedOutput: `{"bsc_status":{"chain_id":56,"nonce_101_claimed":false},"ethereum_tx":{"amount_tokens":500,"chain_id":1,"nonce":101,"recipient":"0x7099...","signature":"0x89ab..."}}`
        },
        {
          title: "Step 2: Practice Attack - Test Voucher Format on Origin Chain (Chain 1)",
          description: "Submit the voucher specifying origin chain_id: 1 with practice mode enabled to verify the signature structure. This returns a DUMMY practice flag.",
          command: `curl -s -X POST "http://localhost:8080/api/v1/challenge10/claim" \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","chain_id":1,"recipient":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":500,"nonce":101,"signature":"0x89abf218204918e7b3017ca85ef193c72b01428fa69302e1c94017b2e9d3810f7602384910cf91730912401827409218401928491028394018274910293847291b","practice":true}'`,
          expectedOutput: `{"flag":"crypto{PRACTICE_ONLY_CROSS_CHAIN_TEST_REPLAY_ON_CHAIN_56}","message":"PRACTICE COMPLETED: Voucher validated on Ethereum (Chain ID 1)!...","mode":"PRACTICE_DRY_RUN","success":true}`
        }
      ],
      curlCommand: `curl -s -X POST http://localhost:8080/api/v1/challenge10/claim \\
  -H "Content-Type: application/json" \\
  -d '{"student_id":"YOUR_CALLSIGN","chain_id":1,"recipient":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":500,"nonce":101,"signature":"0x89abf218204918e7b3017ca85ef193c72b01428fa69302e1c94017b2e9d3810f7602384910cf91730912401827409218401928491028394018274910293847291b","practice":true}'`,
      curlReason: "cURL provides an easy way to examine transaction data and test bridge endpoints. The practice command returns a dummy flag. To execute the real cross-chain replay exploit, change the chain_id parameter as described in Tab 3.",
      pythonScript: `import requests

API = "http://localhost:8080"
student_id = "YOUR_CALLSIGN"

# Practice test
res = requests.post(f"{API}/api/v1/challenge10/claim", json={
    "student_id": student_id,
    "chain_id": 1,
    "recipient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "amount": 500,
    "nonce": 101,
    "signature": "0x89abf218204918e7b3017ca85ef193c72b01428fa69302e1c94017b2e9d3810f7602384910cf91730912401827409218401928491028394018274910293847291b",
    "practice": True
})
data = res.json()
print("[*] Practice Result:", data)
print(f"[*] Practice Dummy Flag: {data.get('flag')}")`,
      pythonReason: "Cross-chain exploit bots use Python to monitor mempools on Ethereum, copy unconfirmed bridge claim signatures, and broadcast identical replay signatures on secondary chains (BSC, Polygon) before the bridge can sync state."
    },
    objective: {
      checklist: [
        "Inspect MultiChainBridge claim voucher signing schema",
        "Identify absence of block.chainid domain separation (EIP-155)",
        "Test voucher payload on Chain 1 with practice command from Tab 2",
        "Modify command to replay on Chain ID 56 (BSC) without practice mode to get REAL flag",
        "Submit the REAL flag into the verification portal below"
      ],
      targetContract: "MultiChainBridge.sol",
      targetAddress: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
      endpoint: "/api/v1/challenge10/claim",
      httpMethod: "POST",
      modificationGuide: {
        practiceParams: `{"student_id":"YOUR_CALLSIGN", "chain_id": 1, ..., "practice": true}`,
        realParams: `{"student_id":"YOUR_CALLSIGN", "chain_id": 56, ...}`,
        explanation: "In your terminal, change chain_id from 1 to 56 (Binance Smart Chain) and remove 'practice': true. Because the bridge contract failed to include chainId in the signed hash, BSC will accept the Ethereum signature and release the real challenge flag."
      },
      payloadSchema: [
        {
          field: "student_id",
          type: "string",
          description: "Your operative call-sign / student identifier",
          example: "YOUR_CALLSIGN"
        },
        {
          field: "chain_id",
          type: "integer",
          description: "Target EVM network identifier (must be 56 for Binance Smart Chain)",
          example: "56"
        },
        {
          field: "recipient",
          type: "string",
          description: "Recipient wallet address",
          example: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        },
        {
          field: "amount",
          type: "integer",
          description: "Token quantity claimed in voucher",
          example: "500"
        },
        {
          field: "nonce",
          type: "integer",
          description: "Voucher claim sequence number",
          example: "101"
        },
        {
          field: "signature",
          type: "string (hex)",
          description: "Original 65-byte ECDSA signature from Ethereum",
          example: "0x89abf218204918e7b3017ca85ef193c72b01428fa69302e1c94017b2e9d3810f7602384910cf91730912401827409218401928491028394018274910293847291b"
        }
      ]
    },
    hints: {
      clue: "Multi-chain bridges validate withdrawal vouchers across disparate EVM chains. The signature hash MUST bind to block.chainid to prevent cross-chain replay.",
      trap: "You cannot forge a new signature because you don't possess the bridge validator's private key. You must use an existing valid signature produced on another chain.",
      trick: "Query the Ethereum Mainnet transaction at GET /api/v1/challenge10/tx. Extract the validator signature and nonce (101). Submit them to the BSC bridge endpoint POST /api/v1/challenge10/claim with chain_id: 56."
    },
    scenario: {
      "title": "The International Certified Cheque With No Country Stamp",
      "analogy": "Imagine bank teller Alfred operates branches in both New York (US Dollars) and London (British Pounds). When customer Charlie deposits $500 in New York, the manager gives him a voucher that says: 'Pay bearer 500 currency units signed by Manager'. The voucher forgets to print the country flag or currency symbol.",
      "steps": [
            {
                  "phase": "Step 1: The Legitimate Ethereum Withdrawal",
                  "actor": "Ethereum Mainnet (Chain ID 1)",
                  "description": "Alfred deposits 500 tokens on Ethereum Mainnet. The bridge validator signs a cryptographic voucher authorizing 500 tokens to be withdrawn on Ethereum. The signature commits to `(recipient, amount, nonce)`."
            },
            {
                  "phase": "Step 2: Spotting The Missing chainId Invariant",
                  "actor": "Charlie (The Cross-Chain Auditor)",
                  "description": "Charlie inspects the Ethereum transaction on Etherscan. He checks the hashing formula: `keccak256(abi.encodePacked(recipient, amount, nonce))`. Notice what is missing? There is NO `block.chainid` in the message hash!"
            },
            {
                  "phase": "Step 3: Replaying The Exact Signature on BSC",
                  "actor": "Binance Smart Chain (Chain ID 56)",
                  "description": "Charlie takes the exact same validator signature from Ethereum Mainnet and submits it to the bridge contract on Binance Smart Chain (Chain ID 56). Because the voucher has no chain binding and the validator public key is the same, BSC verifies the signature and mints Charlie 500 free tokens on BSC!"
            }
      ],
      "the_exploit_mechanic": "Cryptographic signatures over cross-chain messages must incorporate a domain separator that strictly binds to `block.chainid` (EIP-155 / EIP-712). If the signed message payload only hashes `(recipient, amount, nonce)`, an attacker can copy the valid signature emitted on one chain and replay it on every other EVM-compatible chain where the bridge operates.",
      "golden_rule": "Always include `block.chainid` in the signed digest: `keccak256(abi.encode(DOMAIN_SEPARATOR, recipient, amount, nonce, block.chainid))`. This mathematically invalidates the signature if presented on any other blockchain."
}
  }
};

export default function LabDetailClient({ slug }: { slug: string }) {
  const lab = LAB_CONFIGS[slug];
  const [activeTab, setActiveTab] = useState<'theory' | 'methodology' | 'objective' | 'hints' | 'imagine'>('theory');
  const [revealedTiers, setRevealedTiers] = useState<{ [tier: number]: boolean }>({ 1: true, 2: false, 3: false });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [studentId, setStudentId] = useState<string>('anonymous');
  const [score, setScore] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);

  // In-page Flag Submission State
  const [flagInput, setFlagInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const targetApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aicda-web3-api.onrender.com';

  const fetchStudentProgress = async (sid: string) => {
    if (!sid || sid === 'anonymous') return;
    try {
      const res = await fetch(`${targetApiUrl}/api/v1/student/progress?student_id=${encodeURIComponent(sid)}`);
      if (res.ok) {
        const data = await res.json();
        const solved = data.solved_challenges || [];
        setSolvedChallenges(solved);
        setScore(data.score || 0);
        setSolvedCount(solved.length);
        if (solved.includes(slug)) {
          setIsSolved(true);
        }
        localStorage.setItem('aicda_solved_slugs', JSON.stringify(solved));
      }
    } catch (e) {
      console.error('Failed to fetch student progress:', e);
    }
  };

  useEffect(() => {
    const sid = localStorage.getItem('aicda_student_id') || 'anonymous';
    setStudentId(sid);

    // Initial instant check from localStorage cache
    const solvedList = JSON.parse(localStorage.getItem('aicda_solved_slugs') || '[]');
    if (solvedList.includes(slug)) {
      setIsSolved(true);
    }
    setSolvedCount(solvedList.length);
    setScore(solvedList.length * 100);

    // Always fetch live authoritative progress from backend API
    fetchStudentProgress(sid);
  }, [slug, targetApiUrl]);

  if (!lab) {
    return (
      <div className="min-h-screen bg-cyber-black text-white flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-cyber-red mb-3" />
        <h1 className="text-xl font-bold">Challenge Not Found</h1>
        <p className="text-gray-400 text-sm mt-1">Unknown challenge identifier: {slug}</p>
        <Link href="/labs" className="mt-4 px-4 py-2 bg-cyber-green text-black font-bold rounded-lg text-xs">
          Return to All Labs
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleInPageFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`${targetApiUrl}/api/v1/flags/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          challenge_slug: slug,
          flag: flagInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSolved(true);
        setScore((prev) => prev + 100);
        setSolvedCount((prev) => prev + 1);
        setSolvedChallenges((prev) => prev.includes(slug) ? prev : [...prev, slug]);
        const solvedList = JSON.parse(localStorage.getItem('aicda_solved_slugs') || '[]');
        if (!solvedList.includes(slug)) {
          localStorage.setItem('aicda_solved_slugs', JSON.stringify([...solvedList, slug]));
        }
        setSubmitMessage({
          type: 'success',
          text: data.message || `FLAG ACCEPTED! +${data.points || 100} PTS awarded to operative score.`
        });
        setFlagInput('');
        fetchStudentProgress(studentId);
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.message || "Incorrect flag string. Verify your exploit results in your terminal."
        });
      }
    } catch (err: any) {
      setSubmitMessage({
        type: 'error',
        text: "Failed to connect to verification server. Ensure backend is running."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header score={score} solvedCount={solvedCount} />

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/labs"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyber-green transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Penetration Testing Labs</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                lab.difficulty === 'EASY'
                  ? 'border border-cyber-green/50 text-cyber-green bg-cyber-green/10'
                  : lab.difficulty === 'MEDIUM'
                  ? 'border border-cyber-yellow/50 text-cyber-yellow bg-cyber-yellow/10'
                  : 'border border-cyber-red/50 text-cyber-red bg-cyber-red/10'
              }`}
            >
              {lab.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold border border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10">
              {lab.points} PTS
            </span>
            {isSolved ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border-2 border-cyber-green text-cyber-green bg-cyber-green/20 shadow-[0_0_15px_rgba(0,255,65,0.4)] animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green" />
                <span>✓ SOLVED</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-gray-500 border border-cyber-border bg-black/40">
                UNSOLVED
              </span>
            )}
          </div>
        </div>

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyber-green uppercase tracking-wider">
                AICDA CHALLENGE // {lab.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {lab.title}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('imagine')}
              className={`px-3.5 py-2 rounded-lg border font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,180,0,0.2)] shrink-0 ${
                activeTab === 'imagine'
                  ? 'border-cyber-yellow text-black bg-cyber-yellow font-extrabold shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                  : 'border-cyber-yellow/70 text-cyber-yellow bg-cyber-yellow/10 hover:bg-cyber-yellow/20'
              }`}
              title="Visualize the attack with a real-life scenario featuring Alfred, Charlie, and Peter"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyber-yellow" />
              <span>IMAGINE ATTACK</span>
            </button>

            {isSolved ? (
              <div className="px-4 py-2 rounded-lg bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                <span>CHALLENGE SOLVED (+100 PTS)</span>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-cyber-green text-black font-bold text-xs hover:bg-cyber-green/90 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,65,0.3)] shrink-0"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>SUBMIT FLAG PROOF</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-cyber-border overflow-x-auto no-scrollbar pb-1 w-full max-w-full">
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'theory'
                ? 'border-cyber-green text-cyber-green bg-cyber-card/60'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Architecture &amp; Theory</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'methodology'
                ? 'border-cyber-green text-cyber-green bg-cyber-card/60'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Attack Methodology &amp; Terminal Practice</span>
          </button>

          <button
            onClick={() => setActiveTab('objective')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'objective'
                ? 'border-cyber-green text-cyber-green bg-cyber-card/60'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>3. Mission Objective &amp; Target</span>
          </button>

          <button
            onClick={() => setActiveTab('hints')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'hints'
                ? 'border-cyber-yellow text-cyber-yellow bg-cyber-card/60 shadow-[0_0_10px_rgba(255,215,0,0.15)]'
                : 'border-transparent text-gray-400 hover:text-cyber-yellow'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>4. Tactical Intel &amp; Hints</span>
          </button>

          <button
            onClick={() => setActiveTab('imagine')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'imagine'
                ? 'border-amber-400 text-amber-300 bg-cyber-card/60 shadow-[0_0_15px_rgba(255,180,0,0.25)]'
                : 'border-transparent text-amber-400/70 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>5. Imagine Scenario</span>
          </button>
        </div>

        {/* TAB 1: THEORY */}
        {activeTab === 'theory' && (
          <div className="space-y-5 animate-fade-in text-xs sm:text-sm text-gray-300 leading-relaxed">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-cyber-green uppercase tracking-wider">
                Vulnerability Overview
              </h3>
              <p>{lab.theory.overview}</p>
            </div>

            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-cyber-cyan uppercase tracking-wider">
                Technical Vulnerability Breakdown
              </h3>
              <p>{lab.theory.vulnerabilityDetails}</p>
            </div>

            {/* Smart Contract Snippet */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                  Vulnerable Solidity Implementation
                </span>
                <button
                  onClick={() => handleCopy(lab.theory.contractSnippet, 'sol')}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
                >
                  {copiedCode === 'sol' ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'sol' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-black/80 border border-cyber-border/70 text-cyber-green font-mono text-xs overflow-x-auto">
                <code>{lab.theory.contractSnippet}</code>
              </pre>
            </div>

            <div className="p-4 rounded-xl border border-cyber-red/40 bg-cyber-red/10 text-xs text-gray-300 space-y-1">
              <span className="text-cyber-red font-bold uppercase tracking-wide">Real-World Security Impact:</span>
              <p>{lab.theory.impact}</p>
            </div>
          </div>
        )}

        {/* TAB 2: METHODOLOGY & TERMINAL PRACTICE */}
        {activeTab === 'methodology' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-gray-300 leading-relaxed">
            {/* Target Host Banner */}
            <div className="p-3.5 rounded-xl border border-cyber-cyan/50 bg-cyber-cyan/10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-pulse"></span>
                <span className="text-xs text-white font-bold tracking-wide uppercase">Target Lab Host:</span>
                <code className="text-xs text-cyber-cyan font-mono font-bold bg-black/70 px-2.5 py-1 rounded border border-cyber-cyan/40">
                  {targetApiUrl}
                </code>
              </div>
              <button
                onClick={() => handleCopy(targetApiUrl, 'target_host')}
                className="text-xs text-cyber-cyan hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-cyber-cyan/30"
              >
                {copiedCode === 'target_host' ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'target_host' ? 'Copied' : 'Copy Target Host'}</span>
              </button>
            </div>

            {/* PROMINENT PRACTICE FLAG NOTICE */}
            <div className="p-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-xs text-gray-300 space-y-1.5">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>TERMINAL PRACTICE DIRECTIVE: DUMMY PRACTICE FLAGS</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                The curl commands and scripts provided below in <span className="text-white font-semibold">Tab 2</span> are configured with <span className="text-yellow-400 font-bold">PRACTICE PARAMETERS</span> to let you test connectivity, observe contract responses, and understand the exploit mechanism. They output a <span className="text-yellow-400 font-semibold">Dummy Practice Flag</span> (<code className="text-white bg-black/70 px-1.5 py-0.5 rounded">crypto&#123;PRACTICE_ONLY_...&#125;</code>).
              </p>
              <p className="leading-relaxed text-[11px] text-cyber-green">
                To capture the <span className="font-bold underline">ACTUAL CHALLENGE FLAG (+100 PTS)</span>, proceed to <span className="font-bold">Tab 3 (Mission Objective &amp; Target)</span> where you will make the necessary parameter modifications before executing your final attack in your terminal!
              </p>
            </div>

            {/* DETAILED ATTACK EXECUTION STEPS WITH EXACT COMMANDS */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-cyber-green uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyber-green" />
                  <span>Attack Execution Steps &amp; Practice Commands</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Execute these practice commands sequentially in your Kali terminal to practice the exploit flow and receive the dummy practice flag:
                </p>
              </div>

              <div className="space-y-4">
                {lab.methodology.steps.map((st, idx) => {
                  const resolvedCmd = st.command.replaceAll('http://localhost:8080', targetApiUrl).replaceAll('YOUR_CALLSIGN', studentId || 'YOUR_CALLSIGN');
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-cyber-border/80 bg-black/60 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-cyber-green/20 text-cyber-green border border-cyber-green/40 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{st.title}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(resolvedCmd, `step_${idx}`)}
                          className="text-gray-400 hover:text-cyber-green flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-black/50 border border-cyber-border"
                        >
                          {copiedCode === `step_${idx}` ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode === `step_${idx}` ? 'Copied' : 'Copy Command'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-300">{st.description.replaceAll('http://localhost:8080', targetApiUrl)}</p>

                      <pre className="p-3 rounded-lg bg-black/90 border border-cyber-cyan/40 text-cyber-cyan font-mono text-xs overflow-x-auto">
                        <code>{resolvedCmd}</code>
                      </pre>

                      <div className="text-[11px] text-gray-400 font-mono bg-cyber-card/70 px-3 py-1.5 rounded border border-cyber-border/50">
                        <span className="text-gray-500 font-bold">Expected Output: </span>
                        <span>{st.expectedOutput}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CURL COMMAND EXPLANATION */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>Terminal Practice cURL Command</span>
                </span>
                <button
                  onClick={() => handleCopy(lab.methodology.curlCommand.replaceAll('http://localhost:8080', targetApiUrl).replaceAll('YOUR_CALLSIGN', studentId || 'YOUR_CALLSIGN'), 'curl')}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
                >
                  {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'curl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-black/90 border border-cyber-border text-cyber-cyan font-mono text-xs overflow-x-auto">
                <code>{lab.methodology.curlCommand.replaceAll('http://localhost:8080', targetApiUrl).replaceAll('YOUR_CALLSIGN', studentId || 'YOUR_CALLSIGN')}</code>
              </pre>

              {/* WHY WE USE CURL CALLOUT */}
              <div className="p-3.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cyber-cyan font-bold text-xs uppercase tracking-wide">
                  <Info className="w-3.5 h-3.5" />
                  <span>Why We Use This cURL Command:</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {lab.methodology.curlReason}
                </p>
              </div>
            </div>

            {/* PYTHON SCRIPT EXPLANATION */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyber-green tracking-wider uppercase flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyber-green" />
                  <span>Practice Exploit Script (Python)</span>
                </span>
                <button
                  onClick={() => handleCopy(lab.methodology.pythonScript.replaceAll('http://localhost:8080', targetApiUrl).replaceAll('YOUR_CALLSIGN', studentId || 'YOUR_CALLSIGN'), 'py')}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
                >
                  {copiedCode === 'py' ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'py' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-black/90 border border-cyber-border text-gray-200 font-mono text-xs overflow-x-auto">
                <code>{lab.methodology.pythonScript.replaceAll('http://localhost:8080', targetApiUrl).replaceAll('YOUR_CALLSIGN', studentId || 'YOUR_CALLSIGN')}</code>
              </pre>

              {/* WHY WE USE PYTHON SCRIPT CALLOUT */}
              <div className="p-3.5 rounded-lg border border-cyber-green/40 bg-cyber-green/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cyber-green font-bold text-xs uppercase tracking-wide">
                  <Info className="w-3.5 h-3.5" />
                  <span>Why We Use This Python Exploit Script:</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {lab.methodology.pythonReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MISSION OBJECTIVE & TARGET (LIVE TARGET SPECS & MODIFICATION GUIDE) */}
        {/* TAB 4: TACTICAL INTEL & TRICK HINTS */}
        {activeTab === 'hints' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-gray-300 leading-relaxed">
            {/* Warning / Orientation Banner */}
            <div className="bg-cyber-yellow/10 border border-cyber-yellow/40 rounded-xl p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-cyber-yellow shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-cyber-yellow uppercase tracking-wider">
                  OPERATIONAL INTEL &amp; TRICK REVEAL POLICY
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  These tactical intel tiers are designed to stimulate your thought process, point out subtle architectural traps, and guide your mathematical calculations. They teach real Web3 exploit mechanics without spoiling the raw captured flag. Reveal tiers sequentially as needed.
                </p>
              </div>
            </div>

            {/* Tier 1: Vulnerability Recon Clue */}
            <div className="bg-cyber-card border border-cyber-border hover:border-cyber-cyan/50 rounded-xl p-5 space-y-3 transition">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyber-cyan"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyber-cyan">
                    TIER 1 // VULNERABILITY RECON CLUE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-cyber-black px-2 py-0.5 rounded border border-cyber-border">
                  ARCHITECTURAL INSPECTION
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {lab.hints ? lab.hints.clue.replaceAll('http://localhost:8080', targetApiUrl) : "Inspect target smart contract storage and execution flow."}
              </p>
            </div>

            {/* Tier 2: Tactical Trap & Avoidance */}
            <div className="bg-cyber-card border border-cyber-border hover:border-cyber-yellow/50 rounded-xl p-5 space-y-3 transition">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyber-yellow"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyber-yellow">
                    TIER 2 // TACTICAL TRAP &amp; AVOIDANCE
                  </span>
                </div>
                <button
                  onClick={() => setRevealedTiers(prev => ({ ...prev, 2: !prev[2] }))}
                  className="text-[10px] font-bold text-cyber-yellow hover:underline flex items-center gap-1"
                >
                  {revealedTiers[2] ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{revealedTiers[2] ? 'INTEL UNLOCKED' : 'CLICK TO UNLOCK TIER 2'}</span>
                </button>
              </div>
              {revealedTiers[2] ? (
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed animate-fade-in">
                  {lab.hints ? lab.hints.trap.replaceAll('http://localhost:8080', targetApiUrl) : "Examine error logs when executing test payloads."}
                </p>
              ) : (
                <div
                  onClick={() => setRevealedTiers(prev => ({ ...prev, 2: true }))}
                  className="p-3 bg-black/40 border border-cyber-border/60 rounded-lg text-center cursor-pointer hover:bg-black/60 transition"
                >
                  <p className="text-xs text-gray-500 font-mono">
                    [ENCRYPTED INTEL: Click to reveal potential pitfalls and reason why standard attacks fail]
                  </p>
                </div>
              )}
            </div>

            {/* Tier 3: Attack Blueprint & Trick Formula */}
            <div className="bg-cyber-card border border-cyber-border hover:border-cyber-red/50 rounded-xl p-5 space-y-3 transition">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyber-red"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyber-red">
                    TIER 3 // ATTACK BLUEPRINT &amp; TRICK FORMULA
                  </span>
                </div>
                <button
                  onClick={() => setRevealedTiers(prev => ({ ...prev, 3: !prev[3] }))}
                  className="text-[10px] font-bold text-cyber-red hover:underline flex items-center gap-1"
                >
                  {revealedTiers[3] ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{revealedTiers[3] ? 'INTEL UNLOCKED' : 'CLICK TO UNLOCK TIER 3'}</span>
                </button>
              </div>
              {revealedTiers[3] ? (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                    {lab.hints ? lab.hints.trick.replaceAll('http://localhost:8080', targetApiUrl) : "Craft specific parameters matching the vulnerability state machine."}
                  </p>
                  <div className="p-3 rounded-lg bg-black/80 border border-cyber-red/40 font-mono text-xs text-cyber-cyan flex items-center justify-between">
                    <span>Target Endpoint: <code>{lab.objective.endpoint}</code> ({lab.objective.httpMethod})</span>
                    <span className="text-cyber-green text-[10px]">+100 PTS ON EXPLOIT</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setRevealedTiers(prev => ({ ...prev, 3: true }))}
                  className="p-3 bg-black/40 border border-cyber-border/60 rounded-lg text-center cursor-pointer hover:bg-black/60 transition"
                >
                  <p className="text-xs text-gray-500 font-mono">
                    [CLASSIFIED INTEL: Click to unlock the exact mathematical formula &amp; parameters blueprint]
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        
        {/* TAB 5: IMAGINE ATTACK SCENARIO (Mental Model & Attack Flow) */}
        {activeTab === 'imagine' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-gray-300 leading-relaxed">
            {/* Top Analogy Hero Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/40 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  REAL-WORLD MENTAL MODEL // {lab.scenario ? lab.scenario.title : "Attack Scenario"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                How This Attack Actually Works in the Real World
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {lab.scenario ? lab.scenario.analogy : "Examine the practical real-life breakdown of the exploit mechanism."}
              </p>
            </div>

            {/* Step-by-Step Chronological Execution Breakdown */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-xs font-bold text-cyber-cyan uppercase tracking-wider">
                    CHRONOLOGICAL ATTACK METHODOLOGY (STEP-BY-STEP)
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {lab.scenario ? lab.scenario.steps.length : 0} PHASES
                </span>
              </div>

              <div className="space-y-3">
                {lab.scenario && lab.scenario.steps.map((st, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-cyber-border/70 bg-black/60 space-y-1.5 hover:border-amber-400/50 transition">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{st.phase}</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyber-green bg-black/80 px-2 py-0.5 rounded border border-cyber-green/40">
                        Actor: {st.actor}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed pl-7">
                      {st.description.replaceAll('http://localhost:8080', targetApiUrl)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Behind-the-Scenes Exploit Mechanic & Loophole */}
            <div className="bg-cyber-card border border-cyber-red/50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-cyber-red/30">
                <AlertTriangle className="w-4 h-4 text-cyber-red" />
                <span className="text-xs font-bold text-cyber-red uppercase tracking-wider">
                  THE EXACT CODE / CRYPTOGRAPHIC LOOPHOLE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {lab.scenario ? lab.scenario.the_exploit_mechanic : "State machine or signature invariant violated."}
              </p>
            </div>

            {/* The Golden Web3 Defense Invariant */}
            <div className="p-5 rounded-xl border border-cyber-green/50 bg-cyber-green/10 space-y-2">
              <div className="flex items-center gap-2 text-cyber-green font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-cyber-green" />
                <span>The Golden Defense Rule &amp; Security Invariant</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {lab.scenario ? lab.scenario.golden_rule : "Enforce proper cryptographic checks and Checks-Effects-Interactions pattern."}
              </p>
              <div className="pt-3 flex items-center justify-between border-t border-cyber-green/30 text-[11px] flex-wrap gap-2">
                <span className="text-gray-400">Now execute this attack in the live range:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('methodology')}
                    className="px-3 py-1 bg-black/70 border border-cyber-cyan/50 text-cyber-cyan font-bold rounded hover:bg-cyber-cyan hover:text-black transition flex items-center gap-1"
                  >
                    <span>Tab 2: Terminal Practice &rarr;</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('objective')}
                    className="px-3 py-1 bg-cyber-green text-black font-bold rounded hover:bg-cyber-green/90 transition flex items-center gap-1"
                  >
                    <span>Tab 3: Find Real Flag &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'objective' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-gray-300 leading-relaxed">
            {/* Mission Objective Checklist */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-cyber-green uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                <span>Mission Objectives Checklist</span>
              </h3>
              <ul className="space-y-2">
                {lab.objective.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-green"></span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* LIVE TARGET ENVIRONMENT DETAILS */}
            <div className="bg-cyber-card border border-cyber-cyan/50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyber-cyan" />
                <span>Live Target Environment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-black/60 border border-cyber-border space-y-1">
                  <span className="text-gray-400 block text-[11px] uppercase">Target Smart Contract:</span>
                  <span className="text-white font-mono font-bold">{lab.objective.targetContract}</span>
                </div>

                <div className="p-3 rounded-lg bg-black/60 border border-cyber-border space-y-1">
                  <span className="text-gray-400 block text-[11px] uppercase">Target Contract Address:</span>
                  <span className="text-cyber-green font-mono font-bold select-all">{lab.objective.targetAddress}</span>
                </div>

                <div className="p-3 rounded-lg bg-black/60 border border-cyber-border space-y-1">
                  <span className="text-gray-400 block text-[11px] uppercase">Target Exploit Endpoint:</span>
                  <span className="text-cyber-cyan font-mono font-bold select-all">{targetApiUrl}{lab.objective.endpoint}</span>
                </div>

                <div className="p-3 rounded-lg bg-black/60 border border-cyber-border space-y-1">
                  <span className="text-gray-400 block text-[11px] uppercase">HTTP Request Method:</span>
                  <span className="text-yellow-400 font-mono font-bold">{lab.objective.httpMethod}</span>
                </div>
              </div>

              {/* HOW TO MODIFY PRACTICE COMMAND TO FIND REAL FLAG */}
              <div className="p-4 rounded-xl border border-cyber-green/50 bg-cyber-green/10 space-y-3">
                <div className="flex items-center gap-2 text-cyber-green font-bold text-xs uppercase tracking-wider">
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>How to Modify Practice Command for Real Flag</span>
                </div>

                <p className="text-xs text-gray-200 leading-relaxed">
                  {lab.objective.modificationGuide.explanation.replaceAll('http://localhost:8080', targetApiUrl)}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-black/80 border border-yellow-500/40 space-y-1 font-mono text-[11px]">
                    <span className="text-yellow-400 font-bold uppercase block text-[10px]">
                      Tab 2 Practice Payload (Dummy Flag):
                    </span>
                    <code className="text-gray-300 block overflow-x-auto whitespace-pre-wrap">
                      {lab.objective.modificationGuide.practiceParams}
                    </code>
                  </div>

                  <div className="p-3 rounded-lg bg-black/80 border border-cyber-green/50 space-y-1 font-mono text-[11px]">
                    <span className="text-cyber-green font-bold uppercase block text-[10px]">
                      Required Real Payload (Actual Flag):
                    </span>
                    <code className="text-white block overflow-x-auto whitespace-pre-wrap">
                      {lab.objective.modificationGuide.realParams}
                    </code>
                  </div>
                </div>
              </div>

              {/* PAYLOAD SCHEMA TABLE */}
              <div className="space-y-2 pt-2 border-t border-cyber-border/60">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Required Exploit Payload Parameters:
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-cyber-border rounded-lg overflow-hidden">
                    <thead className="bg-black/80 text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 border-b border-cyber-border">Field</th>
                        <th className="p-2.5 border-b border-cyber-border">Type</th>
                        <th className="p-2.5 border-b border-cyber-border">Description</th>
                        <th className="p-2.5 border-b border-cyber-border">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/40 font-mono">
                      {lab.objective.payloadSchema.map((sch, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-2.5 text-cyber-green font-bold">{sch.field}</td>
                          <td className="p-2.5 text-cyber-cyan">{sch.type}</td>
                          <td className="p-2.5 text-gray-300 font-sans">{sch.description}</td>
                          <td className="p-2.5 text-gray-400 select-all">{sch.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* OPERATIONAL DIRECTIVE & FLAG SUBMISSION BOX */}
            <div className="bg-cyber-card border border-cyber-green/50 rounded-xl p-5 space-y-4 shadow-[0_0_20px_rgba(0,255,65,0.08)]">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-cyber-green" />
                  <span>Mission Flag Submission Portal</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Execute your modified exploit command against the target endpoint from your Kali terminal. Once verified, copy the REAL flag from your terminal and submit it below to register your +100 PTS:
                </p>
              </div>

              <form onSubmit={handleInPageFlagSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Paste captured real flag from your terminal output..."
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      className="w-full bg-black/90 border border-cyber-border focus:border-cyber-green rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none placeholder:text-gray-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg bg-cyber-green text-black font-bold text-xs uppercase tracking-wider hover:bg-cyber-green/90 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'VERIFYING...' : 'VERIFY & SUBMIT FLAG'}</span>
                  </button>
                </div>

                {submitMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold border flex items-center gap-2 animate-fade-in ${
                      submitMessage.type === 'success'
                        ? 'bg-cyber-green/20 border-cyber-green text-cyber-green'
                        : 'bg-cyber-red/20 border-cyber-red text-cyber-red'
                    }`}
                  >
                    {submitMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{submitMessage.text}</span>
                  </div>
                )}
              </form>

              <div className="pt-2 border-t border-cyber-border/50 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Operative: <code className="text-cyber-green font-mono">{studentId}</code></span>
                <span className="text-cyber-cyan font-mono">+100 PTS ON REAL FLAG VERIFICATION</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <FlagSubmitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        challengeSlug={slug}
        challengeTitle={lab.title}
        onSuccess={() => {
          setIsSolved(true);
          setScore((prev) => prev + 100);
          setSolvedCount((prev) => prev + 1);
          setSolvedChallenges((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
          const solvedList = JSON.parse(localStorage.getItem('aicda_solved_slugs') || '[]');
          if (!solvedList.includes(slug)) {
            localStorage.setItem('aicda_solved_slugs', JSON.stringify([...solvedList, slug]));
          }
          fetchStudentProgress(studentId);
        }}
      />
</>
  );
}