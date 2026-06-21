import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent , ClickAccessibleDirective],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  private router = inject(Router);

  
  navegar(rota: string) {
    this.router.navigate([`/${rota}`]);
  }

  
  abrirChessCom() {
    window.open('https://www.chess.com', '_blank');
  }
}