export function getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
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

export function getIconEstado(estado: string): '' | 'pi-check-circle' | 'pi-send' | 'pi-check' | 'pi-eraser' | 'pi-ban' | 'pi-times' | 'pi-arrow-down' | 'pi-arrow-right-arrow-left' {
    const estadoUpper = estado?.toUpperCase();
    switch (estadoUpper) {
        case 'VIGENTE':
            return 'pi-check-circle';
        case 'APROBADA':
            return 'pi-check';
        case 'EN_REVISION':
            return 'pi-send';
        case 'BORRADOR':
            return 'pi-eraser';
        case 'ANULADA':
            return 'pi-ban';
        case 'CANCELADA':
            return 'pi-times';
        case 'DE_BAJA':
            return 'pi-arrow-down';
        case 'REEMPLAZADA':
            return 'pi-arrow-right-arrow-left';
        default:
            return '';
    }
}

export function getTextEstado(estado: string): '' | 'Marcar como Vigente' | 'Aprobar Cotización' | 'Enviar a Revisión' | 'Devolver a Borrador' | 'Anular Cotización' | 'Cancelar Cotización' | 'Dar de Baja' | 'Reemplazar Cotización' {
    const estadoUpper = estado?.toUpperCase();
    switch (estadoUpper) {
        case 'VIGENTE':
            return 'Marcar como Vigente';
        case 'APROBADA':
            return 'Aprobar Cotización';
        case 'EN_REVISION':
            return 'Enviar a Revisión';
        case 'BORRADOR':
            return 'Devolver a Borrador';
        case 'ANULADA':
            return 'Anular Cotización';
        case 'CANCELADA':
            return 'Cancelar Cotización';
        case 'DE_BAJA':
            return 'Dar de Baja';
        case 'REEMPLAZADA':
            return 'Reemplazar Cotización';
        default:
            return '';
    }
}