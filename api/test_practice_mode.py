# -*- coding: utf-8 -*-
from app import app
import json

client = app.test_client()

# 1. Practice challenge 1
res = client.post("/api/v1/challenge1/exploit", json={"student_id": "test", "iterations": 1, "practice": True})
data = json.loads(res.data)
assert data["flag"] == "crypto{PRACTICE_ONLY_REENTRANCY_TEST_DRAIN_10_ITERATIONS}"
print("[PASS] Challenge 1 practice returns dummy flag:", data["flag"])

# Real challenge 1
res_real = client.post("/api/v1/challenge1/exploit", json={"student_id": "test", "iterations": 10})
data_real = json.loads(res_real.data)
assert data_real["flag"].startswith("crypto{") and "PRACTICE_ONLY" not in data_real["flag"]
print("[PASS] Challenge 1 real exploit returns actual flag:", data_real["flag"])

# Submit dummy flag to verification
res_submit = client.post("/api/v1/flags/submit", json={"student_id": "test", "challenge_slug": "reentrancy", "flag": data["flag"]})
assert res_submit.status_code == 400
assert "DUMMY PRACTICE FLAG DETECTED" in json.loads(res_submit.data)["message"]
print("[PASS] Flag submission properly rejects practice dummy flag with helpful guidance!")

# Submit real flag to verification
res_real_sub = client.post("/api/v1/flags/submit", json={"student_id": "test", "challenge_slug": "reentrancy", "flag": data_real["flag"]})
assert res_real_sub.status_code == 200
print("[PASS] Real flag accepted!")
