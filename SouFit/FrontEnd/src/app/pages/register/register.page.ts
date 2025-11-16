import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { CommonModule } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, refreshOutline, close } from 'ionicons/icons';

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

  constructor(
    private authService: AuthService,
    private ubicacionService: UbicacionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
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

  async createAccount(): Promise<void> {
    console.log('Iniciando creación de cuenta...');
    
    // Prevenir múltiples clics
    if (this.creando) {
      console.log('Ya se está creando una cuenta, ignorando clic...');
      return;
    }
    
    this.creando = true;
    
    try {
      // Validar términos y condiciones
      if (!this.acceptTerms) {
        await this.presentAlert('Atención', 'Debes aceptar los términos y condiciones.');
        this.creando = false;
        return;
      }

      // Validar nombre y apellido
      if (!this.nombre || !this.nombre.trim()) {
        await this.presentAlert('Error', 'El nombre es obligatorio.');
        this.creando = false;
        return;
      }
      
      if (!this.apellido || !this.apellido.trim()) {
        await this.presentAlert('Error', 'El apellido es obligatorio.');
        this.creando = false;
        return;
      }

      // Validar username
      if (!this.username || !this.username.trim()) {
        await this.presentAlert('Error', 'El nombre de usuario es obligatorio.');
        this.creando = false;
        return;
      }

      // Validar email
      if (!this.email || !this.email.includes('@')) {
        await this.presentAlert('Error', 'Debes ingresar un correo electrónico válido.');
        this.creando = false;
        return;
      }

      // Validar contraseña
      if (!this.password || this.password.length < 6) {
        await this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres.');
        this.creando = false;
        return;
      }

      if (this.password !== this.confirmPassword) {
        await this.presentAlert('Error', 'Las contraseñas no coinciden.');
        this.creando = false;
        return;
      }

      // Validar región y comuna
      if (!this.id_region || !this.id_comuna) {
        await this.presentAlert('Error', 'Debes seleccionar región y comuna.');
        this.creando = false;
        return;
      }
      
      // Validar fecha de nacimiento
      if (!this.fecha_nacimiento) {
        await this.presentAlert('Error', 'La fecha de nacimiento es obligatoria.');
        this.creando = false;
        return;
      }

      // El input type="date" ya devuelve el formato YYYY-MM-DD directamente
      let fechaFormateada = '';
      if (this.fecha_nacimiento) {
        if (typeof this.fecha_nacimiento === 'string') {
          // El input type="date" devuelve directamente YYYY-MM-DD
          if (this.fecha_nacimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
            fechaFormateada = this.fecha_nacimiento;
          } else {
            // Si viene en otro formato, intentar parsearlo
            const fecha = new Date(this.fecha_nacimiento);
            if (!isNaN(fecha.getTime())) {
              fechaFormateada = fecha.toISOString().split('T')[0];
            } else {
              fechaFormateada = this.fecha_nacimiento.trim();
            }
          }
        } else {
          fechaFormateada = String(this.fecha_nacimiento).trim();
        }
      }

      const userData: any = {
        nombre: this.nombre.trim(),
        apellido: this.apellido.trim(),
        username: this.username.trim(),
        email: this.email,
        password: this.password,
        fecha_nacimiento: fechaFormateada,
        id_region: this.id_region,
        id_comuna: this.id_comuna
      };

      console.log('Datos del usuario a registrar:', { ...userData, password: '***' });
      console.log('URL del API:', this.authService['apiUrl']); // Para debugging

      // Mostrar loading
      let loading: HTMLIonLoadingElement | null = null;
      try {
        loading = await this.loadingController.create({
          message: 'Creando cuenta...',
          duration: 30000 // Timeout de 30 segundos
        });
        
        await loading.present();
        console.log('Loading presentado');
      } catch (loadingError) {
        console.error('Error al mostrar loading:', loadingError);
      }
      
      try {
        console.log('Iniciando petición HTTP de registro...');
        console.log('URL completa:', `${this.authService['apiUrl']}/register`);
        
        const subscription = this.authService.register(userData).subscribe({
          next: async (response) => {
            console.log('✅ Respuesta del registro recibida:', response);
            
            try {
              if (loading) {
                await loading.dismiss();
                console.log('Loading cerrado');
              }
            } catch (dismissError) {
              console.error('Error al cerrar loading:', dismissError);
            }
            
            // Verificar que tenemos token y usuario
            if (response && response.token) {
              console.log('✅ Token recibido, redirigiendo...');
              await this.presentToast('¡Cuenta creada exitosamente!');
              
              // Pequeño delay para que el toast se muestre
              setTimeout(() => {
                this.router.navigate(['/home'], { replaceUrl: true });
              }, 500);
            } else {
              console.error('❌ Respuesta sin token:', response);
              await this.presentAlert('Error', 'No se recibió el token de autenticación. Por favor, intenta iniciar sesión.');
              this.creando = false;
            }
            
            subscription.unsubscribe();
          },
          error: async (err) => {
            console.error('❌ Error en registro:', err);
            console.error('Detalles del error:', {
              status: err?.status,
              statusText: err?.statusText,
              error: err?.error,
              message: err?.message,
              url: err?.url,
              name: err?.name
            });
            
            try {
              if (loading) {
                await loading.dismiss();
              }
            } catch (dismissError) {
              console.error('Error al cerrar loading en error:', dismissError);
            }
            
            // Extraer mensaje de error de diferentes formatos posibles
            let errorMsg = 'No se pudo completar el registro. Por favor, verifica los datos e intenta nuevamente.';
            
            if (err?.error) {
              // Si es un array de errores (del validator)
              if (Array.isArray(err.error.errors)) {
                errorMsg = err.error.errors.join(', ');
              } else if (err.error.msg) {
                errorMsg = err.error.msg;
              } else if (err.error.error) {
                errorMsg = err.error.error;
              } else if (err.error.message) {
                errorMsg = err.error.message;
              }
            } else if (err?.message) {
              errorMsg = err.message;
            }
            
            // Si el error es de servidor (500)
            if (err?.status === 500) {
              errorMsg = 'Error del servidor. Por favor, intenta más tarde.';
            }
            
            // Si es error de red (0), puede ser CORS o conexión
            if (err?.status === 0 || err?.status === undefined) {
              errorMsg = 'Error de conexión. Por favor, verifica tu conexión a internet o intenta más tarde.';
            }
            
            // Si es error 400, puede ser validación
            if (err?.status === 400) {
              // El mensaje ya debería estar en errorMsg
            }
            
            console.error('Mostrando alert de error:', errorMsg);
            await this.presentAlert('Error de Registro', errorMsg);
            
            this.creando = false;
            subscription.unsubscribe();
          },
          complete: () => {
            console.log('Observable de registro completado');
          }
        });
      } catch (subscribeError) {
        console.error('❌ Error al suscribirse al observable:', subscribeError);
        try {
          if (loading) {
            loading.dismiss();
          }
        } catch (dismissError) {
          console.error('Error al cerrar loading en catch:', dismissError);
        }
        await this.presentAlert('Error', 'Error inesperado al intentar registrar. Por favor, intenta nuevamente.');
        this.creando = false;
      }
    } catch (error) {
      console.error('Error general en createAccount:', error);
      this.creando = false;
    }
  }


  async presentAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
    await alert.onDidDismiss();
  }


  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
