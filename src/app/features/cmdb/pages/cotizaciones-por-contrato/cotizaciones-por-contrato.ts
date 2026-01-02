import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { ICotizacion } from '../../../../core/models';

@Component({
    selector: 'app-cotizaciones-por-contrato',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, TagModule],
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

    ngOnInit() {
        if (this.idContrato) {
            this.cotizacionesService.loadCotizacionesPorContrato(this.idContrato);
        }
    }

    onVerDetalle(cotizacion: ICotizacion) {
        // Emitir evento para que el componente padre maneje la navegación al detalle
        this.verDetalleCotizacion.emit(cotizacion.idCotizacion);
    }

    onCerrar() {
        this.cerrar.emit();
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
