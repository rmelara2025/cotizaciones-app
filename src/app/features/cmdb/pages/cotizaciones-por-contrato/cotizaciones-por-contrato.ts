import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { ICotizacion, IEstadoCotizacion } from '../../../../core/models';

@Component({
    selector: 'app-cotizaciones-por-contrato',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TooltipModule, TagModule, SelectModule],
    templateUrl: './cotizaciones-por-contrato.html',
    styleUrl: './cotizaciones-por-contrato.scss',
})
export class CotizacionesPorContrato implements OnInit {
    @Input() idContrato!: string;
    @Input() nombreCliente?: string;
    @Output() verDetalleCotizacion = new EventEmitter<string>();
    @Output() cerrar = new EventEmitter<void>();

    private cotizacionesService = inject(CotizacionesService);

    get cotizaciones() {
        return this.cotizacionesService.cotizaciones();
    }

    get loading() {
        return this.cotizacionesService.loadingCotizaciones();
    }

    get error() {
        return this.cotizacionesService.errorCotizaciones();
    }

    get estados() {
        return this.cotizacionesService.estados();
    }

    ngOnInit() {
        if (this.idContrato) {
            this.cotizacionesService.loadCotizacionesPorContrato(this.idContrato);
        }
        // Cargar estados disponibles
        this.cotizacionesService.loadEstados();
    }

    onVerDetalle(cotizacion: ICotizacion) {
        // Emitir evento para que el componente padre maneje la navegación al detalle
        this.verDetalleCotizacion.emit(cotizacion.idCotizacion);
    }

    onCerrar() {
        this.cerrar.emit();
    }

    onEstadoChange(cotizacion: ICotizacion, event: any) {
        const nuevoEstadoId = event.value;
        if (nuevoEstadoId) {
            this.cotizacionesService.actualizarEstado(cotizacion.idCotizacion, nuevoEstadoId).subscribe({
                next: () => {
                    // Recargar la lista de cotizaciones para reflejar el cambio
                    this.cotizacionesService.loadCotizacionesPorContrato(this.idContrato);
                },
                error: (err) => {
                    console.error('Error al actualizar estado:', err);
                    alert('Error al actualizar el estado de la cotización');
                }
            });
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

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const estadoUpper = estado?.toUpperCase();
        switch (estadoUpper) {
            case 'VIGENTE':
                return 'success';
            case 'APROBADA':
                return 'info';
            case 'EN_REVISION':
            case 'BORRADOR':
                return 'warn';
            case 'ANULADA':
            case 'CANCELADA':
            case 'DE_BAJA':
                return 'danger';
            case 'REEMPLAZADA':
                return 'secondary';
            default:
                return 'info';
        }
    }
}
