import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DiscountService, DiscountCoupon } from '../../core/services/discount.service';
import { Coupon } from '../../models/coupon.model';
import { MaterialModule } from '../../shared/material.module';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-discount-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule
  ],
  templateUrl: './discount-management.component.html',
  styleUrls: ['../shared/admin-styles.css', './discount-management.component.css']
})
export class DiscountManagementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  displayedColumns: string[] = ['code', 'discount', 'expiry', 'minAmount', 'usage', 'status', 'actions'];
  dataSource = new MatTableDataSource<DiscountCoupon>([]);
  coupons: DiscountCoupon[] = [];
  filteredCoupons: DiscountCoupon[] = [];
  isLoading = false;
  error: string | null = null;
  statusFilter: 'all' | 'active' | 'inactive' | 'expired' = 'all';
  showForm = false;
  isEditing = false;
  couponForm: FormGroup;
  selectedCoupon: DiscountCoupon | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private discountService: DiscountService,
    private snackBar: MatSnackBar
  ) {
    this.couponForm = this.createCouponForm();
  }

  ngOnInit(): void {
    this.loadCoupons();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  createCouponForm(): FormGroup {
    return this.formBuilder.group({
      code: ['', Validators.required],
      discountAmount: [0, Validators.min(0)],
      discountPercentage: [0, Validators.min(0)],
      minimumOrderAmount: [0, Validators.min(0)],
      maxUsage: [null],
      expiryDate: [new Date(new Date().setMonth(new Date().getMonth() + 1)), Validators.required],
      isActive: [true]
    });
  }

  loadCoupons(): void {
    this.isLoading = true;
    this.error = null;

    this.discountService.getAllCoupons().subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading coupons:', error);
        
        // If API fails, use mock data for development
        this.coupons = [
          {
            id: '1',
            code: 'SUMMER2024',
            discountAmount: 0,
            discountPercentage: 15,
            expiryDate: new Date('2024-08-31'),
            isActive: true,
            minimumOrderAmount: 100,
            maxUsage: 1000,
            currentUsage: 137,
            createdAt: new Date('2024-02-15')
          },
          {
            id: '2',
            code: 'WELCOME50',
            discountAmount: 50,
            discountPercentage: 0,
            expiryDate: new Date('2024-12-31'),
            isActive: true,
            minimumOrderAmount: 200,
            maxUsage: 500,
            currentUsage: 89,
            createdAt: new Date('2024-01-01')
          },
          {
            id: '3',
            code: 'HOLIDAY25',
            discountAmount: 0,
            discountPercentage: 25,
            expiryDate: new Date('2023-12-31'),
            isActive: false,
            minimumOrderAmount: 150,
            maxUsage: 300,
            currentUsage: 300,
            createdAt: new Date('2023-11-01')
          }
        ];
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filteredCoupons = this.coupons.filter(coupon => 
      coupon.code.toLowerCase().includes(filterValue)
    );
    this.dataSource.data = this.filteredCoupons;
  }

  filterByStatus(status: 'all' | 'active' | 'inactive' | 'expired'): void {
    this.statusFilter = status;
    
    if (status === 'all') {
      this.filteredCoupons = this.coupons;
    } else if (status === 'active') {
      this.filteredCoupons = this.coupons.filter(coupon => 
        coupon.isActive && !this.isExpired(coupon)
      );
    } else if (status === 'inactive') {
      this.filteredCoupons = this.coupons.filter(coupon => 
        !coupon.isActive
      );
    } else if (status === 'expired') {
      this.filteredCoupons = this.coupons.filter(coupon => 
        this.isExpired(coupon)
      );
    }
    
    this.dataSource.data = this.filteredCoupons;
  }

  applyFilters(): void {
    this.filterByStatus(this.statusFilter);
  }

  isExpired(coupon: DiscountCoupon): boolean {
    return new Date(coupon.expiryDate) < new Date();
  }

  openCouponForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.selectedCoupon = null;
    this.couponForm.reset({
      code: '',
      discountAmount: 0,
      discountPercentage: 0,
      minimumOrderAmount: 0,
      maxUsage: null,
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true
    });
  }

  editCoupon(coupon: DiscountCoupon): void {
    this.showForm = true;
    this.isEditing = true;
    this.selectedCoupon = coupon;
    
    this.couponForm.setValue({
      code: coupon.code,
      discountAmount: coupon.discountAmount,
      discountPercentage: coupon.discountPercentage,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maxUsage: coupon.maxUsage,
      expiryDate: new Date(coupon.expiryDate),
      isActive: coupon.isActive
    });
  }

  validateCoupon(coupon: any): boolean {
    // Check if code is empty
    if (!coupon.code || coupon.code.trim() === '') {
      this.snackBar.open('Coupon code cannot be empty', 'Close', { duration: 3000 });
      return false;
    }
    
    // Check if at least one discount type is set
    if (coupon.discountAmount <= 0 && coupon.discountPercentage <= 0) {
      this.snackBar.open('Either discount amount or percentage must be greater than 0', 'Close', { duration: 3000 });
      return false;
    }
    
    return true;
  }

  saveCoupon(): void {
    if (this.couponForm.invalid) return;
    
    const formData = this.couponForm.value;
    this.isLoading = true;
    
    if (this.isEditing && this.selectedCoupon) {
      // Update existing coupon
      this.discountService.updateCoupon(this.selectedCoupon.id!, formData).subscribe({
        next: () => {
          const index = this.coupons.findIndex(c => c.id === this.selectedCoupon!.id);
          if (index !== -1) {
            this.coupons[index] = {
              ...this.coupons[index],
              ...formData,
              updatedAt: new Date()
            };
          }
          
          this.applyFilters();
          this.snackBar.open('Coupon updated successfully', 'Close', { duration: 3000 });
          this.cancelForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating coupon:', error);
          this.snackBar.open('Failed to update coupon', 'Close', { duration: 3000 });
          this.isLoading = false;
          
          // Update locally if API fails
          const index = this.coupons.findIndex(c => c.id === this.selectedCoupon!.id);
          if (index !== -1) {
            this.coupons[index] = {
              ...this.coupons[index],
              ...formData,
              updatedAt: new Date()
            };
          }
          
          this.applyFilters();
          this.cancelForm();
        }
      });
    } else {
      // Create new coupon
      formData.currentUsage = 0;
      formData.createdAt = new Date();
      
      this.discountService.createCoupon(formData).subscribe({
        next: (newCouponId: string) => {
          const newCoupon: DiscountCoupon = {
            id: newCouponId,
            ...formData,
            currentUsage: 0,
            createdAt: new Date()
          };
          this.coupons.push(newCoupon);
          this.applyFilters();
          this.snackBar.open('Coupon created successfully', 'Close', { duration: 3000 });
          this.cancelForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating coupon:', error);
          this.snackBar.open('Failed to create coupon', 'Close', { duration: 3000 });
          this.isLoading = false;
          
          // Create locally if API fails
          const newCoupon: DiscountCoupon = {
            id: Date.now().toString(), // Mock ID generation
            ...formData,
            currentUsage: 0,
            createdAt: new Date()
          };
          this.coupons.push(newCoupon);
          this.applyFilters();
          this.cancelForm();
        }
      });
    }
  }

  toggleStatus(coupon: DiscountCoupon): void {
    this.isLoading = true;
    
    const updatedCoupon = { ...coupon, isActive: !coupon.isActive };
    
    this.discountService.updateCoupon(coupon.id!, updatedCoupon).subscribe({
      next: () => {
        const index = this.coupons.findIndex(c => c.id === coupon.id);
        if (index !== -1) {
          this.coupons[index].isActive = !coupon.isActive;
          coupon.isActive = !coupon.isActive;
        }
        
        this.applyFilters();
        this.snackBar.open(
          `Coupon ${updatedCoupon.isActive ? 'activated' : 'deactivated'} successfully`, 
          'Close', 
          { duration: 3000 }
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error toggling coupon status:', error);
        this.snackBar.open('Failed to update coupon status', 'Close', { duration: 3000 });
        this.isLoading = false;
        
        // Update locally if API fails
        const index = this.coupons.findIndex(c => c.id === coupon.id);
        if (index !== -1) {
          this.coupons[index].isActive = !coupon.isActive;
          coupon.isActive = !coupon.isActive;
        }
        this.applyFilters();
      }
    });
  }

  deleteCoupon(coupon: DiscountCoupon): void {
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`)) {
      this.isLoading = true;
      
      this.discountService.deleteCoupon(coupon.id!).subscribe({
        next: () => {
          this.coupons = this.coupons.filter(c => c.id !== coupon.id);
          this.applyFilters();
          
          this.snackBar.open('Coupon deleted successfully', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting coupon:', error);
          this.snackBar.open('Failed to delete coupon', 'Close', { duration: 3000 });
          this.isLoading = false;
          
          // Delete locally if API fails
          this.coupons = this.coupons.filter(c => c.id !== coupon.id);
          this.applyFilters();
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedCoupon = null;
  }

  updateCoupon(coupon: DiscountCoupon): void {
    if (this.validateCoupon(coupon)) {
      const updatedCoupon = { ...coupon };
      this.discountService.updateCoupon(coupon.id!, updatedCoupon)
        .subscribe({
          next: () => {
            const index = this.coupons.findIndex(c => c.id === coupon.id);
            if (index !== -1) {
              this.coupons[index] = updatedCoupon;
            }
            this.snackBar.open('Coupon updated successfully', 'Close', { duration: 3000 });
          },
          error: (error: Error) => {
            console.error('Error updating coupon:', error);
            this.snackBar.open('Error updating coupon', 'Close', { duration: 3000 });
          }
        });
    }
  }

  addCoupon(couponData: any): void {
    if (this.validateCoupon(couponData)) {
      this.discountService.createCoupon(couponData)
        .subscribe({
          next: (newCouponId: string) => {
            const newCoupon: DiscountCoupon = {
              id: newCouponId,
              ...couponData
            };
            this.coupons.push(newCoupon);
            this.snackBar.open('Coupon added successfully', 'Close', { duration: 3000 });
          },
          error: (error: Error) => {
            console.error('Error adding coupon:', error);
            this.snackBar.open('Error adding coupon', 'Close', { duration: 3000 });
          }
        });
    }
  }
} 