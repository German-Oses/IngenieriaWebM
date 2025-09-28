import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonList, IonAccordion, IonButton, IonItemOption, IonItem, IonImg, IonChip, IonAvatar, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { IonIcon } from '@ionic/angular/standalone'
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonRow, IonCol, IonList, IonIcon, IonButton, IonAccordion,
     IonItemOption, IonItem, IonImg, IonChip, IonAvatar, IonLabel ,IonCard,IonCardTitle,IonCardContent,IonCardHeader]
})
export class HomePage {

  constructor(private router: Router){}

  mensajeria()
  {
    console.log("Moviendose a Mensajeria");
  this.router.navigate(['/mensajeria']);
  }

}