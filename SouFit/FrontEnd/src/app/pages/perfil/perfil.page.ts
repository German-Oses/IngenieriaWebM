
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { ChatService } from '../../services/chat.service';
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
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; 
import { homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, createOutline, cameraOutline, imagesOutline, documentTextOutline, heartOutline, chatbubbleOutline as chatbubbleOutlineIcon, locationOutline, logOutOutline } from 'ionicons/icons';

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
    IonAvatar
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private http: HttpClient,
    private postService: PostService,
    private chatService: ChatService
  ) {
    addIcons({ homeOutline, searchOutline, barbellOutline, chatbubblesOutline, personOutline, createOutline, cameraOutline, imagesOutline, documentTextOutline, heartOutline, chatbubbleOutline: chatbubbleOutlineIcon, locationOutline, logOutOutline });
  }

  ionViewWillEnter() {
    this.cargarPerfil();
    this.cargarEstadisticas();
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
          avatar: data.avatar || ''
        };
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
        avatar: this.userProfile.avatar || ''
      };
    }
  }

  cancelarEdicion() {
    this.editando = false;
    this.perfilEditado = {};
  }

  guardarPerfil() {
    this.http.put(`${environment.apiUrl}/profile`, this.perfilEditado).subscribe({
      next: (data) => {
        this.editando = false;
        this.presentToast('Perfil actualizado correctamente');
        // Recargar el perfil y las estadísticas después de guardar
        this.cargarPerfil();
        this.cargarEstadisticas();
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.presentAlert('Error', 'No se pudo actualizar el perfil. ' + (err.error?.msg || ''));
      }
    });
  }

  cambiarAvatar() {
    // Por ahora solo permite URL, en el futuro se puede agregar subida de archivos
    this.presentAlert('Cambiar Avatar', 'Ingresa la URL de tu imagen de perfil en el campo "URL de avatar"');
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