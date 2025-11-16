import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline, arrowBackOutline, refreshOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verificar-email',
  templateUrl: './verificar-email.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class VerificarEmailPage implements OnInit {
  email: string = '';
  codigo: string = '';
  codigoVerificado: boolean = false;
  reenviando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ mailOutline, checkmarkCircleOutline, arrowBackOutline, refreshOutline });
  }

  ngOnInit() {
    // Obtener email de los query params
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
    
    // Si no hay email, redirigir al registro
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  filtrarSoloNumeros(event: any) {
    const input = event.target;
    const value = input.value.replace(/[^0-9]/g, '');
    this.codigo = value;
    input.value = value;
  }

  verificarCodigo() {
    if (!this.codigo || this.codigo.length !== 6) {
      this.presentAlert('Error', 'Por favor, ingresa un código de 6 dígitos');
      return;
    }

    this.authService.verificarEmail(this.email, this.codigo).subscribe({
      next: (response) => {
        this.codigoVerificado = true;
        this.presentToast('¡Email verificado exitosamente!');
        
        // Esperar un momento y luego redirigir al home (ya está autenticado)
        setTimeout(() => {
          this.router.navigate(['/home'], { replaceUrl: true });
        }, 1500);
      },
      error: (err) => {
        const errorMsg = err?.error?.error || err?.error?.msg || 'Código inválido o expirado';
        this.presentAlert('Error', errorMsg);
        this.codigo = ''; // Limpiar el código
      }
    });
  }

  reenviarCodigo() {
    if (!this.email) {
      this.presentAlert('Error', 'No se encontró el email');
      return;
    }

    this.reenviando = true;
    this.authService.reenviarCodigoVerificacion(this.email).subscribe({
      next: (response) => {
        this.presentToast('Código de verificación reenviado. Revisa tu correo.');
        this.reenviando = false;
      },
      error: (err) => {
        const errorMsg = err?.error?.error || err?.error?.msg || 'Error al reenviar el código';
        this.presentAlert('Error', errorMsg);
        this.reenviando = false;
      }
    });
  }

  volverRegistro() {
    this.router.navigate(['/register']);
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

