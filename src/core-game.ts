// Core game constants
export const TILE_TOTAL = 225;
export const PLAYER_START_TILES = [38, 118, 188, 108];
export const OBSTACLE_TYPES = [
  { value: "red", color: "FF0000" },
  { value: "blue", color: "0000FF" },
  { value: "yellow", color: "FFFF00" },
  { value: "green", color: "008000" },
  { value: "purple", color: "800080" },
  { value: "orange", color: "FFA500" },
];
export const IN_PLAY_SURFACES = [1, 3, 4, 5, 7];

class Obstacle {
  value: string;
  color: string;
  id: string;
  collectedBy: string | null = null;

  constructor({
    value,
    color,
    id,
  }: {
    value: string;
    color: string;
    id: string;
  }) {
    this.value = value;
    this.color = color;
    this.id = id;
  }
}

// Fix cubeMap type definition
type CubeTile = {
  surface: number;
  row: number;
  col: number;
  obstacle: Obstacle | null;
  player: Player | null;
};

class Board {
  cubeArrays: number[][][];
  cubeMap: CubeTile[];
  obstacles: Obstacle[];
  activePlayerTotal = 0;

  constructor() {
    this.cubeArrays = this._getCubeArrays();
    this.cubeMap = this._getCubeMap(this.cubeArrays);
    // Initialize cubeMap as an array with proper indices
    const tempMap: CubeTile[] = [];
    for (let i = 0; i < TILE_TOTAL; i++) {
      tempMap[i] = this.cubeMap[i] || {
        surface: 0,
        row: 0,
        col: 0,
        obstacle: null,
        player: null,
      };
    }
    this.cubeMap = tempMap;
    this.obstacles = this._setAllObstactles();
  }

  _checkDirection(from: number, to: number): "up" | "down" | undefined {
    const fromTile = this.cubeMap[from];
    const toTile = this.cubeMap[to];
    if (fromTile.surface === toTile.surface) return;
    if (fromTile.surface < toTile.surface) {
      return "up";
    } else {
      return "down";
    }
  }

  _generateObstacle(start: number): number[] {
    function repeat<T extends "up" | "down" | "left" | "right">(
      arr: T[]
    ): () => T {
      let lastPick: T | null = null;
      return () => {
        if (lastPick) return lastPick;
        const idx = Math.floor(Math.random() * arr.length);
        lastPick = arr[idx];
        return lastPick;
      };
    }

    const leftOrRight: ("left" | "right")[] = ["left", "right"];
    const upOrDown: ("up" | "down")[] = ["up", "down"];

    const repeatLeftOrRight = repeat(leftOrRight);
    const repeatUpOrDown = repeat(upOrDown);
    const second = this.getAdjecentTile(start, repeatLeftOrRight());
    const third = this.getAdjecentTile(start, repeatUpOrDown());

    let forth: number;
    if (this.cubeMap[second].surface === this.cubeMap[start].surface) {
      forth = this.getAdjecentTile(second, repeatUpOrDown());
    } else if (this.cubeMap[third].surface === this.cubeMap[start].surface) {
      forth = this.getAdjecentTile(third, repeatLeftOrRight());
    } else {
      throw "MISFORMED_OBSTACLE";
    }

    return [start, second, third, forth];
  }

  _setAllObstactles(): Obstacle[] {
    const EDGES = {
      5: { col: 4 },
      7: { row: 4 },
    };
    const CORNERS = [70, 145, 140];

    // Create array of valid tile numbers
    const tiles = Array.from({ length: TILE_TOTAL }, (_, i) => i + 1).filter(
      (i) => {
        const tile = this.cubeMap[i];
        if (!tile) return false;

        return (
          !PLAYER_START_TILES.includes(i) &&
          IN_PLAY_SURFACES.includes(tile.surface) &&
          !CORNERS.includes(i) &&
          EDGES[tile.surface]?.row !== tile.row &&
          EDGES[tile.surface]?.col !== tile.col
        );
      }
    );

    const countPerSurface: Record<number, string[]> = {};
    const OBSTACLE_TOTAL = 12;
    const ATTEMPT_TOTAL = 500;
    const result: Obstacle[] = [];

    let obstacleCount = 0;
    let attempt = 0;
    let curTypeIdx = 0;

    while (obstacleCount < OBSTACLE_TOTAL && attempt < ATTEMPT_TOTAL) {
      attempt++;
      const idx = Math.floor(tiles.length * Math.random());
      const start = tiles[idx];

      try {
        const currentType =
          obstacleCount < 10
            ? OBSTACLE_TYPES[curTypeIdx % 5]
            : OBSTACLE_TYPES[5];
        const newObstacle = this._generateObstacle(start);

        // validate the obstacle
        newObstacle.forEach((i) => {
          const tile = this.cubeMap[i];
          if (!tile) throw "INVALID_TILE";

          if (countPerSurface[tile.surface]?.includes(currentType.value)) {
            throw "OBSTACLE_COLOR_EXIST";
          }
          if (tile?.obstacle || PLAYER_START_TILES.includes(i)) {
            throw "OBSTACLE_CREATE_FAIL";
          }
          if (
            this.cubeMap[this.getAdjecentTile(i, "up")]?.obstacle ||
            this.cubeMap[this.getAdjecentTile(i, "down")]?.obstacle ||
            this.cubeMap[this.getAdjecentTile(i, "left")]?.obstacle ||
            this.cubeMap[this.getAdjecentTile(i, "right")]?.obstacle
          ) {
            throw "OBSTACLE_TOO_CROWDED";
          }
        });

        // accept the obstacle
        newObstacle.forEach((i) => {
          const tile = this.cubeMap[i];
          if (!tile) throw "INVALID_TILE";

          const ob = new Obstacle({
            ...currentType,
            id: start.toString(),
          });

          tile.obstacle = ob;
          result.push(ob);

          countPerSurface[tile.surface]
            ? countPerSurface[tile.surface].push(currentType.value)
            : (countPerSurface[tile.surface] = [currentType.value]);
        });

        obstacleCount++;
        curTypeIdx++;
      } catch (err) {
        // Ignore failed attempts
      }
    }

    return result;
  }

  getAdjecentTile(
    tileNum: number,
    dir: "up" | "down" | "left" | "right"
  ): number | null {
    const dirs = ["up", "down", "left", "right"];
    if (!dirs.includes(dir)) throw "GET_ADJECEN_TILE_INCORRECT_DIR";
    const tile = this.cubeMap[tileNum];
    if (!tile) return null;
    const { surface, row, col } = tile;
    let result: number | undefined;

    // handle cross surface cases
    if (surface === 1) {
      if (row === 4 && dir === "down") {
        result = this.cubeArrays[4][0][col];
      }
      if (col === 0 && dir === "left") {
        result = this.cubeArrays[3][0][row];
      }
      if (col === 4 && dir === "right") {
        result = this.cubeArrays[5][0][4 - row];
      }
    } else if (surface === 5) {
      if (row === 0 && dir === "up") {
        result = this.cubeArrays[1][4 - col][4];
      }
      if (row === 4 && dir === "down") {
        result = this.cubeArrays[7][col][row];
      }
      if (col === 0 && dir === "left") {
        result = this.cubeArrays[4][row][4];
      }
    } else if (surface === 7) {
      if (row === 0 && dir === "up") {
        result = this.cubeArrays[4][4][col];
      }
      if (col === 0 && dir === "left") {
        result = this.cubeArrays[3][4][4 - row];
      }
      if (col === 4 && dir === "right") {
        result = this.cubeArrays[5][4][row];
      }
    } else if (surface === 3) {
      if (row === 0 && dir === "up") {
        result = this.cubeArrays[1][col][0];
      }
      if (row === 4 && dir === "down") {
        result = this.cubeArrays[7][4 - col][0];
      }
      if (col === 4 && dir === "right") {
        result = this.cubeArrays[4][row][0];
      }
    } else if (surface === 4) {
      if (row === 0 && dir === "up") {
        result = this.cubeArrays[1][4][col];
      }
      if (row === 4 && dir === "down") {
        result = this.cubeArrays[7][0][col];
      }
      if (col === 0 && dir === "left") {
        result = this.cubeArrays[3][row][4];
      }
      if (col === 4 && dir === "right") {
        result = this.cubeArrays[5][row][0];
      }
    }

    if (result) return result;

    // handle same surface cases
    switch (dir) {
      case "up":
        result = this.cubeArrays[surface]?.[row - 1]?.[col];
        break;
      case "down":
        result = this.cubeArrays[surface]?.[row + 1]?.[col];
        break;
      case "left":
        result = this.cubeArrays[surface]?.[row]?.[col - 1];
        break;
      case "right":
        result = this.cubeArrays[surface]?.[row]?.[col + 1];
        break;
    }

    return result || null;
  }

  getThingsInPath(
    start:
      | number
      | {
          surface: number;
          row: number;
          col: number;
          obstacle?: Obstacle | null;
          player?: Player | null;
        },
    end:
      | number
      | {
          surface: number;
          row: number;
          col: number;
          obstacle?: Obstacle | null;
          player?: Player | null;
        }
  ) {
    const a = typeof start === "number" ? this.cubeMap[start] : start;
    const b = typeof end === "number" ? this.cubeMap[end] : end;

    if (!a || !b) return null;

    if (a.surface !== b.surface) {
      const { obstacle, player } = b;
      if (obstacle) return { obstacle, distance: 0 };
      if (player)
        return { player: this.cubeMap[Number(player)]?.player || null };
      return null;
    }

    // horizontal check
    if (a.col !== b.col) {
      if (a.col < b.col) {
        // check right
        for (let i = a.col + 1; i <= b.col; i++) {
          const { obstacle, player } =
            this.cubeMap[this.cubeArrays[a.surface][a.row][i]];
          if (obstacle) return { obstacle, distance: i - a.col };
          if (player)
            return {
              player: this.cubeMap[Number(player)]?.player || null,
              distance: i - a.col,
            };
        }
      } else {
        // check left
        for (let i = a.col - 1; i >= b.col; i--) {
          const { obstacle, player } =
            this.cubeMap[this.cubeArrays[a.surface][a.row][i]];
          if (obstacle) return { obstacle, distance: a.col - i };
          if (player)
            return {
              player: this.cubeMap[Number(player)]?.player || null,
              distance: a.col - i,
            };
        }
      }
    } else {
      // vertical check
      if (a.row < b.row) {
        // check down
        for (let i = a.row + 1; i <= b.row; i++) {
          const { obstacle, player } =
            this.cubeMap[this.cubeArrays[a.surface][i][a.col]];
          if (obstacle) return { obstacle, distance: i - a.row };
          if (player)
            return {
              player: this.cubeMap[Number(player)]?.player || null,
              distance: i - a.row,
            };
        }
      } else {
        // check up
        for (let i = a.row - 1; i >= b.row; i--) {
          const { obstacle, player } =
            this.cubeMap[this.cubeArrays[a.surface][i][a.col]];
          if (obstacle) return { obstacle, distance: a.row - i };
          if (player)
            return {
              player: this.cubeMap[Number(player)]?.player || null,
              distance: a.row - i,
            };
        }
      }
    }

    return null;
  }

  _getCubeArrays(): number[][][] {
    const subsBy5: number[][] = [[]];
    let curSubArr = 0;

    let i = 1;
    while (i <= TILE_TOTAL) {
      if (curSubArr === 5) {
        subsBy5.push([i]);
        curSubArr = 1;
        i++;
      } else {
        subsBy5.slice(-1)[0].push(i);
        curSubArr++;
        i++;
      }
    }

    const result: number[][][] = [[], [], []];
    curSubArr = 0;
    let round = 0;
    i = 0;

    while (i < subsBy5.length) {
      if (curSubArr === 3) curSubArr = 0;

      if (result[curSubArr + round].length < 5) {
        result[curSubArr + round].push(subsBy5[i]);
      }

      if (
        result[curSubArr + round].length === 5 &&
        curSubArr === 2 &&
        i < subsBy5.length - 1
      ) {
        round += 3;
        result.push([], [], []);
      }

      curSubArr++;
      i++;
    }

    return result;
  }

  _getCubeMap(_cubeArrays: number[][][]): CubeTile[] {
    const result: CubeTile[] = new Array(TILE_TOTAL);

    for (let i = 0; i < _cubeArrays.length; i++) {
      const surface = _cubeArrays[i];
      for (let j = 0; j < surface.length; j++) {
        const row = surface[j];
        for (let k = 0; k < row.length; k++) {
          const tileNum = row[k];
          result[tileNum] = {
            surface: i,
            row: j,
            col: k,
            obstacle: null,
            player: null,
          };
        }
      }
    }

    return result;
  }

  getCollectionByPlayerId(playerId: string): string[] {
    return this.obstacles.reduce((accu: string[], cur) => {
      if (cur.collectedBy === playerId && !accu.includes(cur.value))
        accu.push(cur.value);
      return accu;
    }, []);
  }

  handlePlayerMoved(player: Player, newTile: number) {
    const oldTile = this.getPlayerTile(player);
    if (oldTile !== null) {
      this.cubeMap[oldTile].player = null;
    }
    this.cubeMap[newTile].player = player;
  }

  handleObstacleCollected(obstacleId: string, playerId: string) {
    this.obstacles
      .filter((ob) => ob.id === obstacleId)
      .forEach((ob) => (ob.collectedBy = playerId));
  }

  handleObstacleLost(tileNum: number, playerId: string) {
    const { obstacle } = this.cubeMap[tileNum];
    if (obstacle?.collectedBy !== playerId) {
      throw "OBSTACLE_LOST_FAIL";
    }
    this.obstacles
      .filter((ob) => ob.id === obstacle.id)
      .forEach((ob) => (ob.collectedBy = undefined));
  }

  handleCollectionTrading(tileNum: number, player1: Player, player2: Player) {
    const tile = this.cubeMap[tileNum];
    if (
      !tile ||
      !tile.obstacle ||
      (tile.obstacle.collectedBy !== player1.id &&
        tile.obstacle.collectedBy !== player2.id)
    )
      throw "TRADE_OBSTACLE_FAIL";

    const { obstacle } = tile;
    let tradedTo: Player;
    if (obstacle.collectedBy === player1.id) {
      tradedTo = player2;
      this.handleObstacleCollected(obstacle.id, player2.id);
    } else {
      tradedTo = player1;
      this.handleObstacleCollected(obstacle.id, player1.id);
    }
    return { tradedTo };
  }

  getPlayerTile(player: Player): number | null {
    for (let i = 0; i < this.cubeMap.length; i++) {
      if (this.cubeMap[i].player?.id === player.id) {
        return i;
      }
    }
    return null;
  }
}

class Player {
  static ATTRIBUTES_BY_STARTING_SURFACE = {
    1: { dir: "down", goal: 188 },
    3: { dir: "right", goal: 118 },
    5: { dir: "left", goal: 108 },
    7: { dir: "up", goal: 38 },
  };

  static DIRECTION_MAP = {
    down: {
      up: "down",
      left: "right",
      right: "left",
      down: "up",
    },
    left: {
      up: "left",
      left: "down",
      right: "up",
      down: "right",
    },
    right: {
      up: "right",
      left: "up",
      right: "down",
      down: "left",
    },
  };

  id: string;
  current: number | null = null;
  lastPassedByObstacles: Record<string, { tileNum: number }> = {};
  goal: number | null = null;
  absoluteDirection: "up" | "down" | "left" | "right" | null = null;
  start: number | null = null;
  startDir: "up" | "down" | "left" | "right" | null = null;
  win = false;

  constructor(id: string) {
    this.id = id;
  }

  move(
    next: number,
    board: Board
  ): {
    crashed?: Obstacle | Player;
    collected: boolean;
    win: boolean;
    prev: number | null;
    current: number;
    surrounding?: Record<string, any>;
    shoot?: { direction: string; player: Player };
  } {
    const nextTile = board.cubeMap[next];

    if (!nextTile || !IN_PLAY_SURFACES.includes(nextTile.surface))
      throw "MOVE_FAIL_UNKNOWN_TILE";

    const result = {
      crashed: undefined,
      collected: false,
      win: false,
      prev: this.current,
      current: next,
      surrounding: undefined,
      shoot: undefined,
    };

    // handle player's first move
    try {
      if (!this.current) {
        this.current = next;
        this.start = next;
        board.cubeMap[next].player = this;
        this.goal =
          Player.ATTRIBUTES_BY_STARTING_SURFACE[
            board.cubeMap[next].surface
          ].goal;
        this.absoluteDirection =
          Player.ATTRIBUTES_BY_STARTING_SURFACE[
            board.cubeMap[next].surface
          ].dir;
        this.startDir =
          Player.ATTRIBUTES_BY_STARTING_SURFACE[
            board.cubeMap[next].surface
          ].dir;
        result.collected = this._collectObstacles(board);
        result.surrounding = this.getSurrounding(board);
        board.activePlayerTotal++;
        return result;
      }
    } catch (error) {
      throw "FIRST_MOVE_FAILED";
    }

    this.absoluteDirection = this._getDirectionChange(next, board);

    // check colliding with obstacles or players
    const thingInPath = board.getThingsInPath(this.current, next);
    if (thingInPath) {
      if (thingInPath.obstacle) {
        result.crashed = thingInPath.obstacle;
      } else if (thingInPath.player?.id !== this.id) {
        result.crashed = thingInPath.player;
      }
    } else if (nextTile.obstacle) {
      result.crashed = nextTile.obstacle;
    } else if (nextTile.player?.id !== this.id) {
      result.crashed = nextTile.player;
    }

    this.current = next;
    if (result.crashed) return result;

    result.shoot = this._shoot(board);
    result.collected = this._collectObstacles(board);
    result.surrounding = this.getSurrounding(board);
    result.win = this._checkWin(next, board);

    return result;
  }

  _shoot(board: Board): { direction: string; player: Player } | undefined {
    const { up } = this.getSurrounding(board);
    if (up?.player) {
      return { direction: this.absoluteDirection!, player: up.player };
    }
  }

  _checkWin(next: number, board: Board): boolean {
    if (next !== this.goal) return false;

    const playerTotalMap: Record<number, number> = {
      2: 5,
      3: 4,
      4: 3,
    };
    const collectionGoal = playerTotalMap[board.activePlayerTotal] || 4;

    return board.getCollectionByPlayerId(this.id).length >= collectionGoal;
  }

  _collectObstacles(board: Board): boolean {
    let collected = false;
    const newLastPassedByObstacle: Record<string, { tileNum: number }> = {};
    (["down", "left", "up", "right"] as const).forEach((dir) => {
      const tileNum = board.getAdjecentTile(this.current!, dir);
      const tile = board.cubeMap[tileNum!];
      if (!tile || !tile.obstacle || tile.obstacle.collectedBy) return;
      if (board.getCollectionByPlayerId(this.id).includes(tile.obstacle.value))
        return;

      const passedByObstacleWithSameId =
        this.lastPassedByObstacles[tile.obstacle.id];

      if (
        passedByObstacleWithSameId &&
        passedByObstacleWithSameId.tileNum !== tileNum
      ) {
        collected = true;
        board.handleObstacleCollected(tile.obstacle.id, this.id);
      } else {
        newLastPassedByObstacle[tile.obstacle.id] = {
          tileNum: tileNum!,
        };
      }
    });
    this.lastPassedByObstacles = newLastPassedByObstacle;

    return collected;
  }

  _getCrossSurfaceMoveDirection(
    next: number,
    board: Board
  ): "up" | "down" | "left" | "right" {
    const curTile = board.cubeMap[this.current!];
    const nextTile = board.cubeMap[next];
    if (curTile.surface === 1 && nextTile.surface === 3) return "left";
    if (curTile.surface === 1 && nextTile.surface === 5) return "right";
    if (curTile.surface === 3 && nextTile.surface === 1) return "up";
    if (curTile.surface === 3 && nextTile.surface === 7) return "down";
    if (curTile.surface === 5 && nextTile.surface === 1) return "up";
    if (curTile.surface === 5 && nextTile.surface === 7) return "down";
    if (curTile.surface === 7 && nextTile.surface === 3) return "left";
    if (curTile.surface === 7 && nextTile.surface === 5) return "right";
    if (curTile.surface === 4 || nextTile.surface === 4)
      return this._getDirectionChange(next, board);
    throw "UNKNOWN_MOVE_DIRECTION";
  }

  _getDirectionChange(
    next: number,
    board: Board
  ): "up" | "down" | "left" | "right" {
    const { surface } = board.cubeMap[this.current!];

    if ((next - this.current!) % 15 === 0) {
      if (next > this.current!) return "down";
      else return "up";
    } else if (Math.abs(next - this.current!) <= 4) {
      if (next > this.current!) return "right";
      else return "left";
    } else {
      if (surface === 1) return "down";
      if (surface === 3) return "right";
      if (surface === 5) return "left";
      if (surface === 7) return "up";
    }
    return this.absoluteDirection!;
  }

  getSurrounding(board: Board): Record<string, any> {
    if (!this.current) return {};
    const sur = this._getAbsoluteSurrounding(this.current, board);
    if (this.absoluteDirection === "up") return sur;
    const dirMap = Player.DIRECTION_MAP[this.absoluteDirection!];
    const tempSur = { ...sur };
    for (let key in sur) {
      sur[key] = tempSur[dirMap[key]];
    }
    return sur;
  }

  _getAbsoluteSurrounding(tileNum: number, board: Board): Record<string, any> {
    const result = {
      up: null,
      down: null,
      left: null,
      right: null,
    };
    const current = board.cubeMap[tileNum];

    result.up = board.getThingsInPath(current, {
      ...current,
      row: 0,
      player: null,
    });
    result.down = board.getThingsInPath(current, {
      ...current,
      row: 4,
      player: null,
    });
    result.left = board.getThingsInPath(current, {
      ...current,
      col: 0,
      player: null,
    });
    result.right = board.getThingsInPath(current, {
      ...current,
      col: 4,
      player: null,
    });

    for (let direction in result) {
      if (
        result[direction] === null &&
        board.cubeMap[board.getAdjecentTile(tileNum, direction as any)!]
      ) {
        const { obstacle, player } =
          board.cubeMap[board.getAdjecentTile(tileNum, direction as any)!];
        if (obstacle) result[direction] = { obstacle, distance: 1 };
        if (player)
          result[direction] = {
            player: board.cubeMap[Number(player)]?.player || null,
            distance: 1,
          };
      }
    }

    return result;
  }
}

export { Board, Player, Obstacle };
