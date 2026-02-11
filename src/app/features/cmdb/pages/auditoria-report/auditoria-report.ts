import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReportesService } from '../../../../core/services/reportes.service';

@Component({
    selector: 'app-auditoria-report',
    imports: [CommonModule, ButtonModule, PanelModule, ToastModule],
    template: `
    <p-toast></p-toast>
    <div class="audit-grid">
      <p-panel header="Auditoria de logins">
        <div class="report-card">
          <p class="report-description">
            Descarga un archivo Excel con el historial de logins de los ultimos 6 meses.
          </p>
          <p-button
            label="Descargar XLSX"
            icon="pi pi-download"
            [loading]="loadingLogin()"
            (onClick)="descargarLogin()"
          ></p-button>
        </div>
      </p-panel>

      <p-panel header="Historial de cotizaciones">
        <div class="report-card">
          <p class="report-description">
            Descarga un archivo Excel con la historia de cambios de las cotizaciones de los ultimos 6 meses.
          </p>
          <p-button
            label="Descargar XLSX"
            icon="pi pi-download"
            [loading]="loadingHistorial()"
            (onClick)="descargarHistorial()"
          ></p-button>
        </div>
      </p-panel>
    </div>
  `,
    styles: [
        `
      .audit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }
      .report-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        text-align: center;
      }
      .report-description {
        margin: 0;
        color: #52606d;
        max-width: 560px;
      }
    `
    ],
    providers: [MessageService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditoriaReportComponent {
    private reportesService = inject(ReportesService);
    private messageService = inject(MessageService);

    loadingLogin = signal(false);
    loadingHistorial = signal(false);

    descargarLogin(): void {
        if (this.loadingLogin()) return;

        this.loadingLogin.set(true);
        this.reportesService.exportarLoginAuditExcel().subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) {
                    this.loadingLogin.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo generar el archivo.'
                    });
                    return;
                }

                const fileName = this.extractFileName(response.headers.get('content-disposition'))
                    || `Login_Audit_${this.formatDate(new Date())}.xlsx`;

                this.downloadBlob(blob, fileName);
                this.loadingLogin.set(false);
            },
            error: () => {
                this.loadingLogin.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo descargar el reporte.'
                });
            }
        });
    }

    descargarHistorial(): void {
        if (this.loadingHistorial()) return;

        this.loadingHistorial.set(true);
        this.reportesService.exportarHistorialCotizacionesExcel().subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) {
                    this.loadingHistorial.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo generar el archivo.'
                    });
                    return;
                }

                const fileName = this.extractFileName(response.headers.get('content-disposition'))
                    || `Historial_Cotizaciones_${this.formatDate(new Date())}.xlsx`;

                this.downloadBlob(blob, fileName);
                this.loadingHistorial.set(false);
            },
            error: () => {
                this.loadingHistorial.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo descargar el reporte.'
                });
            }
        });
    }

    private downloadBlob(blob: Blob, fileName: string): void {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    private extractFileName(contentDisposition: string | null): string | null {
        if (!contentDisposition) return null;
        const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
        return match?.[1] ?? null;
    }

    private formatDate(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    }
}
