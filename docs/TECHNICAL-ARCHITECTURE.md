# Arquitectura Técnica Detallada

## 🏗️ Visión General del Sistema

### Stack Tecnológico

**Frontend**:
- Angular 20 (Standalone Components)
- TypeScript 5.x
- PrimeNG 17.x (UI Components)
- RxJS 7.x (Reactive Programming)
- Signals API (State Management)

**Backend**:
- Spring Boot 3.3.5
- Java 21 (LTS)
- MySQL 8.3.0
- JPA/Hibernate 6.5.3
- Maven 3.9.x

---

## 📐 Arquitectura Frontend

### Estructura de Carpetas (Clean Architecture)

```
src/app/
│
├── core/                           # Capa de Infraestructura
│   ├── models/                     # Domain Models (DTOs)
│   │   ├── cliente.model.ts
│   │   ├── contrato.model.ts
│   │   ├── cotizacion.model.ts
│   │   ├── dashboard.model.ts
│   │   ├── expiry.model.ts
│   │   ├── filter.model.ts
│   │   ├── totals.model.ts
│   │   └── index.ts               # Barrel Export
│   │
│   ├── services/                   # Business Logic Layer
│   │   ├── auth.service.ts        # Autenticación
│   │   ├── contratos.service.ts   # CRUD Contratos
│   │   ├── cotizaciones.service.ts # CRUD Cotizaciones
│   │   ├── catalogos.service.ts   # Datos maestros
│   │   ├── dashboard.service.ts   # Métricas y reportes
│   │   ├── expiry.service.ts      # Cálculos de vencimiento
│   │   └── logging.service.ts     # Logging centralizado
│   │
│   ├── pipes/                      # Presentation Transformers
│   │   └── format-rut.pipe.ts
│   │
│   ├── utils/                      # Pure Utility Functions
│   │   ├── auth.guard.ts
│   │   ├── auth.interceptor.ts
│   │   ├── commons.ts
│   │   ├── date.utils.ts
│   │   └── rut.utils.ts
│   │
│   └── interceptors/
│
├── features/                       # Módulos de Negocio
│   └── cmdb/
│       ├── pages/                  # Smart Components (Container)
│       │   ├── clientes-list/
│       │   ├── contactos-list/
│       │   ├── cotizacion-detalle/
│       │   ├── cotizaciones-list/
│       │   ├── cotizaciones-por-contrato/
│       │   ├── dashboard-recurrentes/
│       │   ├── login/
│       │   └── wizard-contrato/
│       │
│       ├── components/             # Dumb Components (Presentational)
│       │   └── wizard/
│       │       ├── wizard-paso1-cliente.component.ts
│       │       ├── wizard-paso2-contrato.component.ts
│       │       ├── wizard-paso3-cotizacion.component.ts
│       │       ├── wizard-paso4-items.component.ts
│       │       └── wizard-paso5-resumen.component.ts
│       │
│       └── services/               # Feature-specific Services
│           └── wizard.service.ts
│
├── layout/                         # Layout Components
│   ├── navbar.component.ts
│   └── sidenav.component.ts
│
├── shared/                         # Shared Components
│
└── environments/                   # Configuration
    ├── environment.ts
    ├── environment.qa.ts
    └── environment.prod.ts
```

### Flujo de Datos (Data Flow)

```
┌─────────────┐
│  Component  │  Smart Component (Container)
│   (Page)    │  - Maneja estado
└──────┬──────┘  - Llama servicios
       │         - Pasa datos a componentes hijos
       │
       ▼
┌─────────────┐
│   Service   │  Business Logic Layer
│             │  - HTTP calls
│             │  - Estado con Signals
└──────┬──────┘  - Transformación de datos
       │
       ▼
┌─────────────┐
│ HTTP Client │  Infrastructure Layer
│ Interceptor │  - Auth headers
└──────┬──────┘  - Error handling
       │
       ▼
┌─────────────┐
│   Backend   │  REST API
│  (Spring)   │  - Validación
└─────────────┘  - Persistencia
```

---

## 🔧 Patrones de Diseño Aplicados

### 1. **Repository Pattern** (Backend)

```java
// Interface define el contrato
public interface CotizacionRepository extends JpaRepository<Cotizacion, UUID> {
    @Query("SELECT c FROM Cotizacion c WHERE c.idContrato = :idContrato")
    List<Cotizacion> findByIdContrato(UUID idContrato);
}

// Service usa el repositorio
@Service
public class CotizacionService {
    private final CotizacionRepository repository;
    
    public List<CotizacionResponse> obtenerPorContrato(UUID idContrato) {
        return repository.findByIdContrato(idContrato)
            .stream()
            .map(mapper::toResponse)
            .toList();
    }
}
```

### 2. **Service Layer Pattern** (Frontend)

```typescript
@Injectable({ providedIn: 'root' })
export class CotizacionesService {
    private http = inject(HttpClient);
    
    // Estado centralizado
    cotizaciones = signal<ICotizacion[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);
    
    // Métodos de negocio
    async obtenerCotizaciones(idContrato: string): Promise<void> {
        this.loading.set(true);
        try {
            const data = await firstValueFrom(
                this.http.get<ICotizacion[]>(`/api/contratos/${idContrato}/cotizaciones`)
            );
            this.cotizaciones.set(data);
        } finally {
            this.loading.set(false);
        }
    }
}
```

### 3. **DTO Pattern** (Data Transfer Objects)

```typescript
// Request DTO (Frontend → Backend)
interface ContratoRequest {
    rutCliente: string;
    numeroContrato: string;
    nombreContrato: string;
    fechaInicio: string;  // YYYY-MM-DD
    fechaTermino: string; // YYYY-MM-DD
    idUsuarioCreacion: string;
}

// Response DTO (Backend → Frontend)
interface ContratoResponse {
    idContrato: string;
    numeroContrato: string;
    nombreContrato: string;
    cliente: ICliente;
    fechaCreacion: string;
}
```

### 4. **Facade Pattern** (Wizard Service)

```typescript
// WizardService actúa como fachada para el flujo complejo
@Injectable({ providedIn: 'root' })
export class WizardService {
    // Estado compartido entre 5 pasos
    paso = signal(1);
    contratoSeleccionado = signal<IContrato | null>(null);
    cotizacion = signal<Partial<ICotizacion> | null>(null);
    items = signal<IItemEditable[]>([]);
    
    // Navegación simplificada
    siguientePaso() { this.paso.update(p => p + 1); }
    pasoAnterior() { this.paso.update(p => p - 1); }
    
    // Validación centralizada
    puedeAvanzar(): boolean {
        switch(this.paso()) {
            case 1: return this.esNuevoContrato() ? !!this.contratoNuevo() : !!this.contratoSeleccionado();
            case 2: return !!this.contrato();
            case 3: return !!this.cotizacion();
            case 4: return this.items().length > 0;
            default: return false;
        }
    }
}
```

### 5. **Strategy Pattern** (Date Formatting)

```typescript
// Estrategia para formato ISO (contratos, cotizaciones)
export function formatDateForBackend(date: Date): string {
    return `${date.getFullYear()}-${month}-${day}`; // YYYY-MM-DD
}

// Estrategia para formato chileno (items de cotización)
export function formatDateForItemBackend(date: Date): string {
    return `${day}-${month}-${date.getFullYear()}`; // DD-MM-YYYY
}

// Uso según contexto
contratoRequest.fechaInicio = formatDateForBackend(fecha);        // ISO
itemRequest.fechaInicioFacturacion = formatDateForItemBackend(fecha); // Chilean
```

### 6. **Observer Pattern** (Signals + Computed)

```typescript
export class CotizacionDetalleComponent {
    // Observable state
    cotizacion = signal<ICotizacionDetalle | null>(null);
    items = signal<IItemEditable[]>([]);
    
    // Computed value (auto-updates cuando cotizacion cambia)
    totalesPorMoneda = computed(() => {
        const cot = this.cotizacion();
        return cot?.totales || [];
    });
    
    // El template se actualiza automáticamente
    // <div>{{ totalesPorMoneda() }}</div>
}
```

---

## 🔐 Seguridad

### Autenticación y Autorización

```typescript
// Auth Guard protege rutas
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
    }
    return true;
};

// Auth Interceptor añade headers
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    
    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }
    
    return next(req);
};
```

### Backend Security (Spring Security)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        
        return http.build();
    }
}
```

---

## 📡 Comunicación API

### REST API Endpoints

```
┌──────────────────────────────────────────────────────────┐
│                    API Endpoints                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  CONTRATOS                                                │
│  ├─ POST   /api/contratos                                │
│  ├─ GET    /api/contratos                                │
│  ├─ GET    /api/contratos/{id}                           │
│  └─ GET    /api/contratos/{id}/cotizaciones              │
│                                                           │
│  COTIZACIONES                                             │
│  ├─ POST   /api/cotizaciones                             │
│  ├─ GET    /api/cotizaciones/{id}                        │
│  ├─ POST   /api/cotizaciones/{id}/versionar              │
│  ├─ POST   /api/cotizaciones/{id}/items                  │
│  └─ GET    /api/cotizaciones/estados                     │
│                                                           │
│  CLIENTES                                                 │
│  ├─ POST   /api/clientes                                 │
│  ├─ GET    /api/clientes                                 │
│  └─ GET    /api/clientes/{rut}                           │
│                                                           │
│  CATALOGOS                                                │
│  ├─ GET    /api/catalogos/servicios                      │
│  ├─ GET    /api/catalogos/monedas                        │
│  └─ GET    /api/catalogos/periodicidades                 │
│                                                           │
│  DASHBOARD                                                │
│  └─ GET    /api/dashboard/recurrentes                    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Request/Response Flow

```
Frontend                      Backend                       Database
   │                             │                              │
   │  POST /api/contratos        │                              │
   ├──────────────────────────>  │                              │
   │                             │  Validate Request            │
   │                             │  (Jakarta Validation)        │
   │                             │                              │
   │                             │  INSERT INTO contratos       │
   │                             ├────────────────────────────> │
   │                             │                              │
   │                             │  <────────────────────────── │
   │                             │  Generated ID (UUID)         │
   │                             │                              │
   │  ContratoResponse (201)     │  Map Entity → Response       │
   │  <──────────────────────────┤                              │
   │                             │                              │
```

---

## 💾 Modelo de Datos (Backend)

### Entidades Principales

```java
// Contrato.java
@Entity
@Table(name = "contratos")
public class Contrato {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idContrato;
    
    private String numeroContrato;
    private String nombreContrato;
    
    @ManyToOne
    @JoinColumn(name = "rut_cliente")
    private Cliente cliente;
    
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;
    
    @Column(name = "fecha_termino")
    private LocalDate fechaTermino;
    
    // Audit fields
    @Column(name = "id_usuario_creacion")
    private String idUsuarioCreacion;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
}

// Cotizacion.java
@Entity
@Table(name = "cotizaciones")
public class Cotizacion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idCotizacion;
    
    private String numeroCotizacion;
    
    @ManyToOne
    @JoinColumn(name = "id_contrato")
    private Contrato contrato;
    
    private Integer version;
    
    @Column(name = "id_cotizacion_anterior")
    private UUID idCotizacionAnterior;
    
    @Enumerated(EnumType.STRING)
    private EstadoCotizacion estado;
    
    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL)
    private List<CotizacionDetalle> detalles = new ArrayList<>();
}

// CotizacionDetalle.java
@Entity
@Table(name = "cotizacion_detalle")
public class CotizacionDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idDetalle;
    
    @ManyToOne
    @JoinColumn(name = "id_cotizacion")
    private Cotizacion cotizacion;
    
    @Column(name = "num_item")
    private Integer numItem;
    
    @ManyToOne
    @JoinColumn(name = "id_servicio")
    private Servicio servicio;
    
    private Integer cantidad;
    private BigDecimal precioUnitario;
    
    // Columna generada por DB
    @Column(name = "subtotal", insertable = false, updatable = false)
    private BigDecimal subtotal;
    
    @ManyToOne
    @JoinColumn(name = "id_tipo_moneda")
    private TipoMoneda tipoMoneda;
    
    // Fechas en formato DD-MM-YYYY (importante!)
    @Column(name = "fecha_inicio_facturacion")
    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate fechaInicioFacturacion;
    
    @Column(name = "fecha_fin_facturacion")
    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate fechaFinFacturacion;
}
```

### Relaciones

```
Cliente (1) ──┬──> (N) Contrato
              │
              └──> (N) Contacto

Contrato (1) ───> (N) Cotizacion

Cotizacion (1) ───> (N) CotizacionDetalle

CotizacionDetalle (N) ───> (1) Servicio
CotizacionDetalle (N) ───> (1) TipoMoneda
CotizacionDetalle (N) ───> (1) Periodicidad

Servicio (N) ───> (1) FamiliaServicio
```

---

## 🔄 Versionamiento de Cotizaciones

### Estrategia de Versionamiento

Cuando se edita una cotización, se crea una nueva versión:

```
Cotización Original (v1)
├─ idCotizacion: UUID-AAA
├─ version: 1
├─ idCotizacionAnterior: null
└─ estado: APROBADA

       │
       │ Usuario edita items
       ▼

Cotización Nueva (v2)
├─ idCotizacion: UUID-BBB  (nuevo)
├─ version: 2
├─ idCotizacionAnterior: UUID-AAA  (referencia)
└─ estado: BORRADOR

       │
       │ Usuario edita nuevamente
       ▼

Cotización Nueva (v3)
├─ idCotizacion: UUID-CCC
├─ version: 3
├─ idCotizacionAnterior: UUID-BBB
└─ estado: BORRADOR
```

### Backend Implementation

```java
@Transactional
public VersionResponse versionarCotizacion(UUID idCotizacion) {
    // 1. Obtener cotización original
    Cotizacion original = repository.findById(idCotizacion)
        .orElseThrow(() -> new NotFoundException("Cotización no encontrada"));
    
    // 2. Crear nueva versión (copia)
    Cotizacion nuevaVersion = new Cotizacion();
    nuevaVersion.setContrato(original.getContrato());
    nuevaVersion.setVersion(original.getVersion() + 1);
    nuevaVersion.setIdCotizacionAnterior(original.getIdCotizacion());
    nuevaVersion.setEstado(EstadoCotizacion.BORRADOR);
    
    // 3. Copiar detalles
    for (CotizacionDetalle detalle : original.getDetalles()) {
        CotizacionDetalle nuevoDetalle = new CotizacionDetalle();
        // ... copiar campos
        nuevoDetalle.setCotizacion(nuevaVersion);
        nuevaVersion.getDetalles().add(nuevoDetalle);
    }
    
    // 4. Guardar
    Cotizacion saved = repository.save(nuevaVersion);
    
    return new VersionResponse(saved.getIdCotizacion(), saved.getVersion());
}
```

---

## 📝 Logging y Debugging

### Frontend Logging

```typescript
@Injectable({ providedIn: 'root' })
export class LoggingService {
    private isDevelopment = !environment.production;
    
    log(message: string, ...args: any[]): void {
        if (this.isDevelopment) {
            console.log(`[LOG] ${message}`, ...args);
        }
    }
    
    error(message: string, error?: any): void {
        console.error(`[ERROR] ${message}`, error);
        // Enviar a servicio de monitoreo (opcional)
    }
    
    warn(message: string, ...args: any[]): void {
        if (this.isDevelopment) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
}
```

### Backend Logging

```java
@Service
public class CotizacionService {
    private static final Logger log = LoggerFactory.getLogger(CotizacionService.class);
    
    public void guardarItems(UUID idCotizacion, List<CotizacionDetalleItemRequest> items) {
        log.info("Guardando {} items para cotización {}", items.size(), idCotizacion);
        
        try {
            // ... operación
            log.debug("Items guardados exitosamente");
        } catch (Exception e) {
            log.error("Error al guardar items para cotización {}", idCotizacion, e);
            throw e;
        }
    }
}
```

---

## 🚀 Deployment

### Frontend Build

```bash
# Development
npm start

# Production Build
npm run build
# Genera archivos en dist/ con:
# - Minificación
# - Tree-shaking
# - AOT compilation
```

### Backend Build

```bash
# Development
./mvnw spring-boot:run

# Production Build
./mvnw clean package
# Genera: target/backend-cmdb-0.0.1-SNAPSHOT.jar
```

### Docker (Opcional)

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/cotizaciones-app /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

```dockerfile
# Backend Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 📊 Performance Considerations

### Frontend Optimization

1. **Lazy Loading**: Cargar módulos bajo demanda
2. **OnPush Change Detection**: Reducir ciclos de detección
3. **TrackBy Functions**: Optimizar `@for` loops
4. **Signals**: Estado reactivo eficiente

### Backend Optimization

1. **Connection Pooling**: HikariCP (ya configurado)
2. **Query Optimization**: Índices en columnas frecuentes
3. **Pagination**: `Pageable` para grandes datasets
4. **Caching**: `@Cacheable` para datos estáticos

---

## 🔍 Troubleshooting

### Problemas Comunes

1. **DateTimeParseException en Backend**
   - Causa: Formato de fecha incorrecto
   - Solución: Verificar uso de `formatDateForBackend()` vs `formatDateForItemBackend()`

2. **Tests fallan con List.of()**
   - Causa: Java 21 type inference con Object[]
   - Solución: Usar `Arrays.asList()` o `new ArrayList<>()`

3. **CORS Errors**
   - Causa: Backend no permite origen del frontend
   - Solución: Configurar `@CrossOrigin` en controllers

4. **Signal no actualiza template**
   - Causa: Mutación directa del signal
   - Solución: Usar `.set()` o `.update()`, no modificar el objeto directamente

---

## 📚 Referencias Adicionales

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Spring Boot Best Practices](https://spring.io/guides)
- [PrimeNG Documentation](https://primeng.org/)
- [Java 21 Features](https://openjdk.org/projects/jdk/21/)
