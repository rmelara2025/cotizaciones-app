/**
 * Utilidades para formatear fechas en el formato esperado por el backend
 * 
 * CONTEXTO IMPORTANTE: El backend Java usa diferentes formatos de fecha según el DTO:
 * 
 * 1. FORMATO ISO (YYYY-MM-DD): 
 *    - ContratoRequest (fechaInicio, fechaTermino)
 *    - CotizacionCreateRequest (fechaEmision, fechaVigenciaDesde, fechaVigenciaHasta)
 *    - Sin anotación @JsonFormat, usa el deserializador por defecto de Spring
 * 
 * 2. FORMATO CHILENO (DD-MM-YYYY):
 *    - CotizacionDetalleItemRequest (fechaInicioFacturacion, fechaFinFacturacion)
 *    - Con anotación @JsonFormat(pattern = "dd-MM-yyyy")
 *    - Requiere formato explícito debido a la anotación
 * 
 * Por esta razón existen DOS funciones de formateo diferentes.
 * NO consolidar en una sola función - cada una tiene su propósito específico.
 */

/**
 * Convierte un objeto Date a string en formato ISO (YYYY-MM-DD) para el backend
 * Usar para: ContratoRequest, CotizacionCreateRequest
 * @param date Objeto Date o string
 * @returns String en formato YYYY-MM-DD o string vacío si date es null/undefined
 */
export function formatDateForBackend(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  // Si ya es string, se asume que está en formato correcto
  if (typeof date === 'string') {
    // Si el string está en formato DD-MM-YYYY, convertirlo a YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [day, month, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }
    return date;
  }

  // Convertir Date a YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un objeto Date a string en formato DD-MM-YYYY para items de cotización
 * Este formato es ESPECÍFICO para CotizacionDetalleItemRequest que tiene @JsonFormat(pattern = "dd-MM-yyyy")
 * NO usar para otros DTOs - revisar documentación del archivo si tienes dudas
 * @param date Objeto Date o string
 * @returns String en formato DD-MM-YYYY o string vacío si date es null/undefined
 */
export function formatDateForItemBackend(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  // Si ya es string en formato DD-MM-YYYY, dejarlo así
  if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    return date;
  }

  // Si es string en otro formato, convertir a Date primero
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Convertir Date a DD-MM-YYYY
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Convierte un string de fecha ISO (YYYY-MM-DD) a objeto Date
 * @param dateString String en formato YYYY-MM-DD
 * @returns Objeto Date o null si el string es inválido
 */
export function parseDateFromBackend(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
