# NPM Package Template

A modern template for creating and publishing NPM packages using TypeScript, TSup, and Changesets.

## Features

- 📦 TypeScript configuration with strict settings
- 🛠️ TSup for bundling (outputs CommonJS and ESM)
- 🔄 Automated versioning and publishing with Changesets
- 🚀 GitHub Actions for CI/CD
- ✨ Type definitions included
- 📝 Automated changelog generation

## Getting Started

### Using this template

1. Click the "Use this template" button at the top of this repository
2. Clone your new repository
3. Install dependencies:
```bash
npm install
```

### Development

1. Make your changes in the `src` directory
2. Build the package:
```bash
npm run build
```
3. Lint your code:
```bash
npm run lint
```

### Making Changes

When you want to make changes to the package:

1. Create a new branch
2. Make your changes
3. Add a changeset:
```bash
npm run changeset
```
4. Commit and push your changes
5. Create a Pull Request

## Project Structure

```
.
├── .changeset/
├── .github/
│   └── workflows/
│       ├── main.yaml
│       └── publish.yaml
├── src/
│   └── index.ts
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm run build` - Builds the package using TSup
- `npm run lint` - Runs TypeScript type checking
- `npm run changeset` - Creates a new changeset
- `npm run version` - Applies changesets to create a new version
- `npm run release` - Publishes the package to NPM

## GitHub Actions Workflows

### Main Workflow (`main.yaml`)

```yaml
name: CI
on:
  push:
    branches:
      - "**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x
          cache: "npm"
      
      - name: Install Dependencies
        run: npm install --frozen-lockfile
      
      - name: Lint and Build
        run: npm run lint && npm run build
```

### Publish Workflow (`publish.yaml`)

```yaml
name: Publish

on:
  workflow_run:
    workflows: [CI]
    branches: [main]
    types: [completed]

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write

jobs:
  publish:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x
          cache: "npm"

      - name: Install Dependencies
        run: npm install --frozen-lockfile

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Configuration Files

### package.json

```json
{
  "name": "pkg-template",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/codebygio/pkg-template.git"
  },
  "version": "0.0.1",
  "description": "A template for creating npm packages",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "release": "npm run build && changeset publish",
    "lint": "tsc"
  },
  "keywords": [
    "npm",
    "package",
    "template"
  ],
  "author": "Giovani Rodriguez",
  "license": "MIT",
  "devDependencies": {
    "@changesets/cli": "^2.27.9",
    "tsup": "^8.3.5",
    "typescript": "^5.6.3"
  }
}
```

### tsconfig.json

```json
{
    "compilerOptions": {
        /* Base Options: */
        "esModuleInterop": true,
        "skipLibCheck": true,
        "target": "es2022",
        "verbatimModuleSyntax": true,
        "allowJs": true,
        "resolveJsonModule": true,
        "moduleDetection": "force",
        /* Strictness */
        "strict": true,
        "noUncheckedIndexedAccess": true,
        /* If NOT transpiling with TypeScript: */
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "noEmit": true,
        /* If your code runs in the DOM: */
        "lib": [
            "es2022",
            "dom",
            "dom.iterable"
        ],
    }
}
```

### .gitignore

```
node_modules/
dist/
.DS_Store
```

## Publishing

1. Make sure you have an NPM account and are logged in:
```bash
npm login
```

2. Add an NPM_TOKEN secret to your GitHub repository:
   - Generate a token on NPM's website
   - Add it to your repository's secrets as `NPM_TOKEN`

3. When you're ready to publish:
   - Merge your changes to main
   - The GitHub Action will automatically create a release PR
   - Merge the release PR to publish to NPM

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add a changeset describing your changes
4. Commit your changes
5. Push to the branch
6. Open a Pull Request

---

Don't forget to customize this README with your package's specific details!