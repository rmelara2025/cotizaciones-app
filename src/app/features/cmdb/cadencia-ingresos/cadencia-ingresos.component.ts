import { Component, OnInit, inject, signal, computed, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReportesService } from '../../../core/services/reportes.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { FamiliaService } from '../../../core/services/familia.service';
import { DetalleAlertaDialogComponent } from './detalle-alerta-dialog.component';
import {
    ICadenciaIngresosFilter,
    ICadenciaCliente,
    ICadenciaMes,
    ICadenciaAlerta
} from '../../../core/models/reporte.model';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-cadencia-ingresos',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        DatePickerModule,
        SelectModule,
        TableModule,
        ChartModule,
        MessageModule,
        ProgressSpinnerModule,
        DetalleAlertaDialogComponent
    ],
    templateUrl: './cadencia-ingresos.component.html',
    styleUrl: './cadencia-ingresos.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadenciaIngresosComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly reportesService = inject(ReportesService);
    private readonly clientesService = inject(ClientesService);
    private readonly familiaService = inject(FamiliaService);
    private readonly catalogosService = inject(CatalogosService);

    // Signals
    loading = signal(false);
    clientes = signal<ICadenciaCliente[]>([]);
    clienteSeleccionado = signal<ICadenciaCliente | null>(null);
    clientesDisponibles = signal<any[]>([]);
    monedas = signal<any[]>([]);
    familias = signal<any[]>([]);
    servicios = signal<any[]>([]);
    serviciosFiltrados = signal<any[]>([]);

    // Dialog
    detalleDialog = viewChild.required(DetalleAlertaDialogComponent);

    // Form
    filterForm!: FormGroup;

    // Computed - datos del cliente seleccionado
    ingresosMensuales = computed(() => this.clienteSeleccionado()?.ingresosMensuales || []);
    alertas = computed(() => this.clienteSeleccionado()?.alertas || []);

    // Computed - datos para el gráfico
    chartData = computed(() => {
        const meses = this.ingresosMensuales();
        if (!meses.length) return null;

        return {
            labels: meses.map(m => this.formatMesCorto(m.mes)),
            datasets: [
                {
                    label: 'Ingresos Mensuales',
                    data: meses.map(m => m.monto),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    });

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed.y;
                        const mes = this.ingresosMensuales()[context.dataIndex];
                        return `${mes.moneda} ${this.formatNumber(value)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => this.formatNumber(value)
                }
            }
        }
    };

    ngOnInit(): void {
        this.initForm();
        this.loadCatalogos();
        this.setDefaultDates();
    }

    private initForm(): void {
        const hoy = new Date();
        const enUnAno = new Date();
        enUnAno.setFullYear(hoy.getFullYear() + 1);

        this.filterForm = this.fb.group({
            rutCliente: [null],
            fechaDesde: [hoy],
            fechaHasta: [enUnAno],
            idTipoMoneda: [null],
            idFamiliaServicio: [null],
            idServicio: [null]
        });
    }

    private setDefaultDates(): void {
        const hoy = new Date();
        const enUnAno = new Date();
        enUnAno.setFullYear(hoy.getFullYear() + 1);

        this.filterForm.patchValue({
            fechaDesde: hoy,
            fechaHasta: enUnAno
        });
    }

    private loadCatalogos(): void {
        // Cargar lista de clientes para el dropdown
        this.clientesService.obtenerTodosParaDropdown().subscribe({
            next: (response) => {
                const clientesOptions = [
                    { label: '📊 Todos los Clientes (Consolidado)', value: null }, // Opción para cadencia total
                    ...response.content.map(c => ({
                        label: `${c.nombreCliente} (${c.rutCliente})`,
                        value: c.rutCliente
                    }))
                ];
                this.clientesDisponibles.set(clientesOptions);
            },
            error: (error) => {
                console.error('Error cargando clientes:', error);
            }
        });

        // Cargar familias de servicio
        this.familiaService.getFamilias().subscribe({
            next: (familias) => {
                const familiasOptions = [
                    { label: 'Todas las Familias', value: null },
                    ...familias.map(f => ({
                        label: f.nombreFamilia,
                        value: f.idFamilia
                    }))
                ];
                this.familias.set(familiasOptions);
            },
            error: (error) => {
                console.error('Error cargando familias:', error);
            }
        });

        // Cargar servicios
        this.catalogosService.listarServicios().subscribe({
            next: (servicios) => {
                this.servicios.set(servicios);
                this.serviciosFiltrados.set([...servicios]);
            },
            error: (error) => {
                console.error('Error cargando servicios:', error);
            }
        });

        // Tipos de moneda: No es necesario cargar por ahora (filtro oculto)
        // this.catalogosService.obtenerTiposMoneda().subscribe(...);
    }

    onFamiliaChange(idFamilia: number | null): void {
        // Resetear servicio cuando cambia la familia
        this.filterForm.patchValue({ idServicio: null });
        
        // Filtrar servicios por familia
        if (idFamilia !== null && idFamilia !== undefined) {
            const filtrados = this.servicios().filter(s => s.idFamilia === idFamilia);
            this.serviciosFiltrados.set(filtrados);
        } else {
            // Mostrar todos los servicios si no hay familia seleccionada
            this.serviciosFiltrados.set([...this.servicios()]);
        }
    }

    buscar(): void {
        if (this.filterForm.invalid) return;

        this.loading.set(true);
        const formValue = this.filterForm.value;

        const filter: ICadenciaIngresosFilter = {
            rutCliente: formValue.rutCliente || undefined, // null se envía como undefined para cadencia total
            fechaDesde: formValue.fechaDesde ? this.formatDate(formValue.fechaDesde) : undefined,
            fechaHasta: formValue.fechaHasta ? this.formatDate(formValue.fechaHasta) : undefined,
            idFamiliaServicio: formValue.idFamiliaServicio || undefined,
            idServicio: formValue.idServicio || undefined,
            // idTipoMoneda no se envía por ahora (filtro oculto)
        };

        this.reportesService.obtenerCadenciaIngresos(filter).subscribe({
            next: (response) => {
                this.clientes.set(response.clientes);

                // Seleccionar el cliente apropiado
                if (response.clientes.length > 0) {
                    if (formValue.rutCliente) {
                        // Si hay filtro de cliente, buscar ese cliente específico
                        const clienteFiltrado = response.clientes.find(c => c.rutCliente === formValue.rutCliente);
                        this.clienteSeleccionado.set(clienteFiltrado || response.clientes[0]);
                    } else {
                        // Si no hay filtro (cadencia total), seleccionar el único resultado (TODOS)
                        this.clienteSeleccionado.set(response.clientes[0]);
                    }
                } else {
                    this.clienteSeleccionado.set(null);
                }

                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error al obtener cadencia:', error);
                this.loading.set(false);
            }
        });
    }

    limpiar(): void {
        this.filterForm.reset();
        this.setDefaultDates();
        this.clientes.set([]);
        this.clienteSeleccionado.set(null);
    }

    seleccionarCliente(cliente: ICadenciaCliente): void {
        this.clienteSeleccionado.set(cliente);
    }

    onClienteChange(rutCliente: string | null): void {
        if (!rutCliente) {
            // Si seleccionó "Todos los clientes" o no hay selección
            if (this.clientes().length > 0) {
                // Si ya hay datos, mostrar el primero (que sería el consolidado)
                this.clienteSeleccionado.set(this.clientes()[0]);
            }
            return;
        }

        // Buscar el cliente seleccionado en los resultados
        const cliente = this.clientes().find(c => c.rutCliente === rutCliente);
        if (cliente) {
            this.clienteSeleccionado.set(cliente);
        }
    }

    getSeverityClass(severidad: string): string {
        switch (severidad) {
            case 'CRITICA': return 'severity-critical';
            case 'ALTA': return 'severity-high';
            case 'MEDIA': return 'severity-medium';
            default: return '';
        }
    }

    getSeverityIcon(severidad: string): string {
        switch (severidad) {
            case 'CRITICA': return 'pi pi-exclamation-triangle';
            case 'ALTA': return 'pi pi-exclamation-circle';
            case 'MEDIA': return 'pi pi-info-circle';
            default: return 'pi pi-info';
        }
    }

    getVariacionClass(variacion: number): string {
        if (variacion < -10) return 'variacion-negativa';
        if (variacion > 10) return 'variacion-positiva';
        return 'variacion-neutral';
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private formatMesCorto(mes: string): string {
        const [year, month] = mes.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${meses[parseInt(month) - 1]} ${year}`;
    }

    formatMes(mes: string): string {
        const [year, month] = mes.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${meses[parseInt(month) - 1]} ${year}`;
    }

    formatNumber(value: number): string {
        return new Intl.NumberFormat('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    verDetalleAlerta(alerta: ICadenciaAlerta): void {
        const dialog = this.detalleDialog();
        dialog.alerta.set(alerta);
        dialog.visible.set(true);
    }

    /**
     * Exporta el reporte a Excel usando estrategia híbrida
     */
    async exportarExcel(): Promise<void> {
        const cliente = this.clienteSeleccionado();
        const todosClientes = this.clientes();

        if (!cliente) {
            alert('No hay datos para exportar');
            return;
        }

        // Estrategia híbrida: frontend para pocos datos, backend para muchos
        const esCadenciaTotal = cliente.rutCliente === 'TODOS';
        const cantidadDatos = this.ingresosMensuales().length;

        // Si es cadencia total O tiene más de 500 registros → Backend
        if (esCadenciaTotal || cantidadDatos > 500) {
            this.exportarDesdeBackend();
        } else {
            // Exportación rápida desde frontend
            await this.exportarConExcelJS(cliente);
        }
    }

    /**
     * Exportación frontend con ExcelJS (para reportes pequeños/medianos)
     */
    private async exportarConExcelJS(cliente: ICadenciaCliente): Promise<void> {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CMDB Chile';
            workbook.created = new Date();

            // Hoja 1: Resumen
            this.crearHojaResumen(workbook, cliente);

            // Hoja 2: Ingresos Mensuales
            this.crearHojaIngresos(workbook, cliente);

            // Hoja 3: Alertas (solo si hay alertas)
            if (cliente.alertas.length > 0) {
                this.crearHojaAlertas(workbook, cliente);
            }

            // Generar y descargar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const nombreArchivo = `Cadencia_Ingresos_${this.sanitizeFilename(cliente.nombreCliente)}_${this.getFechaActual()}.xlsx`;
            saveAs(blob, nombreArchivo);

        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al generar el archivo Excel');
        }
    }

    /**
     * Crea la hoja de resumen con datos generales
     */
    private crearHojaResumen(workbook: ExcelJS.Workbook, cliente: ICadenciaCliente): void {
        const sheet = workbook.addWorksheet('Resumen');

        // Título
        sheet.mergeCells('A1:D1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📊 Reporte de Cadencia de Ingresos';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };

        // Información del cliente
        sheet.getCell('A3').value = 'Cliente:';
        sheet.getCell('B3').value = cliente.nombreCliente;
        sheet.getCell('A4').value = 'RUT:';
        sheet.getCell('B4').value = cliente.rutCliente;
        sheet.getCell('A5').value = 'Fecha Generación:';
        sheet.getCell('B5').value = new Date().toLocaleString('es-CL');

        // Estadísticas
        const ingresos = cliente.ingresosMensuales;
        const totalIngresos = ingresos.reduce((sum, m) => sum + Number(m.monto), 0);
        const promedioMensual = ingresos.length > 0 ? totalIngresos / ingresos.length : 0;

        sheet.getCell('A7').value = 'Total Ingresos Proyectados:';
        sheet.getCell('B7').value = this.formatNumber(totalIngresos);
        sheet.getCell('A8').value = 'Promedio Mensual:';
        sheet.getCell('B8').value = this.formatNumber(promedioMensual);
        sheet.getCell('A9').value = 'Meses Analizados:';
        sheet.getCell('B9').value = ingresos.length;
        sheet.getCell('A10').value = 'Total Alertas:';
        sheet.getCell('B10').value = cliente.alertas.length;

        // Alertas por severidad
        const alertasCriticas = cliente.alertas.filter(a => a.severidad === 'CRITICA').length;
        const alertasAltas = cliente.alertas.filter(a => a.severidad === 'ALTA').length;
        const alertasMedias = cliente.alertas.filter(a => a.severidad === 'MEDIA').length;

        sheet.getCell('A12').value = 'Alertas Críticas:';
        sheet.getCell('B12').value = alertasCriticas;
        sheet.getCell('A13').value = 'Alertas Altas:';
        sheet.getCell('B13').value = alertasAltas;
        sheet.getCell('A14').value = 'Alertas Medias:';
        sheet.getCell('B14').value = alertasMedias;

        // Formato
        sheet.getColumn('A').width = 30;
        sheet.getColumn('B').width = 30;
        ['A3', 'A4', 'A5', 'A7', 'A8', 'A9', 'A10', 'A12', 'A13', 'A14'].forEach(cell => {
            sheet.getCell(cell).font = { bold: true };
        });
    }

    /**
     * Crea la hoja de ingresos mensuales
     */
    private crearHojaIngresos(workbook: ExcelJS.Workbook, cliente: ICadenciaCliente): void {
        const sheet = workbook.addWorksheet('Ingresos Mensuales');

        // Headers
        sheet.columns = [
            { header: 'Mes', key: 'mes', width: 15 },
            { header: 'Moneda', key: 'moneda', width: 12 },
            { header: 'Monto', key: 'monto', width: 18 },
            { header: 'Variación %', key: 'variacion', width: 15 },
            { header: 'Servicios Activos', key: 'servicios', width: 18 }
        ];

        // Estilo del header
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Datos
        cliente.ingresosMensuales.forEach(mes => {
            const row = sheet.addRow({
                mes: this.formatMes(mes.mes),
                moneda: mes.moneda,
                monto: Number(mes.monto),
                variacion: Number(mes.variacionPorcentaje),
                servicios: mes.serviciosActivos
            });

            // Formato de moneda
            row.getCell('monto').numFmt = '#,##0';

            // Formato de porcentaje con color
            const variacionCell = row.getCell('variacion');
            variacionCell.numFmt = '0.00"%"';
            if (Number(mes.variacionPorcentaje) < -10) {
                variacionCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            } else if (Number(mes.variacionPorcentaje) > 10) {
                variacionCell.font = { color: { argb: 'FF16A34A' }, bold: true };
            }
        });

        // Bordes
        sheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
    }

    /**
     * Crea la hoja de alertas
     */
    private crearHojaAlertas(workbook: ExcelJS.Workbook, cliente: ICadenciaCliente): void {
        const sheet = workbook.addWorksheet('Alertas');

        // Headers
        sheet.columns = [
            { header: 'Mes', key: 'mes', width: 15 },
            { header: 'Severidad', key: 'severidad', width: 12 },
            { header: 'Monto Perdido', key: 'monto', width: 18 },
            { header: 'Mensaje', key: 'mensaje', width: 60 },
            { header: 'Servicios Afectados', key: 'servicios', width: 20 }
        ];

        // Estilo del header
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Datos
        cliente.alertas.forEach(alerta => {
            const row = sheet.addRow({
                mes: this.formatMes(alerta.mes),
                severidad: alerta.severidad,
                monto: Number(alerta.montoPerdiendose),
                mensaje: alerta.mensaje,
                servicios: alerta.serviciosQueTerminan.length
            });

            // Color según severidad
            const severidadCell = row.getCell('severidad');
            if (alerta.severidad === 'CRITICA') {
                severidadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
                severidadCell.font = { bold: true, color: { argb: 'FFDC2626' } };
            } else if (alerta.severidad === 'ALTA') {
                severidadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
                severidadCell.font = { bold: true, color: { argb: 'FFEA580C' } };
            } else {
                severidadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                severidadCell.font = { bold: true, color: { argb: 'FFCA8A04' } };
            }

            // Formato de moneda
            row.getCell('monto').numFmt = '#,##0';
        });

        // Bordes
        sheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
    }

    /**
     * Exportación backend (para reportes grandes)
     */
    private exportarDesdeBackend(): void {
        const formValue = this.filterForm.value;

        const filter: ICadenciaIngresosFilter = {
            rutCliente: formValue.rutCliente || undefined,
            fechaDesde: formValue.fechaDesde ? this.formatDate(formValue.fechaDesde) : undefined,
            fechaHasta: formValue.fechaHasta ? this.formatDate(formValue.fechaHasta) : undefined,
            idFamiliaServicio: formValue.idFamiliaServicio || undefined,
            idServicio: formValue.idServicio || undefined,
        };

        this.loading.set(true);

        this.reportesService.exportarCadenciaExcel(filter).subscribe({
            next: (blob) => {
                const cliente = this.clienteSeleccionado();
                const nombreArchivo = `Cadencia_Ingresos_${this.sanitizeFilename(cliente?.nombreCliente || 'Consolidado')}_${this.getFechaActual()}.xlsx`;
                saveAs(blob, nombreArchivo);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error al exportar desde backend:', error);
                alert('Error al generar el archivo Excel desde el servidor');
                this.loading.set(false);
            }
        });
    }

    /**
     * Limpia el nombre del archivo
     */
    private sanitizeFilename(nombre: string): string {
        return nombre
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
    }

    /**
     * Obtiene la fecha actual en formato YYYYMMDD
     */
    private getFechaActual(): string {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}
