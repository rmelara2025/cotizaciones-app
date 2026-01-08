# Sistema de Autenticación

## Descripción
Sistema completo de autenticación para CMDB Chile con gestión de sesión, timeout automático y protección de rutas.

## Características

### ✅ Login con PrimeNG 20
- Formulario reactivo con validación
- Diseño moderno y responsivo
- Integración con API REST

### ✅ Gestión de Sesión
- Duración: 45 minutos
- Almacenamiento en localStorage
- Renovación automática en cada petición HTTP
- Cierre automático al expirar

### ✅ Protección de Rutas
- Guard de autenticación para rutas protegidas
- Redirección automática al login si no está autenticado
- Redirección al dashboard si ya está autenticado

### ✅ Usuario en Memoria
- Información del usuario disponible globalmente
- Servicio de logging con usuario para auditoría
- Avatar con iniciales en navbar

## Componentes Creados

### Modelos
- `usuario.model.ts`: Interfaces IUsuario y IUsuarioLogin

### Servicios
- `auth.service.ts`: Gestión de autenticación y sesión
- `logging.service.ts`: Logging con usuario para auditoría

### Guards
- `auth.guard.ts`: Protección de rutas autenticadas
- `login.guard.ts`: Previene acceso al login si ya está autenticado

### Componentes
- `login`: Página de login con PrimeNG

### Interceptores
- `auth.interceptor.ts`: Renovación automática de sesión

## Uso

### En servicios o componentes
```typescript
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { LoggingService } from './core/services/logging.service';

export class MiComponente {
  private authService = inject(AuthService);
  private logger = inject(LoggingService);

  realizarAccion() {
    const usuario = this.authService.getCurrentUser();
    
    // Realizar acción...
    
    // Registrar acción para auditoría
    this.logger.info('Acción realizada', `Usuario: ${usuario?.idUsuario}`);
  }
}
```

### Obtener usuario actual
```typescript
const usuario = this.authService.getCurrentUser();
console.log('Usuario actual:', usuario);
```

### Verificar autenticación
```typescript
if (this.authService.isAuthenticated()) {
  // Usuario autenticado
}
```

### Cerrar sesión manualmente
```typescript
this.authService.logout();
```

## Flujo de Autenticación

1. Usuario accede a la aplicación → Redirigido a `/login`
2. Ingresa credenciales → POST `/api/usuario/validar`
3. Sesión guardada en localStorage → Redirigido a `/dashboard`
4. Cada petición HTTP renueva la sesión
5. Después de 45min de inactividad → Cierre automático de sesión

## Seguridad

- Contraseñas no se almacenan en localStorage
- Token de sesión con timestamp
- Verificación periódica de expiración
- Limpieza automática de datos al cerrar sesión

## API Endpoint

```bash
POST http://localhost:8080/api/usuario/validar
Content-Type: application/json

{
  "idUsuario": "admin",
  "clave": "Drs035xY@"
}
```

### Respuesta Esperada
```json
{
  "idUsuario": "admin",
  "nombre": "Administrador",
  "email": "admin@example.com",
  "rol": "ADMIN"
}
```

## Rutas

| Ruta | Protección | Descripción |
|------|------------|-------------|
| `/login` | loginGuard | Página de inicio de sesión |
| `/dashboard` | authGuard | Panel principal |
| `/clientes` | authGuard | Gestión de clientes |
| `/contactos` | authGuard | Gestión de contactos |
| `/cotizaciones/*` | authGuard | Módulo de cotizaciones |

## Configuración

### Cambiar duración de sesión
Editar en `auth.service.ts`:
```typescript
const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutos
```

### Personalizar redirección post-login
Editar en `login.ts`:
```typescript
this.router.navigate(['/dashboard']); // Cambiar a ruta deseada
```
