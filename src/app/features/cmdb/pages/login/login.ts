import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

interface LoginForm {
    idUsuario: FormControl<string>;
    clave: FormControl<string>;
}

@Component({
    selector: 'app-login',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        PasswordModule,
        MessageModule,
    ],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm = new FormGroup<LoginForm>({
        idUsuario: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        clave: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
    });

    loading = this.authService.loading;
    error = this.authService.error;

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const { idUsuario, clave } = this.loginForm.getRawValue();
        const success = await this.authService.login({ idUsuario, clave });

        if (success) {
            // Redirigir a cotizaciones (disponible para todos) en lugar de dashboard
            this.router.navigate(['/cotizaciones']);
        }
    }

    getErrorMessage(controlName: keyof LoginForm): string {
        const control = this.loginForm.get(controlName);
        if (control?.hasError('required') && control.touched) {
            return 'Este campo es requerido';
        }
        return '';
    }
}
