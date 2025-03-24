import {
  Board,
  Player,
  PLAYER_START_TILES,
  IN_PLAY_SURFACES,
} from "./core-game";

// Helper function to create a new game instance
function createGame() {
  const board = new Board();
  const players = PLAYER_START_TILES.map((startTile, index) => {
    const player = new Player(`player${index + 1}`);
    const result = player.move(startTile, board);
    const surface = board.tileObjects[startTile]?.surface;
    if (surface && surface in Player.ATTRIBUTES_BY_STARTING_SURFACE) {
      player.absoluteDirection =
        Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
      player.startDir = Player.ATTRIBUTES_BY_STARTING_SURFACE[surface].dir;
    }
    return player;
  });
  return { board, players };
}

// Test basic game setup
function testGameSetup() {
  console.log("\n=== Testing Game Setup ===");
  const { board, players } = createGame();

  // Verify board initialization
  console.log("Board initialized with obstacles:", board.obstacles.length);
  console.log("Active players:", board.activePlayerTotal);

  // Verify player starting positions and directions
  players.forEach((player, index) => {
    console.log(`Player ${index}:`, {
      id: player.id,
      start: player.start,
      current: player.current,
      direction: player.absoluteDirection,
      goal: player.goal,
    });
  });

  // Verify playable surfaces
  const playableTiles = Object.entries(board.tileObjects).filter(([_, tile]) =>
    IN_PLAY_SURFACES.includes(tile.surface)
  ).length;
  console.log("Playable tiles:", playableTiles);
}

// Test player movement
function testPlayerMovement() {
  console.log("\n=== Testing Player Movement ===");
  const { board, players } = createGame();
  const player = players[0];

  // Test first move (already done in createGame)
  console.log("Initial state:", {
    current: player.current,
    direction: player.absoluteDirection,
    surrounding: player.getSurrounding(board),
  });

  // Test subsequent moves
  console.log("\nTesting subsequent moves...");
  const moves = [
    { tile: 39, dir: "right" },
    { tile: 40, dir: "right" },
    { tile: 45, dir: "down" },
  ];

  moves.forEach((move, index) => {
    try {
      const result = player.move(move.tile, board);
      console.log(`Move ${index + 1} result:`, {
        current: result.current,
        direction: player.absoluteDirection,
        collected: result.collected,
        surrounding: result.surrounding,
        win: result.win,
      });
    } catch (error) {
      console.log(`Move ${index + 1} failed:`, error);
    }
  });
}

// Test obstacle collection
function testObstacleCollection() {
  console.log("\n=== Testing Obstacle Collection ===");
  const { board, players } = createGame();
  const player = players[0];

  // Find an obstacle to collect
  const obstacleTile = Object.entries(board.tileObjects).find(
    ([_, tile]) => tile.obstacle && !tile.obstacle.collectedBy
  )?.[0];

  if (obstacleTile) {
    console.log("Found obstacle at tile:", obstacleTile);
    const obstacle = board.tileObjects[Number(obstacleTile)].obstacle;
    console.log("Obstacle details:", {
      value: obstacle?.value,
      color: obstacle?.color,
      id: obstacle?.id,
    });

    // Move to collect the obstacle
    try {
      const result = player.move(Number(obstacleTile), board);
      console.log("Collection attempt result:", {
        collected: result.collected,
        current: result.current,
        surrounding: result.surrounding,
      });

      // Verify collection
      const collections = board.getCollectionByPlayerId(player.id);
      console.log("Player collections:", collections);
    } catch (error) {
      console.log("Collection attempt failed:", error);
    }
  }
}

// Test player collision and trading
function testPlayerCollision() {
  console.log("\n=== Testing Player Collision and Trading ===");
  const { board, players } = createGame();
  const player1 = players[0];
  const player2 = players[1];

  // Initialize players
  console.log("Initial positions:", {
    player1: player1.current,
    player2: player2.current,
  });

  // Try to move player2 to player1's position
  try {
    const result = player2.move(player1.current!, board);
    console.log("Collision result:", {
      crashed: result.crashed,
      current: result.current,
      surrounding: result.surrounding,
    });
  } catch (error) {
    console.log("Collision attempt failed:", error);
  }
}

// Test win condition
function testWinCondition() {
  console.log("\n=== Testing Win Condition ===");
  const { board, players } = createGame();
  const player = players[0];

  console.log("Initial state:", {
    current: player.current,
    goal: player.goal,
    collections: board.getCollectionByPlayerId(player.id),
  });

  // Move to goal position
  try {
    const result = player.move(player.goal!, board);
    console.log("Win check result:", {
      win: result.win,
      current: result.current,
      collections: board.getCollectionByPlayerId(player.id),
    });
  } catch (error) {
    console.log("Win condition test failed:", error);
  }
}

// Run all tests
function runTests() {
  console.log("Starting Core Game Tests...");
  testGameSetup();
  testPlayerMovement();
  testObstacleCollection();
  testPlayerCollision();
  testWinCondition();
  console.log("\nTests completed!");
}

// Run the tests
runTests();
