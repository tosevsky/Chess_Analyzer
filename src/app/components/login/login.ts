import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClickAccessibleDirective],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  
  isSignUpMode = false; 
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  
  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    this.errorMessage = null;
    this.successMessage = null;
    this.loginForm.reset();
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { email, password } = this.loginForm.getRawValue();

    try {
      if (this.isSignUpMode) {
        
        const { data, error } = await this.supabaseService.signUp(email, password);
        
        if (error) {
          this.errorMessage = error.message;
        } else if (data?.user) {
          
          this.successMessage = 'Conta criada com sucesso!ATENÇÃo!! Enviámos um link de confirmação para o teu e-mail Verifica a tua caixa de SPAM. Por favor, valida a tua conta antes de iniciar sessão.';
          this.isSignUpMode = false; 
          this.loginForm.reset();
        }
      } else {
        
        const { data, error } = await this.supabaseService.login(email, password);

        if (error) {
          
          if (error.message.toLowerCase().includes('email not confirmed')) {
            this.errorMessage = 'A tua conta ainda não foi ativada. Por favor, verifica o teu e-mail e clica no link de confirmação.';
          } else {
            this.errorMessage = 'Credenciais inválidas ou utilizador não encontrado.';
          }
        } else if (data?.user) {
          this.router.navigate(['/home']);
        }
      }
    } catch (err) {
      this.errorMessage = 'Ocorreu um erro inesperado na operação.';
    } finally {
      this.isLoading = false;
    }
  }
}