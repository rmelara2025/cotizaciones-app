import { validateRut as validateRutUtil } from '../utils/rut.utils';

export function validarRut(rut: string): boolean {
    return validateRutUtil(rut);
}
