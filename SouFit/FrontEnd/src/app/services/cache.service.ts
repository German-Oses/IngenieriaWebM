import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private storageReady: Promise<boolean>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private storage: Storage) {
    this.storageReady = this.storage.create();
  }

  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.storageReady;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    await this.storage.set(`cache_${key}`, item);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.storageReady;
    const item: CacheItem<T> = await this.storage.get(`cache_${key}`);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      await this.remove(key);
      return null;
    }

    return item.data;
  }

  async remove(key: string): Promise<void> {
    await this.storageReady;
    await this.storage.remove(`cache_${key}`);
  }

  async clear(): Promise<void> {
    await this.storageReady;
    const keys = await this.storage.keys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await Promise.all(cacheKeys.map(k => this.storage.remove(k)));
  }

  // Helper para cachear observables
  cacheObservable<T>(
    key: string,
    observable: Observable<T>,
    ttl?: number
  ): Observable<T> {
    return new Observable(observer => {
      this.get<T>(key).then(cached => {
        if (cached) {
          observer.next(cached);
          observer.complete();
        } else {
          observable.pipe(
            tap(data => this.set(key, data, ttl))
          ).subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete()
          });
        }
      });
    });
  }
}

