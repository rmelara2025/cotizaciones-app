import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CotizacionesService, ICotizacionDetalleCompleta, ICotizacionDetalleItem } from '../../../../core/services/cotizaciones.service';
import { CatalogosService, IServicio, ITipoMoneda, IPeriodicidad, IProveedor } from '../../../../core/services/catalogos.service';
import { IContrato } from '../../../../core/models';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { getEstadoSeverity } from '../../../../core/utils/commons';
import { formatDateForItemBackend, parseDateFromBackend } from '../../../../core/utils/date.utils';

interface IItemEditable extends Omit<ICotizacionDetalleItem, 'fechaInicioFacturacion' | 'fechaFinFacturacion'> {
  _isNew?: boolean;
  _atributosObj?: any;
  _proveedoresDisponibles?: IProveedor[];
  fechaInicioFacturacion: string | Date | null;
  fechaFinFacturacion: string | Date | null;
}

@Component({
  selector: 'app-cotizacion-detalle',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    TagModule,
    InputNumberModule,
    InputTextModule,
    DatePickerModule,
    ToastModule,
    DividerModule,
    FormatRutPipe,
    PanelModule,
    DialogModule,
    TextareaModule
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
  cotizacion = signal<ICotizacionDetalleCompleta | null>(null);
  items = signal<IItemEditable[]>([]);
  modoEdicion = signal(false);
  guardando = signal(false);
  contrato = signal<IContrato | null>(null);

  // Dialog de atributos
  mostrarDialogAtributos = signal(false);
  itemSeleccionado = signal<IItemEditable | null>(null);
  atributosEditables = signal<any>({});

  // Para mantener contexto de navegación
  private idContratoOrigen: string | null = null;
  private filtrosOriginales: any = {};

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

  get estadoSeverity() {
    const estado = this.cotizacion()?.nombreEstado || '';
    return getEstadoSeverity(estado);
  };

  ngOnInit() {
    // Estrategia de recuperación del contrato:
    // 1. Router state (window.history.state)
    // 2. SessionStorage (respaldo)

    const contratoFromState = window.history.state?.['contrato'] as IContrato;
    if (contratoFromState) {
      this.contrato.set(contratoFromState);
      // Guardar en sessionStorage como respaldo
      sessionStorage.setItem('contrato-actual', JSON.stringify(contratoFromState));
      console.log('✅ Contrato recibido por state:', contratoFromState);
    } else {
      // Intentar recuperar desde sessionStorage
      const contratoFromStorage = sessionStorage.getItem('contrato-actual');
      if (contratoFromStorage) {
        try {
          const contrato = JSON.parse(contratoFromStorage) as IContrato;
          this.contrato.set(contrato);
          console.log('♻️ Contrato recuperado de sessionStorage');
        } catch (e) {
          console.error('Error parseando contrato de sessionStorage:', e);
        }
      }
    }

    // Leer idCotizacion de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('idCotizacion');
      if (id) {
        this.idCotizacion.set(id);
        this.cargarDatos();
      }
    });

    // Guardar query params para volver con contexto
    this.route.queryParams.subscribe(params => {
      if (params['idContrato']) {
        this.idContratoOrigen = params['idContrato'];
      }
      // Guardar todos los demás query params (filtros)
      const { idContrato, ...filtros } = params;
      this.filtrosOriginales = filtros;
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
    console.log('🔧 Activando modo edición, items antes de conversión:', this.items());

    // Convertir fechas string a Date objects para los datepickers
    this.items.update(items => items.map(item => {
      const converted = {
        ...item,
        fechaInicioFacturacion: item.fechaInicioFacturacion ? this.parseDateForEdit(item.fechaInicioFacturacion) : null,
        fechaFinFacturacion: item.fechaFinFacturacion ? this.parseDateForEdit(item.fechaFinFacturacion) : null,
        _proveedoresDisponibles: [] as IProveedor[]
      };
      console.log('📅 Fecha conversión:', {
        original: { inicio: item.fechaInicioFacturacion, fin: item.fechaFinFacturacion },
        convertido: { inicio: converted.fechaInicioFacturacion, fin: converted.fechaFinFacturacion }
      });

      // Cargar proveedores si el item ya tiene un servicio
      if (converted.idServicio) {
        this.catalogosService.obtenerProveedoresPorServicio(converted.idServicio).subscribe({
          next: (proveedores) => {
            converted._proveedoresDisponibles = proveedores;
          },
          error: (err) => {
            console.error('Error cargando proveedores del servicio:', err);
            converted._proveedoresDisponibles = [] as IProveedor[];
          }
        });
      }

      return converted;
    }));

    console.log('✅ Items después de conversión:', this.items());
    this.modoEdicion.set(true);
  }

  /**
   * Parsea fechas desde múltiples formatos para modo edición
   * Soporta: DD-MM-YYYY, DD/MM/YYYY, Date objects, ISO strings
   * Este método es específico para convertir datos del backend a objetos Date
   * para los componentes de PrimeNG DatePicker
   */
  private parseDateForEdit(dateStr: string | Date | null): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    // Si es string en formato dd/mm/yyyy o dd-mm-yyyy
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }

    // Intentar parseo directo
    return new Date(dateStr);
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
      fechaInicioFacturacion: null,
      fechaFinFacturacion: null,
      atributos: '',
      observacion: '',
      idProveedor: undefined,
      nombreProveedor: undefined,
      _isNew: true,
      _atributosObj: {},
      _proveedoresDisponibles: [] as IProveedor[]
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

      // Reiniciar proveedor cuando cambia el servicio
      item.idProveedor = undefined;
      item.nombreProveedor = undefined;
      item._proveedoresDisponibles = [] as IProveedor[];

      // Cargar proveedores del servicio
      this.catalogosService.obtenerProveedoresPorServicio(item.idServicio).subscribe({
        next: (proveedores) => {
          item._proveedoresDisponibles = proveedores;
        },
        error: (err) => {
          console.error('Error cargando proveedores del servicio:', err);
          item._proveedoresDisponibles = [] as IProveedor[];
        }
      });

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
      console.log('🔄 Iniciando versionado de cotización:', this.idCotizacion());

      // 1. Versionar cotización
      const versionResponse = await this.cotizacionesService.versionarCotizacion(this.idCotizacion());
      console.log('✅ Versionado exitoso:', versionResponse);

      // 2. Preparar items para guardar
      const itemsParaGuardar = this.items().map((item, idx) => ({
        numItem: idx + 1,
        idServicio: item.idServicio,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        idTipoMoneda: item.idTipoMoneda,
        idPeriodicidad: item.idPeriodicidad,
        fechaInicioFacturacion: formatDateForItemBackend(item.fechaInicioFacturacion),
        fechaFinFacturacion: formatDateForItemBackend(item.fechaFinFacturacion),
        atributos: item._atributosObj ? JSON.stringify(item._atributosObj) : item.atributos,
        observacion: item.observacion,
        idProveedor: item.idProveedor || null
      }));
      console.log('📦 Items preparados para guardar:', itemsParaGuardar);

      // 3. Guardar items en la nueva versión
      await this.cotizacionesService.guardarItems(versionResponse.idNuevaCotizacion, itemsParaGuardar);
      console.log('✅ Items guardados exitosamente');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Cotización versionada exitosamente. Nueva versión: v${versionResponse.version}`
      });

      // Actualizar el componente para mostrar la nueva versión sin navegar
      this.idCotizacion.set(versionResponse.idNuevaCotizacion);
      this.modoEdicion.set(false);

      // Recargar los datos de la nueva versión
      await this.cargarDatos();

      console.log('✅ Componente actualizado con nueva versión');

    } catch (error: any) {
      console.error('❌ Error al guardar cambios:', error);
      const errorMsg = error?.error?.message || error?.message || 'No se pudo guardar los cambios';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMsg
      });
    } finally {
      this.guardando.set(false);
    }
  }

  volver() {
    if (this.idContratoOrigen) {
      // Volver a cotizaciones por contrato con los filtros originales
      this.router.navigate(['/cotizaciones/por-contrato', this.idContratoOrigen], {
        queryParams: this.filtrosOriginales
      });
    } else {
      // Si no hay contexto, usar history.back
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

  /**
   * Verifica si un item tiene atributos
   */
  tieneAtributos(item: IItemEditable): boolean {
    if (!item.atributos) return false;

    // Si es string vacío o "null" o "{}"
    const trimmed = item.atributos.toString().trim();
    if (!trimmed || trimmed === 'null' || trimmed === '{}' || trimmed === '[]') return false;

    // Si es objeto, verificar que tenga propiedades
    if (typeof item.atributos === 'object') {
      return Object.keys(item.atributos).length > 0;
    }

    // Si es string JSON, intentar parsearlo
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch {
      // Si no es JSON válido pero tiene contenido, considerarlo como atributo
      return true;
    }
  }

  /**
   * Aplana un objeto anidado en un objeto plano con claves con notación de punto
   * Ejemplo: {specs: {ram: "8GB", cpu: "i5"}} => {"specs.ram": "8GB", "specs.cpu": "i5"}
   */
  private aplanarObjeto(obj: any, prefijo: string = ''): Record<string, string> {
    const resultado: Record<string, string> = {};

    for (const [clave, valor] of Object.entries(obj)) {
      const claveCompleta = prefijo ? `${prefijo}.${clave}` : clave;

      if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        // Si es un objeto, recursivamente aplanarlo
        Object.assign(resultado, this.aplanarObjeto(valor, claveCompleta));
      } else {
        // Convertir a string el valor
        resultado[claveCompleta] = Array.isArray(valor) ? JSON.stringify(valor) : String(valor ?? '');
      }
    }

    return resultado;
  }

  /**
   * Reconstruye un objeto anidado desde un objeto plano con notación de punto
   * Ejemplo: {"specs.ram": "8GB", "specs.cpu": "i5"} => {specs: {ram: "8GB", cpu: "i5"}}
   */
  private reconstruirObjeto(objetoPlano: Record<string, string>): Record<string, any> {
    const resultado: Record<string, any> = {};

    for (const [clave, valor] of Object.entries(objetoPlano)) {
      const partes = clave.split('.');
      let actual = resultado;

      for (let i = 0; i < partes.length - 1; i++) {
        const parte = partes[i];
        if (!actual[parte]) {
          actual[parte] = {};
        }
        actual = actual[parte];
      }

      actual[partes[partes.length - 1]] = valor;
    }

    return resultado;
  }

  /**
   * Abre el dialog para ver/editar atributos
   */
  verAtributos(item: IItemEditable) {
    this.itemSeleccionado.set(item);

    // Intentar parsear los atributos
    let atributos: Record<string, any> = {};
    if (item.atributos) {
      if (typeof item.atributos === 'string') {
        try {
          atributos = JSON.parse(item.atributos);
        } catch {
          atributos = { valor: item.atributos };
        }
      } else if (typeof item.atributos === 'object' && item.atributos !== null) {
        atributos = { ...item.atributos as Record<string, any> };
      }
    }

    // Si hay _atributosObj, usar ese
    if (item._atributosObj && Object.keys(item._atributosObj).length > 0) {
      atributos = { ...item._atributosObj };
    }

    // Aplanar el objeto para mostrar todos los niveles
    const atributosPlanos = this.aplanarObjeto(atributos);

    this.atributosEditables.set(atributosPlanos);
    this.mostrarDialogAtributos.set(true);
  }

  /**
   * Guarda los atributos editados
   */
  guardarAtributos() {
    const item = this.itemSeleccionado();
    if (item) {
      // Reconstruir el objeto anidado desde el objeto plano
      const atributosReconstruidos = this.reconstruirObjeto(this.atributosEditables());
      item._atributosObj = atributosReconstruidos;
      item.atributos = JSON.stringify(item._atributosObj);
    }
    this.cerrarDialogAtributos();
  }

  /**
   * Cierra el dialog de atributos
   */
  cerrarDialogAtributos() {
    this.mostrarDialogAtributos.set(false);
    this.itemSeleccionado.set(null);
    this.atributosEditables.set({});
  }

  /**
   * Obtiene las llaves de un objeto (para iterar en el template)
   */
  getAtributosKeys(): string[] {
    return Object.keys(this.atributosEditables());
  }

  /**
   * Actualiza un atributo específico
   */
  actualizarAtributo(key: string, value: any) {
    this.atributosEditables.update(attrs => ({
      ...attrs,
      [key]: value
    }));
  }
}
