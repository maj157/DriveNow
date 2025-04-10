import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarService } from '../../core/services/car.service';
import { RouterModule } from '@angular/router';

interface CarGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  carCount: number;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent implements OnInit {
  carGroups: CarGroup[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.loadCarGroups();
  }

  loadCarGroups(): void {
    this.loading = true;
    this.carService.getCarGroups().subscribe({
      next: (groups) => {
        this.carGroups = groups;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load car groups. Please try again later.';
        this.loading = false;
        console.error('Error loading car groups:', err);
      }
    });
  }
}
