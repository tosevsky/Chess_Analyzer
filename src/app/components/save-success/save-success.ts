import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClickAccessibleDirective } from '../../click-accessible'; 

@Component({
  selector: 'app-save-success',
  standalone: true,
  imports: [ClickAccessibleDirective],
  templateUrl: './save-success.html',
  styleUrl: './save-success.css'
})
export class SaveSuccessComponent {
  private router = inject(Router);

  concluir() {
    this.router.navigate(['/repertoire']); 
  }
}