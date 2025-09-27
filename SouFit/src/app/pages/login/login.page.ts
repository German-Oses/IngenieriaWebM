import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    CommonModule, 
    FormsModule
  ]
})
export class LoginPage {

  constructor(private router: Router) { }

  login() {
   
    console.log('Iniciando sesión...');
    this.router.navigate(['/home']);
  }

  forgotPassword() {
    console.log('Olvidé mi contraseña');
    
  }

  goToRegister() {
    console.log('Ir a registro');
    this.router.navigate(['/register']);
  }
}