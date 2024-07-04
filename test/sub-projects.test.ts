import { javascript } from "projen";
import {
  synthProjectSnapshot,
  createSubProject,
  createJSIISubProject,
  createProject,
  parseYaml,
} from "./util";
import { INVALID_PACKAGE_MANAGER_ERROR } from "../src";

describe("TurborepoProject", () => {
  it("should add pnpm-workspace.yaml file", () => {
    expect.assertions(1);

    const project = createProject();

    const subProjectDir = "packages/baz";
    createSubProject({
      parent: project,
      outdir: subProjectDir,
    });

    const synth = synthProjectSnapshot(project);

    expect(parseYaml(synth["pnpm-workspace.yaml"]).packages).toStrictEqual([
      "packages/baz",
    ]);
  });

  it("should add TypeScript path mappings when turned on", () => {
    expect.assertions(2);

    const project = createProject({
      pathMapping: true,
    });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      parent: project,
      outdir: subProjectBarDir,
      srcdir: "pages",
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      parent: project,
      outdir: subProjectBazDir,
      deps: [subProjectBar.package.packageName],
    });

    const synth = synthProjectSnapshot(project);

    expect(synth["packages/baz/tsconfig.json"].compilerOptions.baseUrl).toBe(
      ".",
    );
    expect(
      synth["packages/baz/tsconfig.json"].compilerOptions.paths,
    ).toStrictEqual({
      [subProjectBar.package.packageName]: ["../bar/pages"],
    });
  });

  it("should add VS Code settings", () => {
    expect.assertions(1);

    const project = createProject({
      name: "@foo/root",
      vscodeMultiRootWorkspaces: true,
    });

    const subProjectDir = "packages/baz";
    createSubProject({
      name: "@foo/sub",
      parent: project,
      outdir: subProjectDir,
    });

    const synth = synthProjectSnapshot(project);

    expect(JSON.parse(synth["@foo-root.code-workspace"])).toMatchSnapshot();
  });

  it("should set composite flag on the tsconfig", () => {
    // expect.assertions(3);

    const project = createProject({ projectReferences: true });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      parent: project,
      outdir: subProjectBarDir,
    });
    const subProjectFooDir = "packages/foo";
    const subProjectFoo = createJSIISubProject({
      parent: project,
      outdir: subProjectFooDir,
      deps: [subProjectBar.package.packageName],
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      parent: project,
      outdir: subProjectBazDir,
      deps: [
        subProjectFoo.package.packageName,
        subProjectBar.package.packageName,
      ],
    });

    const synth = synthProjectSnapshot(project);

    expect(synth["tsconfig.json"].compilerOptions.composite).toBe(true);
    expect(
      synth[`${subProjectBarDir}/tsconfig.json`].compilerOptions.composite,
    ).toBe(true);
    expect(
      synth[`${subProjectFooDir}/tsconfig.dev.json`].compilerOptions.composite,
    ).toBe(true);
  });

  it("should add TypeScript project references when turned on", () => {
    expect.assertions(1);

    const project = createProject({
      projectReferences: true,
    });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      parent: project,
      outdir: subProjectBarDir,
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      parent: project,
      outdir: subProjectBazDir,
      deps: [subProjectBar.package.packageName],
    });

    const synth = synthProjectSnapshot(project);

    expect(synth["packages/baz/tsconfig.json"].references).toStrictEqual([
      {
        path: "../bar",
      },
    ]);
  });

  it("should add moduleNameMapper for jest", () => {
    expect.assertions(1);

    const project = createProject({
      jestModuleNameMapper: true,
    });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      parent: project,
      outdir: subProjectBarDir,
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      parent: project,
      outdir: subProjectBazDir,
      deps: [subProjectBar.package.packageName],
    });

    const synth = synthProjectSnapshot(project);

    expect(
      synth["packages/baz/package.json"].jest.moduleNameMapper,
    ).toStrictEqual({
      [`^${subProjectBar.name}$`]: "<rootDir>/../bar/src",
    });
  });

  it("should have no build job in root for when parallelWorkflows are on", () => {
    expect.assertions(1);

    const project = createProject({
      parallelWorkflows: true,
      mutableBuild: false,
    });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      name: "bar",
      parent: project,
      outdir: subProjectBarDir,
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      name: "baz",
      parent: project,
      outdir: subProjectBazDir,
      deps: [subProjectBar.package.packageName],
    });

    const synth = synthProjectSnapshot(project);

    expect(synth[".github/workflows/build.yml"]).toMatchSnapshot();
  });

  it("should have one build job in root for when parallelWorkflows are off", () => {
    expect.assertions(1);

    const project = createProject({
      parallelWorkflows: false,
      mutableBuild: false,
    });
    const synth = synthProjectSnapshot(project);

    expect(synth[".github/workflows/build.yml"]).toMatchSnapshot();
  });

  it("should not clobber basePath", () => {
    const baseUrl = "src";

    const project = createProject({
      pathMapping: true,
    });

    const subProjectBarDir = "packages/bar";
    const subProjectBar = createSubProject({
      name: "bar",
      parent: project,
      outdir: subProjectBarDir,
      srcdir: "pages",
    });

    const subProjectBazDir = "packages/baz";
    createSubProject({
      name: "baz",
      parent: project,
      outdir: subProjectBazDir,
      deps: [subProjectBar.package.packageName],
      tsconfig: {
        compilerOptions: {
          baseUrl,
        },
      },
    });

    const synth = synthProjectSnapshot(project);

    expect(synth["packages/baz/tsconfig.json"].compilerOptions.baseUrl).toBe(
      baseUrl,
    );
    expect(
      synth["packages/baz/tsconfig.json"].compilerOptions.paths.bar,
    ).toStrictEqual(["../../bar/pages"]);
  });

  it("should throw error if any of the sub-projects package manager differs from root package manager", () => {
    expect.assertions(1);

    const project = createProject();
    const subProjectBarDir = "packages/bar";
    createSubProject({
      parent: project,
      outdir: subProjectBarDir,
      packageManager: javascript.NodePackageManager.YARN_CLASSIC,
    });

    expect(() => synthProjectSnapshot(project)).toThrowError(
      INVALID_PACKAGE_MANAGER_ERROR,
    );
  });
});
