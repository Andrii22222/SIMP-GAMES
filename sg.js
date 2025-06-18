//----------------------------------------------------------------------
// Москаленко Андрій 
// Група ІМ-42, КПІ, 2025
//----------------------------------------------------------------------

// const sts = require('../SIMP-TOOLS/simp-tools.js');
// import * as sts from '../SIMP-TOOLS/simp-tools.js';

// Створюємо власний генератор
// const myRandom = sts.createGenerator(Date.now());


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


// PYTHON GAME
//----------------------------------------------------------------------

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
    cell.x = Math.ceil(Math.random() * FIELD_WIDTH);
    cell.y = Math.ceil(Math.random() * FIELD_HEIGTH);
    // cell.x = Math.ceil(myRandom() * FIELD_WIDTH);
    // cell.y = Math.ceil(myRandom() * FIELD_HEIGTH);
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
  ctx.font = '24px Arial';
  ctx.fillText(`${text}`, CELL_SIZE * cellX, CELL_SIZE * cellY);
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

// Обгортка для замикання контексту
function gameMachine(newGame) {
  const game = newGame;
  // Оце gameMachine
  return function () {
    // 
    const rabbit = game.rabbit;
    const python = game.python;
    // Голова буде тут
    const newHead = getNewHeadCell(game);
    // Пересуваємо (дорощуємо) голову
    if (newHead.x < 1 || newHead.x > FIELD_WIDTH || newHead.y < 1 || newHead.y > FIELD_HEIGTH) {
      // Кінець гри, якщо голова врізається у стіну
      clearInterval(game.timerId);
      game.timerId = -1;
    } 
    else if (python.some(cell => cell.x === newHead.x && cell.y === newHead.y )) {
      // Кінець гри, якщо вкусив самого себе
      clearInterval(game.timerId);
      game.timerId = -1;
    } else {
      // Не врізається
      // А крілик там є?
      if (rabbit.x === newHead.x && rabbit.y === newHead.y) {
        // Зів крілика
        game.score++;
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
    drawLabel(game, `Score: ${game.score}`, 2, 2);
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
    // Новий напрям руху
    moveDirection: START_PYTHON_D,
    // Таймер для відмалювання графіки
    timerId: -1,
    // Запускає відмалювання графіки
    startDrawing: function () {
      drawField(this);
      drawRabbit(this);
      drawPython(this);
      // Запускаємо таймер
      this.timerId = setInterval(gameMachine(this), 200);
      return this.timerId;
    }
  };
  // Його і вертаємо
  return gameContext;
}

// Обробник подій клавіатури
function keydownHandler(gameContext) {
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

// Запуск ігрової механіки
const timerId = gameContext.startDrawing();

// Перехоплення вводу з клавіатури
const handler = keydownHandler(gameContext);
document.addEventListener('keydown', handler);

// THE END
//----------------------------------------------------------------------
