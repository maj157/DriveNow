import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective]
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isDropdownOpen = false;
  currentUser$: Observable<User | null>;
  isReviewSubmitActive = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser;
  }

  ngOnInit(): void {
    // Subscribe to router events to determine the active route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isReviewSubmitActive = this.router.url === '/reviews/submit';
    });
    
    // Check initial route
    this.isReviewSubmitActive = this.router.url === '/reviews/submit';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  navigateToSubmitReview(): void {
    this.closeDropdown();
    this.router.navigate(['/reviews/submit']);
  }
}
