
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { ChatService } from '../../services/chat.service';
import { UbicacionService } from '../../services/ubicacion.service';
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
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; 
import { homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, createOutline, cameraOutline, imagesOutline, documentTextOutline, heartOutline, chatbubbleOutline as chatbubbleOutlineIcon, locationOutline, logOutOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
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
    IonSelectOption
  ]
})
export class PerfilPage {
  userProfile: any = null;
  editando = false;
  perfilEditado: any = {};
  totalPosts = 0;
  totalSeguidores = 0;
  totalSiguiendo = 0;
  posts: any[] = [];
  
  // Para región y comuna
  regiones: any[] = [];
  comunas: any[] = [];
  cargandoRegiones: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private http: HttpClient,
    private postService: PostService,
    private chatService: ChatService,
    private ubicacionService: UbicacionService
  ) {
    addIcons({ homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, createOutline, cameraOutline, imagesOutline, documentTextOutline, heartOutline, chatbubbleOutline: chatbubbleOutlineIcon, locationOutline, logOutOutline, arrowBackOutline });
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
    this.authService.getUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.perfilEditado = {
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          username: data.username || '',
          email: data.email || '',
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

  cargarEstadisticas() {
    // Cargar posts del usuario
    this.authService.getCurrentUser().then(user => {
      if (user && user.id) {
        console.log('Cargando posts para usuario:', user.id);
        this.postService.getPostsByUser(user.id).subscribe({
          next: (posts) => {
            console.log('Posts cargados:', posts);
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
      }
    });
  }

  verPost(post: any) {
    // Por ahora solo navega al home, pero se puede crear una vista de detalle
    this.router.navigate(['/home']);
  }

  toggleEdicion() {
    this.editando = !this.editando;
    if (this.editando) {
      this.perfilEditado = {
        nombre: this.userProfile.nombre || '',
        apellido: this.userProfile.apellido || '',
        username: this.userProfile.username || '',
        email: this.userProfile.email || '',
        bio: this.userProfile.bio || '',
        avatar: this.userProfile.avatar || '',
        fecha_nacimiento: this.userProfile.fecha_nacimiento || '',
        id_region: this.userProfile.id_region || null,
        id_comuna: this.userProfile.id_comuna || null
      };
    }
  }

  cancelarEdicion() {
    this.editando = false;
    this.perfilEditado = {};
  }

  guardarPerfil() {
    // Solo enviar campos que realmente tienen valores (no vacíos)
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
    if (this.perfilEditado.email && this.perfilEditado.email.trim()) {
      datosActualizar.email = this.perfilEditado.email.trim();
    }
    // Bio puede ser vacío (para borrarlo)
    if (this.perfilEditado.bio !== undefined) {
      datosActualizar.bio = this.perfilEditado.bio || null;
    }
    if (this.perfilEditado.avatar && this.perfilEditado.avatar.trim()) {
      datosActualizar.avatar = this.perfilEditado.avatar.trim();
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
        this.presentToast('Perfil actualizado correctamente');
        // Recargar el perfil y las estadísticas después de guardar
        this.cargarPerfil();
        this.cargarEstadisticas();
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.presentAlert('Error', 'No se pudo actualizar el perfil. ' + (err.error?.msg || err.error?.error || ''));
      }
    });
  }

  cambiarAvatar() {
    // Crear input de archivo oculto
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
      this.presentAlert('Error', 'La imagen no puede ser mayor a 5MB');
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.presentAlert('Error', 'Solo se permiten archivos de imagen');
      return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    this.http.post(`${environment.apiUrl}/profile/avatar`, formData).subscribe({
      next: (response: any) => {
        this.presentToast('Avatar actualizado correctamente');
        // Actualizar el avatar en el perfil inmediatamente
        if (response.avatar) {
          // Construir URL completa si es relativa
          const avatarUrl = response.avatar.startsWith('http') 
            ? response.avatar 
            : `${environment.apiUrl.replace('/api', '')}${response.avatar}`;
          
          this.userProfile.avatar = avatarUrl;
          this.perfilEditado.avatar = avatarUrl;
        }
        // Recargar el perfil completo para obtener todos los datos actualizados
        this.cargarPerfil();
      },
      error: (err) => {
        console.error('Error al subir avatar:', err);
        this.presentAlert('Error', 'No se pudo actualizar el avatar. ' + (err.error?.error || err.error?.msg || ''));
      }
    });
  }
  
  obtenerUrlArchivo(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${url}`;
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
      duration: 2000,
      position: 'bottom'
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