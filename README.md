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

```bash
$ git clone git@github.com:quelixir/secad # or https://github.com/quelixir/secad
$ cd secad
$ yarn install
```

Next, create a `.env` file in the root directory. You can copy the `.env.example` file as a starting point:

```bash
$ cp .env.example .env
```

Then edit the `.env` file and replace the placeholder values with your actual configuration.

Now, you run the development server:

```bash
$ yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start using secad.

## Testing

This project uses Jest and React Testing Library for testing. To run tests:

```bash
$ yarn test
# or
$ yarn test:watch
# or
$ yarn test:coverage
```

Tests are automatically run on pull requests and pushes to main/develop branches via GitHub Actions, with coverage reports uploaded to Codecov.

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent commit messages and enable automatic changelog generation.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file in this repository.
