import { Component, ElementRef, ViewChild, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;

  // Game settings
  private readonly gridSize = 20;
  private gridWidth = 0;
  private gridHeight = 0;

  // Game state
  snake: { x: number, y: number }[] = [];
  food: { x: number, y: number, color: string } = { x: 0, y: 0, color: '' };
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  highScore = 0;
  speed = 5;
  gameRunning = false;
  paused = false;
  gameOverVisible = false;
  private gameLoop: any;
  private ctx!: CanvasRenderingContext2D;
  private touchStartX = 0;
  private touchStartY = 0;
  isMobile = false;
  ngOnInit(): void {
    this.gridWidth = this.gameCanvas.nativeElement.width / this.gridSize;
    this.gridHeight = this.gameCanvas.nativeElement.height / this.gridSize;
    this.ctx = this.gameCanvas.nativeElement.getContext('2d')!;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    this.initGame();
    this.createParticles();
    this.draw(); // Draw initial state
  }

  ngOnDestroy(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
  }

  private checkIfMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Touch event handlers
  handleTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    event.preventDefault();
  }

  handleTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].screenX;
    const touchEndY = event.changedTouches[0].screenY;
    this.handleSwipe(touchEndX, touchEndY);
    event.preventDefault();
  }

  private handleSwipe(touchEndX: number, touchEndY: number): void {
    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    // Minimum swipe distance (in pixels)
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && this.direction !== 'left') {
        this.nextDirection = 'right';
      } else if (dx < 0 && this.direction !== 'right') {
        this.nextDirection = 'left';
      }
    } else {
      // Vertical swipe
      if (dy > 0 && this.direction !== 'up') {
        this.nextDirection = 'down';
      } else if (dy < 0 && this.direction !== 'down') {
        this.nextDirection = 'up';
      }
    }
  }

  changeDirection(newDirection: string): void {
    // Prevent reversing direction
    if ((newDirection === 'up' && this.direction !== 'down') ||
      (newDirection === 'down' && this.direction !== 'up') ||
      (newDirection === 'left' && this.direction !== 'right') ||
      (newDirection === 'right' && this.direction !== 'left')) {
      this.nextDirection = newDirection;
    }
  }

   preventDefault(event: Event): void {
    event.preventDefault();
  }
  
  // Initialize game
  initGame(): void {
    // Initialize snake
    this.snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];

    // Generate first food
    this.generateFood();

    // Reset game state
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.speed = 5;
    this.gameRunning = false;
    this.paused = false;
    this.gameOverVisible = false;
  }

  // Generate food at random position
  generateFood(): void {
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
      for (const segment of this.snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          onSnake = true;
          break;
        }
      }
    } while (onSnake);

    this.food = newFood;
  }

  // Get random color for food
  getRandomColor(): string {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Draw game elements
  draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);

    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x < this.gameCanvas.nativeElement.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.gameCanvas.nativeElement.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.gameCanvas.nativeElement.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.gameCanvas.nativeElement.width, y);
      this.ctx.stroke();
    }

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

        // Draw eyes based on direction
        const eyeSize = this.gridSize / 5;
        let eyeX1: number, eyeY1: number, eyeX2: number, eyeY2: number;

        switch (this.direction) {
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
            eyeX1 = segment.x * this.gridSize + this.gridSize * 0.75;
            eyeY1 = segment.y * this.gridSize + this.gridSize * 0.25;
            eyeX2 = segment.x * this.gridSize + this.gridSize * 0.75;
            eyeY2 = segment.y * this.gridSize + this.gridSize * 0.75;
            break;
          default: // Default to right direction
            eyeX1 = segment.x * this.gridSize + this.gridSize * 0.75;
            eyeY1 = segment.y * this.gridSize + this.gridSize * 0.25;
            eyeX2 = segment.x * this.gridSize + this.gridSize * 0.75;
            eyeY2 = segment.y * this.gridSize + this.gridSize * 0.75;
        }

        // Draw eyes
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        this.ctx.moveTo(eyeX2, eyeY2); // Move to second eye position
        this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw food
    this.ctx.fillStyle = this.food.color;
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Add shine to food
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 3,
      this.food.y * this.gridSize + this.gridSize / 3,
      this.gridSize / 6,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  // Update game state
  update(): void {
    // Update direction
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = { ...this.snake[0] };

    switch (this.direction) {
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
      this.gameOver();
      return;
    }

    // Check for collisions with self
    for (let i = 0; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.gameOver();
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

  // Game loop
  gameStep(): void {
    if (this.gameRunning && !this.paused) {
      this.update();
      this.draw();
    }
  }

  // Start the game
  startGame(): void {
    if (!this.gameRunning) {
      this.initGame();
    }
    this.gameRunning = true;
    this.paused = false;
    clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.gameStep(), 1000 / this.speed);
  }

  // Pause the game
  pauseGame(): void {
    this.paused = !this.paused;
  }

  // Adjust game speed
  changeSpeed(amount: number): void {
    this.speed += amount;
    if (this.speed < 1) this.speed = 1;
    if (this.speed > 20) this.speed = 20;

    if (this.gameRunning) {
      clearInterval(this.gameLoop);
      this.gameLoop = setInterval(() => this.gameStep(), 1000 / this.speed);
    }
  }

  // End the game
  gameOver(): void {
    this.gameRunning = false;
    this.paused = false;
    clearInterval(this.gameLoop);

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore.toString());
    }

    // Show game over screen
    this.gameOverVisible = true;
  }

  // Restart game from game over screen
  restartGame(): void {
    this.initGame();
    this.startGame();
  }

  // Handle keyboard input
  @HostListener('window:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
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

  // Create background particles
  createParticles(): void {
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
}