// Snake Game Implementation
// Clean code, modular, and best practices

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const gamesPlayedEl = document.getElementById('gamesPlayed');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const restartBtn = document.getElementById('restartBtn');
const difficultySelect = document.getElementById('difficulty');

// Difficulty settings
const DIFFICULTY_SPEEDS = {
  easy: 150,
  medium: 100,
  hard: 60,
};
let gameSpeed = DIFFICULTY_SPEEDS[difficultySelect.value];

// Game settings
const gridSize = 20; // Size of each cell
const tileCount = canvas.width / gridSize;
const GAME_SPEED = 100;
const POWERUP_DURATION = 3000; // ms
const POWERUP_CHANCE = 0.15; // 15% chance after eating food
const POWERUP_BONUS = 5;

// State
let snake, direction, nextDirection, food, powerup, powerupTimeout;
let gameOver = false;
let score = 0;
let highScore = 0;
let gamesPlayed = 0;
let gameInterval = null;
let running = false;
let paused = false;
let countdownTimeout = null;
let countdownValue = 3;

// --- Storage helpers ---
function loadStats() {
  highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
  gamesPlayed = Number(localStorage.getItem('snakeGamesPlayed')) || 0;
}
function saveStats() {
  localStorage.setItem('snakeHighScore', highScore);
  localStorage.setItem('snakeGamesPlayed', gamesPlayed);
}

function updateScoreboard() {
  scoreEl.textContent = `Score: ${score}`;
  highScoreEl.textContent = `High Score: ${highScore}`;
  gamesPlayedEl.textContent = `Games Played: ${gamesPlayed}`;
}

function updateButtonVisibility() {
  if (!running && !gameOver) {
    startBtn.style.display = '';
    restartBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    difficultySelect.parentElement.style.display = '';
  } else if (gameOver) {
    startBtn.style.display = 'none';
    restartBtn.style.display = '';
    stopBtn.style.display = 'none';
    difficultySelect.parentElement.style.display = '';
  } else {
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    stopBtn.style.display = '';
    difficultySelect.parentElement.style.display = 'none';
    stopBtn.textContent = paused ? 'Resume' : 'Pause';
  }
}

// --- Game logic ---
function resetState() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  food = getRandomFoodPosition();
  powerup = null;
  clearTimeout(powerupTimeout);
  gameOver = false;
  score = 0;
  updateScoreboard();
  updateButtonVisibility();
}

function gameLoop() {
  if (paused) return;
  if (gameOver) {
    drawGameOver();
    stopGame();
    updateButtonVisibility();
    return;
  }
  update();
  draw();
}

function update() {
  direction = nextDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };
  // Wall collision
  if (
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount
  ) {
    gameOver = true;
    return;
  }
  // Self collision
  if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
    gameOver = true;
    return;
  }
  snake.unshift(newHead);
  // Food eaten
  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    food = getRandomFoodPosition();
    // Maybe spawn powerup
    maybeSpawnPowerup();
  } else if (powerup && newHead.x === powerup.x && newHead.y === powerup.y) {
    score += POWERUP_BONUS;
    removePowerup();
  } else {
    snake.pop();
  }
  updateScoreboard();
}

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw snake
  ctx.fillStyle = '#7CFC00';
  snake.forEach(segment => {
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
  });
  // Draw food
  ctx.fillStyle = '#f00';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
  // Draw powerup
  if (powerup) {
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(
      powerup.x * gridSize + gridSize / 2,
      powerup.y * gridSize + gridSize / 2,
      gridSize / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
}

function drawGameOver() {
  draw();
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  ctx.font = '24px Arial';
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
  ctx.textAlign = 'start';
}

function getRandomFoodPosition() {
  let position;
  while (true) {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
    if (
      !snake.some(segment => segment.x === position.x && segment.y === position.y) &&
      (!powerup || (position.x !== powerup.x || position.y !== powerup.y))
    ) {
      return position;
    }
  }
}

// --- Powerup logic ---
function maybeSpawnPowerup() {
  if (!powerup && Math.random() < POWERUP_CHANCE) {
    powerup = getRandomFoodPosition();
    powerupTimeout = setTimeout(removePowerup, POWERUP_DURATION);
  }
}
function removePowerup() {
  powerup = null;
  clearTimeout(powerupTimeout);
}

// --- Controls ---
window.addEventListener('keydown', e => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowUp':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
    case 'r':
    case 'R':
      if (gameOver) restartGame();
      break;
  }
});

startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', () => {
  if (!paused) {
    pauseGame();
  } else {
    resumeGameWithCountdown();
  }
});
restartBtn.addEventListener('click', restartGame);

function startGame() {
  if (running) return;
  if (gameOver) return; // Don't start if game is over
  running = true;
  paused = false;
  updateButtonVisibility();
  gameInterval = setInterval(gameLoop, gameSpeed);
}
function stopGame() {
  running = false;
  clearInterval(gameInterval);
  updateButtonVisibility();
}
function restartGame() {
  stopGame();
  resetState();
  gamesPlayed++;
  saveStats();
  updateScoreboard();
  running = true;
  gameOver = false;
  paused = false;
  updateButtonVisibility();
  gameInterval = setInterval(gameLoop, gameSpeed);
}

difficultySelect.addEventListener('change', () => {
  gameSpeed = DIFFICULTY_SPEEDS[difficultySelect.value];
  if (running) {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
  }
});

// --- Game over and stats ---
function handleGameOver() {
  if (score > highScore) {
    highScore = score;
    saveStats();
  }
  updateScoreboard();
}

// --- Initialization ---
function init() {
  loadStats();
  resetState();
  updateScoreboard();
  stopGame();
  updateButtonVisibility();
  // Show only start at first
  startBtn.style.display = '';
  restartBtn.style.display = 'none';
}

// When game ends, update stats
canvas.addEventListener('gameover', handleGameOver);

// Patch gameLoop to fire event on game over
const originalGameLoop = gameLoop;
gameLoop = function() {
  if (gameOver) {
    drawGameOver();
    stopGame();
    handleGameOver();
    updateButtonVisibility();
    return;
  }
  update();
  draw();
};

function pauseGame() {
  paused = true;
  clearInterval(gameInterval);
  updateButtonVisibility();
}

function resumeGameWithCountdown() {
  let count = 3;
  paused = false;
  updateButtonVisibility();
  function showCountdown() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(count, canvas.width / 2, canvas.height / 2);
  }
  function countdownStep() {
    draw();
    showCountdown();
    if (count > 1) {
      setTimeout(() => {
        count--;
        countdownStep();
      }, 1000);
    } else {
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gameInterval = setInterval(gameLoop, gameSpeed);
        updateButtonVisibility();
      }, 1000);
    }
  }
  countdownStep();
}

init();