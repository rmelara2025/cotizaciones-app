# Propuesta: Wizard para Contratos y Cotizaciones

## Problema Actual
El flujo actual puede ser confuso porque:
- No está claro si crear primero el contrato o la cotización
- Los usuarios deben navegar entre diferentes secciones
- No hay una guía paso a paso para el proceso completo

## Propuesta: Wizard Multi-paso

### Flujo 1: Nuevo Contrato + Cotización
```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: ¿Qué deseas hacer?                                 │
│  ○ Crear nuevo contrato con cotización                      │
│  ○ Agregar cotización a contrato existente                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2A: Datos del Contrato (si es nuevo)                  │
│  • Cliente (buscar o crear)                                 │
│  • RUT del cliente                                          │
│  • Fecha inicio/término                                     │
│  • Código proyecto (SAP/CHI/SISON)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2B: Seleccionar Contrato (si es existente)            │
│  • Buscar por cliente                                       │
│  • Filtrar por estado                                       │
│  • Ver contratos activos                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Datos de la Cotización                             │
│  • Fecha emisión                                            │
│  • Vigencia desde/hasta                                     │
│  • Observaciones                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Agregar Items de Servicio                          │
│  • Buscar servicios por familia                             │
│  • Cantidad y precio unitario                               │
│  • Moneda y periodicidad                                    │
│  • Fechas de facturación                                    │
│  [+ Agregar más items]                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: Resumen y Confirmación                             │
│  • Revisar todos los datos                                  │
│  • Ver totales por moneda                                   │
│  • Confirmar o volver atrás                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ✅ Creado!
```

## Ventajas del Wizard

### 1. **Guía Clara**
- El usuario sabe exactamente en qué paso está
- Puede volver atrás para corregir
- Ve el progreso visualmente

### 2. **Validación por Paso**
- Cada paso valida antes de continuar
- Evita datos incompletos
- Mensajes de error contextuales

### 3. **Flexibilidad**
- Permite ambos flujos (nuevo/existente)
- Se adapta según la selección del paso 1
- Mantiene los datos si el usuario vuelve atrás

### 4. **Reducción de Errores**
- Validación temprana
- Autocompletado de campos relacionados
- Vista previa antes de confirmar

## Implementación Técnica

### Componentes Angular Necesarios

```typescript
// Stepper principal
<p-stepper [(activeStep)]="activeStep">
  
  <!-- Paso 1: Tipo de operación -->
  <p-stepperPanel header="Tipo de Operación">
    <ng-template pTemplate="content">
      <app-wizard-tipo-operacion 
        (siguiente)="onSeleccionTipo($event)">
      </app-wizard-tipo-operacion>
    </ng-template>
  </p-stepperPanel>

  <!-- Paso 2: Contrato -->
  <p-stepperPanel header="Contrato">
    <ng-template pTemplate="content">
      <app-wizard-contrato 
        *ngIf="esNuevoContrato"
        (siguiente)="onContratoCreado($event)"
        (atras)="volverAtras()">
      </app-wizard-contrato>
      
      <app-wizard-seleccionar-contrato 
        *ngIf="!esNuevoContrato"
        (siguiente)="onContratoSeleccionado($event)"
        (atras)="volverAtras()">
      </app-wizard-seleccionar-contrato>
    </ng-template>
  </p-stepperPanel>

  <!-- Paso 3: Datos Cotización -->
  <p-stepperPanel header="Cotización">
    <ng-template pTemplate="content">
      <app-wizard-cotizacion 
        [contrato]="contratoSeleccionado"
        (siguiente)="onCotizacionCreada($event)"
        (atras)="volverAtras()">
      </app-wizard-cotizacion>
    </ng-template>
  </p-stepperPanel>

  <!-- Paso 4: Items de Servicio -->
  <p-stepperPanel header="Items">
    <ng-template pTemplate="content">
      <app-wizard-items 
        [cotizacion]="cotizacionCreada"
        (siguiente)="onItemsAgregados($event)"
        (atras)="volverAtras()">
      </app-wizard-items>
    </ng-template>
  </p-stepperPanel>

  <!-- Paso 5: Resumen -->
  <p-stepperPanel header="Confirmar">
    <ng-template pTemplate="content">
      <app-wizard-resumen 
        [datosCompletos]="resumenCompleto"
        (confirmar)="onConfirmar()"
        (atras)="volverAtras()">
      </app-wizard-resumen>
    </ng-template>
  </p-stepperPanel>

</p-stepper>
```

### Estado Compartido (Signal)

```typescript
export class WizardService {
  // Estado del wizard
  private estadoWizard = signal<WizardState>({
    paso: 1,
    esNuevoContrato: true,
    contrato: null,
    cotizacion: null,
    items: [],
    totales: []
  });

  // Métodos para avanzar/retroceder
  siguientePaso() { /* ... */ }
  pasoAnterior() { /* ... */ }
  resetear() { /* ... */ }
  
  // Guardar datos de cada paso
  setContrato(contrato: IContrato) { /* ... */ }
  setCotizacion(cotizacion: ICotizacion) { /* ... */ }
  addItem(item: IItem) { /* ... */ }
}
```

## Ubicación en el Menú

### Opción 1: Botón Flotante Principal
```
┌────────────────────┐
│  CMDB Dashboard    │
│                    │
│  [Lista]           │
│                    │
│         [+ Nuevo]  │ ← Botón flotante FAB
└────────────────────┘
```

Al hacer clic abre el wizard en modal fullscreen o nueva ruta.

### Opción 2: En el Menú Principal
```
📋 Contratos
   ├─ Listar Contratos
   ├─ ➕ Nuevo Contrato + Cotización (Wizard)
   └─ 📄 Nueva Cotización en Contrato Existente

📊 Cotizaciones
   ├─ Listar Todas
   └─ Por Contrato
```

### Opción 3: Card de Inicio (Recomendado)
```
┌──────────────────────────────────────────┐
│  ¿Qué deseas hacer?                      │
│                                          │
│  ┌────────────┐  ┌────────────┐         │
│  │ 📝 Crear   │  │ 📄 Agregar │         │
│  │  Contrato  │  │ Cotización │         │
│  │    Nuevo   │  │  Existente │         │
│  └────────────┘  └────────────┘         │
│                                          │
│  ┌────────────┐  ┌────────────┐         │
│  │ 📋 Ver     │  │ 📊 Dashboard│        │
│  │ Contratos  │  │            │         │
│  └────────────┘  └────────────┘         │
└──────────────────────────────────────────┘
```

## Recomendación Final

✅ **Implementar Wizard con estas características:**

1. **Paso 1**: Radio buttons grandes para elegir flujo
2. **Pasos siguientes**: Formularios con validación inline
3. **Navegación**: Botones "Atrás" / "Siguiente" / "Confirmar"
4. **Estado**: Guard que previene salir sin confirmar
5. **Responsive**: Funciona en móvil y desktop

¿Quieres que implemente el wizard completo? Puedo crear:
- Los componentes Angular
- El servicio de estado compartido
- Las rutas y navegación
- La integración con PrimeNG Stepper
