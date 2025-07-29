---
sidebar_position: 1
---

# Getting Started with secad

**secad** (a corporate **sec**reterial and **ad**ministrative helper) is designed to be a comprehensive web application for managing backend corporate compliance.

## What secad does

secad helps manage the following across multiple entities:

- **Securities**: Manage different classes of securities (shares, units, etc.)
- **Transactions**: Handle various transaction types including:
  - Issue of new securities
  - Transfers between members
  - Redemptions and cancellations
  - Capital calls and returns
- **Resolutions**: Record and track corporate resolutions and decisions
- **Associates**: Manage relationships between entities and their associates
- **Certificates**: Generate professional PDF certificates on-demand

## Quick Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) version 20.0 or above
- [PostgreSQL](https://www.postgresql.org/download/) database
- [Yarn](https://yarnpkg.com/) package manager

### Installation

1. **Clone the repository:**
```bash
git clone git@github.com:quelixir/secad.git
cd secad
```

2. **Install dependencies:**
```bash
yarn install
```

3. **Set up environment:**
```bash
cp .env.example .env
```
Then edit the `.env` file and replace the placeholder values with your actual configuration.

4. **Set up the database:**
```bash
npx prisma migrate dev --name init
```

5. **Seed with demo data:**
```bash
yarn seed:demo
```

6. **Start the development server:**
```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Tech Stack

secad is built with modern web technologies:

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **PDF Generation**: Puppeteer
- **Testing**: Jest, React Testing Library

## Testing

Run the test suite:

```bash
yarn test
# or
yarn test:watch
# or
yarn test:coverage
```

## License

This project is [licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**](https://github.com/quelixir/secad/blob/main/LICENSE).
