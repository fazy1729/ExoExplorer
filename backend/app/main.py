from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
import httpx
import logging
from fastapi.middleware.cors import CORSMiddleware
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"

@app.get("/celestial-objects")
async def get_celestial_objects():
    """Get both stars and planets data"""
    # Get stars from Gaia
    stars_query = """
    SELECT TOP 5 
        source_id,
        ra, 
        dec,
        parallax,
        phot_g_mean_mag,
        bp_rp
    FROM gaiadr3.gaia_source
    WHERE parallax IS NOT NULL
    ORDER BY phot_g_mean_mag
    """

    

    
    # Sample planet data
    planets_data = [
        {
            "mass": 15,
            "name": "Earth",
            "type": "Planet",
            "position": {"x": 0, "y": 0, "z": 0},
            "description": "Our home planet",
            "radius": 1.0,
            "texture_url": "/static/8k_earth_daymap.jpg"
        },
        {
            "mass": 120,
            "name": "Jupiter",
            "type": "Gas Giant",
            "position": {"x": 10, "y": 0, "z": 0},
            "description": "Big gas giant",
            "radius": 2.0,
            "texture_url": "/static/8k_jupiter.jpg"
        },
        
        {
            "mass": 60,
            "name": "Neptune",
            "type": "Ice Giant",
            "position": {"x": 5, "y": 0, "z": -20},
            "description": "Blue ice giant",
            "radius": 1.6,
            "texture_url": "/static/neptune_4k.jpg"
        }
    ]
    
    try:
        async with httpx.AsyncClient() as client:
            # Get stars
            stars_response = await client.post(
                GAIA_TAP_URL,
                data={
                    "REQUEST": "doQuery",
                    "LANG": "ADQL",
                    "FORMAT": "json",
                    "QUERY": stars_query
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            stars = []
            if stars_response.status_code == 200:
                stars_data = stars_response.json().get('data', [])
                stars = [{
                    "id": str(star[0]),
                    "name": f"Star-{star[0]}",
                    "type": "Star",
                    "ra": star[1],
                    "dec": star[2],
                    "parallax": star[3],
                    "magnitude": star[4],
                    "color_index": star[5],
                    "position": convert_equatorial_to_3d(star[1], star[2], star[3]),
                    "radius": 0.5 + (15 - star[4]) / 10,  # Adjust size based on magnitude
                    "texture_url": "/static/star_texture.jpg",  # Add a default star texture
                    "color": get_star_color(star[5]),  # Function to get color based on temperature
                    "mass": 10 + (15 - star[4]) * 2  # Estimate mass based on magnitude
                } for star in stars_data]
            
            return {
                "planets": planets_data,
                "stars": stars
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_star_color(bp_rp):
    """Get star color based on BP-RP color index"""
    if bp_rp is None:
        return "#ffffff"
    
    # Color mapping based on BP-RP index
    if bp_rp < -0.5:
        return "#9bb0ff"  # Blue
    elif bp_rp < 0.0:
        return "#a6c2ff"  # Blue-white
    elif bp_rp < 0.5:
        return "#cad7ff"  # White
    elif bp_rp < 1.0:
        return "#fff4ea"  # Yellow-white
    elif bp_rp < 1.5:
        return "#ffd2a1"  # Yellow
    elif bp_rp < 2.0:
        return "#ffb347"  # Orange
    else:
        return "#ff8c61"  # Red
        
def convert_equatorial_to_3d(ra, dec, parallax):
    """Convert astronomical coordinates to 3D position"""
    distance = 1000/parallax if parallax > 0 else 1000
    phi = (90 - dec) * (3.141592653589793 / 180)
    theta = ra * (3.141592653589793 / 180)
    
    return {
        "x": distance * math.sin(phi) * math.cos(theta),
        "y": distance * math.sin(phi) * math.sin(theta),
        "z": distance * math.cos(phi)
    }
@app.get("/test-stars")
async def test_stars(
    limit: int = Query(10, description="Number of stars to return"),
    min_magnitude: float = Query(15.0, description="Maximum brightness (higher numbers mean dimmer stars)")
):
    """Test endpoint to verify Gaia API connection with simple star data"""
    query = f"""
    SELECT TOP {limit} 
        source_id,
        ra, 
        dec,
        parallax,
        phot_g_mean_mag,
        bp_rp
    FROM gaiadr3.gaia_source
    WHERE 
        parallax IS NOT NULL AND
        phot_g_mean_mag < {min_magnitude}
    ORDER BY phot_g_mean_mag
    """
    
    logger.info(f"Executing test query: {query}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GAIA_TAP_URL,
                data={
                    "REQUEST": "doQuery",
                    "LANG": "ADQL",
                    "FORMAT": "json",
                    "QUERY": query
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                logger.error(f"Gaia API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Gaia API error: {response.text}"
                )
            
            data = response.json()
            logger.info(f"Successfully retrieved {len(data.get('data', []))} stars")
            return {
                "status": "success",
                "query": query,
                "data": data
            }
    
    except Exception as e:
        logger.error(f"Error in test-stars endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
