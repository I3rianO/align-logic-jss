# This file is only for editing file nodes, do not break the structure

/src
├── assets/          # Static resources directory, storing static files like images and fonts
│
├── components/      # Components directory
│   ├── ui/         # Pre-installed shadcn/ui components, avoid modifying or rewriting unless necessary
│   │   └── data-grid.tsx # Excel-like grid component for bulk editing tabular data
│   ├── logo/       # Logo components for the JSS system
│   │   └── JssLogo.tsx # Logo component for the Job Selection System
│   ├── layout/     # Layout components
│   │   └── MainLayout.tsx # Main layout component with header and footer
│   ├── admin/      # Admin-specific components
│   │   └── excel-grid.css # Styling for Excel-like grid interface
│   └── pdf/        # PDF generation components
│       └── AssignmentsPdfDocument.tsx # Component for generating assignment PDF for driver lobby display
│
├── hooks/          # Custom Hooks directory
│   ├── use-mobile.ts # Pre-installed mobile detection Hook from shadcn (import { useIsMobile } from '@/hooks/use-mobile')
│   └── use-toast.ts  # Toast notification system hook for displaying toast messages (import { useToast } from '@/hooks/use-toast')
│
├── lib/            # Utility library directory
│   └── utils.ts    # Utility functions, including the cn function for merging Tailwind class names
│
├── pages/          # Page components directory, based on React Router structure
│   ├── HomePage.tsx # Home page component, serving as driver login portal with tabs for jobs and vacations
│   ├── DriverPreferencesPage.tsx # Driver job selection preferences page
│   ├── DriverVacationPreferencesPage.tsx # Driver vacation selection preferences page
│   ├── AdminPortalPage.tsx # Admin login portal page with unified login
│   ├── AdminDashboardPage.tsx # Admin dashboard page with tabs for both job and vacation management
│   ├── admin/      # Admin-specific pages
│   │   ├── EditDriversPage.tsx # Page for managing drivers with enhanced Excel-style grid
│   │   ├── EditJobsPage.tsx # Page for managing jobs with enhanced Excel-style grid
│   │   ├── ImportExportPage.tsx # Page for importing/exporting data
│   │   ├── LivePicksSnapshotPage.tsx # Page for viewing real-time job selection status
│   │   ├── FinalAssignmentsPage.tsx # Page for viewing and printing final job assignments
│   │   ├── ConflictResolutionPage.tsx # Legacy page for handling job assignment conflicts
│   │   ├── DisputeResolutionPage.tsx # Page for explaining job assignment disputes and resolutions
│   │   ├── StatisticsPage.tsx # Page for viewing system statistics and analytics
│   │   ├── ActivityLogPage.tsx # Page for viewing comprehensive driver activity logs
│   │   ├── SystemSettingsPage.tsx # Page for admin system settings (password, portal access, printing)
│   │   ├── EditVacationWeeksPage.tsx # Page for managing vacation weeks and slots
│   │   ├── LiveVacationPicksPage.tsx # Page for viewing real-time vacation selection status
│   │   └── FinalVacationAssignmentsPage.tsx # Page for managing final vacation assignments
│   └── NotFoundPage.tsx # 404 error page component, displays when users access non-existent routes
│
├── store/          # State management directory
│   ├── driverStore.ts # Zustand store for managing drivers, jobs, and job preferences
│   └── vacationStore.ts # Zustand store for managing vacation weeks, vacation preferences, and assignments
│
├── App.tsx         # Root component, with React Router routing system configured
│                   # All routes are defined here for the application
│
├── main.tsx        # Entry file, rendering the root component and mounting to the DOM
│
├── index.css       # Global styles file, containing Tailwind configuration and custom styles
│                   # Includes JSS-specific utility classes and theme colors
│                   # Includes Excel-grid styling for enhanced admin interfaces
│
└── tailwind.config.js  # Tailwind CSS v3 configuration file
                      # Contains theme customization, plugins, and content paths
                      # Includes shadcn/ui theme configuration 