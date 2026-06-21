import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { SaveGameService } from '../../services/save-game';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-save-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, ClickAccessibleDirective],
  templateUrl: './save-confirmation.html',
  styleUrl: './save-confirmation.css'
 
})
export class SaveConfirmationComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  public saveGameService = inject(SaveGameService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pastas: any[] = [];
  confirmacaoAtiva: boolean = false;

  ngOnInit() {
    this.carregarPastas();
  }

  async carregarPastas() {
    await this.supabaseService.obterPastas();
    this.supabaseService.pastas$.subscribe(dados => {
      this.pastas = dados || [];
      this.cdr.detectChanges();
    });
  }

  selecionarPasta(pasta: any) {
    this.saveGameService.partidaParaSalvar.folderId = pasta.id;
    this.saveGameService.partidaParaSalvar.nomeFolder = pasta.nome;
  }

  clicouGuardar() {
    if (!this.saveGameService.partidaParaSalvar.folderId) {
      alert('Seleciona uma pasta primeiro!');
      return;
    }
    this.confirmacaoAtiva = true;
  }

  async confirmarEGravarNoSupabase() {
    const dados = this.saveGameService.partidaParaSalvar;
    
    const sucesso = await this.supabaseService.salvarJogo(
      dados.folderId,
      dados.nomeCustomizado,
      dados.pgn
    );

    if (sucesso) {
      this.router.navigate(['/save-success']);
    } else {
      alert('Erro ao gravar a partida no Supabase.');
    }
  }
}