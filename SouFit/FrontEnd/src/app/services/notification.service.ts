import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    this.checkPermission();
  }

  /**
   * Verificar si las notificaciones están permitidas
   */
  async checkPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Permisos de notificación denegados');
      return false;
    }

    return false;
  }

  /**
   * Solicitar permiso para mostrar notificaciones
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Permisos de notificación denegados');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      return false;
    }
  }

  /**
   * Mostrar una notificación
   */
  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    if (!this.permissionGranted) {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        // Intentar solicitar permiso si no está concedido
        const granted = await this.requestPermission();
        if (!granted) {
          console.warn('No se puede mostrar notificación: permisos no concedidos');
          return null;
        }
      }
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: '/assets/icon/SouFitLogo.png',
        badge: '/assets/icon/SouFitLogo.png',
        vibrate: [200, 100, 200],
        tag: 'soufit-notification',
        requireInteraction: false,
        ...options
      };

      const notification = new Notification(title, defaultOptions);

      // Cerrar la notificación después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Manejar clic en la notificación
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
      return null;
    }
  }

  /**
   * Mostrar notificación de nuevo mensaje
   */
  async showMessageNotification(
    senderName: string,
    message: string,
    onClick?: () => void
  ): Promise<Notification | null> {
    const notification = await this.showNotification(
      `Nuevo mensaje de ${senderName}`,
      {
        body: message.length > 100 ? message.substring(0, 100) + '...' : message,
        icon: '/assets/icon/SouFitLogo.png',
        badge: '/assets/icon/SouFitLogo.png',
        tag: `message-${senderName}`,
        requireInteraction: false
      }
    );

    if (notification && onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        onClick();
        notification.close();
        window.focus();
      };
    }

    return notification;
  }

  /**
   * Verificar si las notificaciones están disponibles
   */
  isAvailable(): boolean {
    return 'Notification' in window;
  }

  /**
   * Obtener el estado del permiso
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

