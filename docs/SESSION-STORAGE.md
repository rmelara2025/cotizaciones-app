# Gestión de Sesión y Roles

## Resumen

La aplicación utiliza localStorage para persistir la información de sesión del usuario, incluyendo datos personales, timestamp de inicio de sesión y roles asignados.

## Keys de localStorage

| Key | Descripción | Tipo de Dato |
|-----|-------------|--------------|
| `cmdb_user_session` | Datos del usuario autenticado | `IUsuario` (JSON) |
| `cmdb_session_timestamp` | Timestamp de inicio de sesión | `string` (number) |
| `cmdb_user_roles` | Lista de roles del usuario | `IRol[]` (JSON) |

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
}
```

## Acceso a los Roles

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
// Usuario actual
currentUser: Signal<IUsuario | null>

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

## Ejemplo de Uso en Template

```html
<!-- Mostrar contenido solo para roles específicos -->
@if (userRoles().some(rol => rol.nombreRol === 'Admin')) {
  <button>Opción solo para Admin</button>
}

<!-- Listar todos los roles -->
<div>
  <h3>Roles del usuario:</h3>
  <ul>
    @for (rol of userRoles(); track rol.idrol) {
      <li>{{ rol.nombreRol }}</li>
    }
  </ul>
</div>
```

## Métodos del AuthService

### login(credentials: IUsuarioLogin)
Autentica al usuario y carga sus roles automáticamente.

```typescript
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
