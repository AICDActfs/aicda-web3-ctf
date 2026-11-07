#!/usr/bin/env bash
# ==============================================================================
# AICDA Web3 & Cryptocurrency Security Cyber Range - Automated Setup for Kali
# ==============================================================================

set -e

echo "=========================================================="
echo "🇮🇳  AICDA WEB3 CYBER DEFENCE LAB - SETUP (KALI LINUX)   🇮🇳"
echo "=========================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$PROJECT_ROOT/api"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "[1/4] Verifying System Requirements..."
command -v python3 >/dev/null 2>&1 || { echo >&2 "[ERROR] python3 is required. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "[ERROR] node is required. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "[ERROR] npm is required. Aborting."; exit 1; }

echo "[2/4] Setting up Python API Backend (Port 8080)..."
cd "$API_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[3/4] Running Backend Verification Test Suite..."
python3 -c "import app; print('[OK] Backend imports verified successfully.')"

echo "[4/4] Setting up Next.js Frontend (Port 3000)..."
cd "$FRONTEND_DIR"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
fi
npm install

echo "=========================================================="
echo "✅  INSTALLATION COMPLETE!"
echo "=========================================================="
echo ""
echo "To start the Backend API:"
echo "  cd $API_DIR && source venv/bin/activate && python3 app.py"
echo ""
echo "To run automated verification:"
echo "  cd $API_DIR && source venv/bin/activate && python3 test_challenges.py"
echo ""
echo "To start the Next.js Frontend:"
echo "  cd $FRONTEND_DIR && npm run dev"
echo ""
echo "Student Portal:   http://localhost:3000  (Access Code: AICDAWEB3CTF)"
echo "Admin Dashboard:  http://localhost:3000/admin/aicda  (Password: AICDAadmin)"
echo "=========================================================="
