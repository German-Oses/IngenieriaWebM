import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline, addOutline, closeOutline, checkmarkOutline, heartOutline, heart, timeOutline, starOutline, star } from 'ionicons/icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

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
export class BuscarPage implements OnInit, OnDestroy {
  terminoBusqueda: string = '';
  tipoBusqueda: 'usuarios' | 'ejercicios' = 'usuarios';
  usuariosEncontrados: UsuarioBusqueda[] = [];
  ejerciciosEncontrados: Ejercicio[] = [];
  cargando = false;
  mostrarResultados = false;
  errorBusqueda: string = '';
  totalResultados = 0;
  
  // Búsqueda avanzada
  filtroGrupoMuscular: string = '';
  filtroDuracion: string = '';
  ordenarPor: 'relevancia' | 'nombre' | 'duracion' = 'relevancia';
  mostrarFiltros = false;
  
  // Historial de búsquedas
  historialBusquedas: string[] = [];
  mostrarHistorial = false;
  
  // Búsqueda con debounce
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  
  // Modal agregar a rutina
  mostrarModalAgregarRutina = false;
  ejercicioSeleccionado: Ejercicio | null = null;
  rutinasUsuario: RutinaCompleta[] = [];
  rutinaSeleccionada: RutinaCompleta | null = null;
  diaSeleccionado: any = null;
  ejercicioConfig = {
    series: 3,
    repeticiones: '10-12',
    peso_recomendado: 0,
    descanso_segundos: 60
  };

  constructor(
    private router: Router,
    private chatService: ChatService,
    private ejercicioService: EjercicioService,
    private rutinaService: RutinaService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private storage: Storage
  ) {
    addIcons({ searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline, addOutline, closeOutline, checkmarkOutline, heartOutline, heart, timeOutline, starOutline, star });
  }

  async ngOnInit() {
    await this.storage.create();
    await this.cargarHistorial();
    this.configurarBusquedaDebounce();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  configurarBusquedaDebounce() {
    const sub = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(termino => {
      if (termino && termino.length >= 2) {
        this.buscar();
      } else if (termino.length === 0) {
        this.limpiarResultados();
      }
    });
    this.subscriptions.push(sub);
  }

  async cargarHistorial() {
    const historial = await this.storage.get(`historial_busqueda_${this.tipoBusqueda}`) || [];
    this.historialBusquedas = historial.slice(0, 5); // Últimas 5 búsquedas
    this.mostrarHistorial = this.historialBusquedas.length > 0 && this.terminoBusqueda.length < 2;
  }

  async guardarEnHistorial(termino: string) {
    if (!termino || termino.length < 2) return;
    
    const historial = await this.storage.get(`historial_busqueda_${this.tipoBusqueda}`) || [];
    const nuevoHistorial = [termino, ...historial.filter((h: string) => h !== termino)].slice(0, 10);
    await this.storage.set(`historial_busqueda_${this.tipoBusqueda}`, nuevoHistorial);
    this.historialBusquedas = nuevoHistorial.slice(0, 5);
  }

  usarHistorial(termino: string) {
    this.terminoBusqueda = termino;
    this.mostrarHistorial = false;
    this.buscar();
  }

  limpiarHistorial() {
    this.storage.remove(`historial_busqueda_${this.tipoBusqueda}`);
    this.historialBusquedas = [];
    this.mostrarHistorial = false;
  }

  async eliminarDelHistorial(termino: string) {
    const historial = await this.storage.get(`historial_busqueda_${this.tipoBusqueda}`) || [];
    const nuevoHistorial = historial.filter((h: string) => h !== termino);
    await this.storage.set(`historial_busqueda_${this.tipoBusqueda}`, nuevoHistorial);
    this.historialBusquedas = nuevoHistorial.slice(0, 5);
    if (this.historialBusquedas.length === 0) {
      this.mostrarHistorial = false;
    }
  }

  async limpiarHistorialCompleto() {
    await this.storage.set(`historial_busqueda_${this.tipoBusqueda}`, []);
    this.historialBusquedas = [];
    this.mostrarHistorial = false;
    this.presentToast('Historial limpiado');
  }

  buscarDirecto(termino: string) {
    this.terminoBusqueda = termino;
    this.mostrarHistorial = false;
    this.buscar();
  }

  onSearchInput(event: any) {
    this.terminoBusqueda = event.detail.value || '';
    this.mostrarHistorial = this.terminoBusqueda.length < 2 && this.historialBusquedas.length > 0;
    this.searchSubject.next(this.terminoBusqueda);
  }

  cambiarTipoBusqueda(tipo: 'usuarios' | 'ejercicios') {
    this.tipoBusqueda = tipo;
    this.terminoBusqueda = '';
    this.limpiarResultados();
    this.cargarHistorial();
  }

  onInputChange() {
    this.mostrarHistorial = this.terminoBusqueda.length > 0 && this.terminoBusqueda.length < 2;
    this.searchSubject.next(this.terminoBusqueda);
  }

  buscar() {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim().length < 2) {
      this.limpiarResultados();
      return;
    }

    this.cargando = true;
    this.mostrarResultados = true;
    this.errorBusqueda = '';
    this.mostrarHistorial = false;
    this.guardarEnHistorial(this.terminoBusqueda.trim());

    if (this.tipoBusqueda === 'usuarios') {
      this.buscarUsuarios();
    } else {
      this.buscarEjercicios();
    }
  }

  buscarUsuarios() {
    this.chatService.buscarUsuarioPorUsername(this.terminoBusqueda.trim()).subscribe({
      next: (usuarios) => {
        this.usuariosEncontrados = usuarios;
        this.totalResultados = usuarios.length;
        this.cargando = false;
        if (usuarios.length === 0) {
          this.errorBusqueda = 'No se encontraron usuarios con ese nombre';
        }
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.cargando = false;
        this.usuariosEncontrados = [];
        this.errorBusqueda = 'Error al buscar usuarios. Por favor, intenta de nuevo.';
        this.presentToast('Error al buscar usuarios');
      }
    });
  }

  buscarEjercicios() {
    const filtros: any = {
      nombre: this.terminoBusqueda.trim(),
      limit: 100
    };
    
    if (this.filtroGrupoMuscular) {
      filtros.grupo_muscular = this.filtroGrupoMuscular;
    }
    
    if (this.filtroDuracion && this.filtroDuracion.trim()) {
      const duracion = parseInt(this.filtroDuracion);
      if (!isNaN(duracion) && duracion > 0) {
        filtros.duracion_max = duracion;
      }
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
        } else {
          // Ordenar por relevancia (likes primero, luego por nombre)
          ejerciciosOrdenados.sort((a, b) => {
            const likesA = a.total_likes || 0;
            const likesB = b.total_likes || 0;
            if (likesB !== likesA) {
              return likesB - likesA;
            }
            return (a.nombre_ejercicio || '').localeCompare(b.nombre_ejercicio || '');
          });
        }
        
        this.ejerciciosEncontrados = ejerciciosOrdenados;
        this.totalResultados = ejerciciosOrdenados.length;
        this.cargando = false;
        if (ejerciciosOrdenados.length === 0) {
          this.errorBusqueda = 'No se encontraron ejercicios con esos criterios';
        }
      },
      error: (error) => {
        console.error('Error al buscar ejercicios:', error);
        this.cargando = false;
        this.ejerciciosEncontrados = [];
        this.errorBusqueda = 'Error al buscar ejercicios. Por favor, intenta de nuevo.';
        this.presentToast('Error al buscar ejercicios');
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
        this.presentToast(`Ahora sigues a ${usuario.nombre || usuario.username}`);
      },
      error: (error) => {
        console.error('Error al seguir usuario:', error);
        this.presentToast('Error al seguir usuario');
      }
    });
  }

  dejarDeSeguir(usuario: UsuarioBusqueda) {
    this.chatService.dejarDeSeguir(usuario.id_usuario).subscribe({
      next: () => {
        usuario.siguiendo = false;
        this.presentToast(`Dejaste de seguir a ${usuario.nombre || usuario.username}`);
      },
      error: (error) => {
        console.error('Error al dejar de seguir:', error);
        this.presentToast('Error al dejar de seguir usuario');
      }
    });
  }

  toggleFavoritoEjercicio(ejercicio: Ejercicio, event: Event) {
    event.stopPropagation();
    if (ejercicio.esta_guardado) {
      this.ejercicioService.quitarEjercicioGuardado(ejercicio.id_ejercicio!).subscribe({
        next: () => {
          ejercicio.esta_guardado = false;
          ejercicio.total_guardados = (ejercicio.total_guardados || 1) - 1;
          this.presentToast('Ejercicio eliminado de favoritos');
        },
        error: () => this.presentToast('Error al eliminar de favoritos')
      });
    } else {
      this.ejercicioService.guardarEjercicio(ejercicio.id_ejercicio!).subscribe({
        next: () => {
          ejercicio.esta_guardado = true;
          ejercicio.total_guardados = (ejercicio.total_guardados || 0) + 1;
          this.presentToast('Ejercicio guardado en favoritos');
        },
        error: () => this.presentToast('Error al guardar ejercicio')
      });
    }
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
    this.ejercicioConfig = {
      series: 3,
      repeticiones: '10-12',
      peso_recomendado: 0,
      descanso_segundos: 60
    };
    
    // Cargar rutinas del usuario
    this.rutinaService.getMisRutinas().subscribe({
      next: async (rutinas) => {
        this.rutinasUsuario = rutinas;
        if (rutinas.length === 0) {
          const alert = await this.alertController.create({
            header: 'Sin rutinas',
            message: 'No tienes rutinas creadas. ¿Deseas crear una nueva rutina?',
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Crear Rutina',
                handler: () => {
                  this.router.navigate(['/rutinas']);
                }
              }
            ]
          });
          await alert.present();
          return;
        }
        this.mostrarModalAgregarRutina = true;
      },
      error: (error) => {
        console.error('Error al cargar rutinas:', error);
        this.presentToast('Error al cargar tus rutinas', 'danger');
      }
    });
  }

  cerrarModalAgregarRutina() {
    this.mostrarModalAgregarRutina = false;
    this.ejercicioSeleccionado = null;
    this.rutinaSeleccionada = null;
    this.diaSeleccionado = null;
    this.ejercicioConfig = {
      series: 3,
      repeticiones: '10-12',
      peso_recomendado: 0,
      descanso_segundos: 60
    };
  }

  seleccionarRutina(rutina: RutinaCompleta) {
    this.rutinaSeleccionada = rutina;
    this.diaSeleccionado = null; // Reset día al cambiar rutina
  }

  async confirmarAgregarEjercicio() {
    if (!this.rutinaSeleccionada || !this.ejercicioSeleccionado) {
      return;
    }

    // Validar campos
    if (!this.ejercicioConfig.series || this.ejercicioConfig.series < 1) {
      this.presentToast('El número de series debe ser mayor a 0');
      return;
    }

    if (!this.ejercicioConfig.repeticiones || this.ejercicioConfig.repeticiones.trim() === '') {
      this.presentToast('Las repeticiones son requeridas');
      return;
    }

    // Si la rutina no tiene días, informar
    if (!this.rutinaSeleccionada.dias || this.rutinaSeleccionada.dias.length === 0) {
      const alert = await this.alertController.create({
        header: 'Rutina sin días',
        message: 'Esta rutina no tiene días configurados. Por favor, edita la rutina y agrega días primero.',
        buttons: [
          {
            text: 'Entendido',
            handler: () => {
              this.router.navigate(['/rutinas']);
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
      series: this.ejercicioConfig.series,
      repeticiones: this.ejercicioConfig.repeticiones.trim(),
      peso_recomendado: this.ejercicioConfig.peso_recomendado > 0 ? this.ejercicioConfig.peso_recomendado : undefined,
      descanso_segundos: this.ejercicioConfig.descanso_segundos || 60,
      orden: this.diaSeleccionado.ejercicios?.length || 0
    };

    this.rutinaService.agregarEjercicioARutina(this.rutinaSeleccionada.id_rutina!, ejercicioData).subscribe({
      next: () => {
        this.presentToast(`✅ Ejercicio "${this.ejercicioSeleccionado?.nombre_ejercicio}" agregado a la rutina "${this.rutinaSeleccionada?.nombre_rutina}"`, 'success');
        this.cerrarModalAgregarRutina();
      },
      error: (error) => {
        console.error('Error al agregar ejercicio:', error);
        this.presentToast(error.error?.error || 'Error al agregar el ejercicio a la rutina', 'danger');
      }
    });
  }

  limpiarFiltros() {
    this.filtroGrupoMuscular = '';
    this.filtroDuracion = '';
    this.ordenarPor = 'relevancia';
    if (this.terminoBusqueda.trim().length >= 2) {
      this.buscar();
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
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

  formatearDuracion(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }
}

