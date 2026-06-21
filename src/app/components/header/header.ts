import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { GameAnalysisService } from '../../services/game-analysis.service';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ClickAccessibleDirective],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  private router = inject(Router);
  private location = inject(Location);
  private analysisService = inject(GameAnalysisService); 

  @Input() title: string = 'ChessAnalyzer.PT';
  @Input() showLogo: boolean = true;
  @Input() actionLabel: string = 'Log out';

  navigateHome() { this.tentarNavegar('/home'); }
  navigateRepertoire() { this.tentarNavegar('/repertorio'); }
  navigateNewAnalysis() { this.tentarNavegar('/pesquisa'); }

  private tentarNavegar(rota: string) {
    
    
    const analiseAtiva = !!this.analysisService.jogoAtivo;

    
    

    if (analiseAtiva) {
      
      
      this.analysisService.rotaDestinoRetida = rota;
    } else {
      
      this.router.navigate([rota]);
    }
  }

  goBack() {
    if (this.canGoBack()) {
      this.location.back();
    }
  }

  canGoBack(): boolean {
    return true; 
  }

  onActionClick() {
    console.log('[HEADER] Ação clicada:', this.actionLabel);
    this.router.navigate(['/login']);
  }
}