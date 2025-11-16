import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';          
import { AlertController } from '@ionic/angular';      
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [IonicModule, FormsModule],
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  login() {
    const credentials = { email: this.email, password: this.password };
    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (err) => {
        // Si el email no está verificado, redirigir a la página de verificación
        if (err.error?.emailNoVerificado) {
          this.presentAlert(
            'Email no verificado', 
            'Por favor, verifica tu correo electrónico antes de iniciar sesión.'
          );
          this.router.navigate(['/verificar-email'], { 
            queryParams: { email: this.email } 
          });
        } else {
          const errorMsg = err.error?.msg || 'Credenciales inválidas.';
          this.presentAlert('Error', errorMsg);
        }
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  forgotPassword() {
    this.router.navigate(['/recuperar-password']);
  }
}
