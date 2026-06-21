import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  
  public pastas$ = new BehaviorSubject<any[]>([]);
  public jogos$ = new BehaviorSubject<any[]>([]);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  
  async login(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async logout() {
    return await this.supabase.auth.signOut();
  }

  

 
  async obterPastas(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      
      const { data, error } = await this.supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      
      const pastasMapeadas = (data || []).map(p => ({
        id: p.id,
        nome: p.name, 
        created_at: p.created_at
      }));

      this.pastas$.next(pastasMapeadas);
    } catch (error) {
      console.error('Erro ao obter pastas do Supabase:', error);
      this.pastas$.next([]);
    }
  }

  
  async salvarJogo(folderId: string, nomeJogo: string, pgn: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('analyzed_games')
        .insert([
          {
            folder_id: folderId,
            custom_name: nomeJogo,
            pgn: pgn,
            created_at: new Date() 
          }
        ]);

      if (error) {
        throw error;
      }

      console.log('[SUPABASE] Jogo guardado com sucesso na base de dados!');
      return true;
    } catch (error) {
      console.error('[SUPABASE] Erro ao efetuar POST do jogo:', error);
      return false;
    }
  }

  
  async obterJogosPorPasta(pastaId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('analyzed_games')
        .select('*')
        .eq('folder_id', pastaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      
      const jogosMapeados = (data || []).map(j => ({
        id: j.id,
        folder_id: j.folder_id,
        nome: j.custom_name || 'Partida Sem Nome',
        pgn: j.pgn,
        data_analise: j.created_at,
        accuracy_white: j.accuracy_white,
        summary_stats: j.summary_stats,
        user_notes: j.user_notes
      }));

      this.jogos$.next(jogosMapeados);
    } catch (error) {
      console.error('Erro ao obter jogos do Supabase:', error);
      this.jogos$.next([]);
    }
  }

  async criarPasta(nomePasta: string): Promise<void> {
  console.log('[SUPABASE] A iniciar a criação da pasta:', nomePasta);

  try {
    
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilizador não autenticado ou sessão expirada.');
    }

    
    
    
    const { error: insertError } = await this.supabase
      .from('folders') 
      .insert([
        { 
          name: nomePasta, 
          user_id: user.id 
        }
      ]);

    if (insertError) {
      throw insertError;
    }

    console.log('[SUPABASE] Pasta inserida na BD com sucesso!');

    
    
    
    await this.obterPastas();

  } catch (error) {
    console.error('[SUPABASE] Erro crítico no método criarPasta:', error);
    throw error; 
  }
}

async eliminarPasta(idPasta: string | number): Promise<void> {
  console.log('[SUPABASE] A iniciar a remoção da pasta com ID:', idPasta);

  try {
    
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilizador não autenticado ou sessão expirada.');
    }

    
    
    const { error: deleteError } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', idPasta)
      .eq('user_id', user.id); 

    if (deleteError) {
      throw deleteError;
    }

    console.log('[SUPABASE] Pasta removida da BD com sucesso!');

    
    
    await this.obterPastas();

  } catch (error) {
    console.error('[SUPABASE] Erro crítico no método eliminarPasta:', error);
    throw error;
  }
}

async eliminarJogo(jogoId: string, pastaId: string): Promise<void> {
  console.log(`[SUPABASE-SERVICE] A tentar eliminar o jogo ID: ${jogoId} da pasta ID: ${pastaId}`);
  
  try {
    const { error } = await this.supabase
      .from('analyzed_games')
      .delete()
      .eq('id', jogoId);

    if (error) throw error;

    console.log('[SUPABASE-SERVICE] Jogo eliminado com sucesso do banco de dados.');

    
    await this.obterJogosPorPasta(pastaId);

  } catch (error) {
    console.error('[SUPABASE-SERVICE] Erro crítico ao eliminar jogo:', error);
    throw error;
  }
}
}