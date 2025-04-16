import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { CoreModule } from './core/core.module';
// Comment out the MatCommonModule import to avoid _HighContrastModeDetector injection errors
// import { MatCommonModule } from '@angular/material/core';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CartSidebarComponent } from './shared/components/cart-sidebar/cart-sidebar.component';
import { ChatButtonComponent } from './features/chat/chat-button/chat-button.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    FormsModule,
    ReactiveFormsModule,
    CoreModule,
    // MatCommonModule, // Comment out to avoid _HighContrastModeDetector injection errors
    
    // Import standalone components
    AppComponent,
    NavbarComponent,
    FooterComponent,
    CartSidebarComponent,
    ChatButtonComponent
  ],
  providers: []
})
export class AppModule { }