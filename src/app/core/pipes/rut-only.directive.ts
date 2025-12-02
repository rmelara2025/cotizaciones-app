import { Directive, HostListener, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, ControlValueAccessor } from '@angular/forms';

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
        const allowed = /[0-9kK]/;
        if (!allowed.test(event.key)) {
            event.preventDefault();
        }
    }

    // Al escribir → limpiar, formatear y propagar valor
    @HostListener('input', ['$event'])
    onInput(event: any) {
        const raw = event.target.value.replace(/[.\-]/g, '').toUpperCase();
        const formatted = this.formatRut(raw);

        this.el.nativeElement.value = formatted;
        this.onChange(raw);
    }

    // Formato 12.345.678-K
    private formatRut(value: string): string {
        if (!value) return '';

        let body = value.slice(0, -1);
        let dv = value.slice(-1);

        body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return body + '-' + dv;
    }

    writeValue(value: any): void {
        if (value) {
            this.el.nativeElement.value = this.formatRut(value);
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

        if (!this.validateRut(value)) {
            return { rutInvalid: true };
        }

        return null;
    }

    // Cálculo de dígito verificador
    private validateRut(rut: string): boolean {
        const clean = rut.replace(/\./g, '').replace('-', '');

        if (clean.length < 2) return false;

        const body = clean.slice(0, -1);
        let dv = clean.slice(-1).toUpperCase();

        let sum = 0;
        let multiplier = 2;

        for (let i = body.length - 1; i >= 0; i--) {
            sum += Number(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        let expectedDv: any = 11 - (sum % 11);
        expectedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

        return dv === expectedDv;
    }
}
