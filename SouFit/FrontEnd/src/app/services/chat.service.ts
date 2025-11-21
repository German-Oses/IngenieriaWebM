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
    this.socket = io(this.socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });
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

  // Método público para obtener el socket (para notificaciones)
  getSocket(): Socket | null {
    return this.socket;
  }

  private setupSocketListeners() {
    // Escuchar nuevas notificaciones
    this.socket.on('nueva_notificacion', (notificacion: any) => {
      console.log('📬 Nueva notificación recibida:', notificacion);
      // Emitir evento para que otros componentes puedan suscribirse
      // Esto se puede expandir con un Subject si es necesario
    });
    
    // Escuchar nuevos mensajes en tiempo real
    this.socket.on('nuevo_mensaje', (mensaje: Mensaje) => {
      console.log('💬 Nuevo mensaje recibido:', mensaje);
      const chatActivo = this.chatActivoSubject.value;
      const esMensajeParaMi = mensaje.id_destinatario === this.usuarioActual?.id;
      const esMensajeMio = mensaje.id_remitente === this.usuarioActual?.id;
      
      // Si el mensaje es para mí y no estoy en ese chat, emitir notificación
      if (esMensajeParaMi && (!chatActivo || chatActivo.id_usuario !== mensaje.id_remitente)) {
        console.log('📨 Mensaje nuevo de usuario no activo, mostrando notificación');
        this.nuevoMensajeSubject.next(mensaje);
        this.actualizarContadorNoLeidos();
        
        // Mostrar notificación push si está disponible
        if (this.notificationService) {
          const remitenteNombre = (mensaje as any).remitente_nombre || 'Usuario';
          const contenido = mensaje.contenido || 'Nuevo mensaje';
          this.notificationService.showMessageNotification(
            remitenteNombre,
            contenido
          ).catch(err => console.log('Error al mostrar notificación:', err));
        }
      }
      
      // Si el mensaje es del chat activo o es mi mensaje, agregarlo a los mensajes
      if (chatActivo && 
          (mensaje.id_remitente === chatActivo.id_usuario || mensaje.id_destinatario === chatActivo.id_usuario)) {
        const mensajesActuales = this.mensajesSubject.value;
        // Verificar que el mensaje no esté ya en la lista
        const existe = mensajesActuales.some(m => m.id === mensaje.id);
        if (!existe) {
          console.log('✅ Agregando mensaje al chat activo');
          
          // Si hay un mensaje optimista con el mismo contenido y remitente, reemplazarlo
          const mensajeOptimistaIndex = mensajesActuales.findIndex(m => 
            m.id && m.id > 1000000000000 && // IDs temporales son timestamps grandes
            m.id_remitente === mensaje.id_remitente &&
            m.contenido === mensaje.contenido &&
            Math.abs(new Date(m.fecha_envio || '').getTime() - new Date(mensaje.fecha_envio || '').getTime()) < 5000
          );
          
          if (mensajeOptimistaIndex !== -1) {
            // Reemplazar mensaje optimista con el real
            const nuevosMensajes = [...mensajesActuales];
            nuevosMensajes[mensajeOptimistaIndex] = mensaje;
            this.mensajesSubject.next(nuevosMensajes);
          } else {
            // Agregar nuevo mensaje
            this.mensajesSubject.next([...mensajesActuales, mensaje]);
          }
          
          // Si es mi mensaje o estoy viendo el chat, marcar como leído
          if (mensaje.id_destinatario === this.usuarioActual?.id) {
            this.marcarMensajesLeidos(mensaje.id_remitente).subscribe({
              next: () => console.log('✅ Mensajes marcados como leídos'),
              error: (err) => console.error('Error al marcar como leído:', err)
            });
          }
        }
      }
      
      // Actualizar la lista de chats siempre para reflejar el último mensaje
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
      console.log('✅ Conectado al servidor de chat - Socket ID:', this.socket.id);
      if (this.usuarioActual) {
        console.log('Usuario actual detectado, entrando al chat...');
        this.entrarChat(this.usuarioActual.id);
        // Unirse también a la sala de notificaciones
        this.socket.emit('unirse_notificaciones', this.usuarioActual.id);
      }
    });
    
    // Manejar reconexión
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Reconectado al servidor de chat (intento ${attemptNumber})`);
      if (this.usuarioActual) {
        this.entrarChat(this.usuarioActual.id);
        this.socket.emit('unirse_notificaciones', this.usuarioActual.id);
      }
    });
    
    // Manejar desconexión
    this.socket.on('disconnect', (reason: string) => {
      console.warn('⚠️ Desconectado del servidor de chat:', reason);
      if (reason === 'io server disconnect') {
        // El servidor desconectó el socket, reconectar manualmente
        this.socket.connect();
      }
    });
    
    // Manejar errores de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión al servidor de chat:', error);
      // El socket.io se reconectará automáticamente
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
    if (this.socket && this.socket.connected) {
      console.log('Entrando al chat para usuario:', idUsuario);
      this.socket.emit('entrar_chat', idUsuario);
    } else {
      console.warn('Socket no conectado, esperando conexión...');
      if (this.socket) {
        this.socket.once('connect', () => {
          console.log('Socket conectado, entrando al chat...');
          this.socket.emit('entrar_chat', idUsuario);
        });
      }
    }
  }

  // Enviar mensaje
  enviarMensaje(idDestinatario: number, contenido: string) {
    if (!this.usuarioActual) {
      console.error('❌ No hay usuario actual para enviar mensaje');
      return;
    }

    if (!this.socket) {
      console.error('❌ Socket no inicializado');
      return;
    }

    if (!this.socket.connected) {
      console.warn('⚠️ Socket no conectado, intentando reconectar...');
      // Intentar reconectar
      this.socket.connect();
      this.socket.once('connect', () => {
        console.log('✅ Socket reconectado, enviando mensaje...');
        this.enviarMensaje(idDestinatario, contenido);
      });
      return;
    }

    const mensaje = {
      id_remitente: this.usuarioActual.id,
      id_destinatario: idDestinatario,
      contenido: contenido.trim()
    };

    console.log('📤 Enviando mensaje via socket:', mensaje);
    
    // Crear mensaje optimista (para mostrar inmediatamente)
    const mensajeOptimista: Mensaje = {
      id: Date.now(), // ID temporal
      id_remitente: this.usuarioActual.id,
      id_destinatario: idDestinatario,
      contenido: contenido.trim(),
      fecha_envio: new Date().toISOString(),
      leido: false
    };
    
    // Agregar mensaje optimista a la lista si estamos en ese chat
    const chatActivo = this.chatActivoSubject.value;
    if (chatActivo && chatActivo.id_usuario === idDestinatario) {
      const mensajesActuales = this.mensajesSubject.value;
      // Verificar que no exista ya
      const existe = mensajesActuales.some(m => m.id === mensajeOptimista.id);
      if (!existe) {
        this.mensajesSubject.next([...mensajesActuales, mensajeOptimista]);
      }
    }
    
    // Enviar mensaje al servidor
    this.socket.emit('enviar_mensaje', mensaje);
    
    // El servidor responderá con 'nuevo_mensaje' que reemplazará el mensaje optimista
    // Actualizar lista de chats después de enviar
    setTimeout(() => {
      this.actualizarListaChats();
    }, 500);
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
    if (!idOtroUsuario || isNaN(idOtroUsuario)) {
      console.error('❌ ID de usuario inválido para cargar mensajes:', idOtroUsuario);
      return new Observable(observer => {
        observer.error({ error: 'ID de usuario inválido' });
        observer.complete();
      });
    }
    return this.http.get<Mensaje[]>(`${this.apiUrl}/mensajes/${idOtroUsuario}`);
  }
  
  // Seleccionar un chat y cargar sus mensajes
  seleccionarChat(chat: Chat) {
    console.log('💬 Seleccionando chat:', chat.id_usuario);
    this.chatActivoSubject.next(chat);
    // Cargar mensajes del chat seleccionado
    this.cargarMensajes(chat.id_usuario).subscribe({
      next: (mensajes) => {
        console.log('📥 Mensajes cargados para chat:', mensajes.length);
        this.mensajesSubject.next(mensajes);
        // Marcar como leídos
        this.marcarMensajesLeidos(chat.id_usuario).subscribe({
          next: () => console.log('✅ Mensajes marcados como leídos'),
          error: (err) => console.error('Error al marcar como leído:', err)
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar mensajes:', error);
        this.mensajesSubject.next([]);
      }
    });
  }
  
  // Cargar lista de chats del usuario
  cargarChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/chats`);
  }

  // Cargar usuarios disponibles para nueva conversación
  cargarUsuariosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios-disponibles`);
  }

  // Buscar usuarios por username (compatibilidad)
  buscarUsuarioPorUsername(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-usuario/${username}`);
  }

  // Buscar usuarios con filtros avanzados
  buscarUsuarios(filtros: {
    username?: string;
    nombre?: string;
    id_region?: number;
    limit?: number;
    offset?: number;
  }): Observable<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const query = queryParams.toString();
    return this.http.get<any[]>(`${this.apiUrl}/buscar-usuario${query ? '?' + query : ''}`);
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
    if (!this.usuarioActual || !this.usuarioActual.id) {
      return;
    }
    
    // Agregar un pequeño delay para evitar llamadas muy rápidas después de enviar mensajes
    setTimeout(() => {
      // Usar el endpoint del backend para obtener el contador real
      this.http.get<{ total: number }>(`${this.apiUrl}/mensajes/contador-no-leidos`).subscribe({
        next: (response) => {
          if (response && typeof response.total === 'number') {
            this.contadorNoLeidosSubject.next(response.total);
          } else {
            this.contadorNoLeidosSubject.next(0);
          }
        },
        error: (error) => {
          // Loggear el error para debugging
          if (error.status === 401) {
            console.warn('No autenticado al obtener contador de mensajes no leídos');
            this.contadorNoLeidosSubject.next(0);
            return;
          }
          
          if (error.status === 400) {
            console.warn('Error 400 al obtener contador de mensajes no leídos:', error.error?.error || error.error?.msg);
            // Intentar fallback solo si es un error 400
            this.contadorNoLeidosSubject.next(0);
            return;
          }
          
          console.error('Error al actualizar contador:', error);
          // Fallback: contar desde los chats solo para errores que no sean 400 o 401
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
    }, 500); // Esperar 500ms antes de actualizar el contador
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