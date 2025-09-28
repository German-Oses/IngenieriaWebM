import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonText, 
  IonImg, 
  IonCheckbox 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonImg,
    IonCheckbox,
    CommonModule,
    FormsModule
  ]
})
export class RegisterPage implements OnInit {

  // Variables para el formulario
  username: string = '';
  email: string = '';
  region: string = '';
  comuna: string = '';
  password: string = '';
  confirmPassword: string = '';
  acceptTerms: boolean = false;

  constructor() { }

  ngOnInit() { }

  // Función para crear cuenta
  createAccount() {
    if (!this.acceptTerms) {

      return;
    }

    console.log({
      username: this.username,
      email: this.email,
      region: this.region,
      comuna: this.comuna,
      password: this.password,
      confirmPassword: this.confirmPassword
    });
  }

}
