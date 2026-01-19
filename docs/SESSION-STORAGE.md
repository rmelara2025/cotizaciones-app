# Gestión de Sesión, Roles y Permisos

## Resumen

La aplicación utiliza localStorage para persistir la información de sesión del usuario, incluyendo datos personales, timestamp de inicio de sesión, roles asignados y permisos consolidados.

## Keys de localStorage

| Key | Descripción | Tipo de Dato |
|-----|-------------|--------------|
| `cmdb_user_session` | Datos del usuario autenticado | `IUsuario` (JSON) |
| `cmdb_session_timestamp` | Timestamp de inicio de sesión | `string` (number) |
| `cmdb_user_roles` | Lista de roles del usuario con sus permisos | `IRol[]` (JSON) |
| `cmdb_user_permissions` | Array consolidado de permisos únicos | `string[]` (JSON) |

## Duración de Sesión

- **Duración:** 45 minutos
- **Auto-logout:** La sesión se cierra automáticamente al expirar
- **Renovación:** Se renueva automáticamente en cada petición HTTP (vía interceptor)

## Interfaces

### IUsuario
```typescript
interface IUsuario {
    nombreUsuario: string;
    email: string;
    idUsuario?: string;
    rol?: string;
    roles?: IRol[];
}
```

### IRol
```typescript
interface IRol {
    idrol: number;
    nombreRol: string;
    permisos: string[];  // Array de códigos de permisos
}
```
Roles y Permisos

### ✅ Forma Recomendada (usando AuthService)

#### Acceso a Roles
```typescript
import { inject, computed } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export class MiComponente {
  private authService = inject(AuthService);
  
  // Signal con los roles (se actualiza automáticamente)
  userRoles = this.authService.userRoles;
  
  verificarRol() {
    const roles = this.userRoles(); // Array de IRol[]
    const esAdministrativo = roles.some(rol => rol.nombreRol === 'Administrativo');
    
    if (esAdministrativo) {
      // Lógica para usuarios administrativos
    }
  }
  
  // Usar método helper
  esAdmin = computed(() => this.authService.hasRole('Administrativo'));
}
```

#### Acceso a Permisos (RECOMENDADO)
```typescript
export class MiComponente {
  private authService = inject(AuthService);
  
  // Signal con permisos consolidados
  userPermissions = this.authService.userPermissions;
  
  // Computed signals para permisos específicos
  canEdit = computed(() => this.authService.hasPermission('MODIFICAR'));
  canApprove = computed(() => this.authService.hasPermission('APROBAR'));
  canManageUsers = computed(() => 
    this.authService.hasAnyPermission(['ALTA_USUARIOS', 'BAJA_USUARIOS'])
  );
  
  verificarPermisos() {
    // Verificar un permiso
    if (this.authService.hasPermission('MODIFICAR')) {
      // Usuario puede modificar
    }

const permissionsJson = localStorage.getItem('cmdb_user_permissions');
const permissions: string[] = permissionsJson ? JSON.parse(permissionsJson) : [];
    
    // Verificar múltiples permisos (OR - al menos uno)
    if (this.authService.hasAnyPermission(['MODIFICAR', 'APROBAR'])) {
      // Usuario puede modificar O aprobar
    }
    
    // Verificar múltiples permisos (AND - todos)
    if (this.authService.hasAllPermissions(['VER_TODO', 'MODIFICAR'])) {
      // Usuario tiene ambos permisos
### ✅ Forma Recomendada (usando AuthService)

```typescript
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export class MiComponente {
  private authService = inject(AuthService);
  
  // Signal con los roles (se actualiza automáticamente)
  userRoles = this.authService.userRoles;
  
  verificarRol() {
    const roles = this.userRoles(); // Array de IRol[]
    const tieneRolOwner = roles.some(rol => rol.nombreRol === 'Owner');
    
    if (tieneRolOwner) {
      // Lógica para usuarios con rol Owner
    }
  }
}
```

### ⚠️ Acceso Directo a localStorage (no recomendado)

```typescript
// Solo usar si no tienes acceso al AuthService
const rolesJson = localStorage.getItem('cmdb_user_roles');
const roles: IRol[] = rolesJson ? JSON.parse(rolesJson) : [];
```

## Signals Disponibles en AuthService

El `AuthService` expone los siguientes signals:

```typescript
// Usuario actual (con permisos incluidos)
userRoles: Signal<IRol[]>

// Permisos consolidados de todos los roles (array único)
userPermissions: Signal<stringsuario | null>

// Roles del usuario
userRoles: Signal<IRol[]>

// Estado de autenticación
isAuthenticated: Signal<boolean>

// Tiempo restante de sesión (en segundos)
sessionTimeRemaining: Signal<number>

// Estado de carga
loading: Signal<boolean>

// Errores
error: Signal<string | null>
```
### Validación por Permisos (RECOMENDADO)
```html
<!-- Mostrar botón solo si tiene permiso -->
@if (authService.hasPermission('MODIFICAR')) {
  <button pButton label="Editar" icon="pi pi-pencil" />
}

<!-- Múltiples permisos con computed -->
@if (canEdit()) {
  <button pButton label="Editar" />
}

@if (canApprove()) {
  <button pButton label="Aprobar" severity="success" />
}

<!-- Deshabilitar input basado en permiso -->
<input 
  pInputText 
  [(Autenticación

#### login(credentials: IUsuarioLogin)
Autentica al usuario y carga sus roles y permisos automáticamente.

```typescript
const success = await this.authService.login({
  idUsuario: 'usuario123',
  clave: 'password'
});

if (success) {
  console.log('Roles:', this.authService.userRoles());
  console.log('Permisos:', this.authService.userPermissions());
}
```

#### logout()
Cierra la sesión y limpia todos los datos de localStorage (usuario, roles, permisos).

```typescript
this.authService.logout();
```

#### getCurrentUser()
Obtiene el usuario actual (útil para logging y auditoría).

```typescript
const usuario = this.authService.getCurrentUser();
```

### Gestión de Roles y Permisos

#### loadUserRoles()
Recarga loss de Backend

### Obtener Roles y Permisos del Usuario

```
GET /api/usuario/{idusuario}/roles
```

**Response:**
```json
[
  {
    "idrol": 1,
    "nombreRol": "Administrativo",
    "permisos": [
      "ALTA_USUARIOS",
      "APROBAR",
      "BAJA_USUARIOS",
      "CREAR_COTIZACIONES",
      "ELIMINAR_COTIZACIONES",
      "EXPORTAR_REPORTES",
      "GESTIONAR_CLIENTES",
      "GESTIONAR_USUARIOS",
      "MODIFICAR",
      "VER_CLIENTES",
      "VER_COTIZACIONES",
      "VER_DASHBOARD",
      "VER_RECURRENCIAS",
      "VER_REPORTES",
      "VER_SERVICIOS_CONTRATOS",
      "VER_TODO"
    ]
  },
  {
    "idrol": 2,
    "nombreRol": "Rol gerencial / team leader",
    "permisos": [
      "ALTA_USUARIOS",
      "APROBAR",
      "CREAR_COTIZACIONES",
      "EXPORTAR_REPORTES",
      "VER_CLIENTES",
      "VER_COTIZACIONES",
      "VER_DASHBOARD",
      "VER_RECURRENCIAS",
      "VER_REPORTES",
      "VER_TODO"
    ]
  }
]
```

**Nota:** Si un usuario tiene múltiples roles, los permisos se consolidan automáticamente eliminando duplicados.typescript
if (this.authService.hasAnyPermission(['MODIFICAR', 'APROBAR'])) {
  // Usuario puede modificar O aprobar
}
```

#### hasAllPermissions(permissions: string[]): boolean
Verifica si el usuario tiene TODOS los permisos especificados (AND).

```typescript
if (this.authService.hasAllPermissions(['VER_TODO', 'MODIFICAR'])) {
  // Usuario tiene ambos permisos
}
```

#### hasRole(roleName: string): boolean
Verifica si el usuario tiene un rol específico por nombre.
Permisos Disponibles en el Sistema

| Código Permiso | Descripción | Módulo |
|----------------|-------------|--------|
| `VER_TODO` | Acceso completo a todos los módulos | GENERAL |
| `VER_SERVICIOS_CONTRATOS` | Ver servicios y contratos (sin recurrencias) | SERVICIOS |
| `VER_RECURRENCIAS` | Ver información de recurrencias | SERVICIOS |
| `VER_REPORTES` | Acceso a módulo de reportes | REPORTES |
| `EXPORTAR_REPORTES` | Exportar reportes a Excel/PDF | REPORTES |
| `MODIFICAR` | Modificar cotizaciones, servicios y contratos | COTIZACIONES |
| `APROBAR` | Aprobar cotizaciones y solicitudes | COTIZACIONES |
| `ALTA_USUARIOS` | Dar de alta nuevos usuarios | USUARIOS |
| `BAJA_USUARIOS` | Dar de baja usuarios existentes | USUARIOS |
| `GESTIONAR_USUARIOS` | Gestión completa de usuarios | USUARIOS |
| `VER_DASHBOARD` | Acceso al dashboard principal | GENERAL |
| `VER_COTIZACIONES` | Ver listado de cotizaciones | COTIZACIONES |
| `CREAR_COTIZACIONES` | Crear nuevas cotizaciones | COTIZACIONES |
| `ELIMINAR_COTIZACIONES` | Eliminar cotizaciones | COTIZACIONES |
| `VER_CLIENTES` | Ver listado de clientes | CLIENTES |
| `GESTIONAR_CLIENTES` | Crear, modificar y eliminar clientes | CLIENTES |

## Roles Predefinidos

### Administrativo
- **Permisos:** TODOS (16 permisos)
- **Descripción:** Acceso completo al sistema

### Rol gerencial / team leader
- **Permisos:** VER_TODO, APROBAR, ALTA_USUARIOS, VER_REPORTES, EXPORTAR_REPORTES, CREAR_COTIZACIONES
- **Descripción:** Gestión y supervisión (sin modificar ni dar bajas)

### Solo vista VIP
- **Permisos:** VER_TODO, VER_REPORTES, EXPORTAR_REPORTES
- **Descripción:** Acceso completo de lectura con exportación

### Solo vista
- **Permisos:** VER_SERVICIOS_CONTRATOS, VER_DASHBOARD, VER_COTIZACIONES, VER_CLIENTES
- **Descripción:** Acceso básico de solo lectura

## Notas Importantes

1. **Siempre usa el AuthService:** Los signals se mantienen sincronizados automáticamente
2. **Limpieza automática:** Roles y permisos se limpian al cerrar sesión o cuando expira
3. **Persistencia:** Se guardan en localStorage para mantenerlos entre recargas de página
4. **Consolidación de permisos:** Si un usuario tiene múltiples roles, los permisos se unifican automáticamente
5. **Seguridad:** ⚠️ La validación en frontend es solo UX. SIEMPRE validar en backend
6. **Preferir permisos sobre roles:** Usa `hasPermission()` en lugar de `hasRole()` cuando sea posible
        <small>({{ rol.permisos.length }} permisos)</small>
      </li>
    }
  </ul>
</div>
s Completos

### Guard Basado en Permisos (RECOMENDADO)

```typescript
// permission.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Guard que valida si el usuario tiene un permiso específico
 * Uso en routes: canActivate: [permissionGuard('MODIFICAR')]
 */
export const permissionGuard = (requiredPermission: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.hasPermission(requiredPermission)) {
      console.warn(`Acceso denegado. Permiso requerido: ${requiredPermission}`);
      router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  };
};

/**
 * Guard que valida si el usuario tiene al menos uno de varios permisos
 * Uso: canActivate: [anyPermissionGuard(['MODIFICAR', 'APROBAR'])]
 */
export const anyPermissionGuard = (requiredPermissions: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.hasAnyPermission(requiredPermissions)) {
      console.warn(`Acceso denegado. Se requiere uno de: ${requiredPermissions.join(', ')}`);
      router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  };
};
```

### Guard Basado en Roles

```typescript
// role.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const roleGuard = (requiredRole: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.hasRole(requiredRole)) {
      console.warn(`Acceso denegado. Rol requerido: ${requiredRole}`);
      router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  };
};
```

### Uso en Rutas

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard, anyPermissionGuard } from './core/guards/permission.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Ruta protegida por autenticación básica
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  
  // Ruta protegida por permiso específico
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, permissionGuard('GESTIONAR_USUARIOS')]
  },
  
  // Ruta protegida por múltiples permisos (OR)
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard, anyPermissionGuard(['VER_REPORTES', 'EXPORTAR_REPORTES'])]
  },
  
  // Ruta protegida por rol
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard('Administrativo')]
  }
];
```

### Directiva Personalizada para Permisos

```typescript
// has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basado en permisos
 * Uso: <button *hasPermission="'MODIFICAR'">Editar</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  
  @Input() set hasPermission(permission: string) {
    effect(() => {
      if (this.authService.hasPermission(permission)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
```

### Componente Completo de Ejemplo

```typescript
// cotizacion-detalle.component.ts
import { Component, inject, computed } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export class CotizacionDetalleComponent {
  private authService = inject(AuthService);
  
  // Computed signals para permisos
  canEdit = computed(() => this.authService.hasPermission('MODIFICAR'));
  canApprove = computed(() => this.authService.hasPermission('APROBAR'));
  canDelete = computed(() => this.authService.hasPermission('ELIMINAR_COTIZACIONES'));
  canExport = computed(() => this.authService.hasPermission('EXPORTAR_REPORTES'));
  
  // Modo de edición basado en permisos
  isReadOnly = computed(() => !this.canEdit());
  
  editarCotizacion() {
    if (!this.canEdit()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tienes permiso para modificar cotizaciones'
      });
      return;
    }
    
    // Lógica de edición
  }
  
  aprobarCotizacion() {
    if (!this.canApprove()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tienes permiso para aprobar cotizaciones'
      });
      return;
    }
    
    // Lógica de aprobación
  }
}`typescript
const success = await this.authService.login({
  idUsuario: 'usuario123',
  clave: 'password'
});
```

### loadUserRoles()
Recarga los roles del usuario desde el backend. Se llama automáticamente al hacer login.

```typescript
await this.authService.loadUserRoles();
```

### logout()
Cierra la sesión y limpia todos los datos de localStorage.

```typescript
this.authService.logout();
```

### getCurrentUser()
Obtiene el usuario actual (útil para logging y auditoría).

```typescript
const usuario = this.authService.getCurrentUser();
```

## Endpoint de Backend

```
GET /api/usuario/admin/roles
```

**Response:**
```json
[
  {
    "idrol": 5,
    "nombreRol": "Owner"
  },
  {
    "idrol": 3,
    "nombreRol": "Admin"
  }
]
```

## Notas Importantes

1. **Siempre usa el AuthService:** Los signals se mantienen sincronizados automáticamente
2. **Limpieza automática:** Los roles se limpian al cerrar sesión o cuando expira la sesión
3. **Persistencia:** Los roles se guardan en localStorage para mantenerlos entre recargas de página
4. **Seguridad:** La validación de roles debe hacerse también en el backend

## Ejemplo Completo: Guard de Roles

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const roles = authService.userRoles();
  const esAdmin = roles.some(rol => rol.nombreRol === 'Admin');
  
  if (!esAdmin) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  return true;
};
```

## Ver También

- [AUTH.md](./AUTH.md) - Documentación completa del sistema de autenticación
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura general de la aplicación
