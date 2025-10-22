// src/app/pages/perfil/perfil.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// --- 1. IMPORTA LOS COMPONENTES ESPECÍFICOS QUE USAS EN TU HTML ---
import { 
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Necesario para los iconos
import { homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline } from 'ionicons/icons'; // Los iconos que usas

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  // --- 2. AÑADE LOS COMPONENTES AL ARRAY 'imports' ---
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton
  ]
})
export class PerfilPage {
  userProfile: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    // Añade los iconos que vas a usar en la página
    addIcons({ homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline });
  }

  ionViewWillEnter() {
    this.authService.getUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
      },
      error: (err) => {
        console.error('Error al cargar el perfil:', err);
        if (err.status === 401) {
          this.presentAlert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
          this.authService.logout();
        } else {
          this.presentAlert('Error', 'No se pudieron cargar los datos del perfil.');
        }
      }
    });
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  cerrarSesion() {
    this.authService.logout();
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  mensajeria() {
    this.router.navigate(['/mensajes']);
  }
}