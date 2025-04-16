/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '@actions/artifact';
import { readFileSync, unlinkSync } from 'fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

interface CacheItem {
  path: string;
  isDirectory?: boolean;
}

interface CacheConfig {
  cacheMap: Record<string, CacheItem>;
}

interface Artifact {
  name: string;
  archive_download_url: string;
}

interface Config {
  artifacts: Artifact[];
  cached: boolean;
  hashes: string;
}

const artifact = create();

const server = process.env.GITHUB_SERVER_URL;
const repo = process.env.GITHUB_REPOSITORY;

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

const testCachePaths = [
  'coverage/lcov.info',
  'TEST-frontend.xml'
] as const;
const testCacheName = 'test_cov.tar'

async function main() {
  const cacheConfig: CacheConfig = await import(process.cwd() + '/cache.config.js');
  const productionCaches = cacheConfig.cacheMap;
  normalizePackageLock();

  const artifacts = await getArtifacts();

  const libraries = Object.entries(angular.projects).filter(
    (project: [string, any]) => {
      return project[1].projectType === 'library';
    },
  );
  const applications = Object.entries(angular.projects).filter(
      (project: [string, any]) => {
        return project[1].projectType === 'application';
      },
  );

  const globalHash = getFilesHash(globalProdPatterns);

  const libsRestored = await restoreOrSaveCache(
      libraries,
      {
        hashes: globalHash,
        cached: true,
        artifacts,
      },
      productionCaches,
  );
  // only attempt to restore applications if all libraries were restored
  const appsRestored = await restoreOrSaveCache(
      applications,
      libsRestored,
      productionCaches,
  );
  // only attempt to restore test coverage if all applications were restored
  await restoreTest(Object.values(angular.projects), appsRestored);
}

function normalizePackageLock() {
  execSync(
    `npx node-jq --arg new_version "0.0.0" '.version = $new_version | .packages."".version = $new_version' package-lock.json > tmp.json && mv tmp.json package-lock.json`,
  );
  execSync(`git add package-lock.json`);
}

async function getArtifacts(): Promise<Artifact[]> {
  const apiResponse = await fetch(
      `${server}/api/v3/repos/${repo}/actions/artifacts`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
  );
  const responseJson = await apiResponse.json();
  return responseJson.artifacts;
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
  projects: any[],
  config: Config,
  productionCaches: CacheConfig['cacheMap'],
): Promise<Config> {
  let cached = true;
  let hashes = '';

  for (const [key, project] of projects) {
    if (!productionCaches[key]) {
      // if the project is not in the cache map, skip it
      continue;
    }

    const prodPattern = getProjectFiles(project);
    const projectHash = getFilesHash(prodPattern);
    const hash = createHash('sha256')
      .update(projectHash + config.hashes)
      .digest('hex');
    hashes += hash;
    const cacheKey = key + '-' + hash;
    let prodCache = false;

    if (config.cached) {
      prodCache = await downloadCache(
          cacheKey,
          config.artifacts,
          productionCaches[key],
          key,
      );
    }

    if (!prodCache) {
      cached = false;
      execSync(`npm run build:${key}`);
      const cachePath = getCachePath(productionCaches[key], key);

      await artifact.uploadArtifact(cacheKey, [cachePath], process.cwd());
    }
  }

  return {
    cached,
    hashes: hashes || config.hashes,
    artifacts: config.artifacts,
  };
}

function getCachePath(cacheItem: CacheItem, key: string): string {
  if (!cacheItem.isDirectory) {
    return cacheItem.path;
  }

  execSync(`tar -cf ${key}.tar ${cacheItem.path}`);
  return `${key}.tar`;
}

async function downloadCache(
    name: string,
    artifacts: Artifact[],
    cacheItem: CacheItem,
    key: string,
) {
  const artifact = artifacts.find((a) => a.name === name);
  if (!artifact) {
    return false;
  }
  const cachePath = `temp${Math.random()}.zip`;

  execSync(
      `curl -L "${artifact.archive_download_url}" -H "Authorization: Bearer ${process.env.ACCESS_TOKEN}" --output ${cachePath}`,
  );

  execSync(`unzip ${cachePath}`);
  unlinkSync(cachePath);

  if (cacheItem.isDirectory) {
    execSync(`tar -xf ${key}.tar`);
  }

  return true;
}

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

function getTsConfig(project: any): string {
  if (project.projectType === 'application') {
    return project.architect.build.options.tsConfig;
  } else {
    return project.architect.build.configurations.production.tsConfig;
  }
}

async function restoreTest(projects: any[], config: Config) {
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
  let testCache = false;
  const cacheKey = 'test_cov-' + hash;

  if (config.cached) {
    testCache = await downloadCache(
        cacheKey,
        config.artifacts,
        {path: testCacheName},
        'test_cov',
    );

    execSync(`tar -xf ${testCacheName}`);
  }

  if (!testCache) {
    execSync(`npm run test:cov && tar -cf ${testCacheName} ${testCachePaths.join(' ')}`);
    await artifact.uploadArtifact(
        cacheKey,
        [testCacheName],
        process.cwd(),
    );
  }
}

main().then();
