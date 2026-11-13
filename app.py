import os
import sys

# Switch to api directory so database, config and modules resolve natively
api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "api"))
os.chdir(api_dir)

# Ensure api is first and remove root directory to prevent any circular import
sys.path.insert(0, api_dir)
root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir in sys.path:
    sys.path.remove(root_dir)

import app as backend_module
app = backend_module.app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
