import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonGrid, IonRow, IonCol, IonIcon, IonInput, IonButton, IonSpinner, IonChip, IonLabel, IonAvatar, IonItem, IonList, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonText } from '@ionic/angular/standalone';
import { EjercicioService, Ejercicio } from '../../services/ejercicio.service';
import { ChatService } from '../../services/chat.service';
import { RutinaService, RutinaCompleta } from '../../services/rutina.service';
import { AuthService } from '../../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline, addOutline, closeOutline, checkmarkOutline } from 'ionicons/icons';

export interface UsuarioBusqueda {
  id_usuario: number;
  nombre: string;
  username: string;
  avatar?: string;
  siguiendo: boolean;
}

@Component({
  selector: 'app-buscar',
  templateUrl: './buscar.page.html',
  styleUrls: ['./buscar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonGrid, IonRow, IonCol, 
    IonIcon, IonInput, IonButton, IonSpinner, IonChip, IonLabel, IonAvatar, IonItem, IonList,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonText
  ],
  providers: [AlertController, ToastController]
})
export class BuscarPage implements OnInit {
  terminoBusqueda: string = '';
  tipoBusqueda: 'usuarios' | 'ejercicios' = 'usuarios';
  usuariosEncontrados: UsuarioBusqueda[] = [];
  ejerciciosEncontrados: Ejercicio[] = [];
  cargando = false;
  mostrarResultados = false;
  
  // Búsqueda avanzada
  filtroGrupoMuscular: string = '';
  filtroDuracion: string = '';
  ordenarPor: 'relevancia' | 'nombre' | 'duracion' = 'relevancia';
  
  // Modal agregar a rutina
  mostrarModalAgregarRutina = false;
  ejercicioSeleccionado: Ejercicio | null = null;
  rutinasUsuario: RutinaCompleta[] = [];
  rutinaSeleccionada: RutinaCompleta | null = null;
  diaSeleccionado: any = null;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private ejercicioService: EjercicioService,
    private rutinaService: RutinaService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline, addOutline, closeOutline, checkmarkOutline });
  }

  ngOnInit() {
  }

  cambiarTipoBusqueda(tipo: 'usuarios' | 'ejercicios') {
    this.tipoBusqueda = tipo;
    this.terminoBusqueda = '';
    this.limpiarResultados();
  }

  buscar() {
    if (!this.terminoBusqueda || this.terminoBusqueda.length < 2) {
      this.limpiarResultados();
      return;
    }

    this.cargando = true;
    this.mostrarResultados = true;

    if (this.tipoBusqueda === 'usuarios') {
      this.buscarUsuarios();
    } else {
      this.buscarEjercicios();
    }
  }

  buscarUsuarios() {
    this.chatService.buscarUsuarioPorUsername(this.terminoBusqueda).subscribe({
      next: (usuarios) => {
        this.usuariosEncontrados = usuarios;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.cargando = false;
        this.usuariosEncontrados = [];
      }
    });
  }

  buscarEjercicios() {
    const filtros: any = {
      nombre: this.terminoBusqueda,
      limit: 50
    };
    
    if (this.filtroGrupoMuscular) {
      filtros.grupo_muscular = this.filtroGrupoMuscular;
    }
    
    if (this.filtroDuracion) {
      filtros.duracion_max = parseInt(this.filtroDuracion);
    }
    
    this.ejercicioService.getEjercicios(filtros).subscribe({
      next: (ejercicios) => {
        let ejerciciosOrdenados = [...ejercicios];
        
        // Ordenar resultados
        if (this.ordenarPor === 'nombre') {
          ejerciciosOrdenados.sort((a, b) => 
            (a.nombre_ejercicio || '').localeCompare(b.nombre_ejercicio || '')
          );
        } else if (this.ordenarPor === 'duracion') {
          ejerciciosOrdenados.sort((a, b) => 
            (a.duracion_minutos || 0) - (b.duracion_minutos || 0)
          );
        }
        
        this.ejerciciosEncontrados = ejerciciosOrdenados;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar ejercicios:', error);
        this.cargando = false;
        this.ejerciciosEncontrados = [];
      }
    });
  }

  limpiarResultados() {
    this.usuariosEncontrados = [];
    this.ejerciciosEncontrados = [];
    this.mostrarResultados = false;
  }

  seguirUsuario(usuario: UsuarioBusqueda) {
    this.chatService.seguirUsuario(usuario.id_usuario).subscribe({
      next: () => {
        usuario.siguiendo = true;
      },
      error: (error) => {
        console.error('Error al seguir usuario:', error);
      }
    });
  }

  dejarDeSeguir(usuario: UsuarioBusqueda) {
    this.chatService.dejarDeSeguir(usuario.id_usuario).subscribe({
      next: () => {
        usuario.siguiendo = false;
      },
      error: (error) => {
        console.error('Error al dejar de seguir:', error);
      }
    });
  }

  verPerfil(usuarioId: number) {
    // Navegar al perfil del usuario
    this.router.navigate(['/perfil', usuarioId]);
  }

  verEjercicio(ejercicioId: number) {
    // Navegar al detalle del ejercicio
    this.router.navigate(['/ejercicio', ejercicioId]);
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  mensajeria() {
    this.router.navigate(['/mensajeria']);
  }

  perfil() {
    this.router.navigate(['/perfil']);
  }

  async agregarARutina(ejercicio: Ejercicio) {
    this.ejercicioSeleccionado = ejercicio;
    
    // Cargar rutinas del usuario
    this.rutinaService.getMisRutinas().subscribe({
      next: (rutinas) => {
        this.rutinasUsuario = rutinas;
        if (rutinas.length === 0) {
          this.presentToast('No tienes rutinas creadas. Crea una rutina primero.');
          return;
        }
        this.mostrarModalAgregarRutina = true;
      },
      error: (error) => {
        console.error('Error al cargar rutinas:', error);
        this.presentToast('Error al cargar tus rutinas');
      }
    });
  }

  cerrarModalAgregarRutina() {
    this.mostrarModalAgregarRutina = false;
    this.ejercicioSeleccionado = null;
    this.rutinaSeleccionada = null;
    this.diaSeleccionado = null;
  }

  seleccionarRutina(rutina: RutinaCompleta) {
    this.rutinaSeleccionada = rutina;
    this.diaSeleccionado = null; // Reset día al cambiar rutina
  }

  async confirmarAgregarEjercicio() {
    if (!this.rutinaSeleccionada || !this.ejercicioSeleccionado) {
      return;
    }

    // Si la rutina no tiene días, crear uno por defecto
    if (!this.rutinaSeleccionada.dias || this.rutinaSeleccionada.dias.length === 0) {
      const alert = await this.alertController.create({
        header: 'Rutina sin días',
        message: 'Esta rutina no tiene días configurados. ¿Deseas agregar el ejercicio al día 1?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Agregar',
            handler: async () => {
              // Primero necesitaríamos crear un día, pero por ahora solo informamos
              this.presentToast('Por favor, edita la rutina y agrega días primero');
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    // Si no se seleccionó un día, usar el primero
    if (!this.diaSeleccionado) {
      this.diaSeleccionado = this.rutinaSeleccionada.dias[0];
    }

    const ejercicioData = {
      id_dia: this.diaSeleccionado.id_dia!,
      id_ejercicio: this.ejercicioSeleccionado.id_ejercicio!,
      series: 3,
      repeticiones: '10-12',
      orden: this.diaSeleccionado.ejercicios?.length || 0
    };

    this.rutinaService.agregarEjercicioARutina(this.rutinaSeleccionada.id_rutina!, ejercicioData).subscribe({
      next: () => {
        this.presentToast(`Ejercicio "${this.ejercicioSeleccionado?.nombre_ejercicio}" agregado a la rutina`);
        this.cerrarModalAgregarRutina();
      },
      error: (error) => {
        console.error('Error al agregar ejercicio:', error);
        this.presentToast('Error al agregar el ejercicio a la rutina');
      }
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
}

