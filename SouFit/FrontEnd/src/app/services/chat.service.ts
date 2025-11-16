import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

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
  private apiUrl = environment.apiUrl;
  private socketUrl = environment.socketUrl || environment.apiUrl.replace('/api', '');
  
  // Subjects para manejar el estado
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private chatActivoSubject = new BehaviorSubject<Chat | null>(null);
  private nuevoMensajeSubject = new BehaviorSubject<Mensaje | null>(null);
  private contadorNoLeidosSubject = new BehaviorSubject<number>(0);
  
  // Observables públicos
  public mensajes$ = this.mensajesSubject.asObservable();
  public chats$ = this.chatsSubject.asObservable();
  public chatActivo$ = this.chatActivoSubject.asObservable();
  public nuevoMensaje$ = this.nuevoMensajeSubject.asObservable();
  public contadorNoLeidos$ = this.contadorNoLeidosSubject.asObservable();
  
  private usuarioActual: any = null;
  private notificationService: NotificationService | null = null;

  constructor(
    private http: HttpClient
  ) {
    this.socket = io(this.socketUrl);
    this.setupSocketListeners();
  }

  // Método para establecer el servicio de notificaciones (inyección manual)
  setNotificationService(service: NotificationService) {
    this.notificationService = service;
    // Solicitar permisos de notificación al establecer el servicio
    if (this.notificationService) {
      this.notificationService.requestPermission().catch(err => {
        console.log('No se pudieron solicitar permisos de notificación:', err);
      });
    }
  }

  private setupSocketListeners() {
    // Escuchar nuevos mensajes
    this.socket.on('nuevo_mensaje', (mensaje: Mensaje) => {
      const chatActivo = this.chatActivoSubject.value;
      const esMensajeParaMi = mensaje.id_destinatario === this.usuarioActual?.id;
      
      // Si el mensaje es para mí y no estoy en ese chat, emitir notificación
      if (esMensajeParaMi && (!chatActivo || chatActivo.id_usuario !== mensaje.id_remitente)) {
        this.nuevoMensajeSubject.next(mensaje);
        this.actualizarContadorNoLeidos();
        
        // Mostrar notificación push si está disponible
        if (this.notificationService && document.hidden) {
          const remitenteNombre = (mensaje as any).remitente_nombre || 'Usuario';
          const contenido = mensaje.contenido || 'Nuevo mensaje';
          this.notificationService.showMessageNotification(
            remitenteNombre,
            contenido
          ).catch(err => console.log('Error al mostrar notificación:', err));
        }
      }
      
      // Si el mensaje es del chat activo, agregarlo a los mensajes
      if (chatActivo && 
          (mensaje.id_remitente === chatActivo.id_usuario || mensaje.id_destinatario === chatActivo.id_usuario)) {
        const mensajesActuales = this.mensajesSubject.value;
        // Verificar que el mensaje no esté ya en la lista
        const existe = mensajesActuales.some(m => m.id === mensaje.id);
        if (!existe) {
          this.mensajesSubject.next([...mensajesActuales, mensaje]);
          // Si es mi mensaje o estoy viendo el chat, marcar como leído
          if (mensaje.id_destinatario === this.usuarioActual?.id) {
            this.marcarMensajesLeidos(mensaje.id_remitente).subscribe();
          }
        }
      }
      
      // Actualizar la lista de chats siempre
      this.actualizarListaChats();
    });
    
    // Escuchar mensajes actualizados
    this.socket.on('mensaje_actualizado', (mensaje: Mensaje) => {
      const mensajesActuales = this.mensajesSubject.value;
      const index = mensajesActuales.findIndex(m => m.id === mensaje.id);
      if (index !== -1) {
        mensajesActuales[index] = mensaje;
        this.mensajesSubject.next([...mensajesActuales]);
      }
      this.actualizarListaChats();
    });
    
    // Escuchar mensajes eliminados
    this.socket.on('mensaje_eliminado', (data: { id_mensaje: number }) => {
      const mensajesActuales = this.mensajesSubject.value;
      const mensajesFiltrados = mensajesActuales.filter(m => m.id !== data.id_mensaje);
      this.mensajesSubject.next(mensajesFiltrados);
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
      this.socket = io(this.socketUrl);
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
        this.actualizarContadorNoLeidos();
      },
      error: (error) => {
        console.error('Error al actualizar chats:', error);
      }
    });
  }
  
  // Actualizar contador de mensajes no leídos
  private actualizarContadorNoLeidos() {
    if (!this.usuarioActual) return;
    
    // Usar el endpoint del backend para obtener el contador real
    this.http.get<{ total: number }>(`${this.apiUrl}/mensajes/contador-no-leidos`).subscribe({
      next: (response) => {
        this.contadorNoLeidosSubject.next(response.total || 0);
      },
      error: (error) => {
        console.error('Error al actualizar contador:', error);
        // Fallback: contar desde los chats
        this.cargarChats().subscribe({
          next: (chats) => {
            let contador = 0;
            const chatActivo = this.chatActivoSubject.value;
            
            chats.forEach(chat => {
              if (chat.fecha_ultimo_mensaje && 
                  chat.id_usuario !== chatActivo?.id_usuario &&
                  new Date(chat.fecha_ultimo_mensaje) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                contador++;
              }
            });
            
            this.contadorNoLeidosSubject.next(contador);
          },
          error: () => {
            this.contadorNoLeidosSubject.next(0);
          }
        });
      }
    });
  }
  
  // Marcar mensajes como leídos
  marcarMensajesLeidos(otroUsuarioId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/mensajes/marcar-leidos/${otroUsuarioId}`, {});
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