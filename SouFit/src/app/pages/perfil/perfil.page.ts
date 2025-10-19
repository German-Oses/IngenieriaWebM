import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonIcon, IonAvatar, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonAvatar,
    IonButton
]
})
export class PerfilPage implements OnInit {

  constructor(private router: Router) { }

  // Navegación
  volverHome() {
    this.router.navigate(['/home']);
  }

  mensajeria() {
    this.router.navigate(['/mensajeria']);
  }

  rutinas() {
    this.router.navigate(['/rutinas']);
  }
  ngOnInit() {
  }
}