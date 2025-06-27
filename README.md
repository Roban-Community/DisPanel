# Discord Bot Management Panel

## Overview

This is a full-stack Discord bot management panel built with React (frontend) and Express.js (backend). The application allows users to authenticate Discord bots via token, monitor bot statistics, manage guild memberships, send messages, and interact with a live chat interface. It features a modern UI with shadcn/ui components and real-time updates via WebSocket connections.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for development and building
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Discord-themed color palette
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket client for live updates
- **TypeScript**: Full TypeScript support with path mapping

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Discord Integration**: Discord.js library for bot management
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Real-time Communication**: WebSocket server for live updates
- **Session Management**: Express sessions with PostgreSQL store
- **Development Tools**: tsx for TypeScript execution, ESBuild for production builds

## Key Components

### Authentication System
- Discord bot token-based authentication
- Session-based state management
- Automatic token validation and bot information retrieval
- Secure token storage with optional remember functionality

### Bot Management
- Real-time bot statistics monitoring (ping, uptime, memory usage)
- Guild management with join/leave capabilities
- Message sending interface for channels and direct messages
- Status management (online, idle, do not disturb, invisible)
- Bot information display with ID copying functionality

### Real-time Features
- WebSocket connection for live updates
- Real-time statistics updates
- Live chat interface for bot interactions
- Console logging with different message types
- Guild synchronization updates

### UI/UX Components
- Responsive sidebar navigation
- Dashboard with statistics cards
- Message panel for sending messages to channels/users
- Guild management interface with invite generation
- Live chat interface
- Console for debugging and command execution
- Theme switching (light/dark mode)

## Data Flow

### Authentication Flow
1. User enters Discord bot token
2. Backend validates token with Discord API
3. Bot information is stored in database
4. Session is created for authenticated user
5. Client receives bot data and updates UI state

### Real-time Updates Flow
1. WebSocket connection established on successful authentication
2. Backend monitors Discord events and bot statistics
3. Updates are broadcast to connected clients
4. Frontend receives updates and refreshes UI components
5. Statistics, guild data, and messages are updated in real-time

### Message Sending Flow
1. User composes message in message panel
2. Message is sent to backend API endpoint
3. Backend uses Discord.js to send message via bot
4. Result is stored in database and returned to client
5. Success/error feedback is displayed to user

## External Dependencies

### Core Dependencies
- **Discord.js**: Discord API wrapper for bot functionality
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **TanStack Query**: Server state management
- **shadcn/ui**: Modern React component library
- **Tailwind CSS**: Utility-first CSS framework

### Development Dependencies
- **Vite**: Fast development server and build tool
- **tsx**: TypeScript execution engine
- **ESBuild**: Fast JavaScript bundler
- **Drizzle Kit**: Database migration and schema management

### Database Schema
- **bot_sessions**: Store authenticated bot information
- **bot_messages**: Track sent messages and their status
- **bot_guilds**: Manage guild memberships and metadata
- **bot_stats**: Record bot performance statistics over time

## Deployment Strategy

### Development Environment
- Uses Vite dev server for frontend hot reloading
- tsx for backend TypeScript execution
- PostgreSQL database with connection pooling
- WebSocket server integrated with HTTP server

### Production Build
1. Frontend built with Vite to static assets
2. Backend compiled with ESBuild to single JavaScript file
3. Static assets served from Express server
4. Database migrations handled via Drizzle Kit
5. Environment variables for configuration

## Changelog

Changelog:
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
