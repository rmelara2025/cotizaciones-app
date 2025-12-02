export function validarRut(rut: string): boolean {
    if (!rut) return false;

    // Limpiar: quitar puntos y pasar todo a mayúsculas
    rut = rut.replace(/\./g, '').replace('-', '').toUpperCase();

    if (rut.length < 2) return false;

    const cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1);

    // Validar cuerpo numérico
    if (!/^\d+$/.test(cuerpo)) return false;

    // Calcular DV con módulo 11
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i], 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dvEsperado = 11 - resto;

    let dvCalculado =
        dvEsperado === 11 ? '0'
            : dvEsperado === 10 ? 'K'
                : dvEsperado.toString();

    return dv === dvCalculado;
}
