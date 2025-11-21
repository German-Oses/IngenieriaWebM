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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToggle,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { RutinaService, RutinaCompleta } from '../../services/rutina.service';
import { EjercicioService } from '../../services/ejercicio.service';
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
  arrowBackOutline,
  checkmarkOutline,
  checkmarkCircleOutline,
  calendarOutline,
  timeOutline,
  repeatOutline,
  fitnessOutline
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonToggle,
    CommonModule,
    FormsModule
  ]
})
export class RutinasPage implements OnInit {
  rutinas: RutinaCompleta[] = [];
  cargando = false;
  usuarioActual: any = null;
  creandoRutina = false;

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

  // Modal editar rutina
  mostrarModalEditarRutina = false;
  rutinaEditando: RutinaCompleta | null = null;
  editandoRutina = false;

  // Modal agregar día
  mostrarModalAgregarDia = false;
  nuevoDia = {
    numero_dia: 1,
    nombre_dia: '',
    descripcion: ''
  };
  rutinaParaAgregarDia: RutinaCompleta | null = null;

  // Modal agregar ejercicio a día
  mostrarModalAgregarEjercicio = false;
  diaParaAgregarEjercicio: any = null;
  ejerciciosDisponibles: any[] = [];
  ejercicioSeleccionado: any = null;
  configEjercicio = {
    series: 3,
    repeticiones: '10-12',
    peso_recomendado: 0,
    descanso_segundos: 60,
    notas: ''
  };

  constructor(
    private rutinaService: RutinaService,
    private ejercicioService: EjercicioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ addOutline, closeOutline, createOutline, trashOutline, shareOutline, heartOutline, heart, homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, arrowBackOutline, checkmarkOutline, calendarOutline, timeOutline });
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
      this.presentToast('El nombre de la rutina es requerido', 'warning');
      return;
    }

    if (this.nuevaRutina.nombre_rutina.trim().length < 3) {
      this.presentToast('El nombre debe tener al menos 3 caracteres', 'warning');
      return;
    }

    this.creandoRutina = true;
    this.rutinaService.createRutina(this.nuevaRutina as RutinaCompleta).subscribe({
      next: (rutina) => {
        this.creandoRutina = false;
        this.presentToast('✅ Rutina creada exitosamente', 'success');
        this.cerrarModalCrearRutina();
        this.cargarRutinas();
        // Abrir modal para agregar días si la rutina se creó correctamente
        if (rutina.id_rutina) {
          setTimeout(() => {
            this.abrirModalAgregarDia(rutina);
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error al crear rutina:', error);
        this.creandoRutina = false;
        const errorMsg = error.error?.error || error.error?.message || 'Error al crear la rutina';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  abrirModalEditarRutina(rutina: RutinaCompleta) {
    this.rutinaEditando = { ...rutina };
    this.mostrarModalEditarRutina = true;
  }

  cerrarModalEditarRutina() {
    this.mostrarModalEditarRutina = false;
    this.rutinaEditando = null;
  }

  actualizarRutina() {
    if (!this.rutinaEditando || !this.rutinaEditando.nombre_rutina?.trim()) {
      this.presentToast('El nombre de la rutina es requerido', 'warning');
      return;
    }

    this.editandoRutina = true;
    this.rutinaService.updateRutina(this.rutinaEditando.id_rutina!, {
      nombre_rutina: this.rutinaEditando.nombre_rutina,
      descripcion: this.rutinaEditando.descripcion,
      tipo_rutina: this.rutinaEditando.tipo_rutina,
      nivel_dificultad: this.rutinaEditando.nivel_dificultad,
      duracion_semanas: this.rutinaEditando.duracion_semanas,
      es_publica: this.rutinaEditando.es_publica
    }).subscribe({
      next: () => {
        this.editandoRutina = false;
        this.presentToast('✅ Rutina actualizada exitosamente', 'success');
        this.cerrarModalEditarRutina();
        this.cargarRutinas();
      },
      error: (error) => {
        console.error('Error al actualizar rutina:', error);
        this.editandoRutina = false;
        const errorMsg = error.error?.error || error.error?.message || 'Error al actualizar la rutina';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  abrirModalAgregarDia(rutina: RutinaCompleta) {
    this.rutinaParaAgregarDia = rutina;
    const maxDia = rutina.dias && rutina.dias.length > 0 
      ? Math.max(...rutina.dias.map(d => d.numero_dia || 0)) 
      : 0;
    this.nuevoDia = {
      numero_dia: maxDia + 1,
      nombre_dia: '',
      descripcion: ''
    };
    this.mostrarModalAgregarDia = true;
  }

  cerrarModalAgregarDia() {
    this.mostrarModalAgregarDia = false;
    this.rutinaParaAgregarDia = null;
    this.nuevoDia = { numero_dia: 1, nombre_dia: '', descripcion: '' };
  }

  async crearDia() {
    if (!this.rutinaParaAgregarDia || !this.rutinaParaAgregarDia.id_rutina) {
      this.presentToast('Error: Rutina no válida', 'danger');
      return;
    }

    if (!this.nuevoDia.numero_dia || this.nuevoDia.numero_dia < 1) {
      this.presentToast('El número de día debe ser mayor a 0', 'warning');
      return;
    }

    if (!this.nuevoDia.nombre_dia?.trim()) {
      this.nuevoDia.nombre_dia = `Día ${this.nuevoDia.numero_dia}`;
    }

    // Crear el día usando el servicio (no incluir id_rutina en el body, se pasa en la URL)
    const diaData = {
      numero_dia: this.nuevoDia.numero_dia,
      nombre_dia: this.nuevoDia.nombre_dia.trim(),
      descripcion: this.nuevoDia.descripcion?.trim() || undefined
    };

    this.rutinaService.createRutinaDia(this.rutinaParaAgregarDia.id_rutina, diaData).subscribe({
      next: () => {
        this.presentToast('✅ Día agregado exitosamente', 'success');
        this.cerrarModalAgregarDia();
        this.cargarRutinas();
      },
      error: (error) => {
        console.error('Error al crear día:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Error al crear el día';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  abrirModalAgregarEjercicio(dia: any) {
    if (!dia || !dia.id_dia) {
      this.presentToast('Error: Día inválido', 'danger');
      return;
    }
    
    this.diaParaAgregarEjercicio = dia;
    this.configEjercicio = {
      series: 3,
      repeticiones: '10-12',
      peso_recomendado: 0,
      descanso_segundos: 60,
      notas: ''
    };
    this.ejercicioSeleccionado = null;
    this.ejerciciosDisponibles = []; // Limpiar lista anterior
    
    // Abrir modal primero
    this.mostrarModalAgregarEjercicio = true;
    
    // Cargar ejercicios disponibles
    this.ejercicioService.getEjercicios({ limit: 100 }).subscribe({
      next: (ejercicios) => {
        console.log('Ejercicios cargados:', ejercicios.length);
        this.ejerciciosDisponibles = ejercicios || [];
        if (this.ejerciciosDisponibles.length === 0) {
          this.presentToast('No hay ejercicios disponibles', 'warning');
        }
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
        this.presentToast('Error al cargar ejercicios. Por favor, intenta de nuevo.', 'danger');
        // Cerrar modal si hay error
        this.mostrarModalAgregarEjercicio = false;
      }
    });
  }

  cerrarModalAgregarEjercicio() {
    this.mostrarModalAgregarEjercicio = false;
    this.diaParaAgregarEjercicio = null;
    this.ejercicioSeleccionado = null;
  }

  async agregarEjercicioADia() {
    if (!this.diaParaAgregarEjercicio || !this.ejercicioSeleccionado) {
      this.presentToast('Debes seleccionar un ejercicio', 'warning');
      return;
    }

    if (!this.configEjercicio.series || this.configEjercicio.series < 1) {
      this.presentToast('El número de series debe ser mayor a 0', 'warning');
      return;
    }

    if (!this.configEjercicio.repeticiones?.trim()) {
      this.presentToast('Las repeticiones son requeridas', 'warning');
      return;
    }

    // Obtener el id_rutina del día
    const rutina = this.rutinas.find(r => 
      r.dias?.some(d => d.id_dia === this.diaParaAgregarEjercicio.id_dia)
    );

    if (!rutina || !rutina.id_rutina) {
      this.presentToast('Error: No se encontró la rutina', 'danger');
      return;
    }

    const ejercicioData = {
      id_dia: this.diaParaAgregarEjercicio.id_dia!,
      id_ejercicio: this.ejercicioSeleccionado.id_ejercicio!,
      series: this.configEjercicio.series,
      repeticiones: this.configEjercicio.repeticiones.trim(),
      peso_recomendado: this.configEjercicio.peso_recomendado > 0 ? this.configEjercicio.peso_recomendado : undefined,
      descanso_segundos: this.configEjercicio.descanso_segundos || 60,
      notas: this.configEjercicio.notas?.trim() || undefined,
      orden: this.diaParaAgregarEjercicio.ejercicios?.length || 0
    };

    this.rutinaService.agregarEjercicioARutina(rutina.id_rutina, ejercicioData).subscribe({
      next: () => {
        this.presentToast(`✅ Ejercicio "${this.ejercicioSeleccionado.nombre_ejercicio}" agregado`, 'success');
        this.cerrarModalAgregarEjercicio();
        this.cargarRutinas();
      },
      error: (error) => {
        console.error('Error al agregar ejercicio:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Error al agregar el ejercicio';
        this.presentToast(errorMsg, 'danger');
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

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' | 'info' = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  formatearDuracion(semanas: number): string {
    if (semanas === 1) return '1 semana';
    return `${semanas} semanas`;
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
