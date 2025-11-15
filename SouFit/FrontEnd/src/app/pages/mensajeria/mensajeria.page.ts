import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonAvatar, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonRow, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ChatService, Chat, Mensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mensajeria',
  templateUrl: './mensajeria.page.html',
  styleUrls: ['./mensajeria.page.scss'],
  standalone: true,
  imports: [IonInput, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonIcon,IonCol,IonRow,IonGrid,IonAvatar
    ]
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
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initializeChat();
  }

  async initializeChat() {
    // Obtener usuario actual
    this.usuarioActual = await this.authService.getCurrentUser();
    
    if (this.usuarioActual) {
      // Inicializar el servicio de chat
      this.chatService.inicializarChat(this.usuarioActual);
      
      // Suscribirse a los observables
      this.subscriptions.push(
        this.chatService.chats$.subscribe(chats => {
          this.chats = chats;
          // Si no hay chat activo y hay chats, seleccionar el primero
          if (!this.chatActivo && chats.length > 0) {
            this.seleccionarChat(chats[0]);
          }
        })
      );
      
      this.subscriptions.push(
        this.chatService.mensajes$.subscribe(mensajes => {
          this.mensajes = mensajes;
          setTimeout(() => this.scrollToBottom(), 100);
        })
      );
      
      this.subscriptions.push(
        this.chatService.chatActivo$.subscribe(chat => {
          this.chatActivo = chat;
        })
      );
      
      // Los chats se cargan automáticamente cuando se inicializa el servicio
    }
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
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.chatActivo) {
      return;
    }

    this.chatService.enviarMensaje(this.chatActivo.id_usuario, this.nuevoMensaje.trim());
    this.nuevoMensaje = '';
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
