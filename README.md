# Align Logic - Driver Job Selection System

## Overview

The Job Selection System is a web-based platform that enables organizations to manage driver job assignments efficiently. This application is designed for online hosting with secure multi-tenant isolation.

## Features

- **Driver Portal**: Allows drivers to submit job preferences and check assignments
- **Admin Portal**: Provides site administrators with tools to manage jobs, drivers, and assignments
- **Master Admin Panel**: System-wide administration (accessible only from UPS > JACFL)
- **Multi-Tenant Architecture**: Complete isolation between different companies and their sites
- **Assignment Engine**: Sophisticated job allocation based on preferences, seniority, and rules

## Access Information

### Driver Portal
- URL: https://align-logic.com
- Credentials: Individual driver ID and password

### Admin Portal 
- URL: https://align-logic.com/admin
- Credentials: 
  - UPS sites: Site-specific admin credentials
  - Contact system administrator for access if needed

### Master Admin Panel
- URL: https://align-logic.com/admin
- Company: UPS
- Site: Jacksonville, FL
- Credentials: Contact system administrator for access

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management**: Zustand with persistence
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library

## Deployment

This application is deployed on Vercel and accessible at https://align-logic.com. The application is built with standard web technologies using a modern React stack optimized for production use.

## Important Notes

- **UPS > JACFL Required**: The UPS Jacksonville, FL site must always exist in the system for Master Admin access
- **Tenant Isolation**: Companies can only see their own data, never any other company's information
- **Default Credentials**: Automated setup provides appropriate default admin credentials based on company

## Support

For technical support or questions regarding this application, please contact the system administrator.