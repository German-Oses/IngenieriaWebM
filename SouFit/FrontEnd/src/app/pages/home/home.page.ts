import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { heartOutline, heart, chatbubbleOutline, shareOutline, sendOutline, addOutline, closeOutline, personAddOutline, checkmarkOutline, barbellOutline, fitnessOutline, menuOutline, trashOutline, moon, sunny } from 'ionicons/icons';
import { ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { CacheService } from '../../services/cache.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonGrid, IonRow, IonCol, IonIcon, IonButton,
  IonChip, IonAvatar, IonLabel, IonModal, IonInput, IonTextarea, IonSpinner]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('postsContainer', { static: false }) postsContainer!: ElementRef;
  
  posts: Post[] = [];
  ejercicios: any[] = [];
  usuarioActual: any = null;
  cargando = false;
  cargandoMas = false;
  hayMasPosts = true;
  offset = 0;
  limit = 20;
  
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
  
  // Menú móvil
  menuMovilAbierto = false;
  contadorMensajesNoLeidos = 0;
  private subscriptions: Subscription[] = [];
  
  // Filtros
  filtroTipo: 'todos' | 'texto' | 'ejercicio' | 'rutina' | 'logro' = 'todos';
  filtroOrden: 'recientes' | 'populares' = 'recientes';

  constructor(
    private router: Router,
    private postService: PostService,
    private ejercicioService: EjercicioService,
    private authService: AuthService,
    private chatService: ChatService,
    private toastController: ToastController,
    private alertController: AlertController,
    public themeService: ThemeService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {
    addIcons({ heartOutline, heart, chatbubbleOutline, shareOutline, sendOutline, addOutline, closeOutline, personAddOutline, checkmarkOutline, barbellOutline, fitnessOutline, menuOutline, trashOutline, moon, sunny });
  }

  async ngOnInit() {
    this.usuarioActual = await this.authService.getCurrentUser();
    this.cargarFeed(true); // Resetear feed al iniciar
    this.cargarEjerciciosRecomendados();
    
    // Suscribirse a notificaciones de mensajes nuevos
    if (this.usuarioActual) {
      // Establecer el servicio de notificaciones en el chat service
      this.chatService.setNotificationService(this.notificationService);
      this.chatService.inicializarChat(this.usuarioActual);
      
      this.subscriptions.push(
        this.chatService.nuevoMensaje$.subscribe(mensaje => {
          if (mensaje) {
            this.mostrarNotificacionMensaje(mensaje);
            
            // Mostrar notificación push si la página no está visible
            if (document.hidden && this.notificationService) {
              const remitenteNombre = (mensaje as any).remitente_nombre || 'Usuario';
              const contenido = mensaje.contenido || 'Nuevo mensaje';
              this.notificationService.showMessageNotification(
                remitenteNombre,
                contenido,
                () => this.router.navigate(['/mensajeria'])
              ).catch(err => console.log('Error al mostrar notificación push:', err));
            }
          }
        })
      );
      
      this.subscriptions.push(
        this.chatService.contadorNoLeidos$.subscribe(contador => {
          this.contadorMensajesNoLeidos = contador;
        })
      );
    }
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Menú móvil
  toggleMenuMovil() {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }
  
  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }
  
  navegarYcerrarMenu(ruta: string) {
    this.router.navigate([ruta]);
    this.cerrarMenuMovil();
  }
  
  // Notificaciones
  async mostrarNotificacionMensaje(mensaje: any) {
    const toast = await this.toastController.create({
      message: `Nuevo mensaje de ${mensaje.remitente_nombre || 'Usuario'}`,
      duration: 3000,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Ver',
          handler: () => {
            this.router.navigate(['/mensajeria']);
          }
        }
      ]
    });
    await toast.present();
  }

  cargarFeed(resetear: boolean = false) {
    if (resetear) {
      this.offset = 0;
      this.posts = [];
      this.hayMasPosts = true;
      this.cargando = true;
    } else {
      this.cargandoMas = true;
    }
    
    const cacheKey = `feed_${this.filtroTipo}_${this.filtroOrden}_${this.offset}`;
    
    // Intentar obtener del caché solo si es la primera carga
    if (resetear && this.offset === 0) {
      this.cacheService.get<any[]>(cacheKey).then(cached => {
        if (cached) {
          this.posts = cached;
          this.cargando = false;
          this.hayMasPosts = cached.length >= this.limit;
          return;
        }
        this.cargarFeedDesdeAPI(resetear, cacheKey);
      });
    } else {
      this.cargarFeedDesdeAPI(resetear, cacheKey);
    }
  }
  
  private cargarFeedDesdeAPI(resetear: boolean, cacheKey: string) {
    this.postService.getFeed(this.limit, this.offset).subscribe({
      next: (posts) => {
        // Aplicar filtros
        let postsFiltrados = posts;
        
        if (this.filtroTipo !== 'todos') {
          postsFiltrados = posts.filter(p => p.tipo_post === this.filtroTipo);
        }
        
        if (this.filtroOrden === 'populares') {
          postsFiltrados = postsFiltrados.sort((a, b) => 
            (b.total_likes || 0) - (a.total_likes || 0)
          );
        }
        
        if (resetear) {
          this.posts = postsFiltrados;
          // Cachear solo la primera página
          if (this.offset === 0) {
            this.cacheService.set(cacheKey, postsFiltrados, 2 * 60 * 1000); // 2 minutos
          }
        } else {
          this.posts = [...this.posts, ...postsFiltrados];
        }
        
        if (postsFiltrados.length < this.limit) {
          this.hayMasPosts = false;
        }
        
        this.offset += posts.length;
        this.cargando = false;
        this.cargandoMas = false;
      },
      error: (error) => {
        console.error('Error al cargar feed:', error);
        this.cargando = false;
        this.cargandoMas = false;
        this.presentErrorToast('Error al cargar el feed. Por favor, intenta de nuevo.');
      }
    });
  }
  
  aplicarFiltros() {
    this.cargarFeed(true);
  }
  
  cargarMasPosts() {
    if (!this.cargandoMas && this.hayMasPosts) {
      this.cargarFeed(false);
    }
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
  
  onScroll(event: any) {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    
    if (atBottom && this.hayMasPosts && !this.cargandoMas) {
      this.cargarMasPosts();
    }
  }
  
  async eliminarPost(postId: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.postService.deletePost(postId).subscribe({
              next: () => {
                this.posts = this.posts.filter(p => p.id_post !== postId);
                this.presentSuccessToast('Post eliminado correctamente');
              },
              error: () => {
                this.presentErrorToast('Error al eliminar el post');
              }
            });
          }
        }
      ]
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
  
  toggleTheme() {
    const currentTheme = this.themeService.getTheme();
    let newTheme: 'light' | 'dark' | 'system' = 'light';
    
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }
    
    this.themeService.setTheme(newTheme);
  }
  
  async compartirPost(post: Post) {
    // Primero registrar el compartido en el backend
    this.postService.compartirPost(post.id_post!).subscribe({
      next: () => {
        post.total_compartidos = (post.total_compartidos || 0) + 1;
      },
      error: (error) => {
        console.error('Error al registrar compartido:', error);
      }
    });
    
    // Luego compartir usando Web Share API o fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.autor_nombre || post.autor_username}`,
          text: post.contenido,
          url: window.location.href
        });
      } catch (err) {
        // Usuario canceló o error - no hacer nada
        console.log('Compartir cancelado');
      }
    } else if (navigator.clipboard) {
      // Fallback: copiar al portapapeles
      try {
        const text = `${post.contenido}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(text);
        this.presentSuccessToast('Enlace copiado al portapapeles');
      } catch (err) {
        this.presentErrorToast('No se pudo compartir el post');
      }
    } else {
      this.presentErrorToast('Tu navegador no soporta compartir');
    }
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
}