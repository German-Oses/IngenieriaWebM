import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonGrid, IonRow, IonCol, IonButton, IonChip, IonAvatar, IonLabel, IonModal, IonInput, IonTextarea, IonSpinner } from '@ionic/angular/standalone';
import { IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { PostService, Post, Comentario } from '../../services/post.service';
import { EjercicioService } from '../../services/ejercicio.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { addIcons } from 'ionicons';
import { heartOutline, heart, chatbubbleOutline, shareOutline, sendOutline, addOutline, closeOutline, personAddOutline, checkmarkOutline, barbellOutline, fitnessOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonGrid, IonRow, IonCol, IonIcon, IonButton,
  IonChip, IonAvatar, IonLabel, IonModal, IonInput, IonTextarea, IonSpinner]
})
export class HomePage implements OnInit {
  posts: Post[] = [];
  ejercicios: any[] = [];
  usuarioActual: any = null;
  cargando = false;
  
  // Modal crear post
  mostrarModalCrearPost = false;
  nuevoPost = {
    tipo_post: 'texto' as 'texto' | 'ejercicio' | 'rutina' | 'logro',
    contenido: '',
    url_media: ''
  };
  
  // Comentarios
  postComentariosAbierto: number | null = null;
  comentarios: { [key: number]: Comentario[] } = {};
  nuevoComentario: { [key: number]: string } = {};
  mostrandoComentarios: { [key: number]: boolean } = {};

  constructor(
    private router: Router,
    private postService: PostService,
    private ejercicioService: EjercicioService,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    addIcons({ heartOutline, heart, chatbubbleOutline, shareOutline, sendOutline, addOutline, closeOutline, personAddOutline, checkmarkOutline, barbellOutline, fitnessOutline });
  }

  async ngOnInit() {
    this.usuarioActual = await this.authService.getCurrentUser();
    this.cargarFeed();
    this.cargarEjerciciosRecomendados();
  }

  cargarFeed() {
    this.cargando = true;
    this.postService.getFeed(20, 0).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar feed:', error);
        this.cargando = false;
      }
    });
  }

  cargarEjerciciosRecomendados() {
    this.ejercicioService.getEjercicios({ limit: 4 }).subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
      }
    });
  }

  abrirModalCrearPost() {
    this.mostrarModalCrearPost = true;
  }

  cerrarModalCrearPost() {
    this.mostrarModalCrearPost = false;
    this.nuevoPost = { tipo_post: 'texto', contenido: '', url_media: '' };
  }

  crearPost() {
    if (!this.nuevoPost.contenido.trim()) return;
    
    this.postService.createPost(this.nuevoPost).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.cerrarModalCrearPost();
      },
      error: (error) => {
        console.error('Error al crear post:', error);
      }
    });
  }

  reaccionarPost(post: Post) {
    this.postService.reaccionarPost(post.id_post!).subscribe({
      next: (response) => {
        post.me_gusta = response.reaccion;
        const currentLikes = this.toNumber(post.total_likes);
        post.total_likes = response.reaccion ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      },
      error: (error) => {
        console.error('Error al reaccionar:', error);
      }
    });
  }

  toggleComentarios(postId: number) {
    if (this.mostrandoComentarios[postId]) {
      this.mostrandoComentarios[postId] = false;
    } else {
      this.mostrandoComentarios[postId] = true;
      this.cargarComentarios(postId);
    }
  }

  cargarComentarios(postId: number) {
    if (this.comentarios[postId]) return; // Ya cargados
    
    this.postService.getComentarios(postId).subscribe({
      next: (comentarios) => {
        this.comentarios[postId] = comentarios;
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
      }
    });
  }

  comentarPost(postId: number) {
    const contenido = this.nuevoComentario[postId];
    if (!contenido || !contenido.trim()) return;

    this.postService.comentarPost(postId, contenido).subscribe({
      next: (comentario) => {
        if (!this.comentarios[postId]) {
          this.comentarios[postId] = [];
        }
        this.comentarios[postId].push(comentario);
        this.nuevoComentario[postId] = '';
        const post = this.posts.find(p => p.id_post === postId);
        if (post) {
          post.total_comentarios = (post.total_comentarios || 0) + 1;
        }
      },
      error: (error) => {
        console.error('Error al comentar:', error);
      }
    });
  }

  compartirPost(post: Post) {
    this.postService.compartirPost(post.id_post!).subscribe({
      next: () => {
        post.total_compartidos = (post.total_compartidos || 0) + 1;
      },
      error: (error) => {
        console.error('Error al compartir:', error);
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return date.toLocaleDateString('es-ES');
  }

  // Función helper para convertir valores a número
  toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  buscar() {
    this.router.navigate(['/buscar']);
  }

  mensajeria() {
    this.router.navigate(['/mensajeria']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  perfil() {
    this.router.navigate(['/perfil']);
  }

  verPerfil(usuarioId: number) {
    if (usuarioId === this.usuarioActual?.id) {
      this.router.navigate(['/perfil']);
    } else {
      // Por ahora navega al perfil propio, pero se puede crear una página de perfil de otros usuarios
      this.router.navigate(['/perfil']);
    }
  }

  seguirUsuarioDesdePost(usuarioId: number, post: Post) {
    this.chatService.seguirUsuario(usuarioId).subscribe({
      next: () => {
        post.sigo_autor = true;
      },
      error: (error) => {
        console.error('Error al seguir usuario:', error);
      }
    });
  }

  dejarDeSeguirDesdePost(usuarioId: number, post: Post) {
    this.chatService.dejarDeSeguir(usuarioId).subscribe({
      next: () => {
        post.sigo_autor = false;
      },
      error: (error) => {
        console.error('Error al dejar de seguir:', error);
      }
    });
  }

  verEjercicio(ejercicioId: number) {
    // Por ahora solo muestra un alert, pero se puede crear una página de detalle
    console.log('Ver ejercicio:', ejercicioId);
  }
}