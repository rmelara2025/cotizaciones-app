# Permisos de Transiciones de Estado - Restricción por Rol

**Fecha:** 6 de febrero, 2026  
**Módulo:** Cotizaciones - Transiciones de Estado  
**Tipo:** Filtro de acciones por rol

---

## Problema Identificado

Al probar con el perfil **Administrativo**, se identificó que el usuario podía ver botones de acciones que solo deberían estar disponibles para el rol **Gerencial/TeamLeader**:

- ✅ **Aprobar cotización** (EN_REVISIÓN → APROBADA)
- ✅ **Rechazar cotización** (EN_REVISIÓN → RECHAZADA)  
- ✅ **Devolver a borrador** (EN_REVISIÓN → BORRADOR)

Estas son acciones de **aprobación y validación** que corresponden exclusivamente al nivel gerencial, no al nivel administrativo/operativo.

---

## Solución Implementada

### ✅ Frontend (Código TypeScript)

**Archivo modificado:** `cotizaciones-por-contrato.ts`

#### 1. Inyección del AuthService

```typescript
export class CotizacionesPorContrato implements OnInit {
    private cotizacionesService = inject(CotizacionesService);
    private contratosService = inject(ContratosService);
    private authService = inject(AuthService);  // ← NUEVO
    private router = inject(Router);
    private route = inject(ActivatedRoute);
```

#### 2. Método de validación de acciones

```typescript
/**
 * Determina si el usuario actual puede ver una acción específica
 * basándose en su rol y las reglas de negocio
 */
private shouldShowAction(accion: IAccionDisponible): boolean {
    const userRoles = this.authService.userRoles().map(r => r.nombreRol);
    
    // Transiciones que SOLO Gerencial/TeamLeader puede realizar
    // Transición 3: EN_REVISIÓN → APROBADA (Aprobar cotización)
    // Transición 4: EN_REVISIÓN → RECHAZADA (Rechazar cotización)
    // Transición 5: EN_REVISIÓN → BORRADOR (Devolver a borrador)
    const gerencialOnlyTransitions = [3, 4, 5];
    
    if (gerencialOnlyTransitions.includes(accion.idTransicion)) {
        return userRoles.includes('Gerencial/TeamLeader') || userRoles.includes('Owner');
    }
    
    // Resto de transiciones son visibles según backend
    return true;
}
```

#### 3. Filtrado en el método obtenerAcciones

```typescript
/**
 * Obtiene las acciones disponibles para una cotización específica
 */
obtenerAcciones(cotizacion: ICotizacion): IAccionDisponible[] {
    const allAcciones = this.accionesDisponibles().get(cotizacion.idCotizacion) || [];
    return allAcciones.filter(accion => this.shouldShowAction(accion));  // ← FILTRADO
}
```

**Resultado:** El método ahora filtra las acciones antes de retornarlas al template, ocultando las acciones restringidas para usuarios Administrativo.

---

### ⚠️ Backend (Script SQL)

**Archivo creado:** `08-fix-transiciones-gerencial.sql`

El backend también necesita ser actualizado para alinear la base de datos con las reglas de negocio:

```sql
-- ============================================
-- SCRIPT DE CORRECCIÓN: Transiciones exclusivas para Gerencial/TeamLeader
-- ============================================

-- REMOVER: Administrativo de Transición 3 (EN_REVISIÓN → APROBADA)
DELETE FROM transicionestadorol
WHERE idTransicion = 3 AND idRol = 1;

-- REMOVER: Administrativo de Transición 4 (EN_REVISIÓN → RECHAZADA)
DELETE FROM transicionestadorol
WHERE idTransicion = 4 AND idRol = 1;

-- REMOVER: Administrativo de Transición 5 (EN_REVISIÓN → BORRADOR)
DELETE FROM transicionestadorol
WHERE idTransicion = 5 AND idRol = 1;
```

**Ejecución:**
```bash
mysql -u usuario -p cmdb_tech < backend-cmdb/src/main/resources/db/08-fix-transiciones-gerencial.sql
```

---

## Matriz de Transiciones Restringidas

| ID Transición | Desde | Hacia | Descripción | Roles Permitidos |
|--------------|-------|-------|-------------|------------------|
| **3** | EN_REVISIÓN | APROBADA | Aprobar cotización | Gerencial/TeamLeader, Owner |
| **4** | EN_REVISIÓN | RECHAZADA | Rechazar cotización | Gerencial/TeamLeader, Owner |
| **5** | EN_REVISIÓN | BORRADOR | Devolver a borrador para correcciones | Gerencial/TeamLeader, Owner |

---

## Transiciones NO Restringidas (Visible para todos con permisos base)

| ID | Desde | Hacia | Descripción | Roles |
|----|-------|-------|-------------|-------|
| 1 | BORRADOR | EN_REVISIÓN | Enviar a revisión | Administrativo, Gerencial |
| 2 | BORRADOR | CANCELADA | Cancelar borrador | Administrativo |
| 6 | APROBADA | VIGENTE | Activar cotización | Administrativo |
| 7 | APROBADA | CANCELADA | Cancelar cotización aprobada | Administrativo |
| 8 | VIGENTE | REEMPLAZADA | Reemplazar por nueva versión | Administrativo, Gerencial |
| 9 | VIGENTE | CANCELADA | Cancelar cotización vigente | Administrativo |
| 10 | VIGENTE | VENCIDA | Marcar como vencida | Administrativo, Gerencial |
| 11 | RECHAZADA | BORRADOR | Reabrir cotización rechazada | Administrativo |

---

## Flujo de Validación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Backend API devuelve TODAS las acciones disponibles     │
│    según estado actual (basado en tabla transicionestado)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend recibe acciones y las guarda en signal          │
│    accionesDisponibles.set(cotizacionId, acciones)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Template invoca obtenerAcciones(cotizacion)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. shouldShowAction() verifica rol del usuario              │
│    - Si transición es 3, 4 o 5 → Solo Gerencial/Owner      │
│    - Otras transiciones → Permitidas según backend         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Template renderiza SOLO botones con permisos            │
│    @for (accion of obtenerAcciones(cotizacion))             │
└─────────────────────────────────────────────────────────────┘
```

---

## Comportamiento por Rol

### 👤 Administrativo
- ✅ **VE**: Enviar a revisión, Activar cotización, Cancelar, etc.
- ❌ **NO VE**: Aprobar, Rechazar, Devolver a borrador

### 👔 Gerencial/TeamLeader
- ✅ **VE**: Todas las transiciones disponibles según estado
- ✅ **PUEDE**: Aprobar, Rechazar, Devolver a borrador

### 👑 Owner
- ✅ **VE**: Todas las transiciones disponibles según estado
- ✅ **PUEDE**: Todas las acciones (acceso completo)

### 👁️ Vista / VIP
- ✅ **VE**: Solo lectura, sin acciones de transición

---

## Testing

### Escenario de Prueba 1: Usuario Administrativo
1. Login como Administrativo
2. Navegar a Cotizaciones → Seleccionar contrato
3. Crear cotización con estado EN_REVISIÓN
4. **Resultado esperado:** NO aparecen botones "Aprobar", "Rechazar", "Devolver a borrador"

### Escenario de Prueba 2: Usuario Gerencial
1. Login como Gerencial/TeamLeader
2. Navegar a Cotizaciones → Seleccionar contrato
3. Ver cotización con estado EN_REVISIÓN
4. **Resultado esperado:** SÍ aparecen botones "Aprobar", "Rechazar", "Devolver a borrador"

### Escenario de Prueba 3: Usuario Owner
1. Login como Owner
2. Navegar a Cotizaciones → Seleccionar contrato
3. Ver cotización con estado EN_REVISIÓN
4. **Resultado esperado:** SÍ aparecen botones "Aprobar", "Rechazar", "Devolver a borrador"

---

## Notas Técnicas

### Sistema Híbrido de Permisos

El sistema actualmente utiliza un **enfoque híbrido**:

1. **Permisos UI generales** (exportar, ver módulos, etc.)
   - 📍 **Ubicación:** `role-permissions.config.ts` (frontend)
   - 🔧 **Validación:** `AuthService.can(action)`
   - ⚡ **Ventaja:** Fácil de modificar, no requiere backend

2. **Permisos de transiciones de estado**
   - 📍 **Ubicación:** Tabla `transicionestadorol` (backend) + Filtro frontend
   - 🔧 **Validación:** Backend API + `shouldShowAction()` (frontend)
   - ⚡ **Ventaja:** Doble capa de seguridad

### Consideraciones Futuras

1. **Centralización:** Evaluar migrar todas las transiciones a `role-permissions.config.ts` para consistencia
2. **Seguridad:** El backend SIEMPRE valida permisos, el frontend solo oculta UI
3. **Mantenibilidad:** Documentar cualquier cambio en matriz de transiciones

---

## Archivos Relacionados

- **Frontend:** `src/app/features/cmdb/pages/cotizaciones-por-contrato/cotizaciones-por-contrato.ts`
- **Backend:** `src/main/resources/db/07-transiciones-estado.sql` (definiciones)
- **Backend:** `src/main/resources/db/08-fix-transiciones-gerencial.sql` (corrección)
- **Config:** `src/app/core/config/role-permissions.config.ts` (permisos UI generales)
- **Service:** `src/app/core/services/auth.service.ts` (validación de roles)

---

## Referencias

- [Documentación de Arquitectura](./ARCHITECTURE.md)
- [Modelo de Estados de Cotización](../src/app/core/models/cotizacion.model.ts)
- [Configuración de Permisos por Rol](../src/app/core/config/role-permissions.config.ts)
