import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private platform: Platform
  ) {}

  async ngOnInit() {
    // El tema se inicializa automáticamente en el constructor del servicio
    // No necesitamos llamar initTheme() aquí ya que es privado y se llama en el constructor
    
    // Configurar status bar en móvil (si Capacitor está disponible)
    if (this.platform.is('capacitor')) {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const theme = this.themeService.getTheme();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark.matches);
        
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        });
        
        // Escuchar cambios de tema
        this.themeSubscription = this.themeService.theme$.subscribe(async (currentTheme) => {
          const shouldBeDark = currentTheme === 'dark' || (currentTheme === 'system' && prefersDark.matches);
          try {
            await StatusBar.setStyle({
              style: shouldBeDark ? Style.Dark : Style.Light
            });
          } catch (error) {
            console.log('Error al cambiar status bar:', error);
          }
        });
      } catch (error) {
        console.log('StatusBar no disponible:', error);
      }
    }
    
    // Prevenir zoom en iOS
    if (this.platform.is('ios')) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
  }
  
  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
