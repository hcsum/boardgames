import { PLAYER_START_TILES, TileObject, Board, Player } from "../core-game";

const board = new Board();
const tileObjects = board.tileObjects;
const players = PLAYER_START_TILES.map((startTile, index) => {
  const player = new Player(`player${index + 1}`);
  player.move(startTile, board);
  const surface = board.tileObjects[startTile]?.surface;
  if (surface && surface in Player.ATTRIBUTES_BY_STARTING_SURFACE) {
    player.absoluteDirection =
      Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
    player.startDir = Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
  }
  return player;
});

declare global {
  interface Window {
    game: {
      board: Board;
      players: Player[];
      tileObjects: TileObject[];
    };
  }
}

window.game = {
  board,
  players,
  tileObjects,
};

export { board, tileObjects, players };
