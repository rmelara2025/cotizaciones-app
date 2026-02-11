import { Injectable, signal, computed } from '@angular/core';
import { IContrato } from '../../../core/models';

export interface IWizardCliente {
    rutCliente: string;
    nombreCliente: string;
    razonSocial: string;
}

export interface IWizardContratoNuevo {
    cliente: IWizardCliente | null;
    codigoProyecto: string;
    tipoCodigoProyecto: 'CHI' | 'SAP' | 'SISON';
    fechaInicio: Date | null;
    fechaTermino: Date | null;
}

export interface IWizardCotizacion {
    fechaVigenciaDesde: Date | null;
    fechaVigenciaHasta: Date | null;
    observacion: string;
}

export interface IWizardItem {
    numItem: number;
    idServicio: number;
    nombreServicio: string;
    nombreFamilia: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    idTipoMoneda: number;
    nombreMoneda: string;
    idPeriodicidad: number;
    nombrePeriodicidad: string;
    fechaInicioFacturacion: Date | null;
    fechaFinFacturacion: Date | null;
    atributos: any;
    observacion: string;
    idProveedor?: number;
    nombreProveedor?: string;
    _proveedoresDisponibles?: any[];
}

export interface IWizardState {
    // Control de flujo
    pasoActual: number;
    esNuevoContrato: boolean;
    completado: boolean;

    // Datos del contrato
    contratoNuevo: IWizardContratoNuevo | null;
    contratoExistente: IContrato | null;

    // Datos de la cotización
    cotizacion: IWizardCotizacion | null;

    // Items de servicio
    items: IWizardItem[];
}

@Injectable({
    providedIn: 'root'
})
export class WizardService {
    // Estado inicial
    private readonly ESTADO_INICIAL: IWizardState = {
        pasoActual: 1,
        esNuevoContrato: true,
        completado: false,
        contratoNuevo: null,
        contratoExistente: null,
        cotizacion: null,
        items: []
    };

    // Signal principal con todo el estado
    private estado = signal<IWizardState>({ ...this.ESTADO_INICIAL });

    // Computed signals para acceso granular
    readonly pasoActual = computed(() => this.estado().pasoActual);
    readonly esNuevoContrato = computed(() => this.estado().esNuevoContrato);
    readonly completado = computed(() => this.estado().completado);
    readonly contratoNuevo = computed(() => this.estado().contratoNuevo);
    readonly contratoExistente = computed(() => this.estado().contratoExistente);
    readonly cotizacion = computed(() => this.estado().cotizacion);
    readonly items = computed(() => this.estado().items);

    // Computed: contrato actual (puede ser nuevo o existente)
    readonly contratoActual = computed(() => {
        const estado = this.estado();
        return estado.esNuevoContrato ? null : estado.contratoExistente;
    });

    // Computed: validaciones por paso
    readonly paso1Valido = computed(() => true); // Siempre válido (solo elige tipo)

    readonly paso2Valido = computed(() => {
        const estado = this.estado();
        if (estado.esNuevoContrato) {
            // Validar contrato nuevo
            const contrato = estado.contratoNuevo;
            return !!(
                contrato &&
                contrato.cliente &&
                contrato.codigoProyecto &&
                contrato.tipoCodigoProyecto &&
                contrato.fechaInicio &&
                contrato.fechaTermino
            );
        } else {
            // Validar contrato existente seleccionado
            return !!estado.contratoExistente;
        }
    });

    readonly paso3Valido = computed(() => {
        const cotizacion = this.estado().cotizacion;
        return !!(
            cotizacion &&
            cotizacion.fechaVigenciaDesde &&
            cotizacion.fechaVigenciaHasta
        );
    });

    readonly paso4Valido = computed(() => {
        const items = this.estado().items;
        // Al menos un item válido
        return items.length > 0 && items.every(item =>
            item.idServicio > 0 &&
            item.cantidad > 0 &&
            item.precioUnitario > 0 &&
            item.idTipoMoneda > 0 &&
            item.idPeriodicidad > 0
        );
    });

    // Métodos para modificar el estado
    setTipoOperacion(esNuevoContrato: boolean): void {
        this.estado.update(e => ({
            ...e,
            esNuevoContrato,
            pasoActual: 2
        }));
    }

    setContratoNuevo(contrato: IWizardContratoNuevo): void {
        this.estado.update(e => ({
            ...e,
            contratoNuevo: contrato,
            pasoActual: 3
        }));
    }

    setContratoExistente(contrato: IContrato): void {
        this.estado.update(e => ({
            ...e,
            contratoExistente: contrato,
            pasoActual: 3
        }));
    }

    setCotizacion(cotizacion: IWizardCotizacion): void {
        this.estado.update(e => ({
            ...e,
            cotizacion,
            pasoActual: 4
        }));
    }

    setItems(items: IWizardItem[]): void {
        this.estado.update(e => ({
            ...e,
            items,
            pasoActual: 5
        }));
    }

    irAPaso(paso: number): void {
        this.estado.update(e => ({
            ...e,
            pasoActual: paso
        }));
    }

    siguientePaso(): void {
        const actual = this.estado().pasoActual;
        if (actual < 5) {
            this.irAPaso(actual + 1);
        }
    }

    pasoAnterior(): void {
        const actual = this.estado().pasoActual;
        if (actual > 1) {
            this.irAPaso(actual - 1);
        }
    }

    marcarCompletado(): void {
        this.estado.update(e => ({
            ...e,
            completado: true
        }));
    }

    resetear(): void {
        this.estado.set({ ...this.ESTADO_INICIAL });
    }

    // Helper: obtener resumen completo para paso final
    getResumen(): any {
        const estado = this.estado();
        return {
            tipoOperacion: estado.esNuevoContrato ? 'Nuevo Contrato' : 'Contrato Existente',
            contrato: estado.esNuevoContrato ? estado.contratoNuevo : estado.contratoExistente,
            cotizacion: estado.cotizacion,
            items: estado.items,
            totalItems: estado.items.length,
            subtotalGeneral: estado.items.reduce((sum, item) => sum + item.subtotal, 0)
        };
    }
}
