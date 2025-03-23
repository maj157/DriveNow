# 🚗 DriveNow – Car Rental Website

## 📌 Project Overview
DriveNow is a web-based car rental platform that allows users to browse, filter, and book cars while managing reservations efficiently. The project is built using **Angular** for the frontend and **Node.js (Express)** for backend services, following the full specification of the CMPS278 Web Design & Programming course.

---

## 📅 Project Details
- **Course:** CMPS 278 – Web Design & Programming  
- **Due Date:** April 18, 2025  
- **Team Members:**
  - **Frontend Developer:** [Your Name]
  - **Backend Developer:** [Your Name]
  - **Full-Stack Developer:** [Your Name]

---

## 🛠️ Tech Stack

### **Frontend**
- Angular 16
- HTML, CSS, TypeScript
- Google Maps API (for location selection)

### **Backend**
- Node.js (Express.js)
- PostgreSQL / MySQL
- JWT for authentication
- RESTful API

### **Hosting & Deployment**
- **Frontend:** Vercel  
- **Backend:** AWS  
- **Database:** PostgreSQL or MySQL  

---

## 📂 Project Features

✔️ **User Authentication (Sign up, Log in, JWT)**  
✔️ **Car Reservation (Pickup/Drop Locations via Google Maps)**  
✔️ **Car Filtering (Seats, Transmission, Fuel Type, etc.)**  
✔️ **Additional Services (Chauffeur, Baby Seat, GPS, etc.)**  
✔️ **Checkout & Payment System (Discounts, Loyalty Points, etc.)**  
✔️ **User Reviews & Feedback System**  
✔️ **Live Chat with an Agent**  
✔️ **Statistical Insights (Popular Car, Average Rental Fee, etc.)**  
✔️ **Admin Dashboard (Manage Cars, Users, Bookings, Reviews)**  

---

## 📁 Frontend Structure – Angular (Located in `frontend/src/app/`)

### 📁 `core/` – Application logic, authentication, services, and route guards

- **`auth/`**
  - `login.component.ts` – Handles user login.
  - `signup.component.ts` – Handles user registration.
  - `auth.service.ts` – Manages authentication logic and token storage.

- **`guards/`**
  - `auth.guard.ts` – Restricts access to protected routes if the user is not logged in.

- **`services/`**
  - `auth.service.ts` – Communicates with backend for login/signup.
  - `car.service.ts` – Retrieves car group info, specs, filters.
  - `user.service.ts` – Retrieves user profile, invoices, points.
  - `reservation.service.ts` – Handles cart actions, extras, reservations.
  - `review.service.ts` – Manages reviews (post/fetch).
  - `chat.service.ts` – Manages user-agent chat logic.

- **`models/`**
  - Contains interfaces like `User.ts`, `Car.ts`, `Reservation.ts`, and `Review.ts` to define structured data.

---

### 📁 `shared/` – Reusable components, UI elements, pipes

- **`components/`**
  - `navbar` – Top site navigation
  - `footer` – Site footer with links/socials
  - `cart-sidebar` – Shows selected cars/services and price
  - `car-card` – Car image, specs, pricing
  - `group-card` – Displays car group info (e.g., SUV, Electric)
  - `review-card` – Star rating, profile image, and feedback
  - `map-selector` – Google Maps UI to select pickup/dropoff

- **`pipes/`**
  - `filter.pipe.ts` – Allows dynamic filtering of cars by user-chosen specs (e.g., 7 seats + electric)

---

### 📁 `pages/` – Major application pages

- `home/` – Main homepage:
  - Random car images from distinct groups
  - Random user reviews
  - Popular car and average rental price

- `about/` – Info about the company and team

- `contact/` – Contact form to send an email

- `feedback/` – Page to submit reviews and star ratings

- `checkout/` – Displays cart, allows applying discounts, choosing payment methods, and finalizing/cancelling/saving transaction

- `history/` – Shows user’s past bookings and invoices

- `chat/` – Chat with a live agent

---

### 📁 `vehicles/` – Car listings and grouping logic

- `groups/` – Shows available car categories and their common specs

- `gallery/` – Displays all individual cars with models, images, and pricing under each group

- `filter/` – Advanced filtering of cars based on fuel type, seats, gear type, etc.

---

### 📄 `app.routes.ts`
Houses all route definitions in one place. This includes:
```ts
{ path: 'login', component: LoginComponent }
{ path: 'reservation', canActivate: [AuthGuard], component: ReservationComponent }
```

---

### 📄 `app.module.ts`
The central Angular module that declares and imports:
- All components (from shared, core, pages)
- Angular modules (`FormsModule`, `HttpClientModule`, etc.)
- Services and guards

---

### 📄 `app.component.ts`
The root component of the Angular app. This usually contains:
- The app layout (header + router + footer)
- Shared components like navbar or sidebar

---

## 🧑‍💻 Developer Guidelines

- Use services for all API logic.
- Keep UI logic inside components.
- Use interfaces in `models/` for strong typing.
- Always protect private routes with `AuthGuard`.
- Use `cart-sidebar` to reflect current selections across the app.

---

## 🔐 Authentication & Authorization
- JWT stored securely in localStorage
- Guards used to protect checkout and history routes
- Backend verifies JWT on each protected API request

---

## 🧪 Testing & Validation
- Frontend form validation with Angular Validators
- Backend validation using middleware and DB constraints
- Unit tests can be written using Jasmine + Karma (optional)

---

## 📈 Statistical Features (Homepage)
- Show most rented car
- Show average daily rental fee
- Dynamically updated based on actual reservations

---

## 💰 Loyalty & Points System
- Every successful booking grants points
- Points can be redeemed at checkout for discounts
- Formula stored in backend, displayed on frontend

---

## 🧾 Invoice & Booking History
- Booking confirmation and invoices shown under `history/`
- Saved transactions are resumable later
- Users can cancel or finalize bookings at any time

---

## 💬 Reviews & Ratings
- Review component allows submitting feedback with stars
- Homepage shows 3 random reviews with pagination
- Reviews linked to user profiles (with photo and name)

---

## 📞 Contact & Chat
- Contact form triggers backend email route
- Real-time chat box UI for communicating with support (agent-side backend handles messages)

---

## 📌 Notes
- All functionality follows the project specs strictly.
- This README serves as both a project guide and team documentation.
