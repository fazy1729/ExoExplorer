// getStarField.js
import * as THREE from 'three';

const getStarfield = ({ numStars = 1000 }) => {
  const stars = new THREE.Group();

  // Creăm un material pentru particule (stele)
  const material = new THREE.PointsMaterial({
    color: 0xaaaaaa,   // Culoarea stelelor
    size: 0.5,         // Dimensiunea particulelor (stelelor)
    sizeAttenuation: true, // Face ca dimensiunea stelelor să scadă pe măsură ce camera se îndepărtează
  });

  // Creăm un geometrie pentru particule
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  
  // Generează poziții aleatorii pentru stele
  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * 2000 - 1000;  // Poziții între -1000 și 1000 pe axa X
    const y = Math.random() * 2000 - 1000;  // Poziții între -1000 și 1000 pe axa Y
    const z = Math.random() * 2000 - 1000;  // Poziții între -1000 și 1000 pe axa Z
    positions.push(x, y, z);
  }

  // Adăugăm pozițiile în geometrie
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  // Creăm obiectul Points (particulele stelelor)
  const starfield = new THREE.Points(geometry, material);

  return starfield;
};

export default getStarfield;
