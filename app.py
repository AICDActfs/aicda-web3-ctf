import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
from app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
