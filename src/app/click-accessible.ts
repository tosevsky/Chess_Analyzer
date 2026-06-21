import { Directive, HostListener, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[click]', 
  standalone: true
})
export class ClickAccessibleDirective implements OnInit {
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    const tagName = this.el.nativeElement.tagName.toLowerCase();
    
    
    const nativos = ['input', 'select', 'textarea'];

    
    if (!nativos.includes(tagName)) {
      
      if (!this.el.nativeElement.hasAttribute('tabindex')) {
        this.renderer.setAttribute(this.el.nativeElement, 'tabindex', '0');
      }
      
      if (!this.el.nativeElement.hasAttribute('role')) {
        this.renderer.setAttribute(this.el.nativeElement, 'role', 'button');
      }
    }
  }

  
  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const tagName = this.el.nativeElement.tagName.toLowerCase();
    const nativos = ['button', 'a', 'input', 'select', 'textarea'];

    
    if (!nativos.includes(tagName)) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); 
        this.el.nativeElement.click(); 
      }
    }
  }
}