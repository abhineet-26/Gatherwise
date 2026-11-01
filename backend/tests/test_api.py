from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "GatherWise Python API"
    assert data["version"] == "1.0.0"

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "capabilities" in data
    assert data["capabilities"]["weather"] is True

def test_weather():
    res = client.get("/api/weather?city=Pune&date=2026-12-15&setting=outdoor")
    assert res.status_code == 200
    data = res.json()
    assert data["city"] == "Pune"
    assert data["date"] == "2026-12-15"
    assert "risks" in data

def test_ai_chat_budget():
    payload = {
        "message": "What is our current budget status?",
        "context": {
            "event": {
                "id": "evt-test",
                "type": "wedding",
                "date": "2026-12-20",
                "daysToEvent": 49,
                "city": "Pune",
                "budgetTarget": 180000000,
                "contingencyPct": 10.0,
                "priorities": ["catering"],
                "dietaryTags": ["veg"]
            },
            "subEvents": [],
            "budgetLines": [
                {
                    "id": "bl-1",
                    "category": "catering",
                    "estimate": 80000000,
                    "locked": False
                }
            ],
            "commitments": [
                {
                    "id": "c-1",
                    "budgetLineId": "bl-1",
                    "amount": 75000000,
                    "status": "accepted"
                }
            ],
            "payments": [
                {
                    "id": "p-1",
                    "budgetLineId": "bl-1",
                    "amount": 25000000,
                    "status": "paid"
                }
            ],
            "vendors": [],
            "quotes": [],
            "tasks": [],
            "risks": [],
            "totalHeadcount": 250
        }
    }
    res = client.post("/api/ai/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert len(data["evidence"]) > 0

def test_ai_ideas():
    payload = {
        "context": {
            "event": {
                "id": "evt-test",
                "type": "wedding",
                "date": "2026-12-20",
                "daysToEvent": 49,
                "city": "Pune",
                "budgetTarget": 180000000,
                "contingencyPct": 10.0,
                "priorities": [],
                "dietaryTags": []
            },
            "subEvents": [],
            "budgetLines": [],
            "commitments": [],
            "payments": [],
            "vendors": [],
            "quotes": [],
            "tasks": [],
            "risks": [],
            "totalHeadcount": 100
        }
    }
    res = client.post("/api/ai/ideas", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "ideas" in data
    assert len(data["ideas"]) >= 1
