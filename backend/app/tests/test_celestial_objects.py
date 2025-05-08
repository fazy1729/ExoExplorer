import pytest
from httpx import AsyncClient
from aioresponses import aioresponses
from app.main import app

GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"

@pytest.mark.asyncio
async def test_get_celestial_objects():
    # Mock data pentru răspunsul de la Gaia TAP
    mock_star_data = {
        "data": [
            [123, 10.0, 20.0, 5.0, 12.0, 0.5],
            [456, 11.0, 21.0, 6.0, 11.5, 0.3],
        ]
    }

    with aioresponses() as mocked:
        mocked.post(GAIA_TAP_URL, status=200, payload=mock_star_data)

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/celestial-objects")

        assert response.status_code == 200
        data = response.json()

        # Verificăm dacă există câmpurile de planete și stele
        assert "planets" in data
        assert "stars" in data
        assert len(data["stars"]) == 2
        assert data["stars"][0]["name"] == "Star-123"