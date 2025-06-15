import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GameService } from '../app/game.service.ts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule],
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(public gameService: GameService) {}

  ngOnInit() {
    this.gameService.initGame();
    this.gameService.createParticles();
  }

  ngOnDestroy() {
    this.gameService.clearGame();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    this.gameService.handleKeyDown(event);
  }
}