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
  const size = 2000;
  const segments = 750;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      planetMass: { value: planet.mass },
      planetCenter: { value: planet.position },
      planetRadius: { value: planet.radius },
      starMass: { value: star.mass },
      starCenter: { value: star.position },
      starRadius: { value: star.radius },
      deformationRange: { value: 150 }
    },
    vertexShader: `
      uniform float time;
      uniform float planetMass;
      uniform vec3 planetCenter;
      uniform float planetRadius;
      uniform float starMass;
      uniform vec3 starCenter;
      uniform float starRadius;
      uniform float deformationRange;

      void main() {
        vec3 pos = position;

        // Planet deformation
        float distPlanet = distance(pos.xz, planetCenter.xz);
        if (distPlanet < deformationRange) {
          float normalizedDist = distPlanet / deformationRange;
          float falloff = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
          float defPlanet = -planetMass * 10.0 * falloff * (1.0 / (1.0 + distPlanet * 0.1));
          defPlanet *= 1.0 + 0.1 * sin(time * 0.3 + distPlanet * 0.05);
          pos.y += defPlanet;
        }

        // Star deformation
        float distStar = distance(pos.xz, starCenter.xz);
        if (distStar < deformationRange * 2.0) {
          float normalizedDist = distStar / (deformationRange * 2.0);
          float falloff = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
          float defStar = -starMass * 20.0 * falloff * (1.0 / (1.0 + distStar * 0.05));
          defStar *= 1.0 + 0.1 * sin(time * 0.2 + distStar * 0.03);
          pos.y += defStar;
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.1, 0.1, 0.4, 0.7);
      }
    `,
    wireframe: true,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.renderOrder = -1;
  return mesh;
};

const createAnimatedWarpedGrid = ({ planet, star }) => {
  const size = 2000;
  const segments = 750;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      planetMass: { value: planet.mass },
      planetCenter: { value: planet.position },
      planetRadius: { value: planet.radius },
      starMass: { value: star.mass },
      starCenter: { value: star.position },
      starRadius: { value: star.radius },
      deformationRange: { value: 100 }
    },
    vertexShader: `
      uniform float time;
      uniform float planetMass;
      uniform vec3 planetCenter;
      uniform float planetRadius;
      uniform float starMass;
      uniform vec3 starCenter;
      uniform float starRadius;
      uniform float deformationRange;

      void main() {
        vec3 pos = position;

        // Planet deformation - more localized
        float distPlanet = distance(pos.xz, planetCenter.xz);
        if (distPlanet < deformationRange) {
          float normalizedDist = distPlanet / deformationRange;
          float falloff = pow(1.0 - normalizedDist, 2.0);
          float defPlanet = -planetMass * 15.0 * falloff * (1.0 / (0.5 + distPlanet * 0.2));
          defPlanet *= 0.8 + 0.2 * sin(time * 0.4 + distPlanet * 0.1);
          pos.y += defPlanet;
        }

        // Star deformation - more localized
        float distStar = distance(pos.xz, starCenter.xz);
        if (distStar < deformationRange * 1.5) {
          float normalizedDist = distStar / (deformationRange * 1.5);
          float falloff = pow(1.0 - normalizedDist, 2.0);
          float defStar = -starMass * 25.0 * falloff * (1.0 / (0.5 + distStar * 0.1));
          defStar *= 0.8 + 0.2 * sin(time * 0.3 + distStar * 0.08);
          pos.y += defStar;
        }

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
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.renderOrder = -1;
  return mesh;
};

function App() {
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [celestialData, setCelestialData] = useState({ planets: [], stars: [] });
  const [currentStarIndex, setCurrentStarIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuperObject, setShowSuperObject] = useState(false);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const currentPlanetRef = useRef(null);
  const warpedGridRef = useRef(null);
  const labelRef = useRef(null);
  const commonWarpedGridRef = useRef(null);
  const secondaryWarpedGridRef = useRef(null);
  const starMeshesRef = useRef([]);
  const currentStarRef = useRef(null);
  const starLabelRef = useRef(null);
  const planetOrbitRef = useRef(null);
  const planetSystemGroupRef = useRef(new THREE.Group());
  const superObjectRef = useRef(null);

  // Fetch celestial data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Initial fetch of minimal data (for basic setup)
        const response = await fetch('http://localhost:8000/celestial-objects');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // Simulate gradual loading by slowly adding planets data
        const planetsWithOrbits = data.planets.map((planet, index) => ({
          ...planet,
          orbitRadius: planet.orbitRadius || (50 + index * 30),
          orbitSpeed: planet.orbitSpeed || (0.0005 + index * 0.0002),
          orbitAngle: planet.orbitAngle || Math.random() * Math.PI * 2,
          orbitPlaneOffset: (Math.random() - 0.5) * 5
        }));
        
        // First set the stars data and some basic planet data
        setCelestialData({ 
          stars: data.stars,
          planets: [] // Start with empty planets
        });
        
        // Gradually set planets with data (simulate progressive loading)
        for (let i = 0; i < planetsWithOrbits.length; i++) {
          setCelestialData((prevData) => ({
            ...prevData,
            planets: [...prevData.planets, planetsWithOrbits[i]]
          }));
          
          // Add a small delay to make the process feel gradual
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between each planet
        }
  
        setError(null);
      } catch (error) {
        console.error('Error fetching celestial data:', error);
        setError(error.message);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000); // Delay by 2000ms = 2 seconds
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

    // Add planet system group to scene
    scene.add(planetSystemGroupRef.current);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Improved lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Enhanced starfield
    const stars = getStarfield({ numStars: 5000 });
    scene.add(stars);

    // Improved bloom effect
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Create super cool object
    const createSuperObject = () => {
      const geometry = new THREE.IcosahedronGeometry(5, 5);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      mesh.visible = false;
      
      // Add pulsing animation
      const pulseAnimation = () => {
        gsap.to(mesh.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
        
        gsap.to(mesh.rotation, {
          x: Math.PI * 2,
          y: Math.PI * 2,
          duration: 30,
          repeat: -1,
          ease: "linear"
        });
      };
      
      scene.add(mesh);
      superObjectRef.current = mesh;
      pulseAnimation();
    };

    createSuperObject();

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (currentPlanetRef.current) {
        const intersects = raycaster.intersectObject(currentPlanetRef.current);
        if (intersects.length > 0) {
          focusOnObject(currentPlanetRef.current, 8);
          return;
        }
      }
      
      if (currentStarRef.current) {
        const intersects = raycaster.intersectObject(currentStarRef.current);
        if (intersects.length > 0) {
          focusOnObject(currentStarRef.current, 15);
          return;
        }
      }
    };

    window.addEventListener('click', onMouseClick);

    const focusOnObject = (object, distanceMultiplier = 8) => {
      const distance = object.geometry.parameters.radius * distanceMultiplier;
      const offset = new THREE.Vector3(
        distance * 0.7,
        distance * 0.5,
        distance * 0.7
      );
      
      const targetPosition = object.position.clone().add(offset);
      
      gsap.to(cameraRef.current.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          cameraRef.current.lookAt(object.position);
        }
      });
    };

    const animate = () => {
      
      requestAnimationFrame(animate);
      controls.update();

      // Update planet orbit if exists
      if (planetOrbitRef.current && currentPlanetRef.current) {
        const planet = celestialData.planets[currentPlanetIndex];
        if (planet) {
          planet.orbitAngle += planet.orbitSpeed;
          currentPlanetRef.current.position.x = Math.cos(planet.orbitAngle) * planet.orbitRadius;
          currentPlanetRef.current.position.z = Math.sin(planet.orbitAngle) * planet.orbitRadius;
          currentPlanetRef.current.position.y = planet.orbitPlaneOffset;
          
          // Update label position
          if (labelRef.current) {
            labelRef.current.position.copy(currentPlanetRef.current.position);
            labelRef.current.position.y += planet.radius * 2 + 5;
          }

          // Update grid deformation
          if (commonWarpedGridRef.current) {
            commonWarpedGridRef.current.material.uniforms.planetCenter.value.copy(currentPlanetRef.current.position);
          }
          if (warpedGridRef.current) {
            warpedGridRef.current.material.uniforms.planetCenter.value.copy(currentPlanetRef.current.position);
          }
        }
      }

      // Update warped grids time
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
      window.removeEventListener('click', onMouseClick);
      cleanupScene();
    };
  }, []);

  const cleanupScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (currentPlanetRef.current) {
      planetSystemGroupRef.current.remove(currentPlanetRef.current);
      currentPlanetRef.current.geometry.dispose();
      currentPlanetRef.current.material.dispose();
      currentPlanetRef.current = null;
    }
    if (warpedGridRef.current) {
      planetSystemGroupRef.current.remove(warpedGridRef.current);
      warpedGridRef.current.geometry.dispose();
      warpedGridRef.current.material.dispose();
      warpedGridRef.current = null;
    }
    if (commonWarpedGridRef.current) {
      planetSystemGroupRef.current.remove(commonWarpedGridRef.current);
      commonWarpedGridRef.current.geometry.dispose();
      commonWarpedGridRef.current.material.dispose();
      commonWarpedGridRef.current = null;
    }
    if (secondaryWarpedGridRef.current) {
      planetSystemGroupRef.current.remove(secondaryWarpedGridRef.current);
      secondaryWarpedGridRef.current.geometry.dispose();
      secondaryWarpedGridRef.current.material.dispose();
      secondaryWarpedGridRef.current = null;
    }
    if (labelRef.current) {
      scene.remove(labelRef.current);
      labelRef.current.material.dispose();
      labelRef.current = null;
    }
  };

  useEffect(() => {
    if (celestialData.stars.length === 0 || currentStarIndex >= celestialData.stars.length) return;
  
    const scene = sceneRef.current;
    if (!scene) return;
  
    // Cleanup previous star
    if (currentStarRef.current) {
      scene.remove(currentStarRef.current);
      currentStarRef.current.geometry.dispose();
      currentStarRef.current.material.dispose();
    }
    if (starLabelRef.current) {
      scene.remove(starLabelRef.current);
      starLabelRef.current.material.dispose();
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
  
      // Create a strong point light for the star
      const starLight = new THREE.PointLight(star.color || 0xffccaa, 5, 100);
      starLight.position.set(0, 0, 0);
      scene.add(starLight);
  
      // Enhanced star material
      const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.05,
        metalness: 1.0,
        emissive: new THREE.Color(star.color || 0xffffff),
        emissiveIntensity: 5.0,
        toneMapped: false
      });
  
      const geometry = new THREE.SphereGeometry(star.radius * 5, 128, 128);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      mesh.renderOrder = 999;
      
      // Add corona effect
      const coronaGeometry = new THREE.SphereGeometry(star.radius * 7, 64, 64);
      const coronaMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(star.color || 0xffaa77),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
      mesh.add(corona);
  
      scene.add(mesh);
      currentStarRef.current = mesh;
  
      // Enhanced star label
      const label = createStarLabel(star.name, mesh.position);
      scene.add(label);
      starLabelRef.current = label;
  
      // Update planet system position relative to star
      planetSystemGroupRef.current.position.copy(mesh.position);
  
      // Camera animation to view the star system
      const distance = star.radius * 15;
      const targetPosition = new THREE.Vector3(
        distance,
        distance * 0.5,
        distance
      );
      
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
  
      // Update warped grid to reflect the new star
      if (commonWarpedGridRef.current) {
        commonWarpedGridRef.current.material.uniforms.starCenter.value.copy(mesh.position);
      }
      if (warpedGridRef.current) {
        warpedGridRef.current.material.uniforms.starCenter.value.copy(mesh.position);
      }
  
    } catch (error) {
      console.error(`Error creating star ${star.name}:`, error);
    }
  }, [celestialData, currentStarIndex]);
  
  const createStarLabel = (text, position) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Glowing background
    const gradient = context.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 100, 50, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text styling
    context.font = 'Bold 60px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 15;
    context.fillText(text, canvas.width/2, canvas.height/2 + 30);
  
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 15;
    sprite.scale.set(12, 6, 1);
    return sprite;
  };

  // Load current planet
  useEffect(() => {
    if (celestialData.planets.length === 0 || currentPlanetIndex >= celestialData.planets.length) return;

    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous planet and grids
    cleanupScene();

    const planet = celestialData.planets[currentPlanetIndex];
    const star = celestialData.stars[currentStarIndex];
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

      const geometry = new THREE.SphereGeometry(planet.radius * 2, 64, 64);
      const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7,
        metalness: 0.3,
        bumpScale: 0.05
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Position planet in orbit
      if (planet.orbitRadius) {
        mesh.position.set(
          Math.cos(planet.orbitAngle) * planet.orbitRadius,
          planet.orbitPlaneOffset,
          Math.sin(planet.orbitAngle) * planet.orbitRadius
        );
        planetOrbitRef.current = mesh;
      } else {
        mesh.position.set(0, 0, 0);
      }
      
      planetSystemGroupRef.current.add(mesh);
      currentPlanetRef.current = mesh;

      // Add atmospheric glow for planets
      if (planet.hasAtmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(planet.radius * 2.1, 64, 64);
        const atmosphereMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x7ec0ee),
          transparent: true,
          opacity: 0.3,
          roughness: 0.1,
          metalness: 0.1
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        mesh.add(atmosphere);
      }

      // Create new warped grids for this planet
      const grid = createAnimatedWarpedGrid({
        planet: {
          mass: planet.mass,
          position: mesh.position.clone(),
          radius: planet.radius
        },
        star: {
          mass: star?.mass || 0,
          position: new THREE.Vector3(0, 0, 0),
          radius: star?.radius || 0
        }
      });

      const grid2 = createAdditionalWarpedGrid({
        planet: {
          mass: planet.mass,
          position: mesh.position.clone(),
          radius: planet.radius
        },
        star: {
          mass: star?.mass || 0,
          position: new THREE.Vector3(0, 0, 0),
          radius: star?.radius || 0
        }
      });
    
      planetSystemGroupRef.current.add(grid);
      planetSystemGroupRef.current.add(grid2);
      commonWarpedGridRef.current = grid;
      secondaryWarpedGridRef.current = grid2;

      // Enhanced planet label
      const label = createPlanetLabel(planet.name, mesh.position);
      scene.add(label);
      labelRef.current = label;

      // Animate camera to planet
      const distance = planet.radius * 8;
      const targetPosition = new THREE.Vector3(
        distance,
        distance * 0.5,
        distance
      );
      
      gsap.to(cameraRef.current.position, {
        x: targetPosition.x + mesh.position.x,
        y: targetPosition.y,
        z: targetPosition.z + mesh.position.z,
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
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Gradient background
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(50, 100, 150, 0.8)');
    gradient.addColorStop(1, 'rgba(25, 50, 75, 0.8)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text styling
    context.font = 'Bold 50px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.shadowColor = 'rgba(0, 0, 0, 0.7)';
    context.shadowBlur = 10;
    context.fillText(text, canvas.width/2, canvas.height/2 + 30);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += planet.radius * 2 + 5;
    sprite.scale.set(8, 4, 1);
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

  const toggleSuperObject = () => {
    if (!superObjectRef.current) return;
    
    setShowSuperObject(!showSuperObject);
    superObjectRef.current.visible = !showSuperObject;
    
    if (!showSuperObject) {
      // Focus on super object
      const distance = 15;
      const targetPosition = new THREE.Vector3(
        distance,
        distance * 0.5,
        distance
      );
      
      gsap.to(cameraRef.current.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          cameraRef.current.lookAt(superObjectRef.current.position);
        },
      });
    } else {
      // Return to current planet
      if (currentPlanetRef.current) {
        const distance = currentPlanetRef.current.geometry.parameters.radius * 8;
        const targetPosition = new THREE.Vector3(
          distance,
          distance * 0.5,
          distance
        );
        
        gsap.to(cameraRef.current.position, {
          x: targetPosition.x + currentPlanetRef.current.position.x,
          y: targetPosition.y,
          z: targetPosition.z + currentPlanetRef.current.position.z,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            cameraRef.current.lookAt(currentPlanetRef.current.position);
          },
        });
      }
    }
  };

  return (
    <div className="App">
  {/* Canvas is always rendered for Three.js */}
  <canvas id="ThreeJs" />

  {/* Loading Overlay (visible while loading) */}
  {loading && (
    <div className="loading-overlay">
      Loading universe...
    </div>
  )}

  {/* Error message */}
  {error && (
    <div className="error-overlay">
      Error: {error}
    </div>
  )}

  {/* Main UI - only shown once loading is complete */}
  {!loading && (
    <>
      {/* Planet Sidebar */}
      <Sidebar
        celestialObject={celestialData.planets[currentPlanetIndex]}
        onNext={handleNextPlanet}
        onPrev={handlePrevPlanet}
        type="planet"
        position="left"
      />

      {/* Star Sidebar */}
      <Sidebar
        celestialObject={celestialData.stars[currentStarIndex]}
        onNext={handleNextStar}
        onPrev={handlePrevStar}
        type="star"
        position="right"
      />

      {/* Super Object Button */}
      <button 
        className="super-object-button"
        onClick={toggleSuperObject}
      >
        {showSuperObject ? 'Return to Planets' : 'View Super Cool Object!'}
      </button>
    </>
  )}
</div>

  );
}

export default App;