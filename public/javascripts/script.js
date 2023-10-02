const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const socket = io("http://localhost:3000");
let isReferee = false;
let paddleIndex = 0;

let width = 500;
let height = 700;

let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

let speedY = 2;
let speedX = 0;

let score = [0, 0];

function createCanvas() {
  canvas.id = "canvas";
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

function renderIntro() {
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "white";
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, canvas.height / 2 - 30);
}

function renderCanvas() {
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "white";

  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = "grey";
  context.stroke();

  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = "white";
  context.fill();

  context.font = "32px Courier New";
  context.fillText(score[0], 20, canvas.height / 2 + 50);
  context.fillText(score[1], 20, canvas.height / 2 - 30);
}

function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

function ballMove() {
  ballY += speedY * ballDirection;
  if (playerMoved) {
    ballX += speedX;
  }
  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

function ballBoundaries() {
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      if (playerMoved) {
        speedY += 1;
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      ballReset();
      score[1]++;
    }
  }
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      if (playerMoved) {
        speedY += 1;
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      ballReset();
      score[0]++;
    }
  }
}

function animate() {
  if (isReferee) {
    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  window.requestAnimationFrame(animate);
}

function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit("ready");
}

function startGame() {
  paddleIndex = isReferee ? 0 : 1;
  window.requestAnimationFrame(animate);
  canvas.addEventListener("mousemove", (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    socket.emit("paddleMove", {
      xPosition: paddleX[paddleIndex],
    });
    canvas.style.cursor = "none";
  });
}

loadGame();

socket.on("connect", () => {
  console.log("Connected as...", socket.id);
});

socket.on("startGame", (refereeId) => {
  console.log("Referee is", refereeId);

  isReferee = socket.id === refereeId;
  startGame();
});

socket.on("paddleMove", (paddleData) => {
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

socket.on("ballMove", (ballData) => {
  ({ ballX, ballY, score } = ballData);
});
