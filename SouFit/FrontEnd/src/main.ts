
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';


import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';

import { jwtInterceptor } from './app/interceptors/jwt-interceptor'; 

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    
    importProvidersFrom(IonicStorageModule.forRoot()), 
    provideHttpClient(withInterceptors([jwtInterceptor])), 
  ],
});