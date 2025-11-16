import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  templateUrl: './register.page.html',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
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

  constructor(
    private authService: AuthService,
    private ubicacionService: UbicacionService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit(): void {
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
    if (!this.fecha_nacimiento || !this.fecha_nacimiento.trim()) {
      this.presentAlert('Error', 'La fecha de nacimiento es obligatoria.');
      return;
    }

    const userData: any = {
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      username: this.username.trim(),
      email: this.email,
      password: this.password,
      fecha_nacimiento: this.fecha_nacimiento.trim(),
      id_region: this.id_region,
      id_comuna: this.id_comuna
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        // Navegar a la página de verificación de email con el email
        this.router.navigate(['/verificar-email'], { 
          queryParams: { email: response.email || this.email } 
        });
      },
      error: (err) => {
        const errorMsg = err?.error?.msg || err?.error?.errors?.[0] || 'No se pudo completar el registro.';
        this.presentAlert('Error de Registro', errorMsg);
      }
    });
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
