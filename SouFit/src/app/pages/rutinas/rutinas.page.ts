import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  styleUrls: ['./rutinas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonAccordion,
    IonAccordionGroup,
    CommonModule,
    FormsModule
  ]
})
export class RutinasPage implements OnInit {

  rutinas = [
    {
      nombre: 'Rutina de fuerza',
      dias: [
        {
          nombre: 'Día 1',
          ejercicios: [   
            { nombre: 'Sentadillas', series: 4, repeticiones: 12 },
            { nombre: 'Press de banca', series: 4, repeticiones: 10 },
            { nombre: 'Peso muerto', series: 4, repeticiones: 8 }
          ]
        },
        {
          nombre: 'Día 2',
          ejercicios: [  
            { nombre: 'Dominadas', series: 4, repeticiones: 10 },
            { nombre: 'Remo con barra', series: 4, repeticiones: 12 }
          ]
        }
      ]
    }
  ];

  constructor() {}

  ngOnInit() {}

  verEjercicio(ejercicio: any) {
    console.log('Ejercicio seleccionado:', ejercicio);
  }
}
