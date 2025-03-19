import { Board, Player } from "./core-game";

// Helper function to create a new game instance
function createGame() {
  const board = new Board();
  const players = [
    new Player("0"),
    new Player("1"),
    new Player("2"),
    new Player("3"),
  ];
  return { board, players };
}

// Test basic game setup
function testGameSetup() {
  console.log("\n=== Testing Game Setup ===");
  const { board, players } = createGame();

  // Verify board initialization
  console.log("Board initialized with obstacles:", board.obstacles.length);
  console.log("Active players:", board.activePlayerTotal);

  // Verify player starting positions
  players.forEach((player, index) => {
    console.log(`Player ${index} starting position:`, player.current);
  });
}

// Test player movement
function testPlayerMovement() {
  console.log("\n=== Testing Player Movement ===");
  const { board, players } = createGame();
  const player = players[0];

  // Test first move
  console.log("Testing first move...");
  const firstMove = player.move(38, board); // Starting position for player 0
  console.log("First move result:", {
    current: firstMove.current,
    collected: firstMove.collected,
    surrounding: firstMove.surrounding,
  });

  // Test subsequent moves
  console.log("\nTesting subsequent moves...");
  const moves = [39, 40, 41]; // Example moves
  moves.forEach((tile, index) => {
    const result = player.move(tile, board);
    console.log(`Move ${index + 1} result:`, {
      current: result.current,
      collected: result.collected,
      surrounding: result.surrounding,
    });
  });
}

// Test obstacle collection
function testObstacleCollection() {
  console.log("\n=== Testing Obstacle Collection ===");
  const { board, players } = createGame();
  const player = players[0];

  // Initialize player
  player.move(38, board);

  // Find an obstacle to collect
  const obstacleTile = Object.entries(board.cubeMap).find(
    ([_, tile]) => tile.obstacle && !tile.obstacle.collectedBy
  )?.[0];

  if (obstacleTile) {
    console.log("Found obstacle at tile:", obstacleTile);

    // Move to collect the obstacle
    const result = player.move(Number(obstacleTile), board);
    console.log("Collection attempt result:", {
      collected: result.collected,
      current: result.current,
    });

    // Verify collection
    const collections = board.getCollectionByPlayerId(player.id);
    console.log("Player collections:", collections);
  }
}

// Test player collision
function testPlayerCollision() {
  console.log("\n=== Testing Player Collision ===");
  const { board, players } = createGame();
  const player1 = players[0];
  const player2 = players[1];

  // Initialize players
  player1.move(38, board);
  player2.move(118, board);

  // Try to move player2 to player1's position
  const result = player2.move(39, board);
  console.log("Collision result:", {
    crashed: result.crashed,
    current: result.current,
  });
}

// Test win condition
function testWinCondition() {
  console.log("\n=== Testing Win Condition ===");
  const { board, players } = createGame();
  const player = players[0];

  // Initialize player
  player.move(38, board);

  // Move to goal position
  const goal = 188; // Goal for player 0
  const result = player.move(goal, board);
  console.log("Win check result:", {
    win: result.win,
    current: result.current,
    collections: board.getCollectionByPlayerId(player.id),
  });
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
