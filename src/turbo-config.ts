export enum TaskOutputLogsEnum {
  /**
   * 	Displays all logs
   */
  FULL = "full",
  /**
   * Only show the hashes of the tasks
   */
  HASH_ONLY = "hash-only",
  /**
   * Only show logs from cache misses
   */
  NEW_ONLY = "new-only",
  /**
   * Only show logs from task failures
   */
  ERRORS_ONLY = "errors-only",
  /**
   * Hides all task logs
   */
  NONE = "none",
}

export interface TurborepoTaskConfig {
  /**
   * The list of tasks that this task depends on.
   *
   * Prefixing a task in `dependsOn` with a `^` tells `turbo` that this pipeline task depends on the
   * package's topological dependencies completing the task with the `^` prefix first (e.g. "a
   * package's `build` tasks should only run once all of its `dependencies` and `devDependencies`
   * have completed their own `build` commands").
   *
   * Items in `dependsOn` without `^` prefix, express the relationships between tasks at the package
   * level (e.g. "a package's `test` and `lint` commands depend on `build` being completed first").
   */
  readonly dependsOn?: string[];

  /**
   * Defaults to `["dist/**", "build/**"]`. The set of glob patterns of a task's cacheable
   * filesystem outputs.
   *
   * Note: `turbo` automatically logs `stderr`/`stdout` to `.turbo/run-<task>.log`. This file is
   * _always_ treated as a cacheable artifact and never needs to be specified.
   *
   * Passing an empty array can be used to tell `turbo` that a task is a side-effect and thus
   * doesn't emit any filesystem artifacts (e.g. like a linter), but you still want to cache its
   * logs (and treat them like an artifact).
   *
   * @see https://turbo.build/repo/docs/reference/configuration#outputs
   */
  readonly outputs?: string[];

  /**
   * all files in the package that are checked into source control
   *
   * A list of file glob patterns relative to the package's `package.json` to consider when
   * determining if a package has changed. turbo.json is always considered an input.
   *
   * Because specifying an inputs key immediately opts out of the default behavior, you may
   * use the special string `$TURBO_DEFAULT$` within the inputs array to restore turbo's
   * default behavior. This allows you to tweak the default behavior for more granularity.
   *
   * @default []
   * @see https://turbo.build/repo/docs/reference/configuration#inputs
   */
  readonly inputs?: string[];

  /**
   * Whether or not to cache the task `outputs`.
   *
   * Setting `cache` to false is useful for daemon or long-running "watch" or development mode tasks
   * that you don't want to cache.
   *
   * @default true
   * @see https://turbo.build/repo/docs/reference/configuration#cache
   */
  readonly cache?: boolean;

  /**
   * Label a task as persistent to prevent other tasks from depending on long-running processes.
   * Persistent tasks are made interactive by default.
   *
   * Because a long-running process won't exit, tasks that would depend on it would never run.
   * Once you've labeled the task as persistent, turbo will throw an error if other tasks depend on it.
   *
   * This option is most useful for development servers or other "watch" tasks.
   *
   * @default false
   * @see https://turbo.build/repo/docs/reference/configuration#persistent
   */
  readonly persistent?: boolean;

  /**
   * Label a task as `interactive` to make it accept inputs from `stdin` in the terminal UI.
   * Must be used with `persistent`.
   *
   * @default false (Defaults to `true` for tasks marked as `persistent`)
   * @see https://turbo.build/repo/docs/reference/configuration#interactive
   */
  readonly interactive?: boolean;

  /**
   * The list of environment variables a task depends on.
   *
   * @see https://turbo.build/repo/docs/reference/configuration#env
   */
  readonly env?: string[];

  /**
   * An allowlist of environment variables that should be made available to this task's runtime, even
   * when in Strict Environment Mode.
   *
   * @see https://turbo.build/repo/docs/reference/configuration#passthroughenv
   */
  readonly passThroughEnv?: string[];

  /**
   * Set output logging verbosity. Can be overridden by the `--output-logs` CLI option.
   *
   * @default "full"
   * @see https://turbo.build/repo/docs/reference/configuration#outputlogs
   */
  readonly outputLogs?: TaskOutputLogsEnum;
}

export interface TurborepoConfig {
  /**
   * A list of globs for implicit global hash dependencies. The contents of these files will be
   * included in the global hashing algorithm. This is useful for busting the cache based on `.env`
   * files (not in Git) or any root level file that impacts package tasks (but are not represented
   * in the traditional dependency graph (e.g. a root `tsconfig.json`, `jest.config.js`, `.eslintrc`
   * , etc.)).
   *
   * @see https://turborepo.org/docs/reference/configuration#globaldependencies
   */
  readonly globalDependencies?: string[];

  /**
   * A list of environment variables that you want to impact the hash of all tasks. Any change to
   * these environment variables will cause all tasks to miss cache.
   *
   * @see https://turbo.build/repo/docs/reference/configuration#globalenv
   */
  readonly globalEnv?: string[];

  /**
   * A list of environment variables that you want to make available to tasks. Using this key opts
   * all tasks into Strict Environment Variable Mode.
   *
   * Additionally, Turborepo has a built-in set of global passthrough variables for common cases,
   * like operating system environment variables. This includes variables like `HOME`, `PATH`,
   * `APPDATA`, `SHELL`, `PWD`, and more. The full list can be found in the source code.
   *
   * @see https://turbo.build/repo/docs/reference/configuration#globalpassthroughenv
   */
  readonly globalPassThroughEnv?: string[];

  /**
   * An object representing the task dependency graph of your project. `turbo` interprets these
   * conventions to properly schedule, execute, and cache the outputs of tasks in your project.
   *
   * Each key in the tasks object is the name of a task that can be executed by `turbo run`. Turborepo
   * will search the packages described in your Workspace's configuration for `scripts` in `package.json`
   * with the name of the task.
   *
   * Using the rest of the configuration described in the task, Turborepo will run the scripts in the
   * described order, caching logs and file outputs in the outputs key when provided.
   *
   * @see https://turbo.build/repo/docs/reference/configuration#tasks
   */
  readonly tasks?: Record<string, TurborepoTaskConfig>;
}
