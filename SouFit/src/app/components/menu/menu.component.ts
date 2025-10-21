import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent  implements OnInit {
  router: any;

  constructor() { }

  ngOnInit() {}

  volverHome() {
    console.log("Navegando a Home");
    this.router.navigate(['/home']);
  }
  buscar() {
    console.log("buscar");
    this.router.navigate(['/buscar']);
  }
  rutinas() {
    console.log("Navegando a Rutinas");
    this.router.navigate(['/rutinas']);
  }
  mensajeria(){
    console.log("Navegando a Mensajería");
    this.router.navigate(['/mensajeria']);
  }
  perfil(){
    console.log("Navegando a Perfil");
    this.router.navigate(['/perfil']);
  }

}
