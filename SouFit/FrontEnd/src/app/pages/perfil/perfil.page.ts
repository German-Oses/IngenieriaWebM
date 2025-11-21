import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { ChatService } from '../../services/chat.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { EstadisticasService } from '../../services/estadisticas.service';
import { LogroService } from '../../services/logro.service';
import { HistorialService } from '../../services/historial.service';
import { ProgresoService } from '../../services/progreso.service';
import { environment } from '../../../environments/environment';
import { 
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonInput,
  IonTextarea,
  IonAvatar,
  IonItem,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; 
import { 
  homeOutline, 
  searchOutline, 
  barbellOutline, 
  chatbubblesOutline, 
  personOutline, 
  createOutline, 
  cameraOutline, 
  imagesOutline, 
  documentTextOutline, 
  heartOutline, 
  chatbubbleOutline, 
  locationOutline, 
  logOutOutline, 
  arrowBackOutline, 
  trophyOutline, 
  statsChartOutline, 
  calendarOutline, 
  trendingUpOutline, 
  peopleOutline, 
  bookmarkOutline,
  checkmarkOutline,
  closeOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonInput,
    IonTextarea,
    IonAvatar,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class PerfilPage implements OnInit {
  userProfile: any = null;
  editando = false;
  perfilEditado: any = {};
  totalPosts = 0;
  totalSeguidores = 0;
  totalSiguiendo = 0;
  posts: any[] = [];
  cargando = false;
  subiendoAvatar = false;
  
  // Para región y comuna
  regiones: any[] = [];
  comunas: any[] = [];
  cargandoRegiones: boolean = false;

  // Estadísticas avanzadas
  estadisticas: any = null;
  logros: any[] = [];
  historialReciente: any[] = [];
  progresoFisico: any = null;
  cargandoEstadisticas = false;
  mostrarEstadisticas = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private http: HttpClient,
    private postService: PostService,
    private chatService: ChatService,
    private ubicacionService: UbicacionService,
    private estadisticasService: EstadisticasService,
    private logroService: LogroService,
    private historialService: HistorialService,
    private progresoService: ProgresoService
  ) {
    addIcons({ 
      homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, 
      createOutline, cameraOutline, imagesOutline, documentTextOutline, heartOutline, 
      chatbubbleOutline, locationOutline, logOutOutline, arrowBackOutline, trophyOutline, 
      statsChartOutline, calendarOutline, trendingUpOutline, peopleOutline, bookmarkOutline,
      checkmarkOutline, closeOutline, chevronDownOutline, chevronUpOutline
    });
  }

  ngOnInit() {
    this.cargarPerfil();
  }

  ionViewWillEnter() {
    this.cargarPerfil();
    this.cargarEstadisticas();
    this.cargarRegiones();
  }
  
  cargarRegiones() {
    this.cargandoRegiones = true;
    this.ubicacionService.getRegiones().subscribe({
      next: (data) => {
        this.regiones = data || [];
        this.cargandoRegiones = false;
      },
      error: (err) => {
        console.error('Error cargando regiones', err);
        this.cargandoRegiones = false;
      }
    });
  }
  
  onRegionChange() {
    this.comunas = [];
    this.perfilEditado.id_comuna = null;
    if (this.perfilEditado.id_region != null) {
      this.ubicacionService.getComunas(this.perfilEditado.id_region).subscribe({
        next: (data) => {
          this.comunas = data || [];
        },
        error: (err) => {
          console.error('Error cargando comunas', err);
        }
      });
    }
  }

  cargarPerfil() {
    this.cargando = true;
    this.authService.getUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.perfilEditado = {
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          username: data.username || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          fecha_nacimiento: data.fecha_nacimiento || '',
          id_region: data.id_region || null,
          id_comuna: data.id_comuna || null
        };
        
        // Cargar comunas si hay región seleccionada
        if (this.perfilEditado.id_region) {
          this.onRegionChange();
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el perfil:', err);
        this.cargando = false;
        if (err.status === 401) {
          this.presentAlert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
          this.authService.logout();
        } else {
          this.presentErrorToast('No se pudieron cargar los datos del perfil.');
        }
      }
    });
  }

  cargarEstadisticas() {
    this.authService.getCurrentUser().then(user => {
      if (user && user.id) {
        // Cargar posts del usuario
        this.postService.getPostsByUser(user.id).subscribe({
          next: (posts) => {
            this.posts = posts || [];
            this.totalPosts = posts?.length || 0;
          },
          error: (err) => {
            console.error('Error al cargar posts:', err);
            this.posts = [];
            this.totalPosts = 0;
          }
        });

        // Cargar usuarios seguidos
        this.chatService.obtenerUsuariosSiguiendo().subscribe({
          next: (siguiendo) => {
            this.totalSiguiendo = siguiendo?.length || 0;
          },
          error: (err) => {
            console.error('Error al cargar siguiendo:', err);
            this.totalSiguiendo = 0;
          }
        });

        // Cargar seguidores
        this.chatService.obtenerSeguidores().subscribe({
          next: (seguidores) => {
            this.totalSeguidores = seguidores?.length || 0;
          },
          error: (err) => {
            console.error('Error al cargar seguidores:', err);
            this.totalSeguidores = 0;
          }
        });

        // Cargar estadísticas avanzadas
        this.cargarEstadisticasAvanzadas();
      }
    });
  }

  cargarEstadisticasAvanzadas() {
    this.cargandoEstadisticas = true;
    
    // Cargar estadísticas generales
    this.estadisticasService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data?.estadisticas || null;
        this.cargandoEstadisticas = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.cargandoEstadisticas = false;
      }
    });

    // Cargar logros
    this.logroService.getLogros().subscribe({
      next: (logros) => {
        this.logros = logros || [];
      },
      error: (err) => {
        console.error('Error al cargar logros:', err);
        this.logros = [];
      }
    });

    // Cargar historial reciente
    this.historialService.getHistorial({ limit: 5 }).subscribe({
      next: (historial) => {
        this.historialReciente = historial || [];
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.historialReciente = [];
      }
    });

    // Cargar progreso físico
    this.progresoService.getResumen(90).subscribe({
      next: (progreso) => {
        this.progresoFisico = progreso;
      },
      error: (err) => {
        console.error('Error al cargar progreso:', err);
        this.progresoFisico = null;
      }
    });
  }

  toggleEstadisticas() {
    this.mostrarEstadisticas = !this.mostrarEstadisticas;
    if (this.mostrarEstadisticas && !this.estadisticas) {
      this.cargarEstadisticasAvanzadas();
    }
  }

  verPost(post: any) {
    this.router.navigate(['/home']);
  }

  toggleEdicion() {
    this.editando = !this.editando;
    if (this.editando) {
      this.perfilEditado = {
        nombre: this.userProfile.nombre || '',
        apellido: this.userProfile.apellido || '',
        username: this.userProfile.username || '',
        bio: this.userProfile.bio || '',
        avatar: this.userProfile.avatar || '',
        fecha_nacimiento: this.userProfile.fecha_nacimiento || '',
        id_region: this.userProfile.id_region || null,
        id_comuna: this.userProfile.id_comuna || null
      };
      
      // Cargar comunas si hay región
      if (this.perfilEditado.id_region) {
        this.onRegionChange();
      }
    }
  }

  cancelarEdicion() {
    this.editando = false;
    this.perfilEditado = {};
  }

  guardarPerfil() {
    const datosActualizar: any = {};
    
    if (this.perfilEditado.nombre && this.perfilEditado.nombre.trim()) {
      datosActualizar.nombre = this.perfilEditado.nombre.trim();
    }
    if (this.perfilEditado.apellido && this.perfilEditado.apellido.trim()) {
      datosActualizar.apellido = this.perfilEditado.apellido.trim();
    }
    if (this.perfilEditado.username && this.perfilEditado.username.trim()) {
      datosActualizar.username = this.perfilEditado.username.trim();
    }
    if (this.perfilEditado.bio !== undefined) {
      datosActualizar.bio = this.perfilEditado.bio || null;
    }
    if (this.perfilEditado.fecha_nacimiento && this.perfilEditado.fecha_nacimiento.trim()) {
      datosActualizar.fecha_nacimiento = this.perfilEditado.fecha_nacimiento.trim();
    }
    if (this.perfilEditado.id_region !== null && this.perfilEditado.id_region !== undefined) {
      datosActualizar.id_region = this.perfilEditado.id_region;
    }
    if (this.perfilEditado.id_comuna !== null && this.perfilEditado.id_comuna !== undefined) {
      datosActualizar.id_comuna = this.perfilEditado.id_comuna;
    }
    
    this.http.put(`${environment.apiUrl}/profile`, datosActualizar).subscribe({
      next: (data) => {
        this.editando = false;
        this.presentSuccessToast('Perfil actualizado correctamente');
        this.cargarPerfil();
        this.cargarEstadisticas();
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.presentErrorToast('No se pudo actualizar el perfil. ' + (err.error?.msg || err.error?.error || ''));
      }
    });
  }

  cambiarAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.subirAvatar(file);
      }
    };
    input.click();
  }
  
  subirAvatar(file: File) {
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      this.presentErrorToast('La imagen no puede ser mayor a 5MB');
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.presentErrorToast('Solo se permiten archivos de imagen');
      return;
    }
    
    this.subiendoAvatar = true;
    const formData = new FormData();
    formData.append('avatar', file);
    
    this.http.post(`${environment.apiUrl}/profile/avatar`, formData).subscribe({
      next: (response: any) => {
        this.subiendoAvatar = false;
        this.presentSuccessToast('Avatar actualizado correctamente');
        
        // Actualizar el avatar en el perfil
        if (response.avatar) {
          const baseUrl = environment.apiUrl.replace('/api', '');
          const avatarUrl = response.avatar.startsWith('http') 
            ? response.avatar 
            : `${baseUrl}${response.avatar.startsWith('/') ? response.avatar : '/' + response.avatar}`;
          
          if (this.userProfile) {
            this.userProfile.avatar = avatarUrl;
          }
          this.perfilEditado.avatar = avatarUrl;
        }
        
        // Recargar el perfil completo
        this.cargarPerfil();
      },
      error: (err) => {
        this.subiendoAvatar = false;
        console.error('Error al subir avatar:', err);
        this.presentErrorToast('No se pudo actualizar el avatar. ' + (err.error?.error || err.error?.msg || ''));
      }
    });
  }
  
  obtenerUrlArchivo(url: string | undefined): string {
    if (!url) return 'assets/icon/SouFitLogo.png';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseUrl = environment.apiUrl.replace('/api', '');
    const urlNormalizada = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${urlNormalizada}`;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/icon/SouFitLogo.png';
      img.onerror = null;
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async presentSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  async confirmarCerrarSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            this.cerrarSesion();
          }
        }
      ]
    });
    await alert.present();
  }

  cerrarSesion() {
    this.authService.logout();
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  buscar() {
    this.router.navigate(['/buscar']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  mensajeria() {
    this.router.navigate(['/mensajeria']);
  }
}
