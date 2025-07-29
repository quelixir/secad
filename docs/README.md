# SECAD Documentation

This folder contains the Docusaurus documentation site for SECAD.

## Development

### Prerequisites

- Node.js 20.0 or above
- Yarn package manager

### Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn start
```

The documentation site will be available at http://localhost:3000.

### Building for Production

To build the static site for production:

```bash
yarn build
```

The built files will be in the `build` directory.

### Serving the Production Build

To serve the production build locally:

```bash
yarn serve
```

## Project Structure

```
docs/
├── docs/           # Documentation markdown files
├── src/            # React components and pages
├── static/         # Static assets (images, etc.)
├── docusaurus.config.ts  # Docusaurus configuration
├── sidebars.ts     # Sidebar configuration
└── package.json    # Dependencies and scripts
```

## Adding Documentation

### New Pages

1. Create a new `.md` file in the `docs/docs/` directory
2. Add frontmatter with metadata:
```markdown
---
sidebar_position: 1
title: Your Page Title
---

# Your Page Title

Your content here...
```

### Categories

To organize pages into categories, create subdirectories in `docs/docs/` and add a `_category_.json` file:

```json
{
  "label": "Certificate System",
  "position": 2
}
```

### Homepage

The homepage is defined in `src/pages/index.tsx` and provides an overview of SECAD with links to key documentation sections.

## Configuration

- **docusaurus.config.ts**: Main configuration including site metadata, navigation, and theme settings
- **sidebars.ts**: Defines the documentation sidebar structure
- **src/pages/index.tsx**: Homepage component

## Deployment

The documentation can be deployed to GitHub Pages or any static hosting service using the built files from `yarn build`.

## Running from Root

From the project root, you can run:

```bash
yarn docs
```

This will start the documentation development server.
