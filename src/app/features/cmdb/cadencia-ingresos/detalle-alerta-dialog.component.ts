import { Component, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ICadenciaAlerta } from '../../../core/models/reporte.model';

@Component({
    selector: 'app-detalle-alerta-dialog',
    imports: [
        CommonModule,
        DialogModule,
        ButtonModule,
        TableModule,
        TagModule
    ],
    templateUrl: './detalle-alerta-dialog.component.html',
    styleUrl: './detalle-alerta-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetalleAlertaDialogComponent {
    visible = model<boolean>(false);
    alerta = model<ICadenciaAlerta | null>(null);

    servicios = computed(() => this.alerta()?.serviciosQueTerminan || []);
    totalMonto = computed(() =>
        this.servicios().reduce((sum, s) => sum + s.montoMensual, 0)
    );

    formatMes(mes: string): string {
        const [year, month] = mes.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${meses[parseInt(month) - 1]} ${year}`;
    }

    formatNumber(value: number): string {
        return new Intl.NumberFormat('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    getSeverityTag(severidad: string): 'danger' | 'warn' | 'info' {
        switch (severidad) {
            case 'CRITICA': return 'danger';
            case 'ALTA': return 'warn';
            case 'MEDIA': return 'info';
            default: return 'info';
        }
    }

    getPeriodicidadTag(periodicidad: string): 'success' | 'info' | 'warn' {
        switch (periodicidad) {
            case 'MENSUAL': return 'success';
            case 'ANUAL': return 'info';
            case 'ONE_SHOT': return 'warn';
            default: return 'info';
        }
    }

    cerrar(): void {
        this.visible.set(false);
    }
}
