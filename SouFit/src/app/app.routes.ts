import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'mensajeria',
    loadComponent: () => import('./pages/mensajeria/mensajeria.page').then( m => m.MensajeriaPage)
  },  {
    path: 'rutinas',
    loadComponent: () => import('./pages/rutinas/rutinas.page').then( m => m.RutinasPage)
  },

];
