import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rutina {
  id_rutina?: number;
  id_usuario: number;
  nombre_rutina: string;
  descripcion?: string;
  tipo_rutina?: string;
  duracion_semanas?: number;
  nivel_dificultad?: 'Principiante' | 'Intermedio' | 'Avanzado';
  es_publica?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  creador_username?: string;
  total_likes?: number;
  total_guardados?: number;
  esta_guardada?: boolean;
  me_gusta?: boolean;
}

export interface RutinaDia {
  id_dia?: number;
  id_rutina: number;
  numero_dia: number;
  nombre_dia?: string;
  descripcion?: string;
  orden?: number;
  ejercicios?: RutinaEjercicio[];
}

export interface RutinaEjercicio {
  id_rutina_ejercicio?: number;
  id_dia: number;
  id_ejercicio: number;
  series?: number;
  repeticiones?: string;
  peso_recomendado?: number;
  descanso_segundos?: number;
  orden?: number;
  notas?: string;
  nombre_ejercicio?: string;
  descripcion_ejercicio?: string;
}

export interface RutinaCompleta extends Rutina {
  dias?: RutinaDia[];
}

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  private apiUrl = `${environment.apiUrl}/rutinas`;

  constructor(private http: HttpClient) { }

  // Obtener todas las rutinas
  getRutinas(filtros?: {
    tipo_rutina?: string;
    nivel_dificultad?: string;
    es_publica?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<Rutina[]> {
    let params = new URLSearchParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key as keyof typeof filtros] !== undefined) {
          params.append(key, filtros[key as keyof typeof filtros] as string);
        }
      });
    }
    const queryString = params.toString();
    return this.http.get<Rutina[]>(`${this.apiUrl}${queryString ? '?' + queryString : ''}`);
  }

  // Obtener rutinas del usuario actual
  getMisRutinas(): Observable<RutinaCompleta[]> {
    return this.http.get<RutinaCompleta[]>(`${this.apiUrl}/usuario/mis-rutinas`);
  }

  // Obtener una rutina por ID (con días y ejercicios)
  getRutinaById(id: number): Observable<RutinaCompleta> {
    return this.http.get<RutinaCompleta>(`${this.apiUrl}/${id}`);
  }

  // Crear una rutina completa (con días y ejercicios)
  createRutina(rutina: RutinaCompleta): Observable<RutinaCompleta> {
    return this.http.post<RutinaCompleta>(`${this.apiUrl}`, rutina);
  }

  // Actualizar una rutina
  updateRutina(id: number, rutina: Partial<Rutina>): Observable<Rutina> {
    return this.http.put<Rutina>(`${this.apiUrl}/${id}`, rutina);
  }

  // Eliminar una rutina
  deleteRutina(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Guardar rutina como favorita
  guardarRutina(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/guardar`, {});
  }

  // Quitar rutina de favoritos
  quitarRutinaGuardada(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/guardar`);
  }

  // Obtener rutinas guardadas
  getRutinasGuardadas(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/guardadas`);
  }

  // Reaccionar a una rutina
  reaccionarRutina(id: number, tipo_reaccion: string = 'like'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reaccionar`, { tipo_reaccion });
  }

  // Compartir una rutina
  compartirRutina(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/compartir`, {});
  }

  // Crear un día para una rutina
  createRutinaDia(idRutina: number, diaData: {
    numero_dia: number;
    nombre_dia?: string;
    descripcion?: string;
  }): Observable<RutinaDia> {
    return this.http.post<RutinaDia>(`${this.apiUrl}/${idRutina}/dias`, diaData);
  }

  // Agregar ejercicio a un día de rutina
  agregarEjercicioARutina(idRutina: number, ejercicioData: {
    id_dia: number;
    id_ejercicio: number;
    series?: number;
    repeticiones?: string;
    peso_recomendado?: number;
    descanso_segundos?: number;
    orden?: number;
    notas?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idRutina}/ejercicios`, ejercicioData);
  }
}

