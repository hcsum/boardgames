import {
  Board,
  Player,
  IN_PLAY_SURFACES,
  PLAYER_START_TILES,
  GRID_SIZE,
  TileObject,
} from "../core-game";
import { board, players, tileObjects } from "./init-game";

const TILE_SIZE = 60;
const wrapper = document.getElementById("2d");

function makeTile(
  left: string,
  top: string,
  isPlayArea: boolean,
  isStartTile: boolean,
  color: string | undefined,
  player: Player | null,
  idx: number
) {
  const tile = document.createElement("div");
  const DIRECTIONS = {
    down: "180deg",
    left: "-90deg",
    up: "0deg",
    right: "90deg",
  };
  tile.className = "tile";
  tile.style.width = TILE_SIZE + "px";
  tile.style.height = TILE_SIZE + "px";
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
  num.innerText = idx.toString();

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.appendChild(num);
  if (player) {
    const playerDiv = document.createElement("div");
    playerDiv.classList.add("player");
    playerDiv.style.transform = `rotate(${
      DIRECTIONS[player.absoluteDirection!]
    })`;

    wrap.appendChild(playerDiv);
  }

  tile.appendChild(wrap);
  wrapper?.appendChild(tile);
}

function renderCube() {
  if (!wrapper) return;
  wrapper.innerHTML = "";
  let idx = 0;
  for (const tile of tileObjects) {
    const { surface, row, col } = tile;

    // Calculate left and top based on row, col, and surface
    const left = col * TILE_SIZE + (surface % 3) * GRID_SIZE * TILE_SIZE + "px";
    const top =
      row * TILE_SIZE + Math.floor(surface / 3) * GRID_SIZE * TILE_SIZE + "px";

    const isPlayArea = IN_PLAY_SURFACES.includes(surface);
    const obstacle = tile.obstacle;
    const isPlayerStart = PLAYER_START_TILES.includes(idx);
    const player = tile.player;

    makeTile(
      left,
      top,
      isPlayArea,
      isPlayerStart,
      obstacle?.color,
      player,
      idx++
    );
  }
}

// Initial render
renderCube();
