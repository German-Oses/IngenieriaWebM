import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonAvatar, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonRow, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mensajeria',
  templateUrl: './mensajeria.page.html',
  styleUrls: ['./mensajeria.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonIcon,IonCol,IonRow,IonGrid,IonAvatar
    ]
})
export class MensajeriaPage implements OnInit {

  constructor(private router :Router) { }

  volverHome()
  {
    this.router.navigate(['/home'])
  }
  rutinas()
  {
    this.router.navigate(['/rutinas']);
  }
  
  ngOnInit() {}
}
