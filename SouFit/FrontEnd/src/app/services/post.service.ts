import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Post {
  id_post?: number;
  id_usuario: number;
  autor_id?: number;
  tipo_post: 'ejercicio' | 'rutina' | 'logro' | 'texto';
  contenido: string;
  url_media?: string;
  id_ejercicio?: number;
  id_rutina?: number;
  fecha_publicacion?: string;
  autor_username?: string;
  autor_nombre?: string;
  autor_avatar?: string;
  total_likes?: number;
  total_comentarios?: number;
  total_compartidos?: number;
  me_gusta?: boolean;
  sigo_autor?: boolean;
  nombre_ejercicio?: string;
  nombre_rutina?: string;
}

export interface Comentario {
  id_comentario?: number;
  id_usuario: number;
  id_post?: number;
  id_ejercicio?: number;
  id_rutina?: number;
  contenido: string;
  fecha_comentario?: string;
  autor_username?: string;
  autor_nombre?: string;
  autor_avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) { }

  // Obtener feed comunitario
  getFeed(limit: number = 20, offset: number = 0): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/feed?limit=${limit}&offset=${offset}`);
  }

  // Obtener posts de un usuario
  getPostsByUser(userId: number, limit: number = 20, offset: number = 0): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/usuario/${userId}?limit=${limit}&offset=${offset}`);
  }

  // Crear un nuevo post
  createPost(post: Partial<Post>): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}`, post);
  }

  // Crear un post con imagen
  createPostConImagen(post: Partial<Post>, imagen: File): Observable<Post> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('tipo_post', post.tipo_post || 'texto');
    formData.append('contenido', post.contenido || '');
    // No enviar url_media cuando se sube un archivo
    if (post.id_ejercicio) {
      formData.append('id_ejercicio', post.id_ejercicio.toString());
    }
    if (post.id_rutina) {
      formData.append('id_rutina', post.id_rutina.toString());
    }
    
    return this.http.post<Post>(`${this.apiUrl}`, formData);
  }

  // Actualizar un post
  updatePost(id: number, post: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${id}`, post);
  }

  // Eliminar un post
  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Reaccionar a un post (like)
  reaccionarPost(id: number, tipo_reaccion: string = 'like'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reaccionar`, { tipo_reaccion });
  }

  // Comentar un post
  comentarPost(id: number, contenido: string): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.apiUrl}/${id}/comentar`, { contenido });
  }

  // Obtener comentarios de un post
  getComentarios(id: number, limit: number = 50, offset: number = 0): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}/${id}/comentarios?limit=${limit}&offset=${offset}`);
  }

  // Compartir un post
  compartirPost(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/compartir`, {});
  }
}

