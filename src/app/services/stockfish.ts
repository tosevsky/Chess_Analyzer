import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StockfishService {
  private worker: Worker | null = null;
  private resolveAvaliacao: ((value: string) => void) | null = null;
  private ultimaPontuacao: string = '0';

  constructor() {
    this.inicializarMotor();
  }

  private inicializarMotor() {
    try {
      
      this.worker = new Worker('/stockfish/stockfish-18-lite-single.js');

      this.worker.onmessage = (event: MessageEvent) => {
        const linha = event.data;

        
        if (linha.includes('score cp')) {
          const partes = linha.split(' ');
          const cpIndex = partes.indexOf('cp');
          if (cpIndex !== -1 && partes[cpIndex + 1]) {
            this.ultimaPontuacao = partes[cpIndex + 1];
          }
        } 
        
        else if (linha.includes('score mate')) {
          this.ultimaPontuacao = '999';
        }

        
        if (linha.startsWith('bestmove') && this.resolveAvaliacao) {
          this.resolveAvaliacao(this.ultimaPontuacao);
          this.resolveAvaliacao = null; 
        }
      };

      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
    } catch (e) {
      console.error('Erro crítico ao carregar o Web Worker do Stockfish:', e);
    }
  }

  avaliarPosicao(fen: string, profundidade: number = 15): Promise<string> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve('0');
        return;
      }

      
      
      const timeoutSeguranca = setTimeout(() => {
        if (this.resolveAvaliacao) {
          console.warn('Stockfish demorou demasiado tempo nesta posição. A avançar por segurança...');
          this.resolveAvaliacao = null;
          resolve(this.ultimaPontuacao || '0');
        }
      }, 1000);

      
      this.resolveAvaliacao = (valor: string) => {
        clearTimeout(timeoutSeguranca);
        resolve(valor);
      };

      this.ultimaPontuacao = '0'; 

      
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${profundidade}`);
    });
  }
}