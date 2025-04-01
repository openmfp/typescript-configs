import { restoreCache, saveCache } from '@actions/cache';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {readFileSync} from "fs";

interface CacheConfig {
  cacheMap: {
    [key: string]: string[];
  };
}

// in the images all directories are readonly, so the runner must work inside the repo
const RUNNER_TEMP = process.cwd() + '/.runner_temp';
process.env.RUNNER_TEMP = RUNNER_TEMP;

const angularJson = readFileSync(process.cwd() + '/angular.json', 'utf8');
const angular = JSON.parse(angularJson);

const globalProdPatterns = [
  'package-lock.json',
  'angular.json',
  'tsconfig.json',
];

const globalTestPatterns = ['jest.config.ts'];

const testCaches = ['TEST-frontend.xml'];

async function main() {
  const cacheConfig: CacheConfig = await import(process.cwd() + '/cache.config.js');
  const productionCaches = cacheConfig.cacheMap;
  normalizePackageLock();

  const libraries = Object.entries(angular.projects).filter((project: [string, any]) => {
    return project[1].projectType === 'library';
  });
  const applications = Object.entries(angular.projects).filter((project: [string, any]) => {
    return project[1].projectType === 'application';
  });

  const globalHash = getFilesHash(globalProdPatterns);

  const libsRestored = await restoreOrSaveCache(libraries, {
    hashes: globalHash,
    cached: true,
  },productionCaches);
  // only attempt to restore applications if all libraries were restored
  const appsRestored = await restoreOrSaveCache(applications, libsRestored, productionCaches);
  // only attempt to restore test coverage if all applications were restored
  await restoreTest(Object.values(angular.projects), appsRestored);
}

function normalizePackageLock() {
  execSync(
    `npx node-jq --arg new_version "0.0.0" '.version = $new_version | .packages."".version = $new_version' package-lock.json > tmp.json && mv tmp.json package-lock.json`,
  );
  execSync(`git add package-lock.json`);
}

function getFilesHash(patterns: string[]) {
  let hashes = '';
  for (const pattern of patterns) {
    const hash = execSync(
      `git ls-files -s ${pattern} |  awk '{print $2}' | tr -d '\\n'`,
      {
        encoding: 'utf8',
      },
    ).replace(/\s/, '');
    hashes += hash;
  }
  return createHash('sha256').update(hashes).digest('hex');
}

async function restoreOrSaveCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[],
  config: { cached: boolean; hashes: string },
  productionCaches: CacheConfig['cacheMap'],
): Promise<{ cached: boolean; hashes: string }> {
  let cached = true;
  let hashes = '';

  for (const [key, project] of projects) {
    const prodPattern = getProjectFiles(project);
    const projectHash = getFilesHash(prodPattern);
    const hash = createHash('sha256')
      .update(projectHash + config.hashes)
      .digest('hex');
    hashes += hash;
    const cacheKey = key + '/' + hash;
    let prodCache: undefined | string = undefined;

    if (config.cached) {
      prodCache = await restoreCache(productionCaches[key], cacheKey);
    }

    if (!prodCache) {
      cached = false;
      execSync(`npm run build:${key}`);
      await saveCache(productionCaches[key], cacheKey);
    }
  }

  return { cached, hashes: hashes || config.hashes };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProjectFiles(project: any): string[] {
  const srcFiles = [
    `${project.sourceRoot}/**/*.ts`,
    `${project.sourceRoot}/**/*.html`,
    `${project.sourceRoot}/**/*.css`,
    `${project.sourceRoot}/**/*.scss`,
    `${project.sourceRoot}/assets/**/*`,
  ];
  return [getTsConfig(project), ...srcFiles];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTsConfig(project: any): string {
  if (project.projectType === 'application') {
    return project.architect.build.options.tsConfig;
  } else {
    return project.architect.build.configurations.production.tsConfig;
  }
}

async function restoreTest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[],
  config: { cached: boolean; hashes: string },
) {
  const testPattern = [...globalTestPatterns];
  for (const project of projects) {
    const root = project.root || '.';
    testPattern.push(
      ...[
        project.sourceRoot + '/**/*.spec.ts',
        root + '/tsconfig.spec.json',
        root + '/test-setup.ts',
        root + '/jest.config.ts',
      ],
    );
  }
  const testHash = getFilesHash(testPattern);
  const hash = createHash('sha256')
    .update(testHash + config.hashes)
    .digest('hex');
  let testCache: undefined | string = undefined;
  const cacheKey = 'test-cov/' + hash;

  if (config.cached) {
    testCache = await restoreCache(testCaches, cacheKey);
  }

  if (!testCache) {
    execSync(`npm run test:cov`);
    await saveCache(testCaches, cacheKey);
  }
}

main().then();
