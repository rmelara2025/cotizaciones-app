import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CotizacionesService, ICotizacionDetalleCompleta, ICotizacionDetalleItem } from '../../../../core/services/cotizaciones.service';
import { CatalogosService, IServicio, ITipoMoneda, IPeriodicidad } from '../../../../core/services/catalogos.service';

interface IItemEditable extends ICotizacionDetalleItem {
  _isNew?: boolean;
  _atributosObj?: any;
}

@Component({
  selector: 'app-cotizacion-detalle',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    DatePickerModule,
    ToastModule
  ],
  templateUrl: './cotizacion-detalle.html',
  styleUrls: ['./cotizacion-detalle.scss'],
  providers: [MessageService],
  host: {
    class: 'cotizacion-detalle-container'
  }
})
export class CotizacionDetalleComponent implements OnInit {
  private cotizacionesService = inject(CotizacionesService);
  private catalogosService = inject(CatalogosService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  idCotizacion = signal<string>('');
  idContratoOrigen = signal<string | null>(null);
  cotizacion = signal<ICotizacionDetalleCompleta | null>(null);
  items = signal<IItemEditable[]>([]);
  modoEdicion = signal(false);
  guardando = signal(false);

  // Catalogos
  servicios = this.catalogosService.servicios;
  monedas = this.catalogosService.monedas;
  periodicidades = this.catalogosService.periodicidades;

  // Computed
  totalesPorMoneda = computed(() => {
    const cot = this.cotizacion();
    if (!cot) return [];
    return cot.totales || [];
  });

  ngOnInit() {
    // Leer idCotizacion de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('idCotizacion');
      if (id) {
        this.idCotizacion.set(id);
        this.cargarDatos();
      }
    });

    // Leer idContrato de query params para poder volver al popup
    this.route.queryParamMap.subscribe(queryParams => {
      const idContrato = queryParams.get('idContrato');
      if (idContrato) {
        this.idContratoOrigen.set(idContrato);
      }
    });
  }

  private async cargarDatos() {
    try {
      // Cargar catálogos
      this.catalogosService.loadServicios();
      this.catalogosService.loadMonedas();
      this.catalogosService.loadPeriodicidades();

      // Cargar cotización
      const detalle = await this.cotizacionesService.obtenerDetalleCotizacion(this.idCotizacion());
      this.cotizacion.set(detalle);
      this.items.set([...detalle.items]);
    } catch (error) {
      console.error('Error cargando detalle de cotización:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el detalle de la cotización'
      });
    }
  }

  activarModoEdicion() {
    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    // Restaurar items originales
    const cot = this.cotizacion();
    if (cot) {
      this.items.set([...cot.items]);
    }
    this.modoEdicion.set(false);
  }

  agregarItem() {
    const nuevoItem: IItemEditable = {
      numItem: this.items().length + 1,
      idServicio: 0,
      nombreServicio: '',
      nombreFamilia: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0,
      idTipoMoneda: 0,
      nombreMoneda: '',
      idPeriodicidad: 0,
      nombrePeriodicidad: '',
      fechaInicioFacturacion: '',
      fechaFinFacturacion: '',
      atributos: '',
      observacion: '',
      _isNew: true,
      _atributosObj: {}
    };
    this.items.update(items => [...items, nuevoItem]);
  }

  eliminarItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  onServicioChange(item: IItemEditable) {
    const servicio = this.servicios().find(s => s.idServicio === item.idServicio);
    if (servicio) {
      item.nombreServicio = servicio.nombre;
      item.nombreFamilia = servicio.nombreFamilia || '';

      // Inicializar atributos según schema
      if (servicio.atributosSchema) {
        try {
          const schema = JSON.parse(servicio.atributosSchema);
          item._atributosObj = {};
          // Inicializar campos vacíos según schema
          if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
              item._atributosObj![key] = '';
            });
          }
        } catch (e) {
          item._atributosObj = {};
        }
      }
    }
  }

  calcularSubtotal(item: IItemEditable) {
    item.subtotal = item.cantidad * item.precioUnitario;
  }

  async guardarCambios() {
    this.guardando.set(true);
    try {
      // 1. Versionar cotización
      const versionResponse = await this.cotizacionesService.versionarCotizacion(this.idCotizacion());

      // 2. Preparar items para guardar
      const itemsParaGuardar = this.items().map((item, idx) => ({
        numItem: idx + 1,
        idServicio: item.idServicio,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        idTipoMoneda: item.idTipoMoneda,
        idPeriodicidad: item.idPeriodicidad,
        fechaInicioFacturacion: item.fechaInicioFacturacion,
        fechaFinFacturacion: item.fechaFinFacturacion,
        atributos: item._atributosObj ? JSON.stringify(item._atributosObj) : item.atributos,
        observacion: item.observacion
      }));

      // 3. Guardar items en la nueva versión
      await this.cotizacionesService.guardarItems(versionResponse.idNuevaCotizacion, itemsParaGuardar);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Cotización versionada exitosamente. Nueva versión: v${versionResponse.version}`
      });

      // Navegar a la nueva versión
      setTimeout(() => {
        this.router.navigate(['/cmdb/cotizacion-detalle', versionResponse.idNuevaCotizacion]);
      }, 1500);

    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar los cambios'
      });
    } finally {
      this.guardando.set(false);
    }
  }

  volver() {
    const idContrato = this.idContratoOrigen();
    if (idContrato) {
      // Guardar en localStorage para que el componente padre abra el drawer
      localStorage.setItem('openDrawerContrato', idContrato);
      // Navegar directamente a /cotizaciones
      this.router.navigate(['/cotizaciones']);
    } else {
      window.history.back();
    }
  }

  getNombreServicio(idServicio: number): string {
    return this.servicios().find(s => s.idServicio === idServicio)?.nombre || '';
  }

  getNombreMoneda(idMoneda: number): string {
    return this.monedas().find(m => m.idTipoMoneda === idMoneda)?.nombreTipoMoneda || '';
  }

  getNombrePeriodicidad(idPeriodicidad: number): string {
    return this.periodicidades().find(p => p.idPeriodicidad === idPeriodicidad)?.nombre || '';
  }
}
