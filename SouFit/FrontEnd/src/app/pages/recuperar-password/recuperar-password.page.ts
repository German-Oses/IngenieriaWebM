import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class RecuperarPasswordPage {
  paso: 'email' | 'codigo' | 'nuevaPassword' = 'email';
  email = '';
  codigo = '';
  nuevaPassword = '';
  confirmarPassword = '';
  codigoEnviado = false;
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ arrowBackOutline });
  }

  async solicitarCodigo() {
    if (!this.email || !this.email.includes('@')) {
      await this.presentAlert('Error', 'Por favor, ingresa un correo electrónico válido');
      return;
    }

    this.cargando = true;
    this.authService.solicitarRecuperacionPassword(this.email).subscribe({
      next: async (response) => {
        this.cargando = false;
        
        // Verificar si el email existe (indicador interno del backend)
        if (response.emailExists === false) {
          await this.presentAlert(
            'Correo no registrado', 
            'No existe una cuenta asociada a este correo electrónico. Por favor, verifica el correo o crea una cuenta nueva.'
          );
          return;
        }
        
        // Si el email existe, continuar con el flujo
        this.codigoEnviado = true;
        this.paso = 'codigo';
        
        await this.presentAlert(
          'Código enviado', 
          'Se ha enviado un código de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y la carpeta de spam.'
        );
      },
      error: async (err) => {
        this.cargando = false;
        const errorMsg = err.error?.error || err.error?.message || 'Error al solicitar código de recuperación';
        await this.presentAlert('Error', errorMsg);
      }
    });
  }

  async verificarCodigo() {
    if (!this.codigo || this.codigo.length !== 6) {
      await this.presentAlert('Error', 'Por favor, ingresa el código de 6 dígitos');
      return;
    }

    this.paso = 'nuevaPassword';
  }

  async resetearPassword() {
    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      await this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      await this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    this.cargando = true;
    this.authService.resetearPassword(this.email, this.codigo, this.nuevaPassword).subscribe({
      next: async () => {
        this.cargando = false;
        await this.presentAlert('Éxito', 'Tu contraseña ha sido restablecida correctamente');
        this.router.navigate(['/login']);
      },
      error: async (err) => {
        this.cargando = false;
        const errorMsg = err.error?.error || 'Error al restablecer la contraseña';
        await this.presentAlert('Error', errorMsg);
      }
    });
  }

  filtrarSoloNumeros(event: any) {
    const value = event.target.value || '';
    this.codigo = value.replace(/[^0-9]/g, '');
  }

  volverALogin() {
    this.router.navigate(['/login']);
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

