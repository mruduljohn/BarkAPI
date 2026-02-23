export function getGitHubActionsWorkflow(specPath: string, baseUrlVar: string): string {
  return `name: BarkAPI Contract Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  contract-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install BarkAPI
        run: npm install -g barkapi

      - name: Check API contracts
        run: barkapi check --spec ${specPath} --base-url \${{ ${baseUrlVar} }}
`;
}
