import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { CommonModule } from '@angular/common';
import { IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-registro',
  templateUrl: './register.page.html',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent]
})
export class RegistroPage implements OnInit {
  nombre = '';
  apellido = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  fecha_nacimiento = '';
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

  @ViewChild(IonModal) modal?: IonModal;

  constructor(
    private authService: AuthService,
    private ubicacionService: UbicacionService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController
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

    // Convertir fecha a formato YYYY-MM-DD si viene en otro formato
    let fechaFormateada = '';
    if (this.fecha_nacimiento && typeof this.fecha_nacimiento === 'object' && 'getTime' in this.fecha_nacimiento) {
      // Es un objeto Date
      fechaFormateada = (this.fecha_nacimiento as Date).toISOString().split('T')[0];
    } else if (typeof this.fecha_nacimiento === 'string') {
      // Si viene como string, intentar parsearlo
      const fecha = new Date(this.fecha_nacimiento);
      if (!isNaN(fecha.getTime())) {
        fechaFormateada = fecha.toISOString().split('T')[0];
      } else {
        fechaFormateada = this.fecha_nacimiento.trim();
      }
    } else if (this.fecha_nacimiento) {
      fechaFormateada = String(this.fecha_nacimiento).trim();
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

    this.authService.register(userData).subscribe({
      next: (response) => {
        // Navegar a la pantalla de verificación (sin código - solo por email)
        this.router.navigate(['/verificar-email'], { 
          queryParams: { email: response.email || this.email },
          replaceUrl: true
        });
      },
      error: (err) => {
        const errorMsg = err?.error?.msg || err?.error?.errors?.[0] || 'No se pudo completar el registro.';
        this.presentAlert('Error de Registro', errorMsg);
      }
    });
  }

  async cerrarModalFecha() {
    const modal = await this.modalController.getTop();
    if (modal) {
      await modal.dismiss();
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
}
