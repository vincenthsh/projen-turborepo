import { javascript, cdk } from "projen";

const authorName = "Roman Filippov";
const authorAddress = "rf@romanfilippov.com";
// forked from https://github.com/moltar/projen-turborepo
const repository = "https://github.com/vincenthsh/projen-turborepo";

const project = new cdk.JsiiProject({
  defaultReleaseBranch: "master",
  name: "@vincenthsh/projen-turborepo",
  description: "Projen project type for Turborepo monorepo setup.",
  keywords: ["projen", "turborepo", "turbo", "monorepo", "typescript"],
  license: "MIT",
  repositoryUrl: repository,
  repository: repository,
  authorName,
  author: authorName,
  copyrightOwner: authorName,
  authorAddress: authorAddress,
  authorEmail: authorAddress,
  projenrcTs: true,
  packageManager: javascript.NodePackageManager.PNPM,
  bundledDeps: ["dotalias"],
  peerDeps: ["projen", "constructs@^10.3.0"],
  devDeps: ["projen@0.82.8", "yaml", "@types/yaml", "turbo@^2"],
  releaseToNpm: true,
  npmRegistryUrl: "https://npm.pkg.github.com",
  depsUpgrade: true,
  eslint: true,
  prettier: true,
  stale: false,

  jsiiVersion: "~5.4.0",
  typescriptVersion: "~5.4.0",
  pnpmVersion: "9",
  workflowNodeVersion: "20",

  // disable API.md for now
  docgen: false,
});
project.package.addEngine("node", ">=20.6.1");
project.package.addEngine("pnpm", ">=9.4.0");
project.gitignore.exclude(".env");
// bundled dependencies require hoisting
// https://pnpm.io/npmrc#node-linker
project.npmrc.addConfig("node-linker", "hoisted");

project.synth();
