# Video Converter Application

## Overview

A web-based video converter application that allows users to select folders containing legacy video formats (.flv, .rmvb, .wmv, .avi, .mpg, .mpeg, .asf) and batch convert them to modern MP4 format. The application features a dark-themed premium desktop app aesthetic with real-time progress tracking, video preview capabilities, and job management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state with automatic polling for active jobs
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth list transitions and UI effects
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared)

The frontend is a single-page application with a folder scanning interface. Users select folders via the browser's directory picker API, files are filtered by extension client-side, then uploaded individually to create conversion jobs. The UI polls every 2 seconds when jobs are active to show real-time progress.

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under /api prefix
- **File Handling**: Multer for multipart file uploads with disk storage
- **Video Processing**: fluent-ffmpeg wrapper for FFmpeg CLI (converts to H.264/AAC MP4)

The server handles file uploads to an `uploads/` directory, creates database records for each job, then processes conversions asynchronously. Converted files are saved to `public/converted/` for static serving and preview.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with `db:push` command
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

The `conversion_jobs` table tracks: id, originalName, mimeType, size, status (pending/processing/completed/failed), progress (0-100), outputUrl, error message, and createdAt timestamp.

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` directory are used by both client and server
- **Type-Safe API**: Route contracts defined with Zod schemas in `shared/routes.ts`
- **Storage Interface**: `IStorage` interface in server allows swapping implementations
- **Async Processing**: Video conversions run asynchronously after job creation, with progress updates via database polling

## External Dependencies

### Core Services
- **PostgreSQL Database**: Required via DATABASE_URL environment variable
- **FFmpeg**: System dependency for video transcoding (must be installed on host)

### Key NPM Packages
- **drizzle-orm/drizzle-kit**: Database ORM and migration tooling
- **fluent-ffmpeg**: Node.js FFmpeg wrapper for video processing
- **multer**: Express middleware for handling file uploads
- **@tanstack/react-query**: Data fetching and caching
- **shadcn/ui components**: Full suite of Radix-based UI primitives
- **framer-motion**: Animation library for React

### Static File Serving
- Development: Vite dev server serves client assets with HMR
- Production: Express serves built assets from `dist/public`
- Converted videos: Served statically from `public/converted/` directory