import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { RutinaService, RutinaCompleta } from '../../services/rutina.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  closeOutline, 
  createOutline, 
  trashOutline, 
  shareOutline, 
  heartOutline, 
  heart,
  homeOutline,
  searchOutline,
  barbellOutline,
  chatbubblesOutline,
  personOutline,
  arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  styleUrls: ['./rutinas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonAccordion,
    IonAccordionGroup,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule
  ]
})
export class RutinasPage implements OnInit {
  rutinas: RutinaCompleta[] = [];
  cargando = false;
  usuarioActual: any = null;

  // Modal crear rutina
  mostrarModalCrearRutina = false;
  nuevaRutina: Partial<RutinaCompleta> = {
    nombre_rutina: '',
    descripcion: '',
    tipo_rutina: 'Fuerza',
    nivel_dificultad: 'Principiante',
    duracion_semanas: 4,
    es_publica: true,
    dias: []
  };

  constructor(
    private rutinaService: RutinaService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ addOutline, closeOutline, createOutline, trashOutline, shareOutline, heartOutline, heart, homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, arrowBackOutline });
  }

  async ngOnInit() {
    this.usuarioActual = await this.authService.getCurrentUser();
    this.cargarRutinas();
  }

  cargarRutinas() {
    this.cargando = true;
    this.rutinaService.getMisRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar rutinas:', error);
        this.cargando = false;
        this.rutinas = [];
      }
    });
  }

  abrirModalCrearRutina() {
    this.mostrarModalCrearRutina = true;
    this.nuevaRutina = {
      nombre_rutina: '',
      descripcion: '',
      tipo_rutina: 'Fuerza',
      nivel_dificultad: 'Principiante',
      duracion_semanas: 4,
      es_publica: true,
      dias: []
    };
  }

  cerrarModalCrearRutina() {
    this.mostrarModalCrearRutina = false;
  }

  crearRutina() {
    if (!this.nuevaRutina.nombre_rutina?.trim()) {
      this.presentToast('El nombre de la rutina es requerido');
      return;
    }

    this.rutinaService.createRutina(this.nuevaRutina as RutinaCompleta).subscribe({
      next: () => {
        this.presentToast('Rutina creada exitosamente');
        this.cerrarModalCrearRutina();
        this.cargarRutinas();
      },
      error: (error) => {
        console.error('Error al crear rutina:', error);
        this.presentToast('Error al crear la rutina');
      }
    });
  }

  eliminarRutina(id: number) {
    this.presentAlertConfirm('Eliminar Rutina', '¿Estás seguro de eliminar esta rutina?').then(confirm => {
      if (confirm) {
        this.rutinaService.deleteRutina(id).subscribe({
          next: () => {
            this.presentToast('Rutina eliminada');
            this.cargarRutinas();
          },
          error: (error) => {
            console.error('Error al eliminar rutina:', error);
            this.presentToast('Error al eliminar la rutina');
          }
        });
      }
    });
  }

  compartirRutina(id: number) {
    this.rutinaService.compartirRutina(id).subscribe({
      next: () => {
        this.presentToast('Rutina compartida');
      },
      error: (error) => {
        console.error('Error al compartir rutina:', error);
      }
    });
  }

  async presentAlertConfirm(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Confirmar',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  navegarABuscar() {
    this.router.navigate(['/buscar']);
  }

  navegarAMensajeria() {
    this.router.navigate(['/mensajeria']);
  }

  navegarAPerfil() {
    this.router.navigate(['/perfil']);
  }
}
