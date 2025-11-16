import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonButton, IonItem, IonList, IonAvatar, IonSpinner } from '@ionic/angular/standalone';
import { ChatService } from '../../services/chat.service';

export interface UsuarioBusqueda {
  id_usuario: number;
  nombre: string;
  username: string;
  email: string;
  avatar?: string;
  siguiendo: boolean;
}

@Component({
  selector: 'app-buscar-usuarios',
  templateUrl: './buscar-usuarios.component.html',
  styleUrls: ['./buscar-usuarios.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonButton, IonItem, IonList, IonAvatar, IonSpinner]
})
export class BuscarUsuariosComponent implements OnInit {
  @Output() usuarioSeleccionado = new EventEmitter<UsuarioBusqueda>();
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  terminoBusqueda: string = '';
  usuariosEncontrados: UsuarioBusqueda[] = [];
  usuariosSiguiendo: UsuarioBusqueda[] = [];
  cargando: boolean = false;
  mostrarResultados: boolean = false;
  pestanaActiva: string = 'buscar'; // 'buscar' o 'siguiendo'

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.cargarUsuariosSiguiendo();
    // Focus automático en el input de búsqueda
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 300);
  }

  buscarUsuarios() {
    if (!this.terminoBusqueda || this.terminoBusqueda.length < 2) {
      this.usuariosEncontrados = [];
      this.mostrarResultados = false;
      return;
    }

    this.cargando = true;
    this.chatService.buscarUsuarioPorUsername(this.terminoBusqueda).subscribe({
      next: (usuarios) => {
        this.usuariosEncontrados = usuarios;
        this.mostrarResultados = true;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.cargando = false;
        this.usuariosEncontrados = [];
      }
    });
  }

  cargarUsuariosSiguiendo() {
    this.chatService.obtenerUsuariosSiguiendo().subscribe({
      next: (usuarios) => {
        this.usuariosSiguiendo = usuarios;
      },
      error: (error) => {
        console.error('Error al cargar usuarios seguidos:', error);
      }
    });
  }

  seguirUsuario(usuario: UsuarioBusqueda) {
    this.chatService.seguirUsuario(usuario.id_usuario).subscribe({
      next: (response) => {
        usuario.siguiendo = true;
        this.cargarUsuariosSiguiendo();
        console.log(response.message);
      },
      error: (error) => {
        console.error('Error al seguir usuario:', error);
      }
    });
  }

  dejarDeSeguir(usuario: UsuarioBusqueda) {
    this.chatService.dejarDeSeguir(usuario.id_usuario).subscribe({
      next: (response) => {
        usuario.siguiendo = false;
        this.cargarUsuariosSiguiendo();
        console.log(response.message);
      },
      error: (error) => {
        console.error('Error al dejar de seguir:', error);
      }
    });
  }

  seleccionarUsuario(usuario: UsuarioBusqueda) {
    this.usuarioSeleccionado.emit(usuario);
  }

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
    if (pestana === 'siguiendo') {
      this.cargarUsuariosSiguiendo();
    }
  }

  onBusquedaChange() {
    // Debounce para evitar muchas llamadas
    setTimeout(() => {
      this.buscarUsuarios();
    }, 300);
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.usuariosEncontrados = [];
    this.mostrarResultados = false;
  }

  cerrarComponente() {
    this.cerrar.emit();
  }

  onEnterPressed(event: any) {
    if (event.key === 'Enter') {
      this.buscarUsuarios();
    }
  }
}