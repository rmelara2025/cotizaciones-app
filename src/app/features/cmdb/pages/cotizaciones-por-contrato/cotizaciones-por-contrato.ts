import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { ContratosService } from '../../../../core/services/contratos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ICotizacion, IContrato, IAccionDisponible } from '../../../../core/models';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { getEstadoSeverity, getIconEstado, getTextEstado } from '../../../../core/utils/commons';

@Component({
    selector: 'app-cotizaciones-por-contrato',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TooltipModule,
        TagModule,
        FormatRutPipe,
        PanelModule,
        DialogModule,
        TextareaModule
    ],
    templateUrl: './cotizaciones-por-contrato.html',
    styleUrl: './cotizaciones-por-contrato.scss',
})
export class CotizacionesPorContrato implements OnInit {
    private cotizacionesService = inject(CotizacionesService);
    private contratosService = inject(ContratosService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    idContrato = signal<string>('');
    contrato = signal<IContrato | null>(null);
    filtrosOriginales: any = {};

    // Funciones de utilidad desde commons
    readonly getEstadoSeverity = getEstadoSeverity;
    readonly getIconEstado = getIconEstado;
    readonly getTextEstado = getTextEstado

    // Mapa de acciones disponibles por cotización
    accionesDisponibles = signal<Map<string, IAccionDisponible[]>>(new Map());

    // Estado del diálogo
    mostrarDialogo = signal(false);
    accionSeleccionada = signal<IAccionDisponible | null>(null);
    cotizacionSeleccionada = signal<ICotizacion | null>(null);
    comentario = signal('');
    motivoRechazo = signal('');
    procesandoCambio = signal(false);

    get cotizaciones() {
        return this.cotizacionesService.cotizaciones();
    }

    get loading() {
        return this.cotizacionesService.loadingCotizaciones();
    }

    get error() {
        return this.cotizacionesService.errorCotizaciones();
    }

    constructor() {
        // Effect para cargar acciones cuando cambian las cotizaciones
        effect(() => {
            const cotizaciones = this.cotizaciones;
            if (cotizaciones && cotizaciones.length > 0) {
                this.cargarAccionesParaTodasLasCotizaciones();
            }
        });
    }

    ngOnInit() {
        // Estrategia de recuperación del contrato en orden de prioridad:
        // 1. Router state (window.history.state)
        // 2. SessionStorage (respaldo)
        // 3. Servicio de contratos en memoria

        const contratoFromState = window.history.state?.['contrato'] as IContrato;
        if (contratoFromState) {
            this.contrato.set(contratoFromState);
            // Guardar en sessionStorage como respaldo
            sessionStorage.setItem('contrato-actual', JSON.stringify(contratoFromState));
            console.log('✅ Contrato recibido por state:', contratoFromState);
        }

        // Leer idContrato de la ruta
        this.route.paramMap.subscribe(params => {
            const id = params.get('idContrato');
            if (id) {
                this.idContrato.set(id);
                this.cotizacionesService.loadCotizacionesPorContrato(id);

                // Si no hay contrato, intentar recuperarlo
                if (!this.contrato()) {
                    // Intentar desde sessionStorage primero
                    const contratoFromStorage = sessionStorage.getItem('contrato-actual');
                    if (contratoFromStorage) {
                        try {
                            const contrato = JSON.parse(contratoFromStorage) as IContrato;
                            if (contrato.idContrato === id) {
                                this.contrato.set(contrato);
                                console.log('♻️ Contrato recuperado de sessionStorage');
                                return;
                            }
                        } catch (e) {
                            console.error('Error parseando contrato de sessionStorage:', e);
                        }
                    }

                    // Fallback: buscar en servicio de contratos
                    const found = this.contratosService.contratos().find(c => c.idContrato === id);
                    if (found) {
                        this.contrato.set(found);
                        sessionStorage.setItem('contrato-actual', JSON.stringify(found));
                        console.log('🔄 Contrato encontrado en servicio');
                    } else {
                        console.warn('⚠️ No se pudo recuperar el contrato para ID:', id);
                    }
                }
            }
        });

        // Guardar query params originales para volver con los filtros
        this.route.queryParams.subscribe(params => {
            const { clienteNombre, ...filtros } = params;
            this.filtrosOriginales = filtros;
        });
    }

    onVerDetalle(cotizacion: ICotizacion) {
        // Navegar al detalle pasando idContrato y filtros originales como query params
        const queryParams = {
            ...this.filtrosOriginales,
            idContrato: this.idContrato()
        };

        const contratoActual = this.contrato();
        if (contratoActual) {
            // Actualizar sessionStorage antes de navegar
            sessionStorage.setItem('contrato-actual', JSON.stringify(contratoActual));
        }

        this.router.navigate(['/cotizaciones/cotizacion-detalle', cotizacion.idCotizacion], {
            queryParams,
            state: { contrato: contratoActual }
        });
    }

    volver() {
        // Volver a la lista de contratos con los filtros originales
        this.router.navigate(['/cotizaciones'], { queryParams: this.filtrosOriginales });
    }

    /**
     * Carga las acciones disponibles para todas las cotizaciones
     */
    async cargarAccionesParaTodasLasCotizaciones() {
        const cotizaciones = this.cotizaciones;
        const mapaAcciones = new Map<string, IAccionDisponible[]>();

        console.log('🔍 Cargando acciones para', cotizaciones.length, 'cotizaciones');

        for (const cotizacion of cotizaciones) {
            const estadoId = this.getIdEstadoFromNombre(cotizacion.estadoNombre);
            console.log(`📋 Cotización ${cotizacion.numeroCotizacion} - Estado: ${cotizacion.estadoNombre} (ID: ${estadoId})`);

            const acciones = await this.cotizacionesService.obtenerAccionesDisponibles(estadoId);
            console.log(`✅ Acciones disponibles:`, acciones);

            mapaAcciones.set(cotizacion.idCotizacion, acciones);
        }

        this.accionesDisponibles.set(mapaAcciones);
        console.log('📦 Mapa de acciones completo:', this.accionesDisponibles());
    }

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

    /**
     * Obtiene las acciones disponibles para una cotización específica
     */
    obtenerAcciones(cotizacion: ICotizacion): IAccionDisponible[] {
        const allAcciones = this.accionesDisponibles().get(cotizacion.idCotizacion) || [];
        return allAcciones.filter(accion => this.shouldShowAction(accion));
    }

    /**
     * Maneja el clic en un botón de acción
     */
    onAccionClick(accion: IAccionDisponible, cotizacion: ICotizacion) {
        this.accionSeleccionada.set(accion);
        this.cotizacionSeleccionada.set(cotizacion);
        this.comentario.set('');
        this.motivoRechazo.set('');

        // Si la acción requiere comentario o motivo, mostrar diálogo
        if (accion.requiereComentario || accion.requiereMotivoRechazo) {
            this.mostrarDialogo.set(true);
        } else {
            // Ejecutar directamente
            this.ejecutarCambioEstado();
        }
    }

    /**
     * Cierra el diálogo sin ejecutar cambios
     */
    cerrarDialogo() {
        this.mostrarDialogo.set(false);
        this.accionSeleccionada.set(null);
        this.cotizacionSeleccionada.set(null);
        this.comentario.set('');
        this.motivoRechazo.set('');
    }

    /**
     * Valida y ejecuta el cambio de estado
     */
    async confirmarCambioEstado() {
        const accion = this.accionSeleccionada();
        const cotizacion = this.cotizacionSeleccionada();

        if (!accion || !cotizacion) return;

        // Validar campos obligatorios
        if (accion.requiereComentario && !this.comentario().trim()) {
            alert('El comentario es obligatorio para esta acción');
            return;
        }

        if (accion.requiereMotivoRechazo && !this.motivoRechazo().trim()) {
            alert('El motivo de rechazo es obligatorio para esta acción');
            return;
        }

        this.ejecutarCambioEstado();
    }

    /**
     * Ejecuta el cambio de estado en el backend
     */
    async ejecutarCambioEstado() {
        const accion = this.accionSeleccionada();
        const cotizacion = this.cotizacionSeleccionada();

        if (!accion || !cotizacion) return;

        this.procesandoCambio.set(true);

        try {
            await this.cotizacionesService.actualizarEstado(
                cotizacion.idCotizacion,
                accion.idEstadoDestino,
                this.comentario().trim() || undefined,
                this.motivoRechazo().trim() || undefined
            ).toPromise();

            // Cerrar diálogo y recargar
            this.cerrarDialogo();

            // Recargar cotizaciones y acciones
            this.cotizacionesService.loadCotizacionesPorContrato(this.idContrato());

            console.log('✅ Estado actualizado correctamente');
        } catch (error: any) {
            console.error('❌ Error al actualizar estado:', error);

            let mensajeError = 'Error al actualizar el estado de la cotización';
            if (error.status === 403) {
                mensajeError = 'No tienes permisos para realizar esta transición';
            } else if (error.status === 400) {
                mensajeError = error.error?.message || 'Faltan campos obligatorios';
            }

            alert(mensajeError);
        } finally {
            this.procesandoCambio.set(false);
        }
    }

    getIdEstadoFromNombre(nombre: string): number {
        const estadoMap: { [key: string]: number } = {
            'BORRADOR': 1,
            'EN_REVISION': 2,
            'APROBADA': 3,
            'VIGENTE': 4,
            'REEMPLAZADA': 5,
            'ANULADA': 6,
            'CANCELADA': 7,
            'DE_BAJA': 8
        };
        return estadoMap[nombre?.toUpperCase()] || 1;
    }

    isEstadoFinal(estadoNombre: string): boolean {
        const estadosFinales = ['REEMPLAZADA', 'ANULADA', 'CANCELADA', 'DE_BAJA'];
        return estadosFinales.includes(estadoNombre?.toUpperCase());
    }
}
