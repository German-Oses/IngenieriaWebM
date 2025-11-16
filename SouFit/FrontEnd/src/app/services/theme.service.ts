import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('system');
  public theme$: Observable<Theme> = this.themeSubject.asObservable();
  
  private storageReady: Promise<void>;

  constructor(private storage: Storage) {
    this.storageReady = this.storage.create().then(() => {});
    this.initTheme();
  }

  private async initTheme() {
    await this.storageReady;
    const savedTheme = await this.storage.get('theme') || 'system';
    this.setTheme(savedTheme as Theme);
  }

  async setTheme(theme: Theme) {
    this.themeSubject.next(theme);
    await this.storageReady;
    await this.storage.set('theme', theme);
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark.matches);
    
    document.body.classList.toggle('dark', shouldUseDark);
  }

  getTheme(): Theme {
    return this.themeSubject.value;
  }
}

