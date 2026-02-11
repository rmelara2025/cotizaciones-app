import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../core/services/auth.service';

interface SidenavItem {
  label: string;
  icon: string;
  route?: string;
  children?: SidenavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule, AvatarModule],
  template: `
    <aside class="sidenav" [class.collapsed]="collapsed()">
      <div class="sidenav-top">
        <button
          pButton
          type="button"
          icon="pi pi-bars"
          class="hamburger"
          (click)="toggle()"
          aria-label="Toggle navigation"
        ></button>
      </div>

      <nav class="sidenav-nav" role="navigation" aria-label="Main">
        <ul>
          <li *ngFor="let it of items()">
            <!-- Item sin hijos (link directo) -->
            <a 
              *ngIf="!it.children" 
              [routerLink]="it.route" 
              (click)="onNavigate()" 
              title="{{ it.label }}"
              routerLinkActive="active"
            >
              <i class="pi {{ it.icon }}"></i>
              <span class="label" *ngIf="!collapsed()">{{ it.label }}</span>
            </a>
            
            <!-- Item con hijos (submenu) -->
            <div *ngIf="it.children" class="menu-item-with-children">
              <a 
                class="menu-parent" 
                (click)="toggleSubmenu(it)" 
                title="{{ it.label }}"
                [class.active]="it.expanded"
              >
                <i class="pi {{ it.icon }}"></i>
                <span class="label" *ngIf="!collapsed()">{{ it.label }}</span>
                <i 
                  *ngIf="!collapsed()" 
                  class="pi submenu-icon"
                  [class.pi-chevron-down]="!it.expanded"
                  [class.pi-chevron-up]="it.expanded"
                ></i>
              </a>
              
              <ul *ngIf="it.expanded && !collapsed()" class="submenu">
                <li *ngFor="let child of it.children">
                  <a 
                    [routerLink]="child.route" 
                    (click)="onNavigate()" 
                    title="{{ child.label }}"
                    routerLinkActive="active"
                  >
                    <i class="pi {{ child.icon }}"></i>
                    <span class="label">{{ child.label }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>

      <!-- User Section -->
      <ng-container *ngIf="currentUser()">
        <div class="sidenav-user">
          <ng-container *ngIf="!collapsed()">
            <div class="user-info">
              <p-avatar
                [label]="getUserInitials()"
                shape="circle"
                styleClass="user-avatar"
              />
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.nombreUsuario || currentUser()?.email }}</span>
                <small class="session-time" [class.warning]="timeRemaining() < 300">
                  <i class="pi pi-clock"></i> {{ formatTime(timeRemaining()) }}
                </small>
                <div class="user-roles" *ngIf="userRoles().length > 0">
                  <span *ngFor="let rol of userRoles()" class="role-badge">{{ rol.nombreRol }}</span>
                </div>
              </div>
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-sign-out"
              class="p-button-text p-button-danger logout-btn"
              (click)="logout()"
              title="Cerrar Sesión"
            >Cerrar Sesión</button>
          </ng-container>
          
          <ng-container *ngIf="collapsed()">
            <button
              pButton
              type="button"
              icon="pi pi-sign-out"
              class="p-button-text p-button-danger logout-btn-collapsed"
              (click)="logout()"
              title="Cerrar Sesión"
            ></button>
          </ng-container>
        </div>
      </ng-container>

      <div class="sidenav-footer" *ngIf="!collapsed()">
        <small>cotizaciones · v1.0</small>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
      }
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
        box-shadow: 2px 0 8px rgba(2, 6, 23, 0.12);
        transition: width 200ms ease;
        z-index: 1000;
      }
      .sidenav.collapsed {
        width: 72px;
      }
      .sidenav-top {
        display: flex;
        align-items: center;
        padding: 0 0.25rem;
      }
      .hamburger ::ng-deep .p-button-icon {
        font-size: 1.125rem;
      }
      .sidenav-nav {
        overflow: auto;
        flex: 1;
      }
      .sidenav-nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .sidenav-nav li {
        margin: 0.25rem 0;
      }
      .sidenav-nav a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: inherit;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
      }
      .sidenav-nav a:hover {
        background: rgba(255, 255, 255, 0.03);
      }
      .sidenav-nav a.active {
        background: rgba(255, 255, 255, 0.1);
        font-weight: 600;
      }
      .sidenav-nav .menu-parent {
        justify-content: space-between;
      }
      .sidenav-nav .submenu-icon {
        font-size: 0.85rem;
        margin-left: auto;
        transition: transform 200ms ease;
      }
      .sidenav-nav .submenu {
        list-style: none;
        margin: 0;
        padding: 0;
        padding-left: 1.5rem;
        margin-top: 0.25rem;
      }
      .sidenav-nav .submenu li {
        margin: 0.1rem 0;
      }
      .sidenav-nav .submenu a {
        padding: 0.4rem 0.5rem;
        font-size: 0.9rem;
      }
      .sidenav-nav i {
        font-size: 1.15rem;
        width: 24px;
        text-align: center;
      }
      .sidenav .label {
        white-space: nowrap;
      }
      .sidenav-user {
        padding: 0.75rem 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
      }
      .sidenav.collapsed .sidenav-user {
        align-items: center;
        justify-content: center;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
      }
      .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
        flex: 1;
      }
      .user-name {
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .session-time {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .session-time.warning {
        color: #fbbf24;
        font-weight: 600;
      }
      .session-time i {
        font-size: 0.7rem;
      }
      .user-roles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.25rem;
      }
      .role-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.4rem;
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        border-radius: 3px;
        white-space: nowrap;
      }
      ::ng-deep .user-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        width: 2rem;
        height: 2rem;
        font-size: 0.875rem;
      }
      .logout-btn,
      .logout-btn-collapsed {
        flex-shrink: 0;
      }
      .logout-btn-collapsed {
        width: 100%;
      }
      .sidenav-footer {
        padding: 0.5rem;
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
      }
      @media (max-width: 800px) {
        .sidenav {
          transform: translateX(-0%);
          position: fixed;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);
  currentUser = this.authService.currentUser;
  timeRemaining = this.authService.sessionTimeRemaining;
  userRoles = this.authService.userRoles;
  userPermissions = this.authService.userPermissions;

  // Computed para verificar permisos por rol
  canSeeDashboard = computed(() => this.authService.can('VER_DASHBOARD'));
  canSeeReports = computed(() => this.authService.can('VER_REPORTES'));
  canSeeLoginAuditReport = computed(() => this.authService.can('VER_REPORTE_LOGIN_AUDIT'));
  canSeeHistorialCotizacionesReport = computed(() =>
    this.authService.can('VER_REPORTE_HISTORIAL_COTIZACIONES')
  );
  canCreateQuote = computed(() => this.authService.can('CREAR_COTIZACIONES'));
  canSeeProveedores = computed(() => this.authService.can('VER_PROVEEDORES'));
  // Configuración visible si puede ver Familias de Servicios O Gestionar Usuarios
  canSeeConfig = computed(() =>
    this.authService.can('VER_FAMILIA_SERVICIOS') || this.authService.can('GESTIONAR_USUARIOS')
  );
  isOwner = computed(() => this.authService.hasRole('Owner'));

  // Items filtrados dinámicamente según permisos
  items = computed<SidenavItem[]>(() => {
    const menuItems: SidenavItem[] = [];

    // Dashboard - Solo si tiene permiso VER_DASHBOARD
    if (this.canSeeDashboard()) {
      menuItems.push({ label: 'Dashboard', icon: 'pi-clock', route: '/dashboard' });
    }

    // Cotizaciones - Todos pueden ver
    menuItems.push({ label: 'Cotizaciones', icon: 'pi-folder', route: '/cotizaciones' });

    // Nueva cotización - Solo si puede crear
    if (this.canCreateQuote()) {
      menuItems.push({ label: 'Nueva cotización', icon: 'pi-plus', route: '/cotizaciones/wizard-contrato' });
    }

    // Clientes - Todos pueden ver
    menuItems.push({ label: 'Clientes', icon: 'pi-users', route: '/clientes' });

    // Reportes
    const reportChildren: SidenavItem[] = [];

    if (this.authService.can('VER_CADENCIA')) {
      reportChildren.push({
        label: 'Cadencia Ingresos',
        icon: 'pi-chart-line',
        route: '/reportes/cadencia-ingresos'
      });
    }

    if (this.canSeeLoginAuditReport() || this.canSeeHistorialCotizacionesReport()) {
      reportChildren.push({
        label: 'Auditoria',
        icon: 'pi-shield',
        route: '/reportes/auditoria'
      });
    }

    if (reportChildren.length > 0 && this.canSeeReports()) {
      menuItems.push({
        label: 'Reportes',
        icon: 'pi-chart-bar',
        expanded: false,
        children: reportChildren
      });
    }

    // Configuración - Menú con hijos
    if (this.canSeeConfig()) {
      const configChildren: SidenavItem[] = [];

      // Familias de Servicios - Visible para Owner y Administrativo
      if (this.authService.can('VER_FAMILIA_SERVICIOS')) {
        configChildren.push({ label: 'Familias de Servicios', icon: 'pi-sitemap', route: '/config/familias-servicios' });
      }

      // Proveedores - Visible para Owner, Administrativo y Gerencial
      if (this.canSeeProveedores()) {
        configChildren.push({ label: 'Proveedores', icon: 'pi-box', route: '/config/proveedores' });
      }

      // Usuarios - Solo Owner
      if (this.isOwner()) {
        configChildren.push({ label: 'Usuarios', icon: 'pi-user', route: '/config/usuarios' });
      }

      if (configChildren.length > 0) {
        menuItems.push({
          label: 'Configuración',
          icon: 'pi-cog',
          expanded: false,
          children: configChildren
        });
      }
    }

    return menuItems;
  });

  ngOnInit(): void {
    this.applyCssVar();
    // Debug: Verificar estado del usuario
    console.log('🔍 SideNav Init - Usuario actual:', this.currentUser());
    console.log('🔍 SideNav Init - Roles del usuario:', this.userRoles());
    console.log('🔍 SideNav Init - Tiempo restante:', this.timeRemaining());
  }

  toggle() {
    this.collapsed.update((v) => !v);
    this.applyCssVar();
  }

  toggleSubmenu(item: SidenavItem) {
    if (this.collapsed()) return;
    item.expanded = !item.expanded;
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

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';

    // Intentar con nombreUsuario primero
    if (user.nombreUsuario) {
      const parts = user.nombreUsuario.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }

    // Fallback a email
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    // Fallback a idUsuario si existe
    if (user.idUsuario) {
      return user.idUsuario.substring(0, 2).toUpperCase();
    }

    return '??';
  }

  formatTime(seconds: number): string {
    if (seconds <= 0) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
