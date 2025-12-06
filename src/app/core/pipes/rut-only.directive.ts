import { Directive, HostListener, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, ControlValueAccessor } from '@angular/forms';
import { validateRut, formatRut, cleanRut, isValidRutCharacter } from '../utils/rut.utils';

@Directive({
    selector: '[appRutInput]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RutInputDirective),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => RutInputDirective),
            multi: true
        }
    ]
})
export class RutInputDirective implements ControlValueAccessor, Validator {

    private onChange = (_: any) => { };
    private onTouched = () => { };

    constructor(private el: ElementRef<HTMLInputElement>) { }

    // Solo permitir dígitos y K/k
    @HostListener('keypress', ['$event'])
    onKeyPress(event: KeyboardEvent) {
        if (!isValidRutCharacter(event.key)) {
            event.preventDefault();
        }
    }

    // Al escribir → limpiar, formatear y propagar valor
    @HostListener('input', ['$event'])
    onInput(event: any) {
        const raw = event.target.value.replace(/[.\-]/g, '').toUpperCase();
        const formatted = formatRut(raw);

        this.el.nativeElement.value = formatted;
        // 🔥 Enviar al ngModel el RUT limpio pero CONSERVANDO el GUION
        const cleanedValue = cleanRut(formatted);
        this.onChange(cleanedValue);
    }

    private cleanRut(value: string): string {
        // Mantiene el guion
        return value.replace(/\./g, '');
    }

    writeValue(value: any): void {
        if (value) {
            this.el.nativeElement.value = formatRut(value);
        } else {
            this.el.nativeElement.value = '';
        }
    }

    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }

    // Validación del RUT
    validate(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (!value) return null;

        if (!validateRut(value)) {
            return { rutInvalid: true };
        }

        return null;
    }
}
