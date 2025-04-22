import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';
import Sidebar from './Sidebar';
import getStarfield from './getStarField';
import './App.css';



const createAdditionalWarpedGrid = ({ planet, star }) => {
  const size = 500;
  const segments = 750;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      planetMass: { value: planet.mass },
      planetCenter: { value: planet.position },
      starMass: { value: star.mass },
      starCenter: { value: star.position },
    },
    vertexShader: `
      uniform float time;
      uniform float planetMass;
      uniform vec3 planetCenter;
      uniform float starMass;
      uniform vec3 starCenter;

      void main() {
        vec3 pos = position;

        float distPlanet = distance(pos.xz, planetCenter.xz) + 0.001;
        float defPlanet = -planetMass * 5.0 * (1.0 / (1.0 + distPlanet * 0.5));
        defPlanet *= 1.0 + 0.2 * sin(time * 0.5 + distPlanet * 0.1); 

        float distStar = distance(pos.xz, starCenter.xz) + 0.001;
        float defStar = -starMass * 5.0 * (1.0 / (1.0 + distStar * 0.5));
        defStar *= 1.0 + 0.2 * sin(time * 0.5 + distStar * 0.1);

        pos.y += defPlanet + defStar;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.1, 0.1, 0.4, 0.7);; // Albastru turcoaz cu transparență
      }
    `,
    wireframe: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.renderOrder = -1;
  return mesh;
};


const createAnimatedWarpedGrid = ({ planet, star }) => {
  const size = 500;
  const segments = 750;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      planetMass: { value: planet.mass },
      planetCenter: { value: planet.position },
      starMass: { value: star.mass },
      starCenter: { value: star.position },
    },
    vertexShader: `
      uniform float time;
      uniform float planetMass;
      uniform vec3 planetCenter;
      uniform float starMass;
      uniform vec3 starCenter;

      void main() {
        vec3 pos = position;

        float distPlanet = distance(pos.xz, planetCenter.xz) + 0.001;
        float defPlanet = -planetMass * 5.0 * (1.0 / (1.0 + distPlanet * 0.5));
        defPlanet *= 1.0 + 0.1 * sin(time * 0.5 + distPlanet * 0.1);

        float distStar = distance(pos.xz, starCenter.xz) + 0.001;
        float defStar = -starMass * 5.0 * (1.0 / (1.0 + distStar * 0.5));
        defStar *= 1.0 + 0.1 * sin(time * 0.5 + distStar * 0.1);

        pos.y += defPlanet + defStar;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.1, 0.2, 0.6, 0.7);  
      }
    `,
    wireframe: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.renderOrder = -1;
  return mesh;
};



function App() {
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [celestialData, setCelestialData] = useState({ planets: [], stars: [] } );
  const [currentStarIndex, setCurrentStarIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const currentPlanetRef = useRef(null);
  const warpedGridRef = useRef(null);
  const labelRef = useRef(null);
  const commonWarpedGridRef = useRef();
  const starMeshesRef = useRef([]);
  const currentStarRef = useRef();
  const starWarpedGridRef = useRef();
  const starLabelRef = useRef();


  // Fetch celestial data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/celestial-objects');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCelestialData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching celestial data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialize scene
  useEffect(() => {
    const canvas = document.getElementById('ThreeJs');
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const stars = getStarfield({ numStars: 1000 });
    scene.add(stars);

    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.4,
      0.85
    );
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      if (commonWarpedGridRef.current) {
        commonWarpedGridRef.current.material.uniforms.time.value = performance.now() * 0.001;
      }
      
      if (warpedGridRef.current) {
        warpedGridRef.current.material.uniforms.time.value = performance.now() * 0.001;
      }
    
      composer.render();
    };
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentPlanetRef.current) {
        scene.remove(currentPlanetRef.current);
        currentPlanetRef.current.geometry.dispose();
        currentPlanetRef.current.material.dispose();
      }
      if (warpedGridRef.current) {
        scene.remove(warpedGridRef.current);
        warpedGridRef.current.geometry.dispose();
        warpedGridRef.current.material.dispose();
      }
      if (labelRef.current) {
        scene.remove(labelRef.current);
        labelRef.current.material.dispose();
      }
    };
  }, []);

  useEffect(() => {
  if (celestialData.stars.length === 0 || currentStarIndex >= celestialData.stars.length) return;

  const scene = sceneRef.current;
  if (!scene) return;

  // 🔥 Cleanup stea precedentă
  if (currentStarRef.current) {
    scene.remove(currentStarRef.current);
    currentStarRef.current.geometry.dispose();
    currentStarRef.current.material.dispose();
  }

  const star = celestialData.stars[currentStarIndex];
  const textureLoader = new THREE.TextureLoader();

  try {
    const texture = textureLoader.load(
      star.texture_url.startsWith('http') 
        ? star.texture_url 
        : `http://localhost:8000${star.texture_url}`,
      undefined,
      undefined,
      (err) => console.error('Error loading star texture:', err)
    );

    texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    const geometry = new THREE.SphereGeometry(star.radius * 2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.6,
      metalness: 0.3,
      emissive: new THREE.Color(star.color || 0xffffff),
      emissiveIntensity: 1.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(star.position.x, star.position.y, star.position.z);
    scene.add(mesh);
    currentStarRef.current = mesh;

    // Optional label
    const label = createPlanetLabel(star.name, mesh.position);
    scene.add(label);
    starLabelRef.current = label;

    // Camera animation (similar to planet)
    const distance = 20;
    const targetPosition = new THREE.Vector3(distance, distance / 2, distance);
    gsap.to(cameraRef.current.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        cameraRef.current.lookAt(mesh.position);
      },
    });

  } catch (error) {
    console.error(`Error creating star ${star.name}:`, error);
  }
}, [celestialData, currentStarIndex]);


  // Load current planet
  useEffect(() => {
    if (celestialData.planets.length === 0 || currentPlanetIndex >= celestialData.planets.length) return;

    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous planet
    if (currentPlanetRef.current) {
      scene.remove(currentPlanetRef.current);
      currentPlanetRef.current.geometry.dispose();
      currentPlanetRef.current.material.dispose();
    }

    if (!commonWarpedGridRef.current && celestialData.planets[currentPlanetIndex].mass) {
      const planet = celestialData.planets[currentPlanetIndex];
      const star = celestialData.stars[currentStarIndex];
    
      const grid = createAnimatedWarpedGrid({
        planet: {
          mass: planet.mass,
          position: new THREE.Vector3(0, 0, 0),
        },
        star: {
          mass: star?.mass || 0,
          position: new THREE.Vector3(
            star?.position?.x || 1000,
            star?.position?.y || 0,
            star?.position?.z || 0
          ),
        },
      });

      const grid2 = createAdditionalWarpedGrid({
        planet: {
          mass: planet.mass,
          position: new THREE.Vector3(0, 0, 0),
        },
        star: {
          mass: star?.mass || 0,
          position: new THREE.Vector3(
            star?.position?.x || 1000,
            star?.position?.y || 0,
            star?.position?.z || 0
          ),
        },
      });
    
      scene.add(grid2);
      scene.add(grid);
      commonWarpedGridRef.current = grid;
    }


    


    


    
    if (labelRef.current) {
      scene.remove(labelRef.current);
      labelRef.current.material.dispose();
    }

    const planet = celestialData.planets[currentPlanetIndex];
    const textureLoader = new THREE.TextureLoader();

    try {
      const texture = textureLoader.load(
        planet.texture_url.startsWith('http') 
          ? planet.texture_url 
          : `http://localhost:8000${planet.texture_url}`,
        undefined,
        undefined,
        (err) => console.error('Error loading texture:', err)
      );

      texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      const geometry = new THREE.SphereGeometry(planet.radius * 2, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // Centrat în scenă
      scene.add(mesh);
      currentPlanetRef.current = mesh;

      // Add warped grid if needed
      if (planet.mass && planet.mass > 0) {
        const warpedGrid = createAnimatedWarpedGrid({
          mass: planet.mass,
          position: mesh.position.clone(),
        });
        scene.add(warpedGrid);
        warpedGridRef.current = warpedGrid;
      }

      // Add label
      const label = createPlanetLabel(planet.name, mesh.position);
      scene.add(label);
      labelRef.current = label;

      // Animate camera to planet
      const distance = 10;
      const targetPosition = new THREE.Vector3(distance, distance/2, distance);
      
      gsap.to(cameraRef.current.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          cameraRef.current.lookAt(mesh.position);
        },
      });

    } catch (error) {
      console.error(`Error creating planet ${planet.name}:`, error);
    }
  }, [celestialData, currentPlanetIndex]);

  const createPlanetLabel = (text, position) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 40px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(text, canvas.width/2, canvas.height/2 + 15);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 3;
    sprite.scale.set(4, 2, 1);
    return sprite;
  };

  const handleNextPlanet = () => {
    setCurrentPlanetIndex(prev => 
      (prev + 1) % celestialData.planets.length
    );
  };

  const handlePrevPlanet = () => {
    setCurrentPlanetIndex(prev => 
      (prev - 1 + celestialData.planets.length) % celestialData.planets.length
    );
  };


  const handleNextStar = () => {
    setCurrentStarIndex(prev => (prev + 1) % celestialData.stars.length);
  };
  
  const handlePrevStar = () => {
    setCurrentStarIndex(prev => 
      (prev - 1 + celestialData.stars.length) % celestialData.stars.length
    );
  };

  return (
    <div className="App">
      {loading && <div className="loading-overlay">Loading universe...</div>}
      {error && <div className="error-overlay">Error: {error}</div>}
      <canvas id="ThreeJs" />
      
      {/* Sidebar pentru planete */}
      <Sidebar
        celestialObject={celestialData.planets[currentPlanetIndex]}
        onNext={handleNextPlanet}
        onPrev={handlePrevPlanet}
        type="planet"
      />
      
      {/* Sidebar pentru stele */}
      <Sidebar
        celestialObject={celestialData.stars[currentStarIndex]}
        onNext={handleNextStar}
        onPrev={handlePrevStar}
        type="star"
        position="right" // Adaugă o poziție diferită pentru a le afișa pe partea opusă
      />
    </div>
  );
}

export default App;