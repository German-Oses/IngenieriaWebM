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

  createAccount(): void {
    if (!this.acceptTerms) {
      this.presentAlert('Atención', 'Debes aceptar los términos y condiciones.');
      return;
    }

    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.presentAlert('Error', 'Nombre y apellido son obligatorios.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!this.id_region || !this.id_comuna) {
      this.presentAlert('Error', 'Debes seleccionar región y comuna.');
      return;
    }
    
    // Validar que fecha de nacimiento sea obligatoria
    if (!this.fecha_nacimiento) {
      this.presentAlert('Error', 'La fecha de nacimiento es obligatoria.');
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

    // Mostrar loading
    this.loadingController.create({
      message: 'Creando cuenta...',
      duration: 30000 // Timeout de 30 segundos
    }).then(loading => {
      loading.present();
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          loading.dismiss();
          
          // Asegurarse de que tenemos el email para navegar
          const emailParaVerificar = response?.email || this.email;
          
          if (!emailParaVerificar) {
            this.presentAlert('Error', 'No se pudo obtener el correo electrónico para la verificación.');
            return;
          }
          
          // Navegar a la pantalla de verificación (sin código - solo por email)
          this.router.navigate(['/verificar-email'], { 
            queryParams: { email: emailParaVerificar },
            replaceUrl: true
          });
        },
        error: (err) => {
          loading.dismiss();
          console.error('Error en registro:', err);
          
          // Extraer mensaje de error de diferentes formatos posibles
          let errorMsg = 'No se pudo completar el registro.';
          if (err?.error) {
            errorMsg = err.error.msg || err.error.error || err.error.message || errorMsg;
          } else if (err?.message) {
            errorMsg = err.message;
          }
          
          this.presentAlert('Error de Registro', errorMsg);
        }
      });
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
