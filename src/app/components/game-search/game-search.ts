import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockfishService } from '../../services/stockfish'; 
import { Chess } from 'chess.js'; 
import { GameAnalysisService } from '../../services/game-analysis.service';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-game-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, ClickAccessibleDirective],
  templateUrl: './game-search.html',
  styleUrl: './game-search.css'
})
export class GameSearch {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private stockfish = inject(StockfishService);
  private analysisService = inject(GameAnalysisService);

  // Filtros
  username: string = '';
  dataInicial: string = '';
  dataFinal: string = '';
  corSelecionada: string = 'ambas';

  // Controlo de Jogos
  allGames: any[] = [];
  games: any[] = [];
  jogoSelecionado: any = null;
  
  // Estados de Carregamento
  isLoading: boolean = false;
  errorMessage: string | null = null;

  // Variáveis da Barra de Progresso
  lanceAtual: number = 0;
  totalLancesAnalisar: number = 0;
  progressoPercentagem: number = 0;

  // Variáveis de Precisão e Rating Dinâmicos
  precisaoBrancas: number = 0;
  precisaoPretas: number = 0;
  ratingPartidaBrancas: number = 0;
  ratingPartidaPretas: number = 0;

  // Contadores de Lances Separados por Jogador
  contadoresBrancas = { brilliant: 0, excellent: 0, book: 0, best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 };
  contadoresPretas = { brilliant: 0, excellent: 0, book: 0, best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 };

  async buscarJogos() {
    if (!this.username.trim()) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.allGames = [];
    this.games = [];
    this.jogoSelecionado = null;

    try {
      const arquivosRes = await fetch(`https://api.chess.com/pub/player/${this.username.trim().toLowerCase()}/games/archives`);
      if (!arquivosRes.ok) throw new Error('Utilizador não encontrado.');

      const arquivosDados = await arquivosRes.json();
      const listaArquivos = arquivosDados.archives;

      if (listaArquivos && listaArquivos.length > 0) {
        const ultimoMesUrl = listaArquivos[listaArquivos.length - 1];
        const jogosRes = await fetch(ultimoMesUrl);
        const jogosDados = await jogosRes.json();
        
        this.allGames = jogosDados.games.reverse();
        this.aplicarFiltros();
      } else {
        this.errorMessage = 'Este utilizador não tem jogos recentes.';
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Erro ao ligar ao Chess.com.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltros() {
    const userMinusculo = this.username.trim().toLowerCase();

    this.games = this.allGames.filter(jogo => {
      const eBrancas = jogo.white.username.toLowerCase() === userMinusculo;
      if (this.corSelecionada === 'brancas' && !eBrancas) return false;
      if (this.corSelecionada === 'pretas' && eBrancas) return false;

      if (this.dataInicial || this.dataFinal) {
        const dataJogo = new Date(jogo.end_time * 1000);
        if (this.dataInicial && dataJogo < new Date(this.dataInicial)) return false;
        if (this.dataFinal) {
          const limiteFinal = new Date(this.dataFinal);
          limiteFinal.setHours(23, 59, 59, 999);
          if (dataJogo > limiteFinal) return false;
        }
      }
      return true;
    }).slice(0, 10);

    if (this.jogoSelecionado && !this.games.includes(this.jogoSelecionado)) {
      this.jogoSelecionado = null;
    }
    this.cdr.detectChanges();
  }

  mudarFiltroCor(cor: string) {
    this.corSelecionada = cor;
    this.aplicarFiltros();
  }

  selecionarJogo(jogo: any) {
    this.jogoSelecionado = jogo;
    this.precisaoBrancas = 0;
    this.precisaoPretas = 0;
    this.ratingPartidaBrancas = 0;
    this.ratingPartidaPretas = 0;
    this.ZerarContadores(false);
    this.cdr.detectChanges();
    
    // 💡 Iniciar cálculo automático do resumo
    this.calcularResumoLocal();
  }

  async calcularResumoLocal() {
    if (!this.jogoSelecionado || !this.jogoSelecionado.pgn) return;

    this.cdr.detectChanges();

    const chess = new Chess();
    try {
      chess.loadPgn(this.jogoSelecionado.pgn);
    } catch (e) {
      return;
    }

    const historicoLances = chess.history({ verbose: true });
    this.ZerarContadores(false);

    const analisadorVirtual = new Chess();
    let avaliacaoAnterior = 0;
    let somaPontosW = 0, qtdLancesW = 0;
    let somaPontosB = 0, qtdLancesB = 0;

    const limiteLances = Math.min(historicoLances.length, 30);
    this.totalLancesAnalisar = limiteLances;
    this.lanceAtual = 0;
    this.progressoPercentagem = 0;

    for (let i = 0; i < limiteLances; i++) {
      this.lanceAtual = i + 1;
      this.progressoPercentagem = Math.round((this.lanceAtual / this.totalLancesAnalisar) * 100);
      this.cdr.detectChanges();

      const lance = historicoLances[i];
      const eBrancas = lance.color === 'w'; // 💡 CORRIGIDO: Declarado corretamente aqui
      const alvoContador = eBrancas ? this.contadoresBrancas : this.contadoresPretas;
      
      if (i < 8) {
        alvoContador.book++;
        if (eBrancas) { somaPontosW += 100; qtdLancesW++; } 
        else { somaPontosB += 100; qtdLancesB++; }
        analisadorVirtual.move(lance.san);
        continue;
      }

      analisadorVirtual.move(lance.san);
      const fenAtual = analisadorVirtual.fen();

      const resultadoCpStr = await this.stockfish.avaliarPosicao(fenAtual, 5);
      const avaliacaoAtual = parseInt(resultadoCpStr, 10) || 0;
      const diferencaVantagem = Math.abs(avaliacaoAnterior - avaliacaoAtual);

      let notaDoLance = 100;

      if (diferencaVantagem > 250) {
        alvoContador.blunder++;
        notaDoLance = 0;
      } else if (diferencaVantagem > 120) {
        alvoContador.mistake++;
        notaDoLance = 15;
      } else if (diferencaVantagem > 60) {
        alvoContador.inaccuracy++;
        notaDoLance = 50;
      } else if (diferencaVantagem < 15) {
        alvoContador.best++;
        notaDoLance = 100;
      } else {
        alvoContador.excellent++;
        notaDoLance = 100;
      }

      if (eBrancas) {
        somaPontosW += notaDoLance;
        qtdLancesW++;
      } else {
        somaPontosB += notaDoLance;
        qtdLancesB++;
      }

      avaliacaoAnterior = avaliacaoAtual;
    }

    this.contadoresBrancas.great = Math.floor(this.contadoresBrancas.excellent / 2);
    this.contadoresBrancas.good = Math.floor(this.contadoresBrancas.best / 3);
    this.contadoresPretas.great = Math.floor(this.contadoresPretas.excellent / 2);
    this.contadoresPretas.good = Math.floor(this.contadoresPretas.best / 3);

    // Definição das Precisões Reais Calculadas
    this.precisaoBrancas = qtdLancesW > 0 ? Math.round(somaPontosW / qtdLancesW) : 100;
    this.precisaoPretas = qtdLancesB > 0 ? Math.round(somaPontosB / qtdLancesB) : 100;

    // Definição dos Ratings Estimados Reais
    const ratingRealW = parseInt(this.jogoSelecionado.white.rating, 10) || 1500;
    const ratingRealB = parseInt(this.jogoSelecionado.black.rating, 10) || 1500;
    this.ratingPartidaBrancas = this.calcularRatingEstimado(this.precisaoBrancas, ratingRealW);
    this.ratingPartidaPretas = this.calcularRatingEstimado(this.precisaoPretas, ratingRealB);

    this.cdr.detectChanges();
  }

  private calcularRatingEstimado(precisao: number, ratingReal: number): number {
    const fatorAjuste = (precisao - 75) * 20; 
    let ratingEstimado = ratingReal + fatorAjuste;
    if (ratingEstimado < 400) ratingEstimado = 400;
    if (ratingEstimado > 3500) ratingEstimado = 3500;
    return Math.round(ratingEstimado);
  }

  private ZerarContadores(usarValoresMockup: boolean) {
    if (usarValoresMockup) {
      this.contadoresBrancas = { brilliant: 0, excellent: 2, book: 8, best: 8, great: 2, good: 7, inaccuracy: 6, mistake: 0, miss: 0, blunder: 0 };
      this.contadoresPretas = { brilliant: 0, excellent: 3, book: 7, best: 13, great: 3, good: 6, inaccuracy: 4, mistake: 2, miss: 0, blunder: 0 };
    } else {
      const zeros = { brilliant: 0, excellent: 0, book: 0, best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 };
      this.contadoresBrancas = { ...zeros };
      this.contadoresPretas = { ...zeros };
    }
  }

  irParaAnalise() {
    if (!this.jogoSelecionado) return;
    this.analysisService.jogoAtivo = this.jogoSelecionado; // Salva o jogo na ponte
    this.router.navigate(['/analise']);
  }

  voltar() {
    this.router.navigate(['/home']);
  }
}