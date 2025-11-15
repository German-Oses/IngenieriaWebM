import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Mensaje {
  id?: number;
  id_remitente: number;
  id_destinatario: number;
  contenido: string;
  fecha_envio?: string;
  leido?: boolean;
}

export interface Chat {
  id_usuario: number;
  nombre: string;
  ultimo_mensaje?: string;
  fecha_ultimo_mensaje?: string;
  avatar?: string;
  en_linea?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private apiUrl = 'http://localhost:3000/api';
  
  // Subjects para manejar el estado
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private chatActivoSubject = new BehaviorSubject<Chat | null>(null);
  
  // Observables públicos
  public mensajes$ = this.mensajesSubject.asObservable();
  public chats$ = this.chatsSubject.asObservable();
  public chatActivo$ = this.chatActivoSubject.asObservable();
  
  private usuarioActual: any = null;

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Escuchar nuevos mensajes
    this.socket.on('nuevo_mensaje', (mensaje: Mensaje) => {
      const mensajesActuales = this.mensajesSubject.value;
      this.mensajesSubject.next([...mensajesActuales, mensaje]);
      
      // Actualizar la lista de chats
      this.actualizarListaChats();
    });

    // Manejar conexión
    this.socket.on('connect', () => {
      console.log('Conectado al servidor de chat');
      if (this.usuarioActual) {
        this.entrarChat(this.usuarioActual.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor de chat');
    });
  }

  // Inicializar el servicio con el usuario actual
  inicializarChat(usuario: any) {
    this.usuarioActual = usuario;
    this.entrarChat(usuario.id);
    
    // Cargar chats y actualizar el subject
    this.cargarChats().subscribe({
      next: (chats) => {
        this.chatsSubject.next(chats);
      },
      error: (error) => {
        console.error('Error al cargar chats:', error);
        this.chatsSubject.next([]); // Array vacío si hay error
      }
    });
  }

  // Entrar al chat del usuario
  entrarChat(idUsuario: number) {
    this.socket.emit('entrar_chat', idUsuario);
  }

  // Enviar mensaje
  enviarMensaje(idDestinatario: number, contenido: string) {
    if (!this.usuarioActual) return;

    const mensaje = {
      id_remitente: this.usuarioActual.id,
      id_destinatario: idDestinatario,
      contenido: contenido
    };

    this.socket.emit('enviar_mensaje', mensaje);
    
    // Agregar el mensaje enviado a la lista local
    const mensajeLocal: Mensaje = {
      ...mensaje,
      fecha_envio: new Date().toISOString()
    };
    
    const mensajesActuales = this.mensajesSubject.value;
    this.mensajesSubject.next([...mensajesActuales, mensajeLocal]);
  }

  // Cargar historial de mensajes con un usuario específico
  cargarMensajes(idOtroUsuario: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/mensajes/${idOtroUsuario}`);
  }

  // Cargar lista de chats del usuario
  cargarChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/chats`);
  }

  // Cargar usuarios disponibles para nueva conversación
  cargarUsuariosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios-disponibles`);
  }

  // Seleccionar un chat activo
  seleccionarChat(chat: Chat) {
    this.chatActivoSubject.next(chat);
    
    // Cargar mensajes del chat seleccionado
    if (this.usuarioActual) {
      this.cargarMensajes(chat.id_usuario).subscribe({
        next: (mensajes) => {
          this.mensajesSubject.next(mensajes);
        },
        error: (error) => {
          console.error('Error al cargar mensajes:', error);
        }
      });
    }
  }

  // Actualizar la lista de chats después de un nuevo mensaje
  private actualizarListaChats() {
    this.cargarChats().subscribe({
      next: (chats) => {
        this.chatsSubject.next(chats);
      },
      error: (error) => {
        console.error('Error al actualizar chats:', error);
      }
    });
  }

  // Método público para recargar chats
  recargarChats() {
    this.actualizarListaChats();
  }

  // Obtener el usuario actual
  getUsuarioActual() {
    return this.usuarioActual;
  }

  // Desconectar del chat
  desconectar() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Limpiar mensajes
  limpiarMensajes() {
    this.mensajesSubject.next([]);
  }

  // Obtener chats actuales
  getChats() {
    return this.chatsSubject.value;
  }

  // Obtener mensajes actuales
  getMensajes() {
    return this.mensajesSubject.value;
  }

  // Obtener chat activo
  getChatActivo() {
    return this.chatActivoSubject.value;
  }
}