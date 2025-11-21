import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonAvatar, IonCol, IonContent, IonGrid, IonIcon, IonRow } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ChatService, Chat, Mensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mensajeria',
  templateUrl: './mensajeria.page.html',
  styleUrls: ['./mensajeria.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, IonCol, IonRow, IonGrid, IonAvatar]
})
export class MensajeriaPage implements OnInit, OnDestroy {
  @ViewChild('mensajesContainer', { static: false }) mensajesContainer!: ElementRef;

  chats: Chat[] = [];
  mensajes: Mensaje[] = [];
  chatActivo: Chat | null = null;
  usuarioActual: any = null;
  nuevoMensaje: string = '';
  
  // Variables para nueva conversación
  mostrarUsuariosDisponibles: boolean = false;
  usuariosDisponibles: any[] = [];
  
  // Variables para archivos
  archivoSeleccionado: File | null = null;
  previewArchivo: string | null = null;
  tipoArchivo: 'imagen' | 'audio' | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService
  ) {
    addIcons({ arrowBackOutline, addOutline, closeOutline });
  }

  ngOnInit() {
    this.initializeChat();
  }

  async initializeChat() {
    // Obtener usuario actual
    this.usuarioActual = await this.authService.getCurrentUser();
    
    if (this.usuarioActual) {
      console.log('Inicializando chat para usuario:', this.usuarioActual.id);
      
      // Inicializar el servicio de chat
      this.chatService.inicializarChat(this.usuarioActual);
      
      // Esperar un momento para que el socket se conecte
      setTimeout(() => {
        console.log('Socket conectado:', this.chatService.getSocket()?.connected);
      }, 1000);
      
      // Suscribirse a los observables
      this.subscriptions.push(
        this.chatService.chats$.subscribe(chats => {
          console.log('Chats actualizados:', chats.length);
          this.chats = chats;
          // Si no hay chat activo y hay chats, seleccionar el primero
          if (!this.chatActivo && chats.length > 0) {
            this.seleccionarChat(chats[0]);
          }
        })
      );
      
      this.subscriptions.push(
        this.chatService.mensajes$.subscribe(mensajes => {
          console.log('Mensajes actualizados:', mensajes.length);
          this.mensajes = mensajes;
          setTimeout(() => this.scrollToBottom(), 100);
        })
      );
      
      this.subscriptions.push(
        this.chatService.chatActivo$.subscribe(chat => {
          this.chatActivo = chat;
          // Cuando se selecciona un chat, cargar mensajes y marcar como leídos
          if (chat) {
            this.cargarMensajesDelChat(chat.id_usuario);
          }
        })
      );
      
      // Suscribirse a nuevos mensajes para notificaciones
      this.subscriptions.push(
        this.chatService.nuevoMensaje$.subscribe(mensaje => {
          if (mensaje) {
            // Si el mensaje es del chat activo, agregarlo automáticamente
            if (this.chatActivo && 
                (mensaje.id_remitente === this.chatActivo.id_usuario || 
                 mensaje.id_destinatario === this.chatActivo.id_usuario)) {
              // El mensaje ya se agregará por el observable mensajes$
              // Marcar como leído automáticamente si estoy viendo el chat
              this.chatService.marcarMensajesLeidos(this.chatActivo.id_usuario).subscribe();
            } else {
              // Actualizar lista de chats para mostrar el nuevo mensaje
              this.chatService.recargarChats();
            }
          }
        })
      );
      
      // Suscribirse al contador de mensajes no leídos
      this.subscriptions.push(
        this.chatService.contadorNoLeidos$.subscribe(contador => {
          // El contador se actualiza automáticamente
        })
      );
      
      // Los chats se cargan automáticamente cuando se inicializa el servicio
    }
  }
  
  cargarMensajesDelChat(otroUsuarioId: number) {
    this.chatService.cargarMensajes(otroUsuarioId).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        setTimeout(() => this.scrollToBottom(), 100);
        // Marcar mensajes como leídos
        this.chatService.marcarMensajesLeidos(otroUsuarioId).subscribe();
      },
      error: (error) => {
        console.error('Error al cargar mensajes:', error);
      }
    });
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.desconectar();
  }

  cargarChats() {
    // Recargar chats usando el método público del servicio
    this.chatService.recargarChats();
  }

  seleccionarChat(chat: Chat) {
    this.chatActivo = chat;
    this.chatService.seleccionarChat(chat);
    // Cargar mensajes del chat seleccionado
    this.cargarMensajesDelChat(chat.id_usuario);
  }

  enviarMensaje() {
    if (!this.chatActivo) {
      console.warn('No hay chat activo');
      return;
    }

    // Si hay archivo seleccionado, enviar con archivo
    if (this.archivoSeleccionado) {
      this.enviarMensajeConArchivo();
      return;
    }

    // Si no hay contenido ni archivo, no enviar
    if (!this.nuevoMensaje.trim()) {
      return;
    }

    console.log('Enviando mensaje a:', this.chatActivo.id_usuario, 'Contenido:', this.nuevoMensaje.trim());
    this.chatService.enviarMensaje(this.chatActivo.id_usuario, this.nuevoMensaje.trim());
    this.nuevoMensaje = '';
  }

  enviarMensajeConArchivo() {
    if (!this.archivoSeleccionado || !this.chatActivo) {
      return;
    }

    this.chatService.enviarMensajeConArchivo(
      this.chatActivo.id_usuario,
      this.archivoSeleccionado,
      this.nuevoMensaje.trim() || undefined
    ).subscribe({
      next: (mensaje) => {
        // El mensaje ya se agregará automáticamente por el socket
        this.limpiarArchivo();
        this.nuevoMensaje = '';
      },
      error: (error) => {
        console.error('Error al enviar archivo:', error);
        alert('Error al enviar el archivo. Por favor, intenta de nuevo.');
      }
    });
  }

  seleccionarArchivo(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
      alert('Solo se permiten archivos de imagen o audio');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    this.archivoSeleccionado = file;

    if (file.type.startsWith('image/')) {
      this.tipoArchivo = 'imagen';
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewArchivo = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('audio/')) {
      this.tipoArchivo = 'audio';
      this.previewArchivo = null;
    }
  }

  limpiarArchivo() {
    this.archivoSeleccionado = null;
    this.previewArchivo = null;
    this.tipoArchivo = null;
    // Limpiar input file
    const input = document.getElementById('input-archivo') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  obtenerUrlArchivo(url: string | undefined): string {
    if (!url) return '';
    // Si ya es una URL completa, retornarla
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Si es una ruta relativa, agregar el dominio del backend
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${url}`;
  }

  abrirSelectorArchivo() {
    const input = document.getElementById('input-archivo') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  onEnterPressed(event: any) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  esMensajePropio(mensaje: Mensaje): boolean {
    return this.usuarioActual && mensaje.id_remitente === this.usuarioActual.id;
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatearFechaUltimoMensaje(fecha: string): string {
    const hoy = new Date();
    const fechaMensaje = new Date(fecha);
    
    if (fechaMensaje.toDateString() === hoy.toDateString()) {
      return this.formatearHora(fecha);
    }
    
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    if (fechaMensaje.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    
    return fechaMensaje.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.mensajesContainer) {
        this.mensajesContainer.nativeElement.scrollTop = this.mensajesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  volverHome() {
    this.router.navigate(['/home'])
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  perfil() {
    this.router.navigate(['/perfil']);
  }

  // Métodos para nueva conversación
  toggleUsuariosDisponibles() {
    this.mostrarUsuariosDisponibles = !this.mostrarUsuariosDisponibles;
    if (this.mostrarUsuariosDisponibles) {
      this.cargarUsuariosDisponibles();
    }
  }

  onUsuarioSeleccionado(usuario: any) {
    // Crear un objeto Chat para el usuario seleccionado
    const nuevoChat: Chat = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      avatar: usuario.avatar,
      en_linea: false
    };

    // Seleccionar el nuevo chat
    this.seleccionarChat(nuevoChat);
    
    // Limpiar mensajes (nueva conversación)
    this.chatService.limpiarMensajes();
  }

  cerrarUsuariosDisponibles() {
    this.mostrarUsuariosDisponibles = false;
  }

  cargarUsuariosDisponibles() {
    this.chatService.cargarUsuariosDisponibles().subscribe({
      next: (usuarios) => {
        this.usuariosDisponibles = usuarios;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  iniciarConversacion(usuario: any) {
    // Crear un objeto Chat temporal para el usuario seleccionado
    const nuevoChat: Chat = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      avatar: usuario.avatar,
      en_linea: false
    };

    // Seleccionar el nuevo chat
    this.seleccionarChat(nuevoChat);
    
    // Cerrar la lista de usuarios
    this.cerrarUsuariosDisponibles();
    
    // Limpiar mensajes (nueva conversación)
    this.chatService.limpiarMensajes();
  }
}
