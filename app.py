import sys
import os
import importlib.util

# Add api directory to sys.path so config and dependencies resolve
api_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "api"))
if api_path not in sys.path:
    sys.path.insert(0, api_path)

# Load api/app.py under an isolated namespace to prevent circular import
spec = importlib.util.spec_from_file_location("ctf_api_module", os.path.join(api_path, "app.py"))
ctf_mod = importlib.util.module_from_spec(spec)
sys.modules["ctf_api_module"] = ctf_mod
spec.loader.exec_module(ctf_mod)
app = ctf_mod.app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
