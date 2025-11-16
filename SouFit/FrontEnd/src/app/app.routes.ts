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
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegistroPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'mensajeria',
    loadComponent: () => import('./pages/mensajeria/mensajeria.page').then( m => m.MensajeriaPage)
  },
  {
    path: 'rutinas',
    loadComponent: () => import('./pages/rutinas/rutinas.page').then( m => m.RutinasPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page').then( m => m.PerfilPage)
  },
  {
    path: 'buscar',
    loadComponent: () => import('./pages/buscar/buscar.page').then( m => m.BuscarPage)
  },
];
