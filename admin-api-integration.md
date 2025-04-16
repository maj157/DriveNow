# Admin API Integration

## Overview

This update migrates the admin components from direct Firestore database calls to using proper REST API endpoints through an AdminService. This solves several issues:

1. Prevents direct Firestore calls that expose your database structure
2. Improves security by enforcing server-side authentication and authorization
3. Reduces client-side code complexity
4. Centralizes admin operations into a dedicated service

## Changes Made

### 1. New Admin Service

Created a new service `AdminService` that provides methods for all admin operations:

- User management: getAllUsers(), updateUserStatus()
- Review management: getAllReviews(), moderateReview(), resetReviewModeration()
- Booking management: getAllBookings(), updateBookingStatus()
- Dashboard: getDashboardStats()

### 2. Updated Admin Components

Modified all admin components to use the new AdminService:

- **UserManagementComponent**

  - Now uses adminService.getAllUsers() instead of firebaseService.getUsers()
  - Uses adminService.updateUserStatus() for status changes

- **ReviewModerationComponent**

  - Now uses adminService.getAllReviews() instead of firebaseService.getReviews()
  - Uses adminService.moderateReview() and adminService.resetReviewModeration()

- **BookingManagementComponent**
  - Now uses adminService.getAllBookings() instead of firebaseService.getBookings()
  - Uses adminService.updateBookingStatus() for status updates

### 3. API Endpoint Design

All admin API endpoints follow this structure:

- Base URL: `${environment.apiUrl}/admin`
- Users: `/admin/users`
- Reviews: `/admin/reviews`
- Bookings: `/admin/bookings`
- Dashboard: `/admin/dashboard/stats`

## Backend Requirements

For this integration to work, the backend needs to implement these API endpoints with proper JWT authentication and admin role verification.

## Testing Instructions

1. Start the Angular development server
2. Navigate to admin pages:
   - http://localhost:4200/admin/users
   - http://localhost:4200/admin/reviews
   - http://localhost:4200/admin/bookings
3. Verify that API calls are being made to the backend endpoints instead of direct Firestore calls
4. Check browser console for logging messages that confirm API usage

## Troubleshooting

If admin pages show "Unauthorized" errors:

1. Ensure your backend API is running
2. Verify that your login provides a valid JWT token with admin permissions
3. Check that the API endpoints are correctly implemented on the backend
