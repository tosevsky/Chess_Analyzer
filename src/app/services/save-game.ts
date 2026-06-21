import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SaveGameService {
  partidaParaSalvar = {
    pgn: '',
    nomeCustomizado: 'nome_da_partida',
    folderId: '',
    nomeFolder: ''
  };

  reset() {
    this.partidaParaSalvar = {
      pgn: '',
      nomeCustomizado: 'nome_da_partida',
      folderId: '',
      nomeFolder: ''
    };
  }
}