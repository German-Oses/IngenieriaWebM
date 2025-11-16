import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgresoFisico {
  id_progreso?: number;
  id_usuario: number;
  fecha_registro: string;
  peso?: number;
  altura?: number;
  cintura?: number;
  pecho?: number;
  brazo?: number;
  muslo?: number;
  notas?: string;
  fecha_creacion?: string;
}

export interface ResumenProgreso {
  total_registros: number;
  primera_fecha: string;
  ultima_fecha: string;
  peso_minimo: number;
  peso_maximo: number;
  peso_promedio: number;
  peso_actual: number;
  peso_inicial: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {
  private apiUrl = `${environment.apiUrl}/progreso`;

  constructor(private http: HttpClient) { }

  getProgreso(params?: {
    limit?: number;
    offset?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<ProgresoFisico[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.http.get<ProgresoFisico[]>(`${this.apiUrl}${query ? '?' + query : ''}`);
  }

  getResumen(dias: number = 90): Observable<ResumenProgreso> {
    return this.http.get<ResumenProgreso>(`${this.apiUrl}/resumen?dias=${dias}`);
  }

  registrarProgreso(progreso: Partial<ProgresoFisico>): Observable<ProgresoFisico> {
    return this.http.post<ProgresoFisico>(this.apiUrl, progreso);
  }

  eliminarProgreso(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

