// Import constants and classes from core game
import {
  Board,
  Player,
  TILE_TOTAL,
  IN_PLAY_SURFACES,
  OBSTACLE_TYPES,
  PLAYER_START_TILES,
} from "../core-game";

const CUBE_WIDTH = 60;
const BOARD_WIDTH = 15;
let tileCount = 1;
const wrapper = document.querySelector(".wrapper");

// Initialize game state
const board = new Board();
const players = PLAYER_START_TILES.map((startTile, index) => {
  const player = new Player(`player${index + 1}`);
  // Initialize player's first move
  const result = player.move(startTile, board);
  // Set the initial direction based on the starting surface
  const surface = board.cubeMap[startTile]?.surface;
  if (surface && surface in Player.ATTRIBUTES_BY_STARTING_SURFACE) {
    player.absoluteDirection =
      Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
    player.startDir = Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
  }
  return player;
});

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

// Add game controls to window object
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

function makeTile(
  left: string,
  top: string,
  isPlayArea: boolean,
  isStartTile: boolean,
  color: string | undefined,
  player: Player | null
) {
  const tile = document.createElement("div");
  const DIRECTIONS = {
    down: "180deg",
    left: "-90deg",
    up: "0deg",
    right: "90deg",
  };
  tile.className = "tile";
  tile.style.width = CUBE_WIDTH + "px";
  tile.style.height = CUBE_WIDTH + "px";
  tile.style.left = left;
  tile.style.top = top;
  if (isPlayArea) {
    tile.style.border = "1.5px solid skyblue";
  }
  if (isStartTile) {
    tile.style.backgroundColor = "pink";
  }
  if (color) {
    tile.style.backgroundColor = "#" + color;
  }
  const num = document.createElement("div");
  num.innerText = tileCount.toString();

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.appendChild(num);
  if (player) {
    console.log("player", player.absoluteDirection);
    const playerDiv = document.createElement("div");
    playerDiv.classList.add("player");
    playerDiv.style.transform = `rotate(${
      DIRECTIONS[player.absoluteDirection || "up"]
    })`;

    wrap.appendChild(playerDiv);
  }

  tile.appendChild(wrap);
  tileCount++;
  wrapper?.appendChild(tile);
}

function renderCube() {
  if (!wrapper) return;
  wrapper.innerHTML = "";
  while (tileCount <= TILE_TOTAL) {
    const left = (tileCount % BOARD_WIDTH || BOARD_WIDTH) * CUBE_WIDTH + "px";
    const top = Math.ceil(tileCount / BOARD_WIDTH) * CUBE_WIDTH + "px";
    const isPlayArea = IN_PLAY_SURFACES.includes(
      board.cubeMap[tileCount]?.surface || 0
    );
    const obstacle = board.cubeMap[tileCount]?.obstacle;
    const isPlayerStart = PLAYER_START_TILES.includes(tileCount);
    const player = board.cubeMap[tileCount]?.player;
    makeTile(left, top, isPlayArea, isPlayerStart, obstacle?.color, player);
  }
  tileCount = 1;
}

// Initial render
renderCube();
