// game.js

// Wait until the DOM is fully loaded before running the game
document.addEventListener("DOMContentLoaded", () => {
  // Get canvas and context.
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Utility function to check for axis-aligned bounding box (AABB) collisions.
  function rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  // Wall class (Obstacle).
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

  // PowerUp class. Currently only a "health" type.
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
    // Provide a collision rectangle.
    get rect() {
      return { x: this.x, y: this.y, width: this.size, height: this.size };
    }
  }

  // Player class.
  class Player {
    constructor(x, y, color, controls, bulletDirection) {
      this.x = x;
      this.y = y;
      this.width = 50;
      this.height = 50;
      this.color = color;
      this.controls = controls; // Object mapping control keys (code strings)
      this.bulletDirection = bulletDirection; // -1 for shooting upward; 1 for downward
      this.speed = 5;
      this.lastShot = 0;
      this.shootDelay = 300; // milliseconds between shots
      this.health = 100;
    }
  
    // Provide a rectangle for collision detection.
    get rect() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
  
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  
    // Movement with wall collision detection.
    move(keysPressed, walls) {
      // Save starting positions.
      let newX = this.x;
      let newY = this.y;
  
      // Horizontal movement.
      if (keysPressed[this.controls.left] && newX > 0) {
        newX -= this.speed;
      }
      if (keysPressed[this.controls.right] && newX + this.width < WIDTH) {
        newX += this.speed;
      }
      // Check for horizontal collisions with walls.
      let newRectX = { x: newX, y: this.y, width: this.width, height: this.height };
      for (const wall of walls) {
        if (rectIntersect(newRectX, wall)) {
          newX = this.x;
          break;
        }
      }
  
      // Vertical movement.
      if (keysPressed[this.controls.up] && newY > 0) {
        newY -= this.speed;
      }
      if (keysPressed[this.controls.down] && newY + this.height < HEIGHT) {
        newY += this.speed;
      }
      // Check for vertical collisions with walls.
      let newRectY = { x: newX, y: newY, width: this.width, height: this.height };
      for (const wall of walls) {
        if (rectIntersect(newRectY, wall)) {
          newY = this.y;
          break;
        }
      }
  
      // Apply new positions.
      this.x = newX;
      this.y = newY;
    }
  
    // Shooting function; adds a new bullet if the shoot key is pressed and delay has passed.
    shoot(keysPressed, bullets) {
      if (keysPressed[this.controls.shoot]) {
        const now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
          const bulletX = this.x + this.width / 2;
          const bulletY = (this.bulletDirection === -1) ? this.y : this.y + this.height;
          bullets.push(new Bullet(bulletX, bulletY, this.bulletDirection));
          this.lastShot = now;
        }
      }
    }
  }
  
  // Bullet class.
  class Bullet {
    constructor(x, y, direction) {
      this.x = x;
      this.y = y;
      this.radius = 5;
      this.direction = direction;
      this.speed = 7;
    }
  
    update() {
      this.y += this.direction * this.speed;
    }
  
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff0";
      ctx.fill();
      ctx.closePath();
    }
  }
  
  // Define control mappings.
  // Player 1: uses W, A, S, D and Space to shoot.
  const controls1 = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    shoot: "Space"
  };
  
  // Player 2: uses Arrow keys and Enter to shoot.
  const controls2 = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    shoot: "Enter"
  };
  
  // Create the players.
  // Player 1 is near the bottom and shoots upward (-1).
  const player1 = new Player(WIDTH / 2 - 25, HEIGHT - 70, "#0f0", controls1, -1);
  // Player 2 is near the top and shoots downward (1).
  const player2 = new Player(WIDTH / 2 - 25, 20, "#f00", controls2, 1);
  
  // Create a wall (obstacle).
  const walls = [];
  // Example wall: horizontal wall placed roughly in the middle.
  walls.push(new Wall(150, HEIGHT / 2 - 10, 500, 20));
  
  // Array for power-ups.
  const powerUps = [];
  // Set the initial spawn time for a power-up.
  let nextPowerUpTime = Date.now() + 5000; // spawn after 5 seconds
  
  // Object to track which keys are pressed.
  const keysPressed = {};
  
  // Debug logs for key events to verify key presses.
  document.addEventListener("keydown", (e) => {
    console.log("Key down:", e.code);
    keysPressed[e.code] = true;
  });
  
  document.addEventListener("keyup", (e) => {
    console.log("Key up:", e.code);
    keysPressed[e.code] = false;
  });
  
  // Array to hold active bullets.
  let bullets = [];
  
  // Variable to control the game loop status.
  let gameRunning = true;
  
  // Function to draw health indicators.
  function drawHealth() {
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Player 1 Health: " + player1.health, 10, HEIGHT - 10);
    ctx.fillText("Player 2 Health: " + player2.health, 10, 30);
  }
  
  // Main game loop.
  function gameLoop() {
    if (!gameRunning) return;
      
    // Clear the canvas.
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Spawn power-ups at intervals.
    if (Date.now() >= nextPowerUpTime) {
      const puX = Math.random() * (WIDTH - 30) + 10;
      const puY = Math.random() * (HEIGHT - 30) + 10;
      powerUps.push(new PowerUp(puX, puY, "health"));
      // Next power-up spawns between 5 and 8 seconds.
      nextPowerUpTime = Date.now() + (5000 + Math.random() * 3000);
    }
  
    // Update players.
    player1.move(keysPressed, walls);
    player2.move(keysPressed, walls);
    player1.draw();
    player2.draw();
  
    // Draw walls.
    for (const wall of walls) {
      wall.draw();
    }
  
    // Handle shooting.
    player1.shoot(keysPressed, bullets);
    player2.shoot(keysPressed, bullets);
  
    // Update and draw bullets.
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      bullets[i].draw();
  
      // Remove bullets that go off-screen.
      if (bullets[i].y < 0 || bullets[i].y > HEIGHT) {
        bullets.splice(i, 1);
        continue;
      }
  
      // Bullet collision detection:
      // If a bullet shot upward (player1's bullet) hits player2.
      if (bullets[i].direction === -1) {
        if (
          bullets[i].x > player2.x &&
          bullets[i].x < player2.x + player2.width &&
          bullets[i].y > player2.y &&
          bullets[i].y < player2.y + player2.height
        ) {
          player2.health -= 10;
          console.log("Player 1 hit Player 2!");
          bullets.splice(i, 1);
          continue;
        }
      }
      // If a bullet shot downward (player2's bullet) hits player1.
      if (bullets[i].direction === 1) {
        if (
          bullets[i].x > player1.x &&
          bullets[i].x < player1.x + player1.width &&
          bullets[i].y > player1.y &&
          bullets[i].y < player1.y + player1.height
        ) {
          player1.health -= 10;
          console.log("Player 2 hit Player 1!");
          bullets.splice(i, 1);
          continue;
        }
      }
    }
  
    // Check for power-up collection.
    for (let i = powerUps.length - 1; i >= 0; i--) {
      powerUps[i].draw();
      // Collection for player1.
      if (rectIntersect(player1.rect, powerUps[i].rect)) {
        if (powerUps[i].type === "health") {
          player1.health = Math.min(100, player1.health + 20);
        }
        powerUps.splice(i, 1);
        continue;
      }
      // Collection for player2.
      if (rectIntersect(player2.rect, powerUps[i].rect)) {
        if (powerUps[i].type === "health") {
          player2.health = Math.min(100, player2.health + 20);
        }
        powerUps.splice(i, 1);
        continue;
      }
    }
  
    // Draw health info on the canvas.
    drawHealth();
  
    // Check for game over.
    if (player1.health <= 0 || player2.health <= 0) {
      gameRunning = false;
      ctx.fillStyle = "#fff";
      ctx.font = "40px Arial";
      const winner = player1.health <= 0 ? "Player 2 Wins!" : "Player 1 Wins!";
      ctx.fillText(winner, WIDTH / 2 - ctx.measureText(winner).width / 2, HEIGHT / 2);
      return;
    }
  
    // Loop the game.
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
});
