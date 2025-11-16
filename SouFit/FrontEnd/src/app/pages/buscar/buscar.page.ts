import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonGrid, IonRow, IonCol, IonIcon, IonInput, IonButton, IonSpinner, IonChip, IonLabel, IonAvatar, IonItem, IonList } from '@ionic/angular/standalone';
import { EjercicioService, Ejercicio } from '../../services/ejercicio.service';
import { ChatService } from '../../services/chat.service';
import { addIcons } from 'ionicons';
import { searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline } from 'ionicons/icons';

export interface UsuarioBusqueda {
  id_usuario: number;
  nombre: string;
  username: string;
  avatar?: string;
  siguiendo: boolean;
}

@Component({
  selector: 'app-buscar',
  templateUrl: './buscar.page.html',
  styleUrls: ['./buscar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonGrid, IonRow, IonCol, 
    IonIcon, IonInput, IonButton, IonSpinner, IonChip, IonLabel, IonAvatar, IonItem, IonList
  ]
})
export class BuscarPage implements OnInit {
  terminoBusqueda: string = '';
  tipoBusqueda: 'usuarios' | 'ejercicios' = 'usuarios';
  usuariosEncontrados: UsuarioBusqueda[] = [];
  ejerciciosEncontrados: Ejercicio[] = [];
  cargando = false;
  mostrarResultados = false;
  
  // Búsqueda avanzada
  filtroGrupoMuscular: string = '';
  filtroDuracion: string = '';
  ordenarPor: 'relevancia' | 'nombre' | 'duracion' = 'relevancia';

  constructor(
    private router: Router,
    private chatService: ChatService,
    private ejercicioService: EjercicioService
  ) {
    addIcons({ searchOutline, personOutline, barbellOutline, homeOutline, chatbubblesOutline, arrowBackOutline });
  }

  ngOnInit() {
  }

  cambiarTipoBusqueda(tipo: 'usuarios' | 'ejercicios') {
    this.tipoBusqueda = tipo;
    this.terminoBusqueda = '';
    this.limpiarResultados();
  }

  buscar() {
    if (!this.terminoBusqueda || this.terminoBusqueda.length < 2) {
      this.limpiarResultados();
      return;
    }

    this.cargando = true;
    this.mostrarResultados = true;

    if (this.tipoBusqueda === 'usuarios') {
      this.buscarUsuarios();
    } else {
      this.buscarEjercicios();
    }
  }

  buscarUsuarios() {
    this.chatService.buscarUsuarioPorUsername(this.terminoBusqueda).subscribe({
      next: (usuarios) => {
        this.usuariosEncontrados = usuarios;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.cargando = false;
        this.usuariosEncontrados = [];
      }
    });
  }

  buscarEjercicios() {
    const filtros: any = {
      nombre: this.terminoBusqueda,
      limit: 50
    };
    
    if (this.filtroGrupoMuscular) {
      filtros.grupo_muscular = this.filtroGrupoMuscular;
    }
    
    if (this.filtroDuracion) {
      filtros.duracion_max = parseInt(this.filtroDuracion);
    }
    
    this.ejercicioService.getEjercicios(filtros).subscribe({
      next: (ejercicios) => {
        let ejerciciosOrdenados = [...ejercicios];
        
        // Ordenar resultados
        if (this.ordenarPor === 'nombre') {
          ejerciciosOrdenados.sort((a, b) => 
            (a.nombre_ejercicio || '').localeCompare(b.nombre_ejercicio || '')
          );
        } else if (this.ordenarPor === 'duracion') {
          ejerciciosOrdenados.sort((a, b) => 
            (a.duracion_minutos || 0) - (b.duracion_minutos || 0)
          );
        }
        
        this.ejerciciosEncontrados = ejerciciosOrdenados;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar ejercicios:', error);
        this.cargando = false;
        this.ejerciciosEncontrados = [];
      }
    });
  }

  limpiarResultados() {
    this.usuariosEncontrados = [];
    this.ejerciciosEncontrados = [];
    this.mostrarResultados = false;
  }

  seguirUsuario(usuario: UsuarioBusqueda) {
    this.chatService.seguirUsuario(usuario.id_usuario).subscribe({
      next: () => {
        usuario.siguiendo = true;
      },
      error: (error) => {
        console.error('Error al seguir usuario:', error);
      }
    });
  }

  dejarDeSeguir(usuario: UsuarioBusqueda) {
    this.chatService.dejarDeSeguir(usuario.id_usuario).subscribe({
      next: () => {
        usuario.siguiendo = false;
      },
      error: (error) => {
        console.error('Error al dejar de seguir:', error);
      }
    });
  }

  verPerfil(usuarioId: number) {
    // Navegar al perfil del usuario
    this.router.navigate(['/perfil', usuarioId]);
  }

  verEjercicio(ejercicioId: number) {
    // Navegar al detalle del ejercicio
    this.router.navigate(['/ejercicio', ejercicioId]);
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }

  mensajeria() {
    this.router.navigate(['/mensajeria']);
  }

  perfil() {
    this.router.navigate(['/perfil']);
  }
}

