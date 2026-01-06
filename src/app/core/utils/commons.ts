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