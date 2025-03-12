# Course Management System Web App

A modern, responsive web application for managing educational courses, built with React, TypeScript, and Supabase. This system supports multiple user roles (Admin, Instructor, Student) with role-specific functionalities.

## 🚀 Features

### User Management
- Multi-role authentication (Admin, Instructor, Student)
- Secure signup and login
- Profile management
- Role-based access control

### Course Management
- Course creation and editing (Instructors)
- Course enrollment (Students)
- Course capacity management
- Department-wise course organization

### Dashboard Views
- **Student Dashboard**: View enrolled courses, manage enrollments
- **Instructor Dashboard**: Manage courses, view students
- **Admin Dashboard**: System-wide management capabilities

## 🛠️ Tech Stack

- **Frontend**:
  - React 18.x with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - React Router DOM for routing
  - Zustand for state management
  - Zod for form validation
  - React Hot Toast for notifications
  - Lucide React for icons

- **Backend**:
  - Supabase for:
    - Authentication
    - Database
    - Row Level Security (RLS)
    - Real-time subscriptions

## 📁 Project Structure

```
Course-Management-System-Web-App/
├── src/
│   ├── components/           # React components
│   │   ├── Layout.tsx       # Main layout component
│   │   ├── AdminDashboard.tsx
│   │   ├── InstructorDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── ProfileSettings.tsx
│   │   ├── CoursesTab.tsx
│   │   ├── StudentsTab.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Login.tsx       # Authentication page
│   │   └── Dashboard.tsx   # Main dashboard
│   ├── store/              # State management
│   │   └── authStore.ts    # Authentication state
│   ├── lib/                # Utilities
│   │   ├── supabase.ts    # Supabase client
│   │   └── validation.ts   # Zod schemas
│   ├── types.ts            # TypeScript types
│   ├── App.tsx             # Root component
│   └── main.tsx           # Entry point
├── supabase/
│   └── migrations/         # Database migrations
├── public/                # Static assets
├── .env                   # Environment variables
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 🔧 Setup and Installation

1. **Prerequisites**
   ```bash
   # Install Node.js LTS version from
   https://nodejs.org/
   ```

2. **Clone and Install**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd course-management-system

   # Install dependencies
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - The migrations in `supabase/migrations/` will set up:
     - User profiles and authentication
     - Course management tables
     - Role-based security policies
     - Necessary functions and triggers

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Authentication

### Available Demo Accounts
```
Student:
- Email: demo.student@example.com
- Password: Demo@123

Instructor:
- Email: demo.instructor@example.com
- Password: Demo@123

Admin:
- Email: jacobtheracer@gmail.com
- Password: Admin@123
```

## 📚 Database Schema

### Core Tables
- `user_profiles`: Base user information
- `students`: Student-specific data
- `instructors`: Instructor information
- `courses`: Course details
- `enrollments`: Course enrollment records

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Secure function execution

## 🔄 State Management

Uses Zustand for state management with the following stores:
- `authStore`: Handles authentication state and user data
- Implements demo account functionality
- Manages user sessions and profile updates

## 🎨 UI Components

- Modern, responsive design using Tailwind CSS
- Role-specific dashboards
- Toast notifications for user feedback
- Form validation with error messages
- Loading states and animations

## 🛡️ Security Features

- Secure password requirements
- Role-based access control
- Protected routes
- Input validation
- SQL injection prevention
- Secure session management

## 📝 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Team for the amazing framework
- Supabase Team for the backend infrastructure
- TailwindCSS Team for the styling framework
- All contributors and users of this system
