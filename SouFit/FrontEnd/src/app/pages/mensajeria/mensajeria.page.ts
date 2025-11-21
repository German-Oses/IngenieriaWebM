import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonAvatar, IonCol, IonContent, IonGrid, IonIcon, IonRow, IonSpinner, AlertController, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ChatService, Chat, Mensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  addOutline, 
  closeOutline, 
  sendOutline, 
  imageOutline, 
  micOutline,
  searchOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  timeOutline,
  personOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-mensajeria',
  templateUrl: './mensajeria.page.html',
  styleUrls: ['./mensajeria.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, IonCol, IonRow, IonGrid, IonAvatar, IonSpinner]
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
  buscandoUsuarios = false;
  terminoBusquedaUsuario = '';
  
  // Variables para archivos
  archivoSeleccionado: File | null = null;
  previewArchivo: string | null = null;
  tipoArchivo: 'imagen' | 'audio' | null = null;
  enviandoMensaje = false;
  
  // Indicadores
  mensajesNoLeidos: { [key: number]: number } = {};
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ 
      arrowBackOutline, 
      addOutline, 
      closeOutline, 
      sendOutline, 
      imageOutline, 
      micOutline,
      searchOutline,
      checkmarkDoneOutline,
      checkmarkOutline,
      timeOutline,
      personOutline,
      chevronForwardOutline
    });
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
          const mensajesAnteriores = this.mensajes.length;
          const ultimoMensajeAnterior = this.mensajes[this.mensajes.length - 1]?.id;
          const ultimoMensajeNuevo = mensajes[mensajes.length - 1]?.id;
          
          console.log('💬 Mensajes actualizados:', mensajes.length, '(antes:', mensajesAnteriores + ')');
          
          // Actualizar mensajes
          this.mensajes = mensajes;
          
          // Scroll automático solo si estamos cerca del final o hay nuevos mensajes
          setTimeout(() => {
            const container = this.mensajesContainer?.nativeElement;
            if (container) {
              const scrollHeight = container.scrollHeight;
              const scrollTop = container.scrollTop;
              const clientHeight = container.clientHeight;
              const isNearBottom = scrollHeight - scrollTop <= clientHeight + 300;
              const hayNuevosMensajes = mensajes.length > mensajesAnteriores || ultimoMensajeNuevo !== ultimoMensajeAnterior;
              
              if (isNearBottom || hayNuevosMensajes) {
                this.scrollToBottom();
              }
            } else {
              // Si no hay container aún, intentar de nuevo
              setTimeout(() => this.scrollToBottom(), 200);
            }
          }, 150);
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
    if (!otroUsuarioId || isNaN(otroUsuarioId) || otroUsuarioId <= 0) {
      console.error('❌ ID de usuario inválido para cargar mensajes:', otroUsuarioId);
      this.presentErrorToast('Error: ID de usuario inválido');
      return;
    }
    
    console.log('📥 Cargando mensajes del chat con usuario:', otroUsuarioId);
    // El servicio ya carga los mensajes automáticamente cuando se selecciona un chat
    // Este método es solo para asegurar que se carguen si no se han cargado aún
    if (this.mensajes.length === 0) {
      this.chatService.cargarMensajes(otroUsuarioId).subscribe({
        next: (mensajes) => {
          console.log('✅ Mensajes cargados inicialmente:', mensajes.length);
          // Los mensajes se actualizarán automáticamente vía el observable mensajes$
        },
        error: (error) => {
          console.error('❌ Error al cargar mensajes:', error);
          // No mostrar toast para errores de validación que ya se manejaron
          if (error.status !== 400 && error.status !== 401) {
            this.presentErrorToast('Error al cargar los mensajes');
          }
        }
      });
    }
    // Marcar mensajes como leídos
    this.chatService.marcarMensajesLeidos(otroUsuarioId).subscribe({
      next: () => console.log('✅ Mensajes marcados como leídos'),
      error: (err) => {
        // Solo loggear errores que no sean de validación
        if (err.status !== 400 && err.status !== 401) {
          console.error('Error al marcar como leído:', err);
        }
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
    if (!chat || !chat.id_usuario || isNaN(chat.id_usuario)) {
      console.error('❌ Chat inválido:', chat);
      this.presentErrorToast('Error al seleccionar el chat');
      return;
    }
    
    console.log('💬 Seleccionando chat desde página:', chat.id_usuario);
    this.chatActivo = chat;
    // El servicio ya carga los mensajes automáticamente
    this.chatService.seleccionarChat(chat);
    // También cargar mensajes localmente para asegurar que se muestren
    this.cargarMensajesDelChat(chat.id_usuario);
  }

  enviarMensaje() {
    if (!this.chatActivo) {
      console.warn('No hay chat activo');
      this.presentErrorToast('No hay conversación seleccionada');
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

    if (this.enviandoMensaje) {
      return; // Evitar envíos duplicados
    }

    const contenido = this.nuevoMensaje.trim();
    console.log('Enviando mensaje a:', this.chatActivo.id_usuario, 'Contenido:', contenido);
    
    this.enviandoMensaje = true;
    
    // Limpiar el input inmediatamente para mejor UX
    this.nuevoMensaje = '';
    
    // Enviar mensaje (se actualizará automáticamente vía socket)
    this.chatService.enviarMensaje(this.chatActivo.id_usuario, contenido);
    
    // Scroll al final después de un breve delay para que el mensaje se agregue
    setTimeout(() => {
      this.scrollToBottom();
      this.enviandoMensaje = false;
    }, 100);
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
        console.log('✅ Archivo enviado:', mensaje);
        // El mensaje ya se agregará automáticamente por el socket
        this.limpiarArchivo();
        this.nuevoMensaje = '';
        // Scroll al final
        setTimeout(() => this.scrollToBottom(), 200);
      },
      error: (error) => {
        console.error('❌ Error al enviar archivo:', error);
        this.presentErrorToast('No se pudo enviar el archivo. Por favor, intenta de nuevo.');
      }
    });
  }

  seleccionarArchivo(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
      this.presentErrorToast('Solo se permiten archivos de imagen o audio');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.presentErrorToast('El archivo es demasiado grande. Máximo 10MB');
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

  buscarUsuarios() {
    if (!this.terminoBusquedaUsuario || this.terminoBusquedaUsuario.trim().length < 2) {
      this.cargarUsuariosDisponibles();
      return;
    }

    this.buscandoUsuarios = true;
    this.chatService.buscarUsuarioPorUsername(this.terminoBusquedaUsuario.trim()).subscribe({
      next: (usuarios) => {
        this.usuariosDisponibles = usuarios;
        this.buscandoUsuarios = false;
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.buscandoUsuarios = false;
        this.presentErrorToast('Error al buscar usuarios');
      }
    });
  }

  tieneMensajesNoLeidos(chat: Chat): boolean {
    return (this.mensajesNoLeidos[chat.id_usuario] || 0) > 0;
  }

  obtenerEstadoLectura(mensaje: Mensaje): 'enviado' | 'entregado' | 'leido' {
    if (!this.esMensajePropio(mensaje)) {
      return 'enviado'; // Para mensajes recibidos, no mostramos estado
    }

    // Si el mensaje está marcado como leído
    if (mensaje.leido) {
      return 'leido';
    }

    // Por defecto, enviado (en el futuro se puede agregar fecha_entregado)
    return 'enviado';
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

  scrollToBottom(): void {
    try {
      if (this.mensajesContainer && this.mensajesContainer.nativeElement) {
        const container = this.mensajesContainer.nativeElement;
        // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
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
    this.buscandoUsuarios = true;
    this.chatService.cargarUsuariosDisponibles().subscribe({
      next: (usuarios) => {
        this.usuariosDisponibles = usuarios;
        this.buscandoUsuarios = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.presentErrorToast('No se pudieron cargar los usuarios');
        this.buscandoUsuarios = false;
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

  async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
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
  
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
