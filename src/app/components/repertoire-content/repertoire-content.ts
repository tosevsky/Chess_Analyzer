import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { GameAnalysisService } from '../../services/game-analysis.service';
import { SaveGameService } from '../../services/save-game';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-repertoire-content',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ClickAccessibleDirective],
  templateUrl: './repertoire-content.html',
  styleUrl: './repertoire-content.css'
})
export class RepertoireContent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private analysisService = inject(GameAnalysisService);
  private saveGameService = inject(SaveGameService);

  jogos: any[] = [];
  nomePasta: string = 'Pasta';
  carregando: boolean = false;
  
  
  showDeleteModal: boolean = false;
  jogoParaEliminar: any = null;
  pastaIdAtual: string | null = null;

  ngOnInit() {
    const pastaId = this.route.snapshot.paramMap.get('id');
    this.pastaIdAtual = pastaId;
    if (pastaId) {
      this.carregarJogos(pastaId);
    } else {
      this.voltarParaRepertoire();
    }
  }

  async carregarJogos(pastaId: string) {
    this.carregando = true;
    this.cdr.detectChanges();

    console.log(`[REPERTOIRE-CONTENT] A iniciar a busca de jogos para a pasta ID: ${pastaId}`);

    try {
      const pastaAtual = this.supabaseService.pastas$.value.find(p => p.id === pastaId);
      if (pastaAtual) {
        this.nomePasta = pastaAtual.nome;
        console.log(`[REPERTOIRE-CONTENT] Nome da pasta encontrado no estado: "${this.nomePasta}"`);
      } else {
        console.warn('[REPERTOIRE-CONTENT] Pasta não encontrada no estado reativo local.');
      }

      await this.supabaseService.obterJogosPorPasta(pastaId);
      console.log('[REPERTOIRE-CONTENT] Pedido de jogos concluído no Supabase.');

      this.supabaseService.jogos$.subscribe({
        next: (dados) => {
          console.log('[REPERTOIRE-CONTENT] Jogos recebidos do BehaviorSubject:', dados);
          this.jogos = dados || [];
          this.carregando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[REPERTOIRE-CONTENT] Erro na subscrição reativa de jogos:', err);
          this.carregando = false;
          this.cdr.detectChanges();
        }
      });

    } catch (erro) {
      console.error('[REPERTOIRE-CONTENT] Erro no bloco Try/Catch geral de jogos:', erro);
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  abrirAnaliseJogo(jogo: any) {
    console.log('[REPERTOIRE-CONTENT] A navegar para o jogo ID:', jogo.id);
    if (!jogo) return;
    this.analysisService.jogoAtivo = jogo;
    this.router.navigate(['/analise']);
  }

  voltarParaRepertoire() {
    this.router.navigate(['/repertoire']);
  }

  abrirConfirmacaoEliminar(event: Event, jogo: any) {
    event.stopPropagation(); 
    this.jogoParaEliminar = jogo;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  fecharModal() {
    this.showDeleteModal = false;
    this.jogoParaEliminar = null;
    this.cdr.detectChanges();
  }

  
  async confirmarEliminacao() {
    if (!this.jogoParaEliminar || !this.pastaIdAtual) return;
    
    console.log('[REPERTOIRE-CONTENT] A delegar a eliminação do jogo ao serviço.');
    try {
      
      await this.supabaseService.eliminarJogo(this.jogoParaEliminar.id, this.pastaIdAtual);
      
      this.fecharModal();
    } catch (erro) {
      console.error('[REPERTOIRE-CONTENT] Erro apanhado no componente ao apagar jogo:', erro);
      this.fecharModal();
    }
  }
}