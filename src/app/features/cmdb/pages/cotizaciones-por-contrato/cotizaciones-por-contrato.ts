import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { ContratosService } from '../../../../core/services/contratos.service';
import { ICotizacion, IEstadoCotizacion, IContrato } from '../../../../core/models';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';

@Component({
    selector: 'app-cotizaciones-por-contrato',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TooltipModule, TagModule, SelectModule, FormatRutPipe],
    templateUrl: './cotizaciones-por-contrato.html',
    styleUrl: './cotizaciones-por-contrato.scss',
})
export class CotizacionesPorContrato implements OnInit {
    private cotizacionesService = inject(CotizacionesService);
    private contratosService = inject(ContratosService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    idContrato = signal<string>('');
    contrato = signal<IContrato | null>(null);
    filtrosOriginales: any = {};

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
        // AQUÍ SE RECIBE EL ROW COMPLETO desde Router state usando window.history.state
        const contratoFromState = window.history.state?.['contrato'] as IContrato;
        if (contratoFromState) {
            this.contrato.set(contratoFromState);  // Guardas TODO el row aquí
            console.log('Contrato recibido:', contratoFromState); // Para que veas toda la info
        }

        // Leer idContrato de la ruta
        this.route.paramMap.subscribe(params => {
            const id = params.get('idContrato');
            if (id) {
                this.idContrato.set(id);
                this.cotizacionesService.loadCotizacionesPorContrato(id);

                // Si no llegó por state, buscar en servicio (fallback)
                if (!this.contrato()) {
                    const found = this.contratosService.contratos().find(c => c.idContrato === id);
                    if (found) this.contrato.set(found);
                }
            }
        });

        // Guardar query params originales para volver con los filtros
        this.route.queryParams.subscribe(params => {
            const { clienteNombre, ...filtros } = params;
            this.filtrosOriginales = filtros;
        });

        // Cargar estados disponibles
        this.cotizacionesService.loadEstados();
    }

    onVerDetalle(cotizacion: ICotizacion) {
        // Navegar al detalle pasando idContrato y filtros originales como query params
        const queryParams = {
            ...this.filtrosOriginales,
            idContrato: this.idContrato()
        };
        this.router.navigate(['/cotizaciones/cotizacion-detalle', cotizacion.idCotizacion], {
            queryParams,
            state: { contrato: this.contrato() }  // Pasar también el contrato completo si es necesario
        });
    }

    volver() {
        // Volver a la lista de contratos con los filtros originales
        this.router.navigate(['/cotizaciones'], { queryParams: this.filtrosOriginales });
    }

    onEstadoChange(cotizacion: ICotizacion, event: any) {
        const nuevoEstadoId = event.value;
        if (nuevoEstadoId) {
            this.cotizacionesService.actualizarEstado(cotizacion.idCotizacion, nuevoEstadoId).subscribe({
                next: () => {
                    // Recargar la lista de cotizaciones para reflejar el cambio
                    this.cotizacionesService.loadCotizacionesPorContrato(this.idContrato());
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
