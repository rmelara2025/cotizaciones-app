import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ClientesService } from '../../../../core/services/clientes.service';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';
import { cleanRut } from '../../../../core/utils/rut.utils';
import { ICliente, IClienteFilters, DEFAULT_CLIENTE_FILTER } from '../../../../core/models';
import { Table } from 'primeng/table';

@Component({
    selector: 'app-clientes-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TooltipModule,
        FormatRutPipe,
        InputTextModule,
        FormsModule,
        RutInputDirective,
        InputGroupModule,
        InputGroupAddonModule,
    ],
    templateUrl: './clientes-list.html',
    styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
    @ViewChild('dt') table?: Table;

    private clientesService = inject(ClientesService);
    private router = inject(Router);

    // Filtros tipados
    filters: IClienteFilters = { ...DEFAULT_CLIENTE_FILTER };

    get clientes() {
        return this.clientesService.clientes();
    }

    get loading() {
        return this.clientesService.loading();
    }

    get error() {
        return this.clientesService.error();
    }

    get totalRecords() {
        return this.clientesService.totalRecords();
    }

    get pageSize() {
        return this.clientesService.pageSize();
    }

    ngOnInit() {
        // Carga inicial sin filtros
        this.clientesService.loadClientes(0, 10);
    }

    /**
     * Handler para paginación lazy de PrimeNG
     */
    onPageChange(event: any) {
        const page = Math.floor(event.first / event.rows);
        const size = event.rows;
        const sortField = event.sortField || 'rutCliente';
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

        // Limpiar RUT antes de enviar
        const filtrosLimpios = { ...this.filters };
        if (filtrosLimpios.rutCliente) {
            filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
        }

        this.clientesService.loadClientes(page, size, sortField, sortOrder, filtrosLimpios);
    }

    /**
     * Buscar clientes aplicando filtros
     */
    buscarClientes() {
        // Reiniciar a la primera página cuando se busca
        this.table?.reset();
        // Limpiar RUT antes de enviar
        const filtrosLimpios = { ...this.filters };
        if (filtrosLimpios.rutCliente) {
            filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
        }
        this.clientesService.loadClientes(0, this.pageSize, 'rutCliente', 'desc', filtrosLimpios);
    }

    /**
     * Limpiar filtros y recargar todos los datos
     */
    limpiarFiltros() {
        this.filters = { ...DEFAULT_CLIENTE_FILTER };
        this.table?.reset();
        this.clientesService.loadClientes(0, this.pageSize);
    }

    /**
     * Helper para mostrar el estado del cliente
     */
    getEstadoLabel(estado: number): string {
        return estado === 1 ? 'Activo' : 'Inactivo';
    }

    /**
     * Helper para el color del badge de estado
     */
    getEstadoSeverity(estado: number): 'success' | 'danger' {
        return estado === 1 ? 'success' : 'danger';
    }

    /**
     * Navegar a cotizaciones filtradas por el RUT del cliente
     */
    verContratos(cliente: ICliente) {
        this.router.navigate(['/cotizaciones'], {
            queryParams: { rutCliente: cliente.rutCliente }
        });
    }

    /**
     * Navegar a la lista de contactos del cliente
     */
    verContactos(cliente: ICliente) {
        // Limpiar el RUT (remover puntos, espacios, mantener guion)
        const rutLimpio = cleanRut(cliente.rutCliente);
        this.router.navigate(['/contactos'], {
            queryParams: {
                rut: rutLimpio,
                nombre: cliente.nombreCliente
            }
        });
    }
}
