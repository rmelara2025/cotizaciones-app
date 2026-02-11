import { Component, signal, inject, computed, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidenavComponent } from './layout/sidenav.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidenavComponent, ToastModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);

  protected readonly title = signal('cotizaciones-app');
  showLayout = signal(false); // Iniciar en false para evitar flash del layout

  constructor() {
    // Verificar ruta inicial
    this.updateLayoutVisibility(this.router.url);

    // Escuchar cambios de ruta para ocultar/mostrar el layout
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEvent = event as NavigationEnd;
        this.updateLayoutVisibility(navigationEvent.url);
      });
  }

  private updateLayoutVisibility(url: string): void {
    const path = url.split('?')[0];
    this.showLayout.set(path !== '/login');
  }
}
