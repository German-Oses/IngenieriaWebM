import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Recordatorio {
  id_recordatorio?: number;
  id_usuario: number;
  hora: string; // Formato HH:MM
  dias_semana: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  mensaje?: string;
  activo: boolean;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecordatorioService {
  private apiUrl = `${environment.apiUrl}/recordatorios`;

  constructor(private http: HttpClient) { }

  getRecordatorios(): Observable<Recordatorio[]> {
    return this.http.get<Recordatorio[]>(this.apiUrl);
  }

  crearRecordatorio(recordatorio: Partial<Recordatorio>): Observable<Recordatorio> {
    return this.http.post<Recordatorio>(this.apiUrl, recordatorio);
  }

  actualizarRecordatorio(id: number, recordatorio: Partial<Recordatorio>): Observable<Recordatorio> {
    return this.http.put<Recordatorio>(`${this.apiUrl}/${id}`, recordatorio);
  }

  eliminarRecordatorio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

