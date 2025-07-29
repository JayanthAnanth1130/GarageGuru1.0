# Garage Management System

## Overview

This is a multi-tenant garage management system built with React (client), Express.js (server), and PostgreSQL (using Drizzle ORM). The system allows garage owners to manage customers, spare parts inventory, job cards, and invoices while providing different access levels for garage admins, mechanics, and super admins.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React Context for auth and theme
- **Build Tool**: Vite with hot reload support

### Backend Architecture
- **Technology**: Express.js with TypeScript
- **API Design**: RESTful API with role-based access control
- **Database ORM**: Drizzle ORM with type-safe schema definitions
- **Authentication**: JWT-based authentication with role-based permissions
- **Session Management**: Express sessions with PostgreSQL store

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation pattern for mobile UX
- PWA-ready with mobile-specific interactions
- Touch-friendly interface components

## Key Components

### Authentication & Authorization
- **Multi-role system**: Super admin, garage admin, mechanic staff
- **Tenant isolation**: Each garage operates independently
- **JWT tokens**: Secure authentication with refresh capabilities
- **Role-based routing**: Different access levels for different user types

### Database Schema
- **Garages**: Multi-tenant architecture with garage isolation
- **Users**: Role-based user management per garage
- **Customers**: Customer management with service history
- **Spare Parts**: Inventory management with low-stock alerts
- **Job Cards**: Service tracking from pending to completed
- **Invoices**: Billing system with PDF generation

### Core Features
- **Job Card Management**: Create, track, and complete service requests
- **Inventory Control**: Spare parts management with barcode scanning
- **Customer Database**: Comprehensive customer profiles and history
- **Invoice Generation**: PDF creation with WhatsApp integration
- **Sales Analytics**: Revenue tracking and reporting (admin only)

## Data Flow

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials and returns JWT token
3. Token stored in localStorage for subsequent requests
4. Protected routes verify token and user permissions
5. Garage-specific data filtered by user's garage association

### Service Management Flow
1. Create job card with customer and service details
2. Add spare parts from inventory (with quantity tracking)
3. Mark service as completed
4. Generate invoice with labor and parts costs
5. Send invoice PDF via WhatsApp to customer
6. Update customer service history and garage analytics

### Inventory Management Flow
1. Add spare parts with barcode scanning capability
2. Track quantity changes during service jobs
3. Monitor low-stock alerts based on thresholds
4. Update pricing and availability in real-time

## External Dependencies

### Database
- **PostgreSQL**: Primary database with connection pooling
- **Neon Database**: Serverless PostgreSQL provider via @neondatabase/serverless
- **Drizzle Kit**: Database migrations and schema management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **Class Variance Authority**: Component variant management

### Authentication & Security
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **connect-pg-simple**: PostgreSQL session store

### PDF & Communication
- **jsPDF**: Client-side PDF generation
- **WhatsApp Business API**: Message sending integration
- **Cloudinary**: Image and file storage (configured for future use)

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling
- **Replit**: Development environment integration

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express API
- **Hot Reload**: Real-time updates during development
- **Environment Variables**: DATABASE_URL and JWT_SECRET required

### Production Build
- **Client Build**: Vite builds React app to static files
- **Server Build**: ESBuild bundles Express server
- **Asset Serving**: Express serves built client files
- **Database**: PostgreSQL with connection pooling

### Environment Configuration
- **Database**: Requires PostgreSQL connection string
- **Authentication**: JWT secret for token signing
- **File Storage**: Cloudinary configuration for media uploads
- **Mobile Optimization**: Service worker for PWA capabilities

### Scaling Considerations
- **Multi-tenant**: Database designed for horizontal scaling
- **Stateless API**: JWT-based auth for load balancing
- **Caching**: TanStack Query provides client-side caching
- **Database Indexing**: Optimized queries with garage-based filtering