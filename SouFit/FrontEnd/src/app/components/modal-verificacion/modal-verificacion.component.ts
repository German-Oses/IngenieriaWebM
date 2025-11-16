import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, refreshOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-modal-verificacion',
  templateUrl: './modal-verificacion.component.html',
  styleUrls: ['./modal-verificacion.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ModalVerificacionComponent implements OnInit {
  @Input() email: string = '';
  
  codigoVerificacion: string = '';
  verificando: boolean = false;
  reenviandoCodigo: boolean = false;

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({ mailOutline, refreshOutline, close });
  }

  ngOnInit() {
    console.log('Modal de verificación abierto para:', this.email);
  }

  filtrarSoloNumerosCodigo(event: any) {
    const input = event.target;
    const value = input.value.replace(/[^0-9]/g, '');
    this.codigoVerificacion = value;
    input.value = value;
  }

  async verificarCodigo() {
    if (!this.codigoVerificacion || this.codigoVerificacion.length !== 6) {
      await this.presentAlert('Error', 'Por favor, ingresa un código de 6 dígitos');
      return;
    }

    this.verificando = true;
    console.log('Verificando código:', this.codigoVerificacion, 'para email:', this.email);
    
    this.authService.verificarEmail(this.email, this.codigoVerificacion).subscribe({
      next: async (response) => {
        console.log('✅ Email verificado:', response);
        this.verificando = false;
        
        // El AuthService ya guarda el token automáticamente en el pipe tap
        // Solo necesitamos cerrar el modal
        
        // Cerrar modal y retornar éxito
        await this.modalController.dismiss({ verificado: true });
      },
      error: async (err) => {
        console.error('❌ Error verificando código:', err);
        this.verificando = false;
        const errorMsg = err?.error?.error || err?.error?.msg || 'Código inválido o expirado';
        await this.presentAlert('Error', errorMsg);
        this.codigoVerificacion = ''; // Limpiar el código
      }
    });
  }

  async reenviarCodigo() {
    if (!this.email) {
      await this.presentAlert('Error', 'No se encontró el email');
      return;
    }

    this.reenviandoCodigo = true;
    this.authService.reenviarCodigoVerificacion(this.email).subscribe({
      next: async (response) => {
        this.reenviandoCodigo = false;
        await this.presentToast('Código de verificación reenviado. Revisa tu correo.');
      },
      error: async (err) => {
        this.reenviandoCodigo = false;
        const errorMsg = err?.error?.error || err?.error?.msg || 'Error al reenviar el código';
        await this.presentAlert('Error', errorMsg);
      }
    });
  }

  cerrarModal() {
    this.modalController.dismiss({ verificado: false });
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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

