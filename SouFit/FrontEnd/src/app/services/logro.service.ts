import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Logro {
  id_logro?: number;
  nombre_logro: string;
  descripcion?: string;
  icono?: string;
  categoria?: string;
  requisito_valor?: number;
  obtenido?: boolean;
  fecha_obtenido?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogroService {
  private apiUrl = `${environment.apiUrl}/logros`;

  constructor(private http: HttpClient) { }

  getLogros(): Observable<Logro[]> {
    return this.http.get<Logro[]>(this.apiUrl);
  }

  getLogrosDisponibles(): Observable<Logro[]> {
    return this.http.get<Logro[]>(`${this.apiUrl}/disponibles`);
  }

  verificarLogros(): Observable<{ logros_otorgados: Logro[] }> {
    return this.http.post<{ logros_otorgados: Logro[] }>(`${this.apiUrl}/verificar`, {});
  }
}

