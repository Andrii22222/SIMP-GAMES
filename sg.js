
// Raw game code

function getDirection (event) {
  // ctx.fillText(`Score: ${event.keyCode}`, CELL, CELL);
  if (event.keyCode === 37)
    moveDirection = 'left';
  else if (event.keyCode === 38)
    moveDirection = 'up';
  else if (event.keyCode === 39)
    moveDirection = 'right';
  else if (event.keyCode === 40)
    moveDirection = 'down';
}

function eatSelf(head, body) {
  for (let i = 0; i < body.length; i++) {
    if (head.x === body.x && head.y === body.y)
      clearInterval(game);  
  }
}

// 
function drawGame() {
  // 
  ctx.drawImage(fieldImage, 0, 0);
  ctx.drawImage(rabbit.image, rabbit.x, rabbit.y);
  for (let i = 0; i < python.length; i++) {
    ctx.drawImage(rabbit.image, rabbit.x, rabbit.y);
    ctx.fillStyle = i === 0 ? 'red' : 'green';
    ctx.fillRect(python[i].x, python[i].y, CELL, CELL);
  }
  // 
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${gameScore}`, CELL, CELL);

  // 
  let headX = python[0].x;
  let headY = python[0].y;
  if (rabbit.x === headX && rabbit.y === headY) {
    gameScore++;
    rabbit.x = Math.floor(Math.random() * 35 + 1) * CELL;
    rabbit.y = Math.floor(Math.random() * 22 + 1) * CELL;
  } else {
    python.pop();
  }

  //  
  if (headX < CELL || headX > CELL * 35 || headY < CELL || headY > CELL * 23) {
    clearInterval(game);
  }
  if (moveDirection === 'left')  headX -= CELL;
  if (moveDirection === 'right') headX += CELL;
  if (moveDirection === 'up')    headY -= CELL;
  if (moveDirection === 'down')  headY += CELL;
  const newHead = {
    x: headX, 
    y: headY
  };
  eatSelf(newHead, python);
  python.unshift({
    x: headX,
    y: headY 
  });
}


// 
const CELL = 32;

// Ігрова канва
const canvas = document.getElementById('ctxGameField');
const ctx = canvas.getContext('2d');
// 
const fieldImage= new Image();
fieldImage.src = './img/field.png';
const rabbitImage = new Image();
rabbitImage.src = './img/rabbit.png';

// Ігрові змінні
let gameScore = 0;
let moveDirection = 'right';
let rabbit = {
  image: rabbitImage,
  x: Math.floor(Math.random() * 35 + 1) * CELL,
  y: Math.floor(Math.random() * 22 + 1) * CELL
};
let python = [];
python[0] = {
  x: 10 * CELL,
  y: 10 * CELL
};

// 
const game = setInterval(drawGame, 100);
document.addEventListener('keydown', getDirection);




