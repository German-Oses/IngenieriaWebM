import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { CommonModule } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './register.page.html',
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

  constructor(
    private authService: AuthService,
    private ubicacionService: UbicacionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

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
    
    // Validar términos y condiciones
    if (!this.acceptTerms) {
      await this.presentAlert('Atención', 'Debes aceptar los términos y condiciones.');
      return;
    }

    // Validar nombre y apellido
    if (!this.nombre || !this.nombre.trim()) {
      await this.presentAlert('Error', 'El nombre es obligatorio.');
      return;
    }
    
    if (!this.apellido || !this.apellido.trim()) {
      await this.presentAlert('Error', 'El apellido es obligatorio.');
      return;
    }

    // Validar username
    if (!this.username || !this.username.trim()) {
      await this.presentAlert('Error', 'El nombre de usuario es obligatorio.');
      return;
    }

    // Validar email
    if (!this.email || !this.email.includes('@')) {
      await this.presentAlert('Error', 'Debes ingresar un correo electrónico válido.');
      return;
    }

    // Validar contraseña
    if (!this.password || this.password.length < 6) {
      await this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.presentAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    // Validar región y comuna
    if (!this.id_region || !this.id_comuna) {
      await this.presentAlert('Error', 'Debes seleccionar región y comuna.');
      return;
    }
    
    // Validar fecha de nacimiento
    if (!this.fecha_nacimiento) {
      await this.presentAlert('Error', 'La fecha de nacimiento es obligatoria.');
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

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      duration: 30000 // Timeout de 30 segundos
    });
    
    await loading.present();
    
    this.authService.register(userData).subscribe({
      next: async (response) => {
        await loading.dismiss();
        
        console.log('Respuesta del registro:', response);
        
        // Asegurarse de que tenemos el email para navegar
        const emailParaVerificar = response?.email || this.email?.trim();
        
        if (!emailParaVerificar) {
          await this.presentAlert('Error', 'No se pudo obtener el correo electrónico para la verificación. Por favor, intenta nuevamente.');
          return;
        }
        
        console.log('Navegando a verificación de email con:', emailParaVerificar);
        
        // Navegar directamente a la pantalla de verificación (sin alert para mejor UX)
        this.router.navigate(['/verificar-email'], { 
          queryParams: { email: emailParaVerificar },
          replaceUrl: true
        });
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error en registro:', err);
        
        // Extraer mensaje de error de diferentes formatos posibles
        let errorMsg = 'No se pudo completar el registro. Por favor, verifica los datos e intenta nuevamente.';
        if (err?.error) {
          errorMsg = err.error.msg || err.error.error || err.error.message || errorMsg;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        
        // Si el error es de servidor (500), puede ser problema de email
        if (err?.status === 500) {
          errorMsg = 'Error del servidor. Por favor, verifica la configuración del servidor de correo o intenta más tarde.';
        }
        
        await this.presentAlert('Error de Registro', errorMsg);
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
    await alert.onDidDismiss();
  }
}
