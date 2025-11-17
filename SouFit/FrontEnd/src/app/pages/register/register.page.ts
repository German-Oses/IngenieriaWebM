import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { CommonModule } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, eye, eyeOff } from 'ionicons/icons';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-registro',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, IonInput]
})
export class RegistroPage implements OnInit {
  nombre = '';
  apellido = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  fecha_nacimiento: string | null = null;
  acceptTerms = false;

  // IDs seleccionados
  id_region: number | null = null;
  id_comuna: number | null = null;

  // Listas para los dropdowns
  regiones: any[] = [];
  comunas: any[] = [];

  // Fechas para el datetime picker
  fechaMaxima: string = '';
  fechaMinima: string = '';

  // Estado de creación
  creando: boolean = false;

  // Estados de validación en tiempo real
  nombreValido: boolean | null = null;
  apellidoValido: boolean | null = null;
  usernameValido: boolean | null = null;
  usernameDisponible: boolean | null = null;
  usernameVerificando: boolean = false;
  emailValido: boolean | null = null;
  passwordValida: boolean | null = null;
  passwordFuerza: 'débil' | 'media' | 'fuerte' | null = null;
  confirmPasswordValida: boolean | null = null;
  fechaValida: boolean | null = null;
  
  // Mostrar/ocultar contraseñas
  mostrarPassword: boolean = false;
  mostrarConfirmPassword: boolean = false;
  
  // Subject para debounce de verificación de username
  private usernameSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private ubicacionService: UbicacionService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ checkmarkCircle, closeCircle, eye, eyeOff });
    
    // Suscribirse a cambios de username con debounce para verificar disponibilidad
    this.usernameSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(username => {
        if (username && username.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username)) {
          this.usernameVerificando = true;
          return this.authService.checkUsername(username).pipe(
            catchError(() => {
              this.usernameVerificando = false;
              this.usernameDisponible = null;
              return of({ available: false, message: 'Error al verificar' });
            })
          );
        } else {
          this.usernameVerificando = false;
          this.usernameDisponible = null;
          return of({ available: false, message: '' });
        }
      })
    ).subscribe({
      next: (response) => {
        this.usernameVerificando = false;
        this.usernameDisponible = response.available;
      },
      error: () => {
        this.usernameVerificando = false;
        this.usernameDisponible = null;
      }
    });
  }

  ngOnInit(): void {
    // Configurar fechas para el datetime picker
    const hoy = new Date();
    const fechaMax = new Date();
    fechaMax.setFullYear(fechaMax.getFullYear() - 13); // Mínimo 13 años
    const fechaMin = new Date();
    fechaMin.setFullYear(fechaMin.getFullYear() - 120); // Máximo 120 años
    
    this.fechaMaxima = fechaMax.toISOString().split('T')[0];
    this.fechaMinima = fechaMin.toISOString().split('T')[0];

    this.ubicacionService.getRegiones().subscribe({
      next: (data) => { this.regiones = data; },
      error: (err) => { console.error('Error cargando regiones', err); }
    });
  }

  onRegionChange(): void {
    this.comunas = [];
    this.id_comuna = null;
    if (this.id_region != null) {
      this.ubicacionService.getComunas(this.id_region).subscribe({
        next: (data) => { this.comunas = data; },
        error: (err) => { console.error('Error cargando comunas', err); }
      });
    }
  }

  // Validación en tiempo real
  onNombreChange(): void {
    this.nombreValido = this.nombre.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.nombre.trim());
  }

  onApellidoChange(): void {
    this.apellidoValido = this.apellido.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.apellido.trim());
  }

  onUsernameChange(): void {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    this.usernameValido = usernameRegex.test(this.username.trim());
    
    if (this.usernameValido) {
      this.usernameSubject.next(this.username.trim());
    } else {
      this.usernameDisponible = null;
      this.usernameVerificando = false;
    }
  }

  onEmailChange(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValido = emailRegex.test(this.email.trim());
  }

  onPasswordChange(): void {
    this.passwordValida = this.password.length >= 6;
    this.calcularFuerzaPassword();
    this.validarConfirmPassword();
  }

  calcularFuerzaPassword(): void {
    if (!this.password) {
      this.passwordFuerza = null;
      return;
    }
    
    let fuerza = 0;
    if (this.password.length >= 6) fuerza++;
    if (this.password.length >= 8) fuerza++;
    if (/[a-z]/.test(this.password)) fuerza++;
    if (/[A-Z]/.test(this.password)) fuerza++;
    if (/\d/.test(this.password)) fuerza++;
    if (/[^a-zA-Z0-9]/.test(this.password)) fuerza++;
    
    if (fuerza <= 2) {
      this.passwordFuerza = 'débil';
    } else if (fuerza <= 4) {
      this.passwordFuerza = 'media';
    } else {
      this.passwordFuerza = 'fuerte';
    }
  }

  onConfirmPasswordChange(): void {
    this.validarConfirmPassword();
  }

  validarConfirmPassword(): void {
    this.confirmPasswordValida = this.password === this.confirmPassword && this.password.length > 0;
  }

  onFechaChange(): void {
    if (!this.fecha_nacimiento) {
      this.fechaValida = null;
      return;
    }
    
    const fecha = new Date(this.fecha_nacimiento);
    const hoy = new Date();
    const edadMinima = new Date();
    edadMinima.setFullYear(edadMinima.getFullYear() - 13);
    
    this.fechaValida = fecha <= hoy && fecha <= edadMinima;
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  getPasswordStrengthColor(): string {
    switch (this.passwordFuerza) {
      case 'débil': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'fuerte': return '#10b981';
      default: return '#e5e7eb';
    }
  }

  getPasswordStrengthText(): string {
    switch (this.passwordFuerza) {
      case 'débil': return 'Débil';
      case 'media': return 'Media';
      case 'fuerte': return 'Fuerte';
      default: return '';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.nombreValido === true &&
      this.apellidoValido === true &&
      this.usernameValido === true &&
      this.usernameDisponible === true &&
      this.emailValido === true &&
      this.passwordValida === true &&
      this.passwordFuerza !== 'débil' &&
      this.confirmPasswordValida === true &&
      this.fechaValida === true &&
      this.id_region &&
      this.id_comuna &&
      this.acceptTerms
    );
  }

  async createAccount(): Promise<void> {
    if (this.creando) return;
    
    // Validaciones básicas
    if (!this.acceptTerms) {
      await this.presentAlert('Atención', 'Debes aceptar los términos y condiciones.');
      return;
    }

    if (!this.nombre || !this.nombre.trim() || !this.apellido || !this.apellido.trim() || 
        !this.username || !this.username.trim() || !this.email || !this.email.includes('@') ||
        !this.password || this.password.length < 6 || this.password !== this.confirmPassword ||
        !this.id_region || !this.id_comuna || !this.fecha_nacimiento) {
      await this.presentAlert('Error', 'Por favor completa todos los campos correctamente.');
      return;
    }

    this.creando = true;

    // Formatear fecha
    let fechaFormateada = '';
    if (typeof this.fecha_nacimiento === 'string' && this.fecha_nacimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
      fechaFormateada = this.fecha_nacimiento;
    } else if (this.fecha_nacimiento) {
      const fecha = new Date(this.fecha_nacimiento);
      if (!isNaN(fecha.getTime())) {
        fechaFormateada = fecha.toISOString().split('T')[0];
      }
    }

    const userData = {
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      fecha_nacimiento: fechaFormateada,
      id_region: this.id_region,
      id_comuna: this.id_comuna
    };
    
    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response && response.token) {
          // Guardar datos en segundo plano
          this.authService.guardarDatosSesion(response.token, response.user).catch(() => {});
          
          this.creando = false;
          
          // Mostrar alerta de éxito
          this.presentAlert('¡Éxito!', 'Cuenta creada exitosamente. Serás redirigido al inicio.').then(() => {
            this.router.navigate(['/home'], { replaceUrl: true });
          });
        } else {
          this.creando = false;
          this.presentAlert('Error', 'No se pudo crear la cuenta. Intenta nuevamente.');
        }
      },
      error: (err) => {
        this.creando = false;
        const errorMsg = err?.error?.msg || err?.error?.error || err?.error?.message || 
                        'No se pudo completar el registro. Verifica los datos e intenta nuevamente.';
        this.presentAlert('Error de Registro', errorMsg);
      }
    });
  }

  async presentAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentToast(message: string): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message,
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al mostrar toast:', error);
    }
  }
}
