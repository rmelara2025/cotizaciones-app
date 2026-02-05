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
                        // Si no hay filtro de cliente, crear/buscar el consolidado "TODOS"
                        const consolidado = this.crearClienteConsolidado(response.clientes);
                        this.clienteSeleccionado.set(consolidado);
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
     * Crea un cliente consolidado "TODOS" agrupando todos los clientes individuales
     */
    private crearClienteConsolidado(clientes: ICadenciaCliente[]): ICadenciaCliente {
        // Mapear todos los meses únicos
        const mesesMap = new Map<string, { monto: number, moneda: string, nombreMoneda: string, serviciosActivos: number }>();

        clientes.forEach(cliente => {
            cliente.ingresosMensuales.forEach(mes => {
                const key = mes.mes;
                if (mesesMap.has(key)) {
                    const existing = mesesMap.get(key)!;
                    existing.monto += mes.monto;
                    existing.serviciosActivos += mes.serviciosActivos;
                } else {
                    mesesMap.set(key, {
                        monto: mes.monto,
                        moneda: mes.moneda,
                        nombreMoneda: mes.nombreMoneda,
                        serviciosActivos: mes.serviciosActivos
                    });
                }
            });
        });

        // Convertir a array y ordenar por mes
        const ingresosMensuales: ICadenciaMes[] = Array.from(mesesMap.entries())
            .map(([mes, data]) => ({
                mes,
                monto: data.monto,
                moneda: data.moneda,
                nombreMoneda: data.nombreMoneda,
                variacionPorcentaje: 0,
                serviciosActivos: data.serviciosActivos
            }))
            .sort((a, b) => a.mes.localeCompare(b.mes));

        // Consolidar alertas (las alertas no tienen mucho sentido en consolidado, pero por completitud)
        const alertas: ICadenciaAlerta[] = [];

        return {
            rutCliente: 'TODOS',
            nombreCliente: 'TODOS LOS CLIENTES (CONSOLIDADO)',
            ingresosMensuales,
            alertas
        };
    }

    /**
     * Exporta el reporte a Excel - Incluye matriz de detalle según filtros
     */
    async exportarExcel(): Promise<void> {
        const cliente = this.clienteSeleccionado();

        if (!cliente) {
            alert('No hay datos para exportar');
            return;
        }

        const formValue = this.filterForm.value;
        const hayFiltroCliente = formValue.rutCliente && formValue.rutCliente.trim() !== '';

        // Si hay filtro de cliente específico, usar solo ese cliente
        if (hayFiltroCliente) {
            console.log('📋 Exportando Excel con cliente específico:', cliente.nombreCliente);
            await this.generarExcelDirecto(cliente);
            return;
        }

        // Si NO hay filtro de cliente, obtener TODOS los clientes con los filtros aplicados
        this.loading.set(true);

        const filterTodosClientes: ICadenciaIngresosFilter = {
            rutCliente: undefined, // Sin filtro de cliente - obtener TODOS
            fechaDesde: formValue.fechaDesde ? this.formatDate(formValue.fechaDesde) : undefined,
            fechaHasta: formValue.fechaHasta ? this.formatDate(formValue.fechaHasta) : undefined,
            idFamiliaServicio: formValue.idFamiliaServicio || undefined,
            idServicio: formValue.idServicio || undefined,
        };

        console.log('🔍 Obteniendo todos los clientes para matriz detalle...');

        this.reportesService.obtenerCadenciaIngresos(filterTodosClientes).subscribe({
            next: async (response) => {
                try {
                    // Filtrar solo clientes individuales (excluir TODOS)
                    const clientesIndividuales = response.clientes.filter(c => c.rutCliente !== 'TODOS');
                    console.log('✅ Clientes individuales obtenidos:', clientesIndividuales.length);

                    const workbook = new ExcelJS.Workbook();
                    workbook.creator = 'CMDB Chile';
                    workbook.created = new Date();

                    // Hoja 1: Resumen del cliente actual
                    this.crearHojaResumen(workbook, cliente);

                    // Hoja 2: Ingresos Mensuales del cliente actual
                    this.crearHojaIngresos(workbook, cliente);

                    // Hoja 3: Alertas del cliente actual (solo si hay)
                    if (cliente.alertas.length > 0) {
                        this.crearHojaAlertas(workbook, cliente);
                    }

                    // Hoja 4: DETALLE POR CLIENTE - TODOS los clientes
                    if (clientesIndividuales.length > 0) {
                        console.log('📊 Creando matriz detalle con', clientesIndividuales.length, 'clientes');
                        this.crearHojaDetalleClientes(workbook, clientesIndividuales);
                    } else {
                        console.warn('⚠️ No hay clientes individuales - matriz estará vacía');
                    }

                    // Generar y descargar
                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    });

                    const nombreArchivo = `Cadencia_Ingresos_Todos_${this.getFechaActual()}.xlsx`;
                    saveAs(blob, nombreArchivo);

                    console.log('📥 Excel generado exitosamente:', nombreArchivo);
                    this.loading.set(false);
                } catch (error) {
                    console.error('❌ Error al generar Excel:', error);
                    alert('Error al generar el archivo Excel');
                    this.loading.set(false);
                }
            },
            error: (error) => {
                console.error('❌ Error obteniendo clientes:', error);
                alert('Error al obtener datos del servidor');
                this.loading.set(false);
            }
        });
    }

    /**
     * Genera Excel directo con el cliente específico seleccionado
     */
    private async generarExcelDirecto(cliente: ICadenciaCliente): Promise<void> {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CMDB Chile';
            workbook.created = new Date();

            // Hoja 1: Resumen
            this.crearHojaResumen(workbook, cliente);

            // Hoja 2: Ingresos Mensuales
            this.crearHojaIngresos(workbook, cliente);

            // Hoja 3: Alertas (solo si hay)
            if (cliente.alertas.length > 0) {
                this.crearHojaAlertas(workbook, cliente);
            }

            // Hoja 4: DETALLE POR CLIENTE - Solo este cliente
            console.log('📊 Creando matriz detalle con 1 cliente:', cliente.nombreCliente);
            this.crearHojaDetalleClientes(workbook, [cliente]);

            // Generar y descargar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const nombreArchivo = `Cadencia_Ingresos_${this.sanitizeFilename(cliente.nombreCliente)}_${this.getFechaActual()}.xlsx`;
            saveAs(blob, nombreArchivo);

            console.log('📥 Excel generado exitosamente:', nombreArchivo);
        } catch (error) {
            console.error('❌ Error al generar Excel:', error);
            alert('Error al generar el archivo Excel');
        }
    }

    /**
     * Exporta con hoja detalle obteniendo todos los clientes según filtros
     */
    private async exportarConDetalleCompleto(clienteActual: ICadenciaCliente): Promise<void> {
        this.loading.set(true);

        // Obtener TODOS los clientes aplicando los filtros actuales (familia, servicio)
        const formValue = this.filterForm.value;
        const filter: ICadenciaIngresosFilter = {
            rutCliente: undefined, // Sin filtro de cliente para obtener todos
            fechaDesde: formValue.fechaDesde ? this.formatDate(formValue.fechaDesde) : undefined,
            fechaHasta: formValue.fechaHasta ? this.formatDate(formValue.fechaHasta) : undefined,
            idFamiliaServicio: formValue.idFamiliaServicio || undefined,
            idServicio: formValue.idServicio || undefined,
        };

        console.log('Obteniendo todos los clientes con filtros:', filter);

        this.reportesService.obtenerCadenciaIngresos(filter).subscribe({
            next: async (response) => {
                this.loading.set(false);

                // Filtrar solo clientes reales (no TODOS)
                const clientesReales = response.clientes.filter(c => c.rutCliente !== 'TODOS');

                console.log('Clientes para matriz obtenidos:', clientesReales.length);

                // Exportar con la matriz de clientes
                await this.exportarConExcelJSCompleto(clienteActual, clientesReales);
            },
            error: (error) => {
                console.error('Error obteniendo clientes:', error);
                this.loading.set(false);
                alert('Error al obtener datos para exportar');
            }
        });
    }

    /**
     * Exportación completa con hoja detalle
     */
    private async exportarConExcelJSCompleto(clienteActual: ICadenciaCliente, todosLosClientes: ICadenciaCliente[]): Promise<void> {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CMDB Chile';
            workbook.created = new Date();

            const esConsolidado = clienteActual.rutCliente === 'TODOS';

            // Hoja 1: Resumen del cliente actual
            this.crearHojaResumen(workbook, clienteActual);

            // Hoja 2: Ingresos Mensuales del cliente actual
            this.crearHojaIngresos(workbook, clienteActual);

            // Hoja 3: Alertas (solo si hay alertas)
            if (clienteActual.alertas.length > 0) {
                this.crearHojaAlertas(workbook, clienteActual);
            }

            // Hoja 4: SIEMPRE crear matriz de detalle por cliente
            if (todosLosClientes.length > 0) {
                console.log('Creando hoja "Detalle por Cliente" con', todosLosClientes.length, 'clientes');
                this.crearHojaDetalleClientes(workbook, todosLosClientes);
            } else {
                console.warn('No hay clientes para la matriz detalle');
            }

            // Generar y descargar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const nombreBase = esConsolidado ? 'Consolidado' : this.sanitizeFilename(clienteActual.nombreCliente);
            const nombreArchivo = `Cadencia_Ingresos_${nombreBase}_${this.getFechaActual()}.xlsx`;
            saveAs(blob, nombreArchivo);

        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al generar el archivo Excel');
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

            // Hoja 4: Detalle por Cliente (solo si hay múltiples clientes)
            const todosClientes = this.clientes();
            console.log('Exportando Excel - Total clientes:', todosClientes.length);
            console.log('Clientes:', todosClientes.map(c => ({ rut: c.rutCliente, nombre: c.nombreCliente })));

            // Siempre crear la hoja si hay clientes (excepto cuando es solo el consolidado TODOS)
            const clientesSinTodos = todosClientes.filter(c => c.rutCliente !== 'TODOS');
            if (clientesSinTodos.length > 0) {
                console.log('Creando hoja detalle con', clientesSinTodos.length, 'clientes');
                this.crearHojaDetalleClientes(workbook, todosClientes);
            } else {
                console.log('No se crea hoja detalle - solo hay cliente TODOS');
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
     * Crea la hoja de detalle con matriz clientes vs meses
     */
    private crearHojaDetalleClientes(workbook: ExcelJS.Workbook, clientes: ICadenciaCliente[]): void {
        const sheet = workbook.addWorksheet('Detalle por Cliente');

        console.log('📋 Creando matriz - Clientes recibidos:', clientes.length);

        // Filtrar el cliente "TODOS" si existe
        const clientesFiltrados = clientes.filter(c => c.rutCliente !== 'TODOS');

        console.log('📋 Clientes después de filtrar TODOS:', clientesFiltrados.length);

        if (clientesFiltrados.length === 0) {
            // Crear hoja vacía con mensaje
            sheet.mergeCells('A1:D1');
            const cell = sheet.getCell('A1');
            cell.value = 'No hay clientes individuales para mostrar';
            cell.font = { size: 14, italic: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            return;
        }

        // Obtener todos los meses únicos de todos los clientes (ordenados)
        const mesesSet = new Set<string>();
        clientesFiltrados.forEach(cliente => {
            cliente.ingresosMensuales.forEach(mes => mesesSet.add(mes.mes));
        });
        const mesesOrdenados = Array.from(mesesSet).sort();

        console.log('📅 Meses únicos encontrados:', mesesOrdenados.length, mesesOrdenados);

        // Crear headers dinámicos
        const columns: any[] = [
            { header: 'CLIENTE', key: 'cliente', width: 30 },
            { header: 'RUT', key: 'rut', width: 15 }
        ];

        // Agregar columna por cada mes
        mesesOrdenados.forEach(mes => {
            columns.push({
                header: this.formatMesCorto(mes).toUpperCase(),
                key: mes,
                width: 15
            });
        });

        sheet.columns = columns;

        // Estilo del header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Datos de cada cliente
        clientesFiltrados.forEach((cliente, idx) => {
            const rowData: any = {
                cliente: cliente.nombreCliente,
                rut: cliente.rutCliente
            };

            // Crear un mapa de mes -> monto para acceso rápido
            const montoPorMes = new Map<string, { monto: number, moneda: string }>();
            cliente.ingresosMensuales.forEach(mes => {
                montoPorMes.set(mes.mes, { monto: mes.monto, moneda: mes.moneda });
            });

            // Llenar cada columna de mes
            mesesOrdenados.forEach(mes => {
                const data = montoPorMes.get(mes);
                rowData[mes] = data ? data.monto : 0;
            });

            const row = sheet.addRow(rowData);

            // Aplicar formato de moneda a las columnas de meses
            mesesOrdenados.forEach((mes, index) => {
                const cellIndex = index + 3; // +3 porque las primeras 2 columnas son cliente y rut
                const cell = row.getCell(cellIndex);
                cell.numFmt = '#,##0';
                cell.alignment = { horizontal: 'right' };
            });

            // Alineación de las primeras columnas
            row.getCell('cliente').alignment = { horizontal: 'left' };
            row.getCell('rut').alignment = { horizontal: 'center' };

            if (idx === 0) {
                console.log('📊 Primera fila de datos:', rowData);
            }
        });

        // Fila de totales al final
        const totalRowData: any = {
            cliente: 'TOTAL',
            rut: ''
        };

        mesesOrdenados.forEach(mes => {
            let totalMes = 0;
            clientesFiltrados.forEach(cliente => {
                const mesData = cliente.ingresosMensuales.find(m => m.mes === mes);
                if (mesData) {
                    totalMes += mesData.monto;
                }
            });
            totalRowData[mes] = totalMes;
        });

        const totalRow = sheet.addRow(totalRowData);
        totalRow.font = { bold: true };
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };

        // Formato de moneda para totales
        mesesOrdenados.forEach((mes, index) => {
            const cellIndex = index + 3;
            const cell = totalRow.getCell(cellIndex);
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
        });

        // Bordes para toda la tabla
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

        // Congelar la primera fila y las dos primeras columnas
        sheet.views = [
            { state: 'frozen', xSplit: 2, ySplit: 1 }
        ];

        console.log('✅ Matriz creada con', clientesFiltrados.length, 'filas y', mesesOrdenados.length, 'meses');
    }

    /**     * Exportación backend (para reportes grandes)
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
