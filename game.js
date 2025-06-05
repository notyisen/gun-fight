// game.js
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const restartScreen = document.getElementById("restartScreen");
  const restartButton = document.getElementById("restartButton");
  const gameOverText = document.getElementById("gameOverText");

  let player1, player2, walls, powerUps, bullets, gameRunning, keysPressed, nextPowerUpTime;

  keysPressed = {};
  document.addEventListener("keydown", (e) => keysPressed[e.code] = true);
  document.addEventListener("keyup", (e) => keysPressed[e.code] = false);
  restartButton.addEventListener("click", resetGame);
  document.addEventListener("keydown", () => {
    if (!gameRunning) resetGame();
  });

  function rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  class Wall {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = "#888";
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class PowerUp {
    constructor(x, y, type = "health") {
      this.x = x;
      this.y = y;
      this.size = 20;
      this.type = type;
      this.color = type === "health" ? "#00f" : "#ff0";
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    get rect() {
      return { x: this.x, y: this.y, width: this.size, height: this.size };
    }
  }

  class Player {
    constructor(x, y, color, controls, id) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.width = 50;
      this.height = 50;
      this.color = color;
      this.controls = controls;
      this.speed = 5;
      this.lastShot = 0;
      this.shootDelay = 300;
      this.health = 100;
      this.id = id;
    }

    get rect() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(keysPressed, walls) {
      let newX = this.x;
      let newY = this.y;
      this.vx = 0;

      if (keysPressed[this.controls.left] && newX > 0) {
        newX -= this.speed;
        this.vx = -1;
      }
      if (keysPressed[this.controls.right] && newX + this.width < WIDTH) {
        newX += this.speed;
        this.vx = 1;
      }

      let newRectX = { x: newX, y: this.y, width: this.width, height: this.height };
      for (const wall of walls) {
        if (rectIntersect(newRectX, wall)) {
          newX = this.x;
          break;
        }
      }

      if (keysPressed[this.controls.up] && newY > 0) {
        newY -= this.speed;
      }
      if (keysPressed[this.controls.down] && newY + this.height < HEIGHT) {
        newY += this.speed;
      }

      let newRectY = { x: newX, y: newY, width: this.width, height: this.height };
      for (const wall of walls) {
        if (rectIntersect(newRectY, wall)) {
          newY = this.y;
          break;
        }
      }

      this.x = newX;
      this.y = newY;
    }

    shoot(keysPressed, bullets) {
      if (keysPressed[this.controls.shoot]) {
        const now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
        let dx = this.vx * 0.5;
        let dy, bulletX, bulletY;
        
        if (this.id === "player1") {
          dy = -1; // shoot up
          bulletX = this.x + this.width / 2;
          bulletY = this.y;
        } else {
          dy = 1; // shoot down
          bulletX = this.x + this.width / 2;
          bulletY = this.y + this.height;
        }

          bullets.push(new Bullet(bulletX, bulletY, dx, dy, this.id));
          this.lastShot = now;
        }
      }
    }
  }

  class Bullet {
    constructor(x, y, dx, dy, ownerId) {
      this.x = x;
      this.y = y;
      this.dx = dx;
      this.dy = dy;
      this.radius = 5;
      this.speed = 7;
      this.ownerId = ownerId;
    }

    update() {
      this.x += this.dx * this.speed;
      this.y += this.dy * this.speed;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff0";
      ctx.fill();
      ctx.closePath();
    }
  }

  const controls1 = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    shoot: "Space"
  };

  const controls2 = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    shoot: "Enter"
  };

  function drawHealth() {
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Player 1 Health: " + player1.health, 10, HEIGHT - 10);
    ctx.fillText("Player 2 Health: " + player2.health, 10, 30);
  }

  function resetGame() {
    restartScreen.style.display = "none";
    player1 = new Player(WIDTH / 2 - 25, HEIGHT - 70, "#0f0", controls1, "player1");
    player2 = new Player(WIDTH / 2 - 25, 20, "#f00", controls2, "player2");
    walls = [new Wall(0, HEIGHT / 2 - 10, WIDTH, 20)];
    bullets = [];
    powerUps = [];
    gameRunning = true;
    nextPowerUpTime = Date.now() + 5000;
    gameLoop();
  }

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (Date.now() >= nextPowerUpTime) {
      const puX = Math.random() * (WIDTH - 30) + 10;
      const puY = Math.random() * (HEIGHT - 30) + 10;
      powerUps.push(new PowerUp(puX, puY, "health"));
      nextPowerUpTime = Date.now() + (5000 + Math.random() * 3000);
    }

    player1.move(keysPressed, walls);
    player2.move(keysPressed, walls);
    player1.draw();
    player2.draw();

    for (const wall of walls) wall.draw();

    player1.shoot(keysPressed, bullets);
    player2.shoot(keysPressed, bullets);

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      bullets[i].draw();

      if (
        bullets[i].x < 0 || bullets[i].x > WIDTH ||
        bullets[i].y < 0 || bullets[i].y > HEIGHT
      ) {
        bullets.splice(i, 1);
        continue;
      }

      const target = bullets[i].ownerId === "player1" ? player2 : player1;
      if (
        bullets[i].x > target.x &&
        bullets[i].x < target.x + target.width &&
        bullets[i].y > target.y &&
        bullets[i].y < target.y + target.height
      ) {
        target.health -= 10;
        bullets.splice(i, 1);
        continue;
      }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
      powerUps[i].draw();
      if (rectIntersect(player1.rect, powerUps[i].rect)) {
        player1.health = Math.min(100, player1.health + 20);
        powerUps.splice(i, 1);
        continue;
      }
      if (rectIntersect(player2.rect, powerUps[i].rect)) {
        player2.health = Math.min(100, player2.health + 20);
        powerUps.splice(i, 1);
        continue;
      }
    }

    drawHealth();

    if (player1.health <= 0 || player2.health <= 0) {
      gameRunning = false;
      gameOverText.textContent = player1.health <= 0 ? "Player 2 Wins!" : "Player 1 Wins!";
      restartScreen.style.display = "flex";
      return;
    }

    requestAnimationFrame(gameLoop);
  }

  resetGame();
});
