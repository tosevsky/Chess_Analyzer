import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameAnalysisService } from '../../services/game-analysis.service';
import { StockfishService } from '../../services/stockfish';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { SaveGameService } from '../../services/save-game';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

interface LanceRow {
  brancas: { san: string; fenAfter: string; eval: string; tipo: 'positivo' | 'negativo' | '' };
  pretas?: { san: string; fenAfter: string; eval: string; tipo: 'positivo' | 'negativo' | '' };
}

@Component({
  selector: 'app-analysis-board',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ClickAccessibleDirective],
  templateUrl: './analysis-board.html',
  styleUrl: './analysis-board.css'
})
export class AnalysisBoard implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private analysisService = inject(GameAnalysisService);
  private stockfish = inject(StockfishService);
  private saveGameService = inject(SaveGameService);

  @ViewChild('tabuleiroCg') tabuleiroElement!: ElementRef;
  private cgApi!: Api;

  private chessEngine = new Chess();
  private historicoCompletoLances: any[] = [];

  jogoReal: any = null;
  lancesPartida: LanceRow[] = [];
  currentMoveIndex: number = -1;
  evalPercentagem: number = 50;

  
  mostrarPopUpSalvar: boolean = false;

  ngOnInit() {
    if (this.saveGameService.partidaParaSalvar.pgn) {
      this.jogoReal = { pgn: this.saveGameService.partidaParaSalvar.pgn };
    } else {
      this.jogoReal = this.analysisService.jogoAtivo;
    }

    if (!this.jogoReal || !this.jogoReal.pgn) {
      this.router.navigate(['/game-search']);
      return;
    }

    console.log('[ANALYSIS-BOARD] Sucesso! A carregar PGN:', this.jogoReal.pgn);
    this.chessEngine.loadPgn(this.jogoReal.pgn);
    this.historicoCompletoLances = this.chessEngine.history({ verbose: true });

    this.lancesPartida = [];
    for (let i = 0; i < this.historicoCompletoLances.length; i += 2) {
      const lanceW = this.historicoCompletoLances[i];
      const lanceB = this.historicoCompletoLances[i + 1];

      this.lancesPartida.push({
        brancas: { san: lanceW.san, fenAfter: lanceW.after, eval: '...', tipo: '' },
        pretas: lanceB ? { san: lanceB.san, fenAfter: lanceB.after, eval: '...', tipo: '' } : undefined
      });
    }

    this.analysisService.setAnalysisInProgress(true);
    this.analysisService.setUnsavedChanges(true);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.tabuleiroElement && this.tabuleiroElement.nativeElement) {
        this.cgApi = Chessground(this.tabuleiroElement.nativeElement, {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          orientation: 'white',
          viewOnly: true,
          movable: { free: false }
        });

        const anyApi: any = this.cgApi;
        if (anyApi && typeof anyApi.set === 'function') {
          anyApi.set({
            style: { pieces: 'cburnett' }
          });
        }
        
        if (this.currentMoveIndex >= 0) {
          this.viajarParaLanceIndex(this.currentMoveIndex);
        } else {
          this.atualizarPosicaoVisualTabuleiros();
        }
        
        this.analisarLancesEmSegundoPlano();
        this.cdr.detectChanges();
      }
    }, 100);
  }

  private atualizarPosicaoVisualTabuleiros() {
    if (this.cgApi) {
      this.cgApi.set({ fen: this.chessEngine.fen() });
    }
    this.cdr.detectChanges();
  }

  private obterScoreAbsoluto(scoreRelativo: number, fen: string): number {
    return fen.includes(' b ') ? -scoreRelativo : scoreRelativo;
  }

  private async analisarLancesEmSegundoPlano() {
    for (let i = 0; i < this.lancesPartida.length; i++) {
      const linha = this.lancesPartida[i];
      let scoreAbsolutoW = 0;
      let scoreAbsolutoB = 0;
      let textoEvalW = '';
      let textoEvalB = '';

      const cpWStr = await this.stockfish.avaliarPosicao(linha.brancas.fenAfter, 5);
      const cpWLower = cpWStr.toLowerCase();

      if (linha.brancas.san.includes('#')) {
        scoreAbsolutoW = 9900;
        textoEvalW = '#0';
      } else if (cpWLower.includes('#') || cpWLower.includes('mate')) {
        const eMatePretas = cpWLower.includes('-');
        scoreAbsolutoW = eMatePretas ? -9900 : 9900;
        const apenasNumeros = cpWStr.replace(/[^0-9]/g, '');
        textoEvalW = eMatePretas ? `-#${apenasNumeros || '1'}` : `#${apenasNumeros || '1'}`;
      } else {
        const cpW = parseInt(cpWStr, 10) || 0;
        scoreAbsolutoW = this.obterScoreAbsoluto(cpW, linha.brancas.fenAfter);
        const valorEvalW = (Math.abs(scoreAbsolutoW) / 100).toFixed(1);
        textoEvalW = scoreAbsolutoW > 0 ? `+${valorEvalW}` : (scoreAbsolutoW < 0 ? `-${valorEvalW}` : '0.0');
      }
      
      linha.brancas.eval = textoEvalW;
      linha.brancas.tipo = scoreAbsolutoW > 0 ? 'positivo' : (scoreAbsolutoW < 0 ? 'negativo' : '');
      this.cdr.detectChanges();

      if (linha.pretas) {
        const cpBStr = await this.stockfish.avaliarPosicao(linha.pretas.fenAfter, 5);
        const cpBLower = cpBStr.toLowerCase();

        if (linha.pretas.san.includes('#')) {
          scoreAbsolutoB = -9900;
          textoEvalB = '#0';
        } else if (cpBLower.includes('#') || cpBLower.includes('mate')) {
          const eMatePretas = cpBLower.includes('-');
          scoreAbsolutoB = eMatePretas ? -9900 : 9900;
          const apenasNumeros = cpBStr.replace(/[^0-9]/g, '');
          textoEvalB = eMatePretas ? `-#${apenasNumeros || '1'}` : `#${apenasNumeros || '1'}`;
        } else {
          const cpB = parseInt(cpBStr, 10) || 0;
          scoreAbsolutoB = this.obterScoreAbsoluto(cpB, pipelineFlippedAux(linha.pretas.fenAfter));
          const valorEvalB = (Math.abs(scoreAbsolutoB) / 100).toFixed(1);
          textoEvalB = scoreAbsolutoB > 0 ? `+${valorEvalB}` : (scoreAbsolutoB < 0 ? `-${valorEvalB}` : '0.0');
        }
        
        linha.pretas.eval = textoEvalB;
        linha.pretas.tipo = scoreAbsolutoB > 0 ? 'positivo' : (scoreAbsolutoB < 0 ? 'negativo' : '');
        this.cdr.detectChanges();
      }
      
      if (this.currentMoveIndex === i * 2 || this.currentMoveIndex === (i * 2) + 1) {
        const activeScore = this.currentMoveIndex % 2 === 0 ? scoreAbsolutoW : scoreAbsolutoB;
        this.atualizarBarraAvaliacaoVisual(activeScore);
      }
    }
  }

  private atualizarBarraAvaliacaoVisual(centipawnsAbsolutos: number) {
    if (centipawnsAbsolutos >= 9000) {
      this.evalPercentagem = 100;
    } else if (centipawnsAbsolutos <= -9000) {
      this.evalPercentagem = 0;
    } else {
      let pct = 50 + (centipawnsAbsolutos / 15);
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      this.evalPercentagem = pct;
    }
    this.cdr.detectChanges();
  }

  viajarParaLanceIndex(index: number) {
    this.currentMoveIndex = index;
    this.chessEngine.reset();

    for (let i = 0; i <= index; i++) {
      if (this.historicoCompletoLances[i]) {
        this.chessEngine.move(this.historicoCompletoLances[i].san);
      }
    }
    this.atualizarPosicaoVisualTabuleiros();
    if (index >= 0) {
      const rowIndex = Math.floor(index / 2);
      const eBrancas = index % 2 === 0;
      const dadosLance = eBrancas ? this.lancesPartida[rowIndex]?.brancas : this.lancesPartida[rowIndex]?.pretas;
      
      if (dadosLance && dadosLance.eval !== '...') {
        const cpAbsoluto = Math.round(parseFloat(dadosLance.eval) * 100);
        this.atualizarBarraAvaliacaoVisual(cpAbsoluto);
      }
    } else {
      this.evalPercentagem = 50;
    }
  }

  @HostListener('window:keydown', ['$event'])
  lidarComTeclado(event: KeyboardEvent) {
    
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === 'ArrowRight') this.proximoLance();
    else if (event.key === 'ArrowLeft') this.lanceAnterior();
    else if (event.key === 'ArrowUp') this.primeiroLance();
    else if (event.key === 'ArrowDown') this.ultimoLance();
  }

  @HostListener('window:resize')
  aoMudarTamanhoJanela() {
    if (this.cgApi) {
      const anyApi: any = this.cgApi;
      if (typeof anyApi.redraw === 'function') {
        anyApi.redraw();
      } else {
        try { anyApi.set({ fen: this.chessEngine.fen() }); } catch (e) {}
      }
    }
  }

  
  @HostListener('click')
  @HostListener('window:click')
  verificarBloqueioRemoto() {
    if (this.analysisService.rotaDestinoRetida && !this.mostrarPopUpSalvar) {
      this.carregarDadosDeGravacao();
      this.mostrarPopUpSalvar = true;
      this.cdr.detectChanges();
    }
  }

  primeiroLance() { this.viajarParaLanceIndex(-1); }
  lanceAnterior() { if (this.currentMoveIndex >= 0) this.viajarParaLanceIndex(this.currentMoveIndex - 1); }
  proximoLance() { if (this.currentMoveIndex < this.historicoCompletoLances.length - 1) this.viajarParaLanceIndex(this.currentMoveIndex + 1); }
  ultimoLance() { this.viajarParaLanceIndex(this.historicoCompletoLances.length - 1); }

  terminarAnalise() {
    this.analysisService.rotaDestinoRetida = null; 
    this.carregarDadosDeGravacao();
    this.mostrarPopUpSalvar = true;
    this.cdr.detectChanges();
  }

  private carregarDadosDeGravacao() {
    this.saveGameService.reset();
    const jogoCompleto = this.analysisService.jogoAtivo;
    if (jogoCompleto) {
      this.saveGameService.partidaParaSalvar.pgn = jogoCompleto.pgn || '';
      if (jogoCompleto.custom_name) {
        this.saveGameService.partidaParaSalvar.nomeCustomizado = jogoCompleto.custom_name;
      }
    }
  }

  fecharPopUp() {
    this.mostrarPopUpSalvar = false;
    this.analysisService.rotaDestinoRetida = null; 
    this.cdr.detectChanges();
  }

  guardarEClose() {
    this.mostrarPopUpSalvar = false;
    this.analysisService.setUnsavedChanges(false);
    this.router.navigate(['/save-confirmation']); 
  }

  recusarEAbandonar() {
    this.mostrarPopUpSalvar = false;
    const rotaOriginal = this.analysisService.rotaDestinoRetida;
    this.analysisService.resetAnalysisState();
    
    if (rotaOriginal) {
      this.analysisService.rotaDestinoRetida = null; 
      this.router.navigate([rotaOriginal]); 
    } else {
      this.router.navigate(['/game-search']);
    }
  }

  extrairMetaPGN(jogo: any, tag: string): string {
    if (!jogo) return '';
    let pgnTexto = '';
    if (jogo.pgn && typeof jogo.pgn === 'object' && jogo.pgn.pgn) pgnTexto = jogo.pgn.pgn;
    else if (jogo.pgn && typeof jogo.pgn === 'string') pgnTexto = jogo.pgn;
    else if (typeof jogo === 'string') pgnTexto = jogo;

    if (!pgnTexto) return '';
    const regex = new RegExp(`\\[${tag}\\s+"([^"]+)"\\]`);
    const match = pgnTexto.match(regex);
    return match ? match[1] : '';
  }

  ngOnDestroy() {
    this.analysisService.setAnalysisInProgress(false);
    this.analysisService.setUnsavedChanges(false);
  }

  trackByLance(index: number, item: LanceRow): number {
    return index;
  }
}

function pipelineFlippedAux(fen: string): string { return fen; }