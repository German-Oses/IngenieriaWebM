import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Mensaje {
  id?: number;
  id_remitente: number;
  id_destinatario: number;
  contenido?: string;
  tipo_archivo?: string;
  url_archivo?: string;
  nombre_archivo?: string;
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
      const chatActivo = this.chatActivoSubject.value;
      
      // Si el mensaje es del chat activo, agregarlo a los mensajes
      if (chatActivo && 
          (mensaje.id_remitente === chatActivo.id_usuario || mensaje.id_destinatario === chatActivo.id_usuario)) {
        const mensajesActuales = this.mensajesSubject.value;
        // Verificar que el mensaje no esté ya en la lista
        const existe = mensajesActuales.some(m => m.id === mensaje.id);
        if (!existe) {
          this.mensajesSubject.next([...mensajesActuales, mensaje]);
        }
      }
      
      // Actualizar la lista de chats siempre
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

  // Limpiar completamente el estado del chat
  limpiarEstado(reconectar: boolean = false) {
    // Limpiar todos los subjects
    this.mensajesSubject.next([]);
    this.chatsSubject.next([]);
    this.chatActivoSubject.next(null);
    this.usuarioActual = null;
    
    // Desconectar y remover todos los listeners del socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    
    // Si se solicita reconectar, crear un nuevo socket
    if (reconectar) {
      this.socket = io('http://localhost:3000');
      this.setupSocketListeners();
    }
  }

  // Inicializar el servicio con el usuario actual
  inicializarChat(usuario: any) {
    // Limpiar el estado anterior y reconectar el socket
    this.limpiarEstado(true);
    
    this.usuarioActual = usuario;
    
    // Esperar a que el socket se conecte antes de entrar al chat
    if (this.socket.connected) {
      this.entrarChat(usuario.id);
    } else {
      this.socket.once('connect', () => {
        this.entrarChat(usuario.id);
      });
    }
    
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

  // Enviar mensaje con archivo (imagen o audio)
  enviarMensajeConArchivo(idDestinatario: number, archivo: File, contenido?: string): Observable<Mensaje> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('id_destinatario', idDestinatario.toString());
    if (contenido) {
      formData.append('contenido', contenido);
    }

    return this.http.post<Mensaje>(`${this.apiUrl}/mensajes/enviar`, formData);
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

  // Buscar usuarios por username
  buscarUsuarioPorUsername(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-usuario/${username}`);
  }

  // Seguir a un usuario
  seguirUsuario(userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seguir/${userId}`, {});
  }

  // Dejar de seguir a un usuario
  dejarDeSeguir(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/seguir/${userId}`);
  }

  // Obtener usuarios que sigo
  obtenerUsuariosSiguiendo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/siguiendo`);
  }

  // Obtener seguidores del usuario actual
  obtenerSeguidores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/seguidores`);
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

  // Desconectar del chat y limpiar estado (sin reconectar)
  desconectar() {
    this.limpiarEstado(false);
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