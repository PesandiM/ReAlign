import sys

class _SE:
    pass
class _ER:
    pass

class _FakeMain:
    SimilarityEngine = _SE
    EnsembleRecommender = _ER

sys.modules['__mp_main__'] = _FakeMain()

import os
import uvicorn

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

print(f"✅ Backend directory added to path: {backend_dir}")
print(f"✅ Looking for app module at: {os.path.join(backend_dir, 'app')}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)