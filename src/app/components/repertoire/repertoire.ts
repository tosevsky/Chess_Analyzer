import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-repertoire',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, ClickAccessibleDirective], 
  templateUrl: './repertoire.html',
  styleUrl: './repertoire.css'
})
export class Repertoire implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  
  pastas: any[] = [];
  carregando: boolean = false;

  
  modoCriar = signal(false);
  modoEliminarAtivo = signal(false);
  novoNomePasta: string = '';
  
  showDeleteDialog = signal(false);
  pastaParaEliminar: any = null;

  ngOnInit() {
    this.carregarPastas();

    
  }

  async carregarPastas() {
    this.carregando = true;
    this.cdr.detectChanges(); 
    
    console.log('[REPERTOIRE] A iniciar a procura de pastas...');

    try {
      
      await this.supabaseService.obterPastas();
      console.log('[REPERTOIRE] Pedido ao Supabase concluído com sucesso.');

      
      this.supabaseService.pastas$.subscribe({
        next: (dados) => {
          console.log('[REPERTOIRE] Dados recebidos do BehaviorSubject:', dados);
          this.pastas = dados || [];
          this.carregando = false; 
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[REPERTOIRE] Erro dentro da subscrição das pastas:', err);
          this.carregando = false;
          this.cdr.detectChanges();
        }
      });

    } catch (erro) {
      console.error('[REPERTOIRE] Erro no bloco Try/Catch geral:', erro);
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  
  ativarModoCriar() {
    this.modoCriar.set(true);
    this.modoEliminarAtivo.set(false); 
    this.novoNomePasta = '';
    this.cdr.detectChanges();

    setTimeout(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth' // 
    });
  }, 100);
  }

  cancelarCriacao() {
    this.modoCriar.set(false);
    this.novoNomePasta = '';
    this.cdr.detectChanges();
  }

  async guardarNovaPasta() {
    if (!this.novoNomePasta.trim()) return;

    console.log('[REPERTOIRE] A tentar criar a pasta:', this.novoNomePasta);
    this.carregando = true;
    this.cdr.detectChanges();

    try {
      
      await this.supabaseService.criarPasta(this.novoNomePasta.trim());
      console.log('[REPERTOIRE] Pasta criada no Supabase com sucesso.');
      
      this.modoCriar.set(false);
      this.novoNomePasta = '';
      
      
      await this.carregarPastas();
    } catch (erro) {
      console.error('[REPERTOIRE] Erro ao criar nova pasta:', erro);
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  
  alternarModoEliminar() {
    this.modoEliminarAtivo.update(estado => !estado);
    this.modoCriar.set(false); 
    this.cdr.detectChanges();
  }

  
  aoClicarNaPasta(pasta: any) {
    if (this.modoEliminarAtivo()) {
      
      this.pastaParaEliminar = pasta;
      this.showDeleteDialog.set(true);
      this.cdr.detectChanges();
    } else {
      
      this.abrirPasta(pasta);
    }
  }

  cancelarEliminacao() {
    this.showDeleteDialog.set(false);
    this.pastaParaEliminar = null;
    this.cdr.detectChanges();
  }

  async confirmarEliminacao() {
    if (!this.pastaParaEliminar) return;

    console.log('[REPERTOIRE] A tentar eliminar a pasta com ID:', this.pastaParaEliminar.id);
    this.carregando = true;
    this.showDeleteDialog.set(false);
    this.cdr.detectChanges();

    try {
      
      await this.supabaseService.eliminarPasta(this.pastaParaEliminar.id);
      console.log('[REPERTOIRE] Pasta removida do Supabase com sucesso.');

      this.pastaParaEliminar = null;
      
      await this.carregarPastas();
    } catch (erro) {
      console.error('[REPERTOIRE] Erro ao eliminar a pasta:', erro);
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  
  abrirPasta(pasta: any) {
    this.router.navigate(['/repertoire', pasta.id]);
  }

  voltarHome() {
    this.router.navigate(['/game-search']);
  }
}