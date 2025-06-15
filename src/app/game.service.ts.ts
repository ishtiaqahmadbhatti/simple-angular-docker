import { Injectable, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameService implements AfterViewInit {
  // Game settings
  gridSize = 20;
  gridWidth = 600 / this.gridSize;
  gridHeight = 450 / this.gridSize;
  
  // Game state
  snake: {x: number, y: number}[] = [];
  food: {x: number, y: number, color: string} = {x: 0, y: 0, color: ''};
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  highScore = 0;
  speed = 5;
  gameRunning = false;
  gameOver = false;
  gameLoop: any;
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  initCanvas() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  initGame() {
    // Initialize snake
    this.snake = [
      {x: 5, y: 10},
      {x: 4, y: 10},
      {x: 3, y: 10}
    ];
    
    // Generate first food
    this.generateFood();
    
    // Reset game state
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.speed = 5;
    this.gameRunning = false;
    this.gameOver = false;
    
    // Draw initial state
    this.draw();
  }

  generateFood() {
    // Make sure food doesn't appear on snake
    let newFood;
    let onSnake;
    
    do {
      onSnake = false;
      newFood = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight),
        color: this.getRandomColor()
      };
      
      // Check if food is on snake
      for (let segment of this.snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          onSnake = true;
          break;
        }
      }
    } while (onSnake);
    
    this.food = newFood;
  }

  getRandomColor() {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

draw() {
  if (!this.ctx) {
    console.error('Canvas context is not available');
    return;
  }

  // Clear canvas
  this.ctx.fillStyle = '#0a0a0a';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  // Draw grid (existing code remains the same)
  // ...

  // Draw snake
  this.snake.forEach((segment, index) => {
    // Head has different color
    if (index === 0) {
      this.ctx.fillStyle = '#4CAF50';
    } else {
      // Gradient body
      const hue = (index * 5) % 360;
      this.ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
    }

    this.ctx.fillRect(
      segment.x * this.gridSize, 
      segment.y * this.gridSize, 
      this.gridSize, 
      this.gridSize
    );

    // Add details to head
    if (index === 0) {
      this.ctx.fillStyle = '#000';
      
      // Initialize eye positions with default values
      let eyeX1 = segment.x * this.gridSize + this.gridSize * 0.75;
      let eyeY1 = segment.y * this.gridSize + this.gridSize * 0.25;
      let eyeX2 = segment.x * this.gridSize + this.gridSize * 0.75;
      let eyeY2 = segment.y * this.gridSize + this.gridSize * 0.75;

      // Adjust eye positions based on direction
      switch(this.direction) {
        case 'up':
          eyeX1 = segment.x * this.gridSize + this.gridSize * 0.25;
          eyeY1 = segment.y * this.gridSize + this.gridSize * 0.25;
          eyeX2 = segment.x * this.gridSize + this.gridSize * 0.75;
          eyeY2 = segment.y * this.gridSize + this.gridSize * 0.25;
          break;
        case 'down':
          eyeX1 = segment.x * this.gridSize + this.gridSize * 0.25;
          eyeY1 = segment.y * this.gridSize + this.gridSize * 0.75;
          eyeX2 = segment.x * this.gridSize + this.gridSize * 0.75;
          eyeY2 = segment.y * this.gridSize + this.gridSize * 0.75;
          break;
        case 'left':
          eyeX1 = segment.x * this.gridSize + this.gridSize * 0.25;
          eyeY1 = segment.y * this.gridSize + this.gridSize * 0.25;
          eyeX2 = segment.x * this.gridSize + this.gridSize * 0.25;
          eyeY2 = segment.y * this.gridSize + this.gridSize * 0.75;
          break;
        case 'right':
          // Default values already set for right direction
          break;
      }

      const eyeSize = this.gridSize / 5;
      
      // Draw eyes
      this.ctx.beginPath();
      this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  });

  // Rest of the draw method (food drawing) remains the same
  // ...
}

  update() {
    // Update direction
    this.direction = this.nextDirection;
    
    // Calculate new head position
    const head = {...this.snake[0]};
    
    switch(this.direction) {
      case 'up':
        head.y--;
        break;
      case 'down':
        head.y++;
        break;
      case 'left':
        head.x--;
        break;
      case 'right':
        head.x++;
        break;
    }
    
    // Check for collisions with walls
    if (
      head.x < 0 || 
      head.x >= this.gridWidth || 
      head.y < 0 || 
      head.y >= this.gridHeight
    ) {
      this.endGame();
      return;
    }
    
    // Check for collisions with self
    for (let i = 0; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.endGame();
        return;
      }
    }
    
    // Add new head
    this.snake.unshift(head);
    
    // Check for food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      // Increase score
      this.score += 10;
      
      // Generate new food
      this.generateFood();
    } else {
      // Remove tail if no food was eaten
      this.snake.pop();
    }
  }

  gameStep() {
    if (this.gameRunning) {
      this.update();
      this.draw();
    }
  }

  startGame() {
    if (!this.gameRunning) {
      this.gameRunning = true;
      this.gameOver = false;
      clearInterval(this.gameLoop);
      this.gameLoop = setInterval(() => this.gameStep(), 1000 / this.speed);
    } else {
      // If game is already running, restart
      this.initGame();
      this.startGame();
    }
  }

  pauseGame() {
    this.gameRunning = !this.gameRunning;
    if (this.gameRunning) {
      this.gameLoop = setInterval(() => this.gameStep(), 1000 / this.speed);
    } else {
      clearInterval(this.gameLoop);
    }
  }

  changeSpeed(amount: number) {
    this.speed += amount;
    if (this.speed < 1) this.speed = 1;
    if (this.speed > 20) this.speed = 20;
    
    if (this.gameRunning) {
      clearInterval(this.gameLoop);
      this.gameLoop = setInterval(() => this.gameStep(), 1000 / this.speed);
    }
  }

  endGame() {
    this.gameRunning = false;
    this.gameOver = true;
    clearInterval(this.gameLoop);
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
  }

  restartGame() {
    this.initGame();
    this.startGame();
  }

  handleKeyDown(event: KeyboardEvent) {
    switch(event.key) {
      case 'ArrowUp':
        if (this.direction !== 'down') this.nextDirection = 'up';
        break;
      case 'ArrowDown':
        if (this.direction !== 'up') this.nextDirection = 'down';
        break;
      case 'ArrowLeft':
        if (this.direction !== 'right') this.nextDirection = 'left';
        break;
      case 'ArrowRight':
        if (this.direction !== 'left') this.nextDirection = 'right';
        break;
      case ' ':
        this.pauseGame();
        break;
    }
  }

  createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random properties
      const size = Math.random() * 6 + 2;
      const x = Math.random();
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.setProperty('--x', x.toString());
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  }

  clearGame() {
    clearInterval(this.gameLoop);
  }
}