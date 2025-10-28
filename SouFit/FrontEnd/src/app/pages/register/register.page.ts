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
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
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

    if (this.password !== this.confirmPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!this.id_region || !this.id_comuna) {
      this.presentAlert('Error', 'Debes seleccionar región y comuna.');
      return;
    }

    const userData = {
      username: this.username,
      email: this.email,
      password: this.password,
      id_region: this.id_region,
      id_comuna: this.id_comuna
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.presentAlert('¡Éxito!', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const errorMsg = err?.error?.msg || 'No se pudo completar el registro.';
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
