import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  templateUrl: './register.page.html',
  imports: [IonicModule, FormsModule], 
})
export class RegisterPage {
  username = '';
  email = '';
  region = '';
  comuna = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  createAccount() {
    if (!this.acceptTerms) {
      this.presentAlert('Atención', 'Debes aceptar los términos y condiciones.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    const userData = {
      username: this.username,
      email: this.email,
      password: this.password,
      region: this.region,
      comuna: this.comuna,
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.presentAlert('¡Éxito!', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const errorMsg = err.error?.msg || 'No se pudo completar el registro.';
        this.presentAlert('Error de Registro', errorMsg);
      },
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
