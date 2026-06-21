import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameAnalysisService {
  
  public jogoAtivo: any = null;

  public rotaDestinoRetida: string | null = null;

  
  public isAnalysisInProgress = signal(false);

  
  public hasUnsavedChanges = signal(false);

  setAnalysisInProgress(inProgress: boolean) {
    this.isAnalysisInProgress.set(inProgress);
  }

  setUnsavedChanges(unsaved: boolean) {
    this.hasUnsavedChanges.set(unsaved);
  }

  resetAnalysisState() {
    this.isAnalysisInProgress.set(false);
    this.hasUnsavedChanges.set(false);
    this.jogoAtivo = null;
  }
}