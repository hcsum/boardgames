import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import {
  Board,
  Player,
  TILE_TOTAL,
  IN_PLAY_SURFACES,
  PLAYER_START_TILES,
} from "../core-game";
import { cubeMap as debugCubeMap } from "./debug-cube-map";
// Initialize game state
const board = new Board();
const cubeMap = board.cubeMap;
// const cubeMap = debugCubeMap;
const players = PLAYER_START_TILES.map((startTile, index) => {
  const player = new Player(`player${index + 1}`);
  player.move(startTile, board);
  const surface = board.cubeMap[startTile]?.surface;
  if (surface && surface in Player.ATTRIBUTES_BY_STARTING_SURFACE) {
    player.absoluteDirection =
      Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
    player.startDir = Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
  }
  return player;
});

// Three.js setup
const scene = new THREE.Scene();
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
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

// Constants
const SURFACE_SIZE = 5;
const TILE_SIZE = 1; // 5x5 grid per surface
const GRID_OFFSET = 0.01; // Slight offset to prevent z-fighting

// Materials
const materials = {
  grid: new THREE.LineBasicMaterial({ color: 0xffffff }),
  player: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
  obstacle: new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
};

// Create the main cube
const cubeGeometry = new THREE.BoxGeometry(
  SURFACE_SIZE,
  SURFACE_SIZE,
  SURFACE_SIZE
);
const cubeMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  wireframe: true,
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

const gameElements = new THREE.Group();
scene.add(gameElements);

function createGridLines(surface: number) {
  const points: THREE.Vector3[] = [];
  const halfSize = SURFACE_SIZE / 2;

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
  x: number,
  y: number,
  z: number,
  direction: string,
  surface: number
) {
  const size = TILE_SIZE * 0.4; // 40% of tile size
  const shape = new THREE.Shape();
  shape.moveTo(0, size); // Top point
  shape.lineTo(-size, -size); // Bottom left
  shape.lineTo(size, -size); // Bottom right
  shape.lineTo(0, size); // Close the shape

  const geometry = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geometry, materials.player);
  mesh.position.set(x, y, z + 0.1); // Slightly above the surface

  // Rotate based on surface and direction
  switch (surface) {
    case 7: // Front
      mesh.rotation.set(0, 0, 0);
      mesh.position.set(x, y, z + 0.1);
      break;
    case 3: // Left
      mesh.rotation.set(0, Math.PI / 2, 0);
      mesh.position.set(x - 0.1, y, z);
      break;
    case 4: // Top
      mesh.rotation.set(Math.PI / 2, 0, 0);
      mesh.position.set(x, y, z + 0.1);
      break;
    case 5: // Right
      mesh.rotation.set(0, -Math.PI / 2, 0);
      mesh.position.set(x + 0.1, y, z);
      break;
    case 1: // Back
      mesh.rotation.set(0, Math.PI, 0);
      mesh.position.set(x, y, z - 0.1);
      break;
  }

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
  x: number,
  y: number,
  z: number,
  color: string,
  surface: number
) {
  const size = TILE_SIZE * 0.8; // 80% of tile size
  const height = TILE_SIZE * 0.2; // 20% of tile size for height
  const geometry = new THREE.BoxGeometry(size, size, height);
  const material = new THREE.MeshPhongMaterial({ color: parseInt(color, 16) });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z + height / 2);

  // Rotate based on surface
  switch (surface) {
    case 7: // Front
      mesh.rotation.set(0, 0, 0);
      break;
    case 3: // Left
      mesh.rotation.set(0, Math.PI / 2, 0);
      break;
    case 4: // Top
      mesh.rotation.set(Math.PI / 2, 0, 0);
      break;
    case 5: // Right
      mesh.rotation.set(0, -Math.PI / 2, 0);
      break;
    case 1: // Back
      mesh.rotation.set(0, Math.PI, 0);
      break;
  }

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
      const halfSize = SURFACE_SIZE / 2;
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

console.log(cubeMap);

// Render the cube
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
  const line = new THREE.Line(
    points,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  gameElements.add(line);

  // Add grid lines for each surface
  IN_PLAY_SURFACES.forEach((surface) => {
    const gridLines = createGridLines(surface);
    gameElements.add(gridLines);
    // Add surface number label
    createSurfaceLabel(surface);
  });

  // return;

  // Create game elements (players and obstacles)
  for (let i = 1; i <= TILE_TOTAL; i++) {
    const tile = cubeMap[i];
    if (!tile) continue;

    const row = tile.row;
    const col = tile.col;
    const halfSize = SURFACE_SIZE / 2;
    let x = 0;
    let y = 0;
    let z = 0;

    // Calculate position based on surface, row, and col
    switch (tile.surface) {
      case 7: // Front
        x = (col - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        z = halfSize + 0.1;
        y = ((SURFACE_SIZE - 1) / 2 - row) * TILE_SIZE;
        break;
      case 3: // Left
        x = -halfSize - 0.1;
        y = (col - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        z = (row - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        break;
      case 4: // Top
        x = (col - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        y = halfSize + 0.1;
        z = (row - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        break;
      case 5: // Right
        x = halfSize + 0.1;
        y = ((SURFACE_SIZE - 1) / 2 - col) * TILE_SIZE;
        z = (row - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        break;
      case 1: // Back
        x = (col - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        z = -halfSize - 0.1;
        y = (row - (SURFACE_SIZE - 1) / 2) * TILE_SIZE;
        break;
    }

    // Add player if present
    // if (tile.player !== null) {
    //   const playerMesh = createPlayer(
    //     x,
    //     y,
    //     z,
    //     tile.player.absoluteDirection || "up",
    //     tile.surface
    //   );
    //   gameElements.add(playerMesh);
    // }

    // Add obstacle if present
    if (tile.obstacle !== null) {
      if (tile.surface === 5) console.log(tile);
      const obstacleMesh = createObstacle(
        x,
        y,
        z,
        tile.obstacle.color,
        tile.surface
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

// Expose game state to browser console
declare global {
  interface Window {
    game: {
      board: Board;
      players: Player[];
      move: (playerIndex: number, tileNumber: number) => void;
    };
  }
}

window.game = {
  board,
  players,
  move: (playerIndex: number, tileNumber: number) => {
    const player = players[playerIndex];
    if (!player) {
      console.error(`Player ${playerIndex} not found`);
      return;
    }
    try {
      const result = player.move(tileNumber, board);
      board.handlePlayerMoved(player, result.current);
      renderCube();
      console.log(`Move result:`, result);
    } catch (error) {
      console.error(`Move failed:`, error);
    }
  },
};
