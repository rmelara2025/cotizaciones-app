# Clean Code & Best Practices Guide

## 📚 Tabla de Contenidos

1. [Principios de Diseño](#principios-de-diseño)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
4. [Patrones de Código](#patrones-de-código)
5. [Testing](#testing)
6. [Decisiones de Diseño Críticas](#decisiones-de-diseño-críticas)

---

## 🎯 Principios de Diseño

### 1. **DRY (Don't Repeat Yourself)**

✅ **CORRECTO**:
```typescript
// core/utils/date.utils.ts - Centralizado
export function formatDateForItemBackend(date: Date): string {
  // Implementación única
}

// Múltiples archivos pueden importar
import { formatDateForItemBackend } from '../../../../core/utils/date.utils';
```

❌ **INCORRECTO**:
```typescript
// component-a.ts
private formatDate(date: Date): string { /* duplicado */ }

// component-b.ts  
private formatDate(date: Date): string { /* duplicado */ }
```

### 2. **Single Responsibility Principle (SRP)**

Cada clase/función debe tener UNA razón para cambiar.

✅ **CORRECTO**:
```typescript
// CotizacionesService - Maneja solo lógica de cotizaciones
export class CotizacionesService {
  obtenerDetalleCotizacion(id: string): Promise<ICotizacionDetalleCompleta>
  versionarCotizacion(id: string): Promise<IVersionResponse>
  guardarItems(id: string, items: any[]): Promise<void>
}

// CatalogosService - Maneja solo catálogos
export class CatalogosService {
  loadServicios(): void
  loadMonedas(): void
  loadPeriodicidades(): void
}
```

❌ **INCORRECTO**:
```typescript
// CotizacionesService sobrecargado
export class CotizacionesService {
  obtenerDetalleCotizacion(id: string)
  loadServicios() // ❌ Responsabilidad de otro servicio
  formatearFecha(date: Date) // ❌ Debería ser una utilidad
  calcularSubtotal(item: any) // ❌ Lógica de dominio en servicio HTTP
}
```

### 3. **Separation of Concerns**

Separar capas de la aplicación:

```
src/app/
├── core/              # Funcionalidad transversal
│   ├── models/        # Interfaces y tipos de dominio
│   ├── services/      # Servicios de negocio
│   ├── pipes/         # Transformaciones de presentación
│   ├── utils/         # Funciones puras y helpers
│   └── guards/        # Protección de rutas
│
├── features/          # Módulos funcionales
│   └── cmdb/
│       ├── pages/     # Componentes de página
│       ├── components/ # Componentes reutilizables del feature
│       └── services/  # Servicios específicos del feature
│
├── layout/            # Componentes de layout
└── shared/            # Componentes compartidos globalmente
```

---

## 📁 Estructura de Archivos

### Organización por Feature

```
features/cmdb/
├── pages/                          # Rutas principales
│   ├── cotizacion-detalle/
│   │   ├── cotizacion-detalle.ts
│   │   ├── cotizacion-detalle.html
│   │   └── cotizacion-detalle.scss
│   └── wizard-contrato/
│
├── components/                     # Componentes reutilizables
│   └── wizard/
│       ├── wizard-paso1-cliente.component.ts
│       ├── wizard-paso2-contrato.component.ts
│       └── ...
│
└── services/                       # Servicios del feature
    └── wizard.service.ts
```

### Barrel Exports (index.ts)

Simplifica imports usando archivo barrel:

```typescript
// core/models/index.ts
export * from './contrato.model';
export * from './cotizacion.model';
export * from './dashboard.model';
// ...

// Uso en componentes
import { IContrato, ICotizacion, DashboardData } from '../../../../core/models';
```

---

## 🏷️ Convenciones de Nomenclatura

### Interfaces

```typescript
// ✅ Prefijo 'I' para interfaces de dominio
interface IContrato { }
interface ICotizacion { }
interface ICliente { }

// ✅ Response DTOs con contexto
interface IPaginatedContratoResponse { }
interface IPaginatedCotizacionResponse { }

// ❌ Evitar nombres genéricos
interface PaginatedResponse { } // ¿Response de qué?
```

### Servicios

```typescript
// ✅ Sufijo 'Service'
CotizacionesService
ContratosService
AuthService

// ✅ Sufijo descriptivo para servicios especializados
wizard.service.ts  // Service implícito en contexto
logging.service.ts
```

### Componentes

```typescript
// ✅ Standalone components (Angular 20+)
@Component({
  selector: 'app-cotizacion-detalle',
  imports: [CommonModule, FormsModule, TableModule],
  // NO: standalone: true ← Ya es default en Angular 20
})
export class CotizacionDetalleComponent { }

// ✅ Signals para estado reactivo
cotizacion = signal<ICotizacionDetalleCompleta | null>(null);
items = signal<IItemEditable[]>([]);
modoEdicion = signal(false);

// ✅ Computed para valores derivados
totalesPorMoneda = computed(() => {
  const cot = this.cotizacion();
  return cot?.totales || [];
});
```

### Funciones

```typescript
// ✅ Nombres descriptivos y específicos
formatDateForBackend()        // Formato ISO para contratos
formatDateForItemBackend()    // Formato DD-MM-YYYY para items
parseDateForEdit()            // Conversión para UI editing

// ❌ Nombres genéricos
formatDate()  // ¿Qué formato? ¿Para qué?
parseDate()   // ¿Qué parse? ¿Para qué caso de uso?
```

---

## 🔧 Patrones de Código

### 1. Service Pattern con Signals

```typescript
@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private http = inject(HttpClient);
  
  // State management con signals
  cotizaciones = signal<ICotizacion[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async obtenerCotizaciones(idContrato: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const response = await firstValueFrom(
        this.http.get<ICotizacion[]>(`${API_URL}/contratos/${idContrato}/cotizaciones`)
      );
      this.cotizaciones.set(response);
    } catch (err) {
      this.error.set('Error al cargar cotizaciones');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 2. Utility Functions (Pure Functions)

```typescript
/**
 * Función pura: mismo input → mismo output, sin side effects
 */
export function formatDateForBackend(date: Date | null): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
```

### 3. Component Communication

```typescript
// ✅ Input/Output con funciones (Angular 20+)
export class ChildComponent {
  // Input
  data = input<string>(); // Signal-based input
  
  // Output
  dataChange = output<string>(); // Signal-based output
  
  emitChange(newValue: string) {
    this.dataChange.emit(newValue);
  }
}
```

### 4. Error Handling Pattern

```typescript
async guardarCambios() {
  this.guardando.set(true);
  
  try {
    // 1. Validación temprana
    if (!this.esValido()) {
      throw new Error('Datos inválidos');
    }
    
    // 2. Operaciones
    const result = await this.cotizacionesService.guardar(this.datos());
    
    // 3. Feedback success
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Cambios guardados'
    });
    
    // 4. Navegación o actualización de estado
    await this.recargarDatos();
    
  } catch (error: any) {
    // 5. Feedback error con contexto
    console.error('Error al guardar:', error);
    const errorMsg = error?.error?.message || error?.message || 'Error desconocido';
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMsg
    });
  } finally {
    // 6. Limpieza
    this.guardando.set(false);
  }
}
```

### 5. Navigation with Context

```typescript
// ✅ Pasar contexto en navegación
this.router.navigate(['/cotizaciones/detalle', idCotizacion], {
  state: { contrato: contratoActual }, // Window history state
  queryParams: { idContrato, ...filtros } // Query params para volver
});

// Recuperar contexto con fallback
ngOnInit() {
  // 1. Intentar desde state
  const contratoFromState = window.history.state?.['contrato'];
  
  if (contratoFromState) {
    this.contrato.set(contratoFromState);
    // Guardar en sessionStorage como respaldo
    sessionStorage.setItem('contrato-actual', JSON.stringify(contratoFromState));
  } else {
    // 2. Fallback a sessionStorage
    const contratoFromStorage = sessionStorage.getItem('contrato-actual');
    if (contratoFromStorage) {
      this.contrato.set(JSON.parse(contratoFromStorage));
    }
  }
}
```

---

## 🧪 Testing

### Estructura de Tests

```
backend-cmdb/src/test/java/
└── com/telefonicatech/cmdbChile/
    └── service/
        ├── ClienteServiceTest.java
        ├── ContactoServiceImplTest.java
        ├── ContratoServiceTest.java
        └── CotizacionServiceTest.java
```

### Patrón de Unit Test (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class CotizacionServiceTest {
    
    @Mock
    private CotizacionRepository repository;
    
    @InjectMocks
    private CotizacionService service;
    
    private UUID id;
    
    @BeforeEach
    void setUp() {
        id = UUID.randomUUID();
    }
    
    @Test
    void guardarItems_callsRepositoryMethods() {
        // Arrange
        CotizacionDetalleItemRequest item = new CotizacionDetalleItemRequest();
        item.setIdServicio(1);
        
        Cotizacion cotizacion = new Cotizacion();
        cotizacion.setIdCotizacion(id);
        when(repository.findById(id)).thenReturn(Optional.of(cotizacion));
        
        doNothing().when(repository).deleteDetallesByCotizacion(anyString());
        
        // Act
        service.guardarItems(id, Arrays.asList(item));
        
        // Assert
        verify(repository).findById(id);
        verify(repository).deleteDetallesByCotizacion(id.toString());
    }
}
```

### Testing Best Practices

✅ **DO**:
- Usar `Arrays.asList()` en lugar de `List.of()` para evitar problemas de inferencia con generics
- Mockear todas las dependencias
- Usar `any()`, `anyString()`, `anyInt()` para matchers genéricos
- Un test por caso de uso

❌ **DON'T**:
- Usar valores hardcoded en mocks cuando la implementación espera otros
- Mezclar múltiples casos de uso en un test
- Dejar tests comentados

---

## 🚨 Decisiones de Diseño Críticas

### 1. Estrategia de Formateo de Fechas

**PROBLEMA**: Backend usa diferentes formatos según el DTO.

**SOLUCIÓN**: Dos funciones especializadas en `date.utils.ts`

```typescript
// Para ContratoRequest, CotizacionCreateRequest (sin @JsonFormat)
formatDateForBackend(date: Date): string  // → "2026-01-22" (ISO)

// Para CotizacionDetalleItemRequest (con @JsonFormat)
formatDateForItemBackend(date: Date): string  // → "22-01-2026" (Chilean)
```

**REGLA**: NO consolidar en una función - cada una tiene su propósito.

### 2. Manejo de Atributos Dinámicos

Items de cotización pueden tener atributos JSON dinámicos:

```typescript
interface IItemEditable {
  atributos: string;        // JSON string from backend
  _atributosObj?: any;      // Parsed object for editing
}

// Aplanar objeto para edición
aplanarObjeto({specs: {ram: "8GB"}}) 
  → {"specs.ram": "8GB"}

// Reconstruir para guardar
reconstruirObjeto({"specs.ram": "8GB"}) 
  → {specs: {ram: "8GB"}}
```

### 3. Versionamiento de Cotizaciones

**WORKFLOW**:
1. Usuario edita cotización
2. Al guardar, backend crea nueva versión automáticamente
3. Frontend actualiza ID y recarga datos SIN navegación
4. Mantiene contexto de navegación (filtros, query params)

```typescript
async guardarCambios() {
  // 1. Versionar
  const versionResponse = await this.cotizacionesService.versionarCotizacion(id);
  
  // 2. Guardar items en nueva versión
  await this.cotizacionesService.guardarItems(versionResponse.idNuevaCotizacion, items);
  
  // 3. Actualizar componente con nueva versión (sin navegar)
  this.idCotizacion.set(versionResponse.idNuevaCotizacion);
  await this.cargarDatos();
}
```

### 4. Wizard Multi-paso

**ESTADO COMPARTIDO**: `WizardService` centraliza el estado entre pasos

```typescript
// wizard.service.ts
export class WizardService {
  paso = signal(1);
  esNuevoContrato = signal(false);
  contratoSeleccionado = signal<IContrato | null>(null);
  contratoNuevo = signal<Partial<IContrato> | null>(null);
  cotizacion = signal<Partial<ICotizacion> | null>(null);
  items = signal<IItemEditable[]>([]);
}

// Cada paso lee/escribe en el servicio compartido
```

---

## 📊 Métricas de Calidad

### Antes de Refactoring
- 6 interfaces duplicadas en múltiples archivos
- RUT utils: 178 líneas con duplicación
- Imports verbosos: 4-5 líneas para importar modelos

### Después de Refactoring
- ✅ Barrel exports: 1 línea para importar múltiples modelos
- ✅ RUT utils: 79 líneas (56% reducción)
- ✅ 0 métodos duplicados en componentes
- ✅ Separación clara de concerns

---

## 🎓 Referencias

- [Angular Style Guide](https://angular.dev/style-guide)
- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring by Martin Fowler](https://refactoring.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## ✅ Checklist para Code Reviews

- [ ] ¿Hay código duplicado? → Extraer a utilidad o servicio
- [ ] ¿Las funciones son puras cuando es posible?
- [ ] ¿Los nombres son descriptivos y específicos?
- [ ] ¿Los componentes tienen una sola responsabilidad?
- [ ] ¿Los imports usan barrel exports cuando es posible?
- [ ] ¿Hay documentación JSDoc en funciones complejas?
- [ ] ¿Los errores tienen manejo apropiado?
- [ ] ¿Los tests cubren los casos principales?
- [ ] ¿Se siguen las convenciones de nomenclatura?
- [ ] ¿El código es fácil de entender sin comentarios?
