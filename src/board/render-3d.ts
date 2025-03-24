import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import {
  Board,
  Player,
  IN_PLAY_SURFACES,
  GRID_SIZE,
  TileObject,
} from "../core-game";
import { board, players, tileObjects } from "./init-game";

// Three.js setup
const scene = new THREE.Scene();
const canvas = document.getElementById("3d") as HTMLCanvasElement;
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Add orbit controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Constants
const TILE_SIZE = 1; // 5x5 grid per surface
const GRID_OFFSET = 0.01; // Slight offset to prevent z-fighting

// Materials
const materials = {
  grid: new THREE.LineBasicMaterial({ color: 0xffffff }),
  player: new THREE.MeshPhongMaterial({ color: 0xffc0cb }),
  obstacle: new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
};

// Create the main cube
const cubeGeometry = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
const cubeMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  wireframe: false,
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

const gameElements = new THREE.Group();
scene.add(gameElements);

function createGridLines(surface: number) {
  const points: THREE.Vector3[] = [];
  const halfSize = GRID_SIZE / 2;

  // Create vertical and horizontal lines
  for (let i = 0; i <= 5; i++) {
    const pos = -halfSize + i * TILE_SIZE;

    switch (surface) {
      case 7: // Front
        // Vertical lines
        points.push(new THREE.Vector3(pos, -halfSize, halfSize + GRID_OFFSET));
        points.push(new THREE.Vector3(pos, halfSize, halfSize + GRID_OFFSET));
        // Horizontal lines
        points.push(new THREE.Vector3(-halfSize, pos, halfSize + GRID_OFFSET));
        points.push(new THREE.Vector3(halfSize, pos, halfSize + GRID_OFFSET));
        break;

      case 3: // Left
        // Vertical lines
        points.push(new THREE.Vector3(-halfSize - GRID_OFFSET, -halfSize, pos));
        points.push(new THREE.Vector3(-halfSize - GRID_OFFSET, halfSize, pos));
        // Horizontal lines
        points.push(new THREE.Vector3(-halfSize - GRID_OFFSET, pos, -halfSize));
        points.push(new THREE.Vector3(-halfSize - GRID_OFFSET, pos, halfSize));
        break;

      case 4: // Top
        // Vertical lines
        points.push(new THREE.Vector3(pos, halfSize + GRID_OFFSET, -halfSize));
        points.push(new THREE.Vector3(pos, halfSize + GRID_OFFSET, halfSize));
        // Horizontal lines
        points.push(new THREE.Vector3(-halfSize, halfSize + GRID_OFFSET, pos));
        points.push(new THREE.Vector3(halfSize, halfSize + GRID_OFFSET, pos));
        break;

      case 5: // Right
        // Vertical lines
        points.push(new THREE.Vector3(halfSize + GRID_OFFSET, -halfSize, pos));
        points.push(new THREE.Vector3(halfSize + GRID_OFFSET, halfSize, pos));
        // Horizontal lines
        points.push(new THREE.Vector3(halfSize + GRID_OFFSET, pos, -halfSize));
        points.push(new THREE.Vector3(halfSize + GRID_OFFSET, pos, halfSize));
        break;

      case 1: // Back
        // Vertical lines
        points.push(new THREE.Vector3(pos, -halfSize, -halfSize - GRID_OFFSET));
        points.push(new THREE.Vector3(pos, halfSize, -halfSize - GRID_OFFSET));
        // Horizontal lines
        points.push(new THREE.Vector3(-halfSize, pos, -halfSize - GRID_OFFSET));
        points.push(new THREE.Vector3(halfSize, pos, -halfSize - GRID_OFFSET));
        break;
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const gridLines = new THREE.LineSegments(geometry, materials.grid);
  return gridLines;
}

function createPlayer(
  positionValue: THREE.Vector3,
  rotationValue: THREE.Vector3,
  direction: string
) {
  console.log(direction);
  const radius = TILE_SIZE * 0.2; // 20% of tile size for radius
  const height = TILE_SIZE * 0.6; // 60% of tile size for height
  const geometry = new THREE.ConeGeometry(radius, height, 32); // 32 segments for smoothness
  const mesh = new THREE.Mesh(geometry, materials.player);
  mesh.position.set(
    positionValue.x,
    positionValue.y,
    positionValue.z + height / 2
  );
  mesh.rotation.set(rotationValue.x, rotationValue.y, rotationValue.z);

  // Apply direction rotation
  const directionRotations = {
    up: 0,
    right: Math.PI / 2,
    down: Math.PI,
    left: -Math.PI / 2,
  };
  mesh.rotateZ(
    directionRotations[direction as keyof typeof directionRotations]
  );

  return mesh;
}

function createObstacle(
  positionValue: THREE.Vector3,
  rotationValue: THREE.Vector3,
  color: string
) {
  const size = TILE_SIZE * 0.9;
  const height = TILE_SIZE * 0.4;
  const geometry = new THREE.BoxGeometry(size, size, height);
  const material = new THREE.MeshPhongMaterial({ color: parseInt(color, 16) });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    positionValue.x,
    positionValue.y,
    positionValue.z + height / 2
  );
  mesh.rotation.set(rotationValue.x, rotationValue.y, rotationValue.z);

  return mesh;
}

function createSurfaceLabel(surface: number) {
  const loader = new FontLoader();
  const text = surface.toString();
  const textSize = TILE_SIZE * 0.5;

  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const geometry = new TextGeometry(text, {
        font: font,
        depth: 0.1,
        size: textSize,
        curveSegments: 12,
      });

      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(geometry, material);

      // Position based on surface
      const halfSize = GRID_SIZE / 2;
      switch (surface) {
        case 7: // Front
          mesh.position.set(0, 0, halfSize + GRID_OFFSET);
          break;
        case 3: // Left
          mesh.position.set(-halfSize - GRID_OFFSET, 0, 0);
          mesh.rotation.y = -Math.PI / 2;
          break;
        case 4: // Top
          mesh.position.set(0, halfSize + GRID_OFFSET, 0);
          mesh.rotation.x = -Math.PI / 2;
          break;
        case 5: // Right
          mesh.position.set(halfSize + GRID_OFFSET, 0, 0);
          mesh.rotation.y = Math.PI / 2;
          break;
        case 1: // Back
          mesh.position.set(0, 0, -halfSize - GRID_OFFSET - 0.1);
          break;
      }

      gameElements.add(mesh);
    }
  );
}

console.log(tileObjects);

function renderCube() {
  // Clear existing game elements
  while (gameElements.children.length > 0) {
    gameElements.remove(gameElements.children[0]);
  }

  const points = new THREE.BufferGeometry();
  points.setFromPoints([
    new THREE.Vector3(-5, 5, 0),
    new THREE.Vector3(5, 5, 0),
  ]);

  IN_PLAY_SURFACES.forEach((surface) => {
    const gridLines = createGridLines(surface);
    gameElements.add(gridLines);
    createSurfaceLabel(surface);
  });

  for (const tile of tileObjects) {
    const { row, col, surface } = tile;
    const halfSize = GRID_SIZE / 2;
    const positionValue = new THREE.Vector3(0, 0, 0);
    const rotationValue = new THREE.Vector3(0, 0, 0);

    switch (surface) {
      case 7: // Front
        positionValue.set(
          (col - (GRID_SIZE - 1) / 2) * TILE_SIZE,
          ((GRID_SIZE - 1) / 2 - row) * TILE_SIZE,
          halfSize
        );
        rotationValue.set(0, 0, 0);
        break;
      case 3: // Left
        positionValue.set(
          -halfSize - 0.1,
          (col - (GRID_SIZE - 1) / 2) * TILE_SIZE,
          (row - (GRID_SIZE - 1) / 2) * TILE_SIZE - 0.2
        );
        rotationValue.set(0, Math.PI / 2, 0);
        break;
      case 4: // Top
        positionValue.set(
          (col - (GRID_SIZE - 1) / 2) * TILE_SIZE,
          halfSize + 0.1,
          (row - (GRID_SIZE - 1) / 2) * TILE_SIZE - 0.2
        );
        rotationValue.set(Math.PI / 2, 0, 0);
        break;
      case 5: // Right
        positionValue.set(
          halfSize + 0.1,
          ((GRID_SIZE - 1) / 2 - col) * TILE_SIZE,
          (row - (GRID_SIZE - 1) / 2) * TILE_SIZE - 0.2
        );
        rotationValue.set(0, -Math.PI / 2, 0);
        break;
      case 1: // Back
        positionValue.set(
          (col - (GRID_SIZE - 1) / 2) * TILE_SIZE,
          (row - (GRID_SIZE - 1) / 2) * TILE_SIZE,
          -halfSize - 0.1 - 0.2
        );
        rotationValue.set(0, Math.PI, 0);
        break;
    }

    if (tile.player !== null) {
      const playerMesh = createPlayer(
        positionValue,
        rotationValue,
        tile.player.absoluteDirection || "up"
      );
      gameElements.add(playerMesh);
    }

    if (tile.obstacle !== null) {
      const obstacleMesh = createObstacle(
        positionValue,
        rotationValue,
        tile.obstacle.color
      );
      gameElements.add(obstacleMesh);
    }
  }
}

// Position camera
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial render
renderCube();
animate();
