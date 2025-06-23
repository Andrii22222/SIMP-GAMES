//----------------------------------------------------------------------
// Москаленко Андрій 
// Група ІМ-42, КПІ, 2025
//----------------------------------------------------------------------

// const sts = require('../SIMP-TOOLS/simp-tools.js');
import * as sts from '../SIMP-TOOLS/simp-tools.js';

// Створюємо власний генератор
const myRandom = sts.createGenerator(Date.now());


// RESOURCES
//----------------------------------------------------------------------
// Розміри в ігрових ячейках
const BORDER_LINES = 1;
const HEADER_LINES = 2;
const FIELD_WIDTH = 35;
const FIELD_HEIGTH = 22;
const START_PYTHON_X = 17;
const START_PYTHON_Y = 11;
const START_PYTHON_D = 'right';
// Розміри в пікселях
const CELL_SIZE = 32;
const CANVAS_WIDTH = CELL_SIZE * (BORDER_LINES * 2 + FIELD_WIDTH);
const CANVAS_HEIGHT = CELL_SIZE * (BORDER_LINES * 2 + HEADER_LINES + FIELD_HEIGTH);
// Картинки
const fieldImage = new Image();
fieldImage.src = './img/field.png';
const rabbitImage = new Image();
rabbitImage.src = './img/rabbit.png';
// Ігрові параметри 
const START_MOVE_TIMEOUT = 200;
const MIN_MOVE_TIMEOUT = 50;
const STEP_MOVE_TIMEOUT = 2;
// Мережеві параметри
const PROXY_HOST = 'http://localhost:5000';


// PYTHON GAME
//----------------------------------------------------------------------

// Зберігає таблицю результатів на проксі-серврі
function saveLeaders(game) {
  fetch(PROXY_HOST + '/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game.leaders)
  }).then(() => {
    console.log('Збережено!');
  });
}

// Завантажує таблицю резултатів ні проксі-серврі
function loadLeaders(game) {
  game.leaders = [];
  fetch(PROXY_HOST + '/load')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        game.leaders = data;
      }      
      console.log('Завантажено!');
    });
}

// Розраховують графічні координати на канві по ігровим на полі
function getCanvasX(cellX) {
  return (BORDER_LINES + cellX - 1) * CELL_SIZE;
}
function getCanvasY(cellY) {
  return (BORDER_LINES + HEADER_LINES + cellY - 1) * CELL_SIZE;
}
// Генерує випадкові ігрові координати на полі
function getRandomCell(occupiedCells) {
  const cell = { x: 1, y: 1 };
  do {
    // cell.x = Math.ceil(Math.random() * FIELD_WIDTH);
    // cell.y = Math.ceil(Math.random() * FIELD_HEIGTH);
    cell.x = Math.ceil(myRandom() * FIELD_WIDTH);
    cell.y = Math.ceil(myRandom() * FIELD_HEIGTH);
  }
  while (occupiedCells.some(item => item.x === cell.x && item.y === cell.y))
  return cell;
}

// Відмальовує фон ігрового поля
function drawField(game) {
  const ctx = game.ctx;
  ctx.fillStyle = 'green';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(fieldImage, getCanvasX(1), getCanvasY(1));
}
// Відмальовує крілика
function drawRabbit(game) {
  const ctx = game.ctx;
  const rabbit = game.rabbit;
  ctx.drawImage(rabbitImage, getCanvasX(rabbit.x), getCanvasY(rabbit.y));
}
// Відмальовує всю гадюку
function drawPython(game) {
  const ctx = game.ctx;
  const python = game.python;
  for (let i = 0; i < python.length; i++) {
    ctx.fillStyle = i === 0 ? 'red' : 'green';
    ctx.fillRect(getCanvasX(python[i].x), getCanvasY(python[i].y), CELL_SIZE, CELL_SIZE);
  }
}
// Виводить текст у шапку
function drawLabel(game, text, cellX, cellY) {
  const ctx = game.ctx;
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`${text}`, CELL_SIZE * cellX, CELL_SIZE * cellY);
}

// Виводить таблицю результатів
function drawRecords(game, cellX, cellY) {
  const ctx = game.ctx;
  let currX = cellX;
  let currY = cellY;
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  for (let i = 0; i < 10 && i < game.leaders.length; i++) {
    const name = game.leaders[i].name;
    const score = game.leaders[i].score;
    ctx.fillText(`${name}: ${score}`, CELL_SIZE * currX, CELL_SIZE * currY);
    currX += 6;
    // Переводимо вивід на новий рядок
    if (currX - cellX > 6 * 4) {
      currX = cellX;
      currY += 1;
    }
  }
}

// Реєструє результат у таблиці
function addNewRecord(game) {
  const playerNameElement = document.getElementById('playerName');
  let playerName = playerNameElement.value.substring(0, 15);
    if (playerName === '') {
      playerName = 'Гравець';
  }
  // Добавляємо залежно від рахунку (масив сортований)
  for (let i = 0; i < game.leaders.length; i++) {
    if (game.score > game.leaders[i].score) {
      game.leaders.splice(i, 0, { name: playerName, score: game.score });
      saveLeaders(game);
      return;
    }
  }
  // Добавляємо в кінець якщо рахунок найменший і список короткий
  if (game.leaders.length < 15) {
    game.leaders.push({ name: playerName, score: game.score });
    saveLeaders(game);
  }
}

// Розраховує нові координати голови
function getNewHeadCell(game) {
  // Старе положення голови
  const newHead = {
    x: game.python[0].x, 
    y: game.python[0].y
  };   
  const move = game.moveDirection;
  // Нове положення голови
  if (move === 'left')  newHead.x -= 1;
  if (move === 'right') newHead.x += 1;
  if (move === 'up')    newHead.y -= 1;
  if (move === 'down')  newHead.y += 1;
  // 
  return newHead;
}

// Відпрацьовую та відмальвуює пересування пітона
function gameMachine(newGame) {
  const game = newGame;
  // 
  return function () {
    // Пауза?
    if (game.isPaused) {
      return;
    }
    // Чи ні
    const rabbit = game.rabbit;
    const python = game.python;
    // Голова буде тут
    const newHead = getNewHeadCell(game);
    // Пересуваємо (дорощуємо) голову
    if (newHead.x < 1 || newHead.x > FIELD_WIDTH || newHead.y < 1 || newHead.y > FIELD_HEIGTH) {
      // Кінець гри, якщо голова врізається у стіну
      clearInterval(game.timerId);
      game.timerId = -1;
      addNewRecord(game);
    } 
    else if (python.some(cell => cell.x === newHead.x && cell.y === newHead.y )) {
      // Кінець гри, якщо вкусив самого себе
      clearInterval(game.timerId);
      game.timerId = -1;
      addNewRecord(game);
    } else {
      // Не врізається
      // А крілик там є?
      if (rabbit.x === newHead.x && rabbit.y === newHead.y) {
        // Зів крілика
        game.score++;
        // Збільшуємо швидкість гри
        if (game.moveTimeout > MIN_MOVE_TIMEOUT) {
          game.moveTimeout -= STEP_MOVE_TIMEOUT;
          clearInterval(game.timerId);
          game.timerId = setInterval(gameMachine(game), game.moveTimeout);
        }
        // Робимо нового крілика
        game.rabbit = getRandomCell(python);
      } else {
        // А от не зів то хвіст обрізаємо і гадюка не виросте
        python.pop();
      }
      // Пересуваємо голову
      python.unshift(newHead);
    }
    // Тепер все малюємо по новому
    drawField(game);
    drawRabbit(game);
    drawPython(game);
    drawLabel(game, `Current Score: ${game.score}`, 1, 2);
    drawLabel(game, 'Top 10 Scores:', 1, 1);
    drawRecords(game, 7, 1);
  }
}


// GAME CONTEXT
//----------------------------------------------------------------------
// Об'єкт, який містить стан гри

function createGame(canvasContext) {
  // Весь ігровий контекст у одному об'єкті
  const gameContext = {
    // Канва для малювання
    ctx: canvasContext,
    // Рахунок
    score: 0,
    // Крілик
    rabbit: getRandomCell([{
      x: START_PYTHON_X,
      y: START_PYTHON_Y
    }]),
    // Гадюка
    python: [{
      x: START_PYTHON_X,
      y: START_PYTHON_Y
    }],
    // Напрям руху
    moveDirection: START_PYTHON_D,
    // Таймер для відмалювання графіки
    timerId: -1,
    // Швидкість руху (затримка між пересуванням ms)
    moveTimeout: START_MOVE_TIMEOUT,
    // Гра на паузі
    isPaused: false,
    // Таблиця лідерів
    leaders: [],
  };
  // Його і вертаємо
  return gameContext;
}


// GAME CONTROL
//----------------------------------------------------------------------
// Функціїї керування грою

// Обробляє події клавіатури
function keydownProcess(gameContext) {
  const game = gameContext;
  return function (event) {
    const ctx = game.ctx;
    // drawLabel(game, `keyCode: ${event.keyCode}`, 20, 1);
    // 
    if (event.keyCode === 37)
      game.moveDirection = 'left';
    else if (event.keyCode === 38)
      game.moveDirection = 'up';
    else if (event.keyCode === 39)
      game.moveDirection = 'right';
    else if (event.keyCode === 40)
      game.moveDirection = 'down'; 
    else if (event.keyCode === 32)
      game.isPaused = !game.isPaused;
  }
}

// Запускає відмалювання графіки
function startGame(gameContext) {
  const game = gameContext;
  return function (event) {
    // Початкове налаштування
    game.score = 0;
    game.rabbit = getRandomCell([{
      x: START_PYTHON_X,
      y: START_PYTHON_Y
    }]);
    game.python = [{
      x: START_PYTHON_X,
      y: START_PYTHON_Y
    }];
    game.moveDirection = START_PYTHON_D;
    game.isPaused = false;
    game.moveTimeout = START_MOVE_TIMEOUT;
    
    // Початкове відмалювання
    drawField(game);
    drawRabbit(game);
    drawPython(game);
    // Запускаємо таймер
    if (game.timerId === -1) {
      game.timerId = setInterval(gameMachine(game), game.moveTimeout);
    }
    // Знімаємо фокус із кнопки
    event.target.blur();
  }
}

// Ставить гру на паузу
function pauseGame(gameContext) {
  const game = gameContext;
  return function (event) {
    // Переключаємо паузу
    game.isPaused = !game.isPaused;
    // Знімаємо фокус із кнопки
    event.target.blur();
  }
}

// MAIN
//----------------------------------------------------------------------
// Запуск усієї машинерії

// Створення графічного контексту
const canvas = document.getElementById('sgGameCanvas');
const ctx = canvas.getContext('2d');

// Створення ігрового контексту
const gameContext = createGame(ctx);
loadLeaders(gameContext);

// Запуск нової гри кнопкою
const startGameHandler = startGame(gameContext);
const startButton = document.getElementById('startBtn');
startButton.addEventListener('click', startGameHandler);

// Пауза гри кнопкою
const pauseGameHandler = pauseGame(gameContext);
const pauseButton = document.getElementById('pauseBtn');
pauseButton.addEventListener('click', pauseGameHandler);

// Перехоплення вводу з клавіатури
const keydownHandler = keydownProcess(gameContext);
document.addEventListener('keydown', keydownHandler);

// THE END
//----------------------------------------------------------------------
