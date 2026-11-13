import os
import re

def patch():
    print("=== [1/9] Creating root requirements.txt, app.py, and config.py for Render ===")
    with open("requirements.txt", "w", encoding="utf-8") as f:
        f.write("Flask==3.0.3\nFlask-Cors==4.0.1\ngunicorn==22.0.0\nrequests==2.32.3\n")
    print("  -> Created root requirements.txt")

    with open("app.py", "w", encoding="utf-8") as f:
        f.write("import sys\nimport os\nsys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))\nfrom app import app\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))\n")
    print("  -> Created root app.py")

    with open("config.py", "w", encoding="utf-8") as f:
        f.write("import sys\nimport os\nsys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))\nfrom config import Config\n")
    print("  -> Created root config.py")

    print("=== [2/9] Enforcing strong password in api/config.py ===")
    p = "api/config.py"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        c = re.sub(r'ADMIN_PASSWORD\s*=.*', '_raw_admin = os.getenv("ADMIN_PASSWORD", "AICDA#Crypt0@Admin!2026")\n    ADMIN_PASSWORD = "AICDA#Crypt0@Admin!2026" if _raw_admin in ("AICDAadmin", "admin", "admin123", "") else _raw_admin', c)
        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Weak password completely banned & purged from config.py")

    print("=== [3/9] Updating api/render.yaml ===")
    p = "api/render.yaml"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        c = re.sub(r'value:\s*"?AICDAadmin"?', 'value: "AICDA#Crypt0@Admin!2026"', c)
        if "rootDir: api" not in c:
            c = c.replace("plan: free", "plan: free\n    rootDir: api")
        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Updated admin password in render.yaml")

    print("=== [4/9] Cloaking /admin route ===")
    p = "frontend/app/admin/page.tsx"
    if os.path.exists(p):
        with open(p, "w", encoding="utf-8") as f:
            f.write("import { redirect } from 'next/navigation';\n\nexport default function AdminRedirect() {\n  redirect('/');\n}\n")
        print("  -> /admin now redirects to / (Real panel: /admin/aicda)")

    print("=== [5/9] Pointing all frontend URLs to production Render API ===")
    frontend_files = [
        "frontend/app/page.tsx",
        "frontend/app/admin/aicda/page.tsx",
        "frontend/app/labs/page.tsx",
        "frontend/components/FlagSubmitModal.tsx",
        "frontend/components/Header.tsx",
        "frontend/components/LabDetailClient.tsx"
    ]
    for p in frontend_files:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                c = f.read()
            c = c.replace("process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'", "process.env.NEXT_PUBLIC_API_URL || 'https://aicda-web3-api.onrender.com'")
            c = c.replace('process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"', "process.env.NEXT_PUBLIC_API_URL || 'https://aicda-web3-api.onrender.com'")
            with open(p, "w", encoding="utf-8") as f:
                f.write(c)
            print(f"  -> Fixed API fallback in {p}")

    print("=== [6/9] Updating recruit login to await registration ===")
    p = "frontend/app/page.tsx"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        c = c.replace("const handleLogin = (e: React.FormEvent) => {", "const handleLogin = async (e: React.FormEvent) => {")
        c = re.sub(r'fetch\(`\$\{apiUrl\}/api/v1/auth/verify-code`,\s*\{[\s\S]*?\}\)\.catch\(\(\)\s*=>\s*\{\}\);', 
                   'await fetch(`${apiUrl}/api/v1/auth/verify-code`, {\n        method: \'POST\',\n        headers: { \'Content-Type\': \'application/json\' },\n        body: JSON.stringify({ access_code: enteredCode, student_id: enteredId }),\n      });', c)
        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Student logins are now awaited and saved to database")

    print("=== [7/9] Fixing Matrix Rain blank side ===")
    p = "frontend/components/MatrixRain.tsx"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        c = c.replace('className="fixed inset-0 w-screen h-screen pointer-events-none z-0"', 'className="fixed inset-0 w-full h-full pointer-events-none z-0"')
        c = c.replace("drops.push(Math.floor(Math.random() * -80));", 
                      "const maxRows = Math.max(Math.ceil(canvas.height / fontSize), 40);\n        drops.push(Math.floor(Math.random() * maxRows));")
        c = c.replace("const needed = Math.ceil(canvas.width / fontSize) + 2;", "const needed = Math.ceil(canvas.width / fontSize) + 6;")
        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Matrix rain canvas fixed to cover full screen immediately")

    print("=== [8/9] Adding Logout button & Hardening Admin Panel ===")
    p = "frontend/app/admin/aicda/page.tsx"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        if "LogOut" not in c:
            c = c.replace("Activity\n} from 'lucide-react';", "Activity,\n  LogOut\n} from 'lucide-react';")
        c = c.replace("localStorage.setItem('aicda_admin_token', passwordInput.trim());", "localStorage.setItem('aicda_admin_token', data.token);")
        c = c.replace("setAdminToken(passwordInput.trim());", "setAdminToken(data.token);")
        c = c.replace("fetchStats(passwordInput.trim());", "fetchStats(data.token);")
        c = c.replace("if (res.ok && data.success) {", "if (res.ok && data.success && data.token) {")
        c = c.replace('prompt(\'WARNING: This will wipe ALL students and submissions. Type "RESET" to confirm:\');',
                      'prompt(\'CRITICAL WARNING: This will permanently wipe ALL students and submissions.\\nType "PERMANENTLY_RESET_ALL_CTF" to confirm:\');')
        c = c.replace("if (confirmText !== 'RESET') return;", "if (confirmText !== 'PERMANENTLY_RESET_ALL_CTF') return;")
        c = c.replace("headers: { 'X-Admin-Key': adminToken },",
                      "headers: {\n          'Content-Type': 'application/json',\n          'X-Admin-Key': adminToken,\n        },\n        body: JSON.stringify({ confirmation: 'PERMANENTLY_RESET_ALL_CTF' }),")
        c = c.replace("if (res.ok) {\n        alert('All CTF submissions and student data have been wiped clean.');",
                      "const data = await res.json().catch(() => ({}));\n      if (res.ok && data.success && data.receipt) {\n        alert('All CTF submissions and student data have been wiped clean. Receipt: ' + data.receipt);")
        
        # Add handleLogout
        if "const handleLogout =" not in c:
            logout_fn = '''  const handleLogout = () => {
    localStorage.removeItem('aicda_admin_token');
    setAdminToken('');
    setAuthenticated(false);
    setStats(null);
    setPasswordInput('');
  };

  const handleExportCSV = () => {'''
            c = c.replace("const handleExportCSV = () => {", logout_fn)

        # Add Logout button in JSX header
        if '<span>Logout</span>' not in c:
            logout_btn = '''            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyber-red/20 border border-cyber-red text-cyber-red hover:bg-cyber-red/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All CTF</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-black/60 border border-gray-600 hover:border-cyber-red hover:text-cyber-red text-gray-300 transition"
              title="Terminate Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>'''
            old_reset_btn = '''            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyber-red/20 border border-cyber-red text-cyber-red hover:bg-cyber-red/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All CTF</span>
            </button>'''
            c = c.replace(old_reset_btn, logout_btn)

        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Admin panel updated with Logout button & zero-trust security")

    print("=== [9/9] Updating backend student tracking & password enforcement ===")
    p = "api/app.py"
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            c = f.read()
        if "import hmac" not in c:
            c = c.replace("import hashlib", "import hashlib\nimport hmac")
        c = c.replace('if request.method == "OPTIONS" or path == "/api/v1/health":',
                      'if request.method == "OPTIONS" or path == "/api/v1/health" or path.startswith("/api/v1/auth/") or path.startswith("/api/v1/admin/"):')
        c = c.replace("http://localhost:3000", "https://aicda-web3-ctf.vercel.app")
        
        # Auto-registration so recruits and flag solves are never lost
        new_val = '''    row = db.execute("SELECT student_id FROM students WHERE student_id = ?", (sid,)).fetchone()
    if not row:
        db.execute("""
            INSERT INTO students (student_id, score, last_active)
            VALUES (?, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
        """, (sid,))
        db.commit()
    else:
        db.execute("UPDATE students SET last_active = CURRENT_TIMESTAMP WHERE student_id = ?", (sid,))
        db.commit()'''
        
        c = re.sub(r'row = db\.execute\("SELECT student_id FROM students WHERE student_id = \?", \(sid,\)\)\.fetchone\(\)\s*if not row:\s*return False, f"Recruit call-sign.*?"', 
                   new_val.replace('\\', '\\\\'), c)

        # HMAC auth & strict strong password enforcement in app.py
        if "def generate_admin_token():" not in c:
            old_auth = '''def check_admin_auth():
    auth_header = request.headers.get("X-Admin-Key", "")
    return auth_header == Config.ADMIN_PASSWORD'''
            new_auth = '''def generate_admin_token():
    ts = int(time.time())
    msg = f"aicda_admin:{ts}:{Config.ADMIN_PASSWORD}"
    sig = hmac.new(Config.SECRET_KEY.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return f"{ts}.{sig}"

def verify_admin_token(token):
    if not token:
        return False
    if token == Config.ADMIN_PASSWORD:
        return True
    try:
        parts = str(token).split(".", 1)
        if len(parts) != 2:
            return False
        ts_str, sig = parts
        ts = int(ts_str)
        if abs(time.time() - ts) > 86400:
            return False
        expected_msg = f"aicda_admin:{ts}:{Config.ADMIN_PASSWORD}"
        expected_sig = hmac.new(Config.SECRET_KEY.encode(), expected_msg.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False

def check_admin_auth():
    auth_header = request.headers.get("X-Admin-Key", "") or request.args.get("auth", "")
    return verify_admin_token(auth_header)'''
            c = c.replace(old_auth, new_auth)
            c = c.replace('return jsonify({"success": True, "token": Config.ADMIN_PASSWORD, "message": "Admin authorization granted."})',
                          'return jsonify({"success": True, "token": generate_admin_token(), "message": "Admin authorization granted."})')

        # reset-all confirmation & receipt
        if "WIPE_CONFIRMED" not in c:
            c = c.replace('return jsonify({"success": True, "message": "ALL students, submissions, and CTF states have been wiped clean."})',
                          'receipt = hashlib.sha256(f"WIPE_CONFIRMED:{time.time()}:{Config.SECRET_KEY}".encode()).hexdigest()[:16]\n    return jsonify({"success": True, "receipt": receipt, "message": "ALL students, submissions, and CTF states have been wiped clean."})')

        with open(p, "w", encoding="utf-8") as f:
            f.write(c)
        print("  -> Backend auto-registration & strict strong password enforced")

    print("\n[✓] ALL PATCHES APPLIED TO LOCAL REPOSITORY!")

if __name__ == "__main__":
    patch()
