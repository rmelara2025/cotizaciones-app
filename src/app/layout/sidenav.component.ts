import { Component, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface SidenavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  template: `
    <aside class="sidenav" [class.collapsed]="collapsed()">
      <div class="sidenav-top">
        <button pButton type="button" icon="pi pi-bars" class="hamburger" (click)="toggle()" aria-label="Toggle navigation"></button>
      </div>

      <nav class="sidenav-nav" role="navigation" aria-label="Main">
        <ul>
          <li *ngFor="let it of items">
            <a [routerLink]="it.route" (click)="onNavigate()" title="{{it.label}}">
              <i class="pi {{it.icon}}"></i>
              <span class="label" *ngIf="!collapsed()">{{ it.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidenav-footer" *ngIf="!collapsed()">
        <small>cotizaciones · v1.0</small>
      </div>
    </aside>
  `,
  styles: [
    `
    :host { display: block; }
    .sidenav {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 240px;
      background: var(--sidenav-bg, #0b1220);
      color: var(--sidenav-color, #fff);
      padding: 0.5rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 2px 0 8px rgba(2,6,23,0.12);
      transition: width 200ms ease;
      z-index: 1000;
    }
    .sidenav.collapsed { width: 72px; }
    .sidenav-top { display:flex; align-items:center; padding:0 0.25rem; }
    .hamburger ::ng-deep .p-button-icon { font-size: 1.125rem; }
    .sidenav-nav { overflow:auto; flex:1; }
    .sidenav-nav ul { list-style:none; margin:0; padding:0; }
    .sidenav-nav li { margin: 0.25rem 0; }
    .sidenav-nav a {
      display:flex; align-items:center; gap:0.75rem; text-decoration:none; color:inherit; padding:0.5rem; border-radius:6px;
    }
    .sidenav-nav a:hover { background: rgba(255,255,255,0.03); }
    .sidenav-nav i { font-size: 1.15rem; width: 24px; text-align:center; }
    .sidenav .label { white-space:nowrap; }
    .sidenav-footer { padding:0.5rem; text-align:center; color:rgba(255,255,255,0.6); }
    @media (max-width: 800px) {
      .sidenav { transform: translateX(-0%); position:fixed; }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent implements OnInit {
  collapsed = signal(false);

  items: SidenavItem[] = [
    { label: 'Dashboard', icon: 'pi-clock', route: '/dashboard' },
    { label: 'Cotizaciones', icon: 'pi-folder', route: '/cotizaciones' },
    { label: 'Nueva cotización', icon: 'pi-plus', route: '/cotizaciones/nueva' },
    { label: 'Clientes', icon: 'pi-users', route: '/clientes' },
    { label: 'Proveedores', icon: 'pi-box', route: '/proveedores' },
    { label: 'Reportes', icon: 'pi-chart-bar', route: '/reportes' },
    { label: 'Configuración', icon: 'pi-cog', route: '/config' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.applyCssVar();
  }

  toggle() {
    this.collapsed.update(v => !v);
    this.applyCssVar();
  }

  onNavigate() {
    // if small screen we could auto-close; leave behavior for later
  }

  private applyCssVar() {
    const w = this.collapsed() ? '72px' : '240px';
    try {
      document.documentElement.style.setProperty('--sidenav-width', w);
    } catch (e) {
      /* noop during server-side or tests */
    }
  }
}
