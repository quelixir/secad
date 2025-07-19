# secad

secad (a corporate **sec**reterial and **ad**ministrative helper) is designed to be a comprehensive web application for managing backend corporate compliance.

It is designed to help manage the following across multiple entities:

- **Securities**: Manage different classes of securities (shares, units, etc.)
- **Transactions**: Handle various transaction types including:
  - Issue of new securities
  - Transfers between members
  - Redemptions and cancellations
  - Capital calls and returns
- **Resolutions**: Record and track corporate resolutions and decisions
- **Associates**: Manage relationships between entities and their associates


## Getting Started

### Environment Setup

Create a `.env` file in the root directory and populate it with the following variables:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/secad"
```

Replace the connection string with your actual PostgreSQL database credentials.

### Running the Application

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file in this repository.
