# OpenMFP Typescript Configurations

![Build Status](https://github.com/openmfp/typescript-configs/actions/workflows/pipeline.yaml/badge.svg)
[![REUSE status](
https://api.reuse.software/badge/github.com/openmfp/typescript-configs)](https://api.reuse.software/info/github.com/openmfp/typescript-configs)

## About

This repository offers reusable TypeScript configuration to be used for services which are TypeScript-based (e.g. backend services building with NestJS, or plain TypeScript projects).

## How to use

In order to use the `@openmfp/config-prettier` package in your project:

* Execute npm install command

  ```sh
  npm install --dev-save @openmfp/config-prettier@latest
  ```

* Add prettier configuration into the `package.json` file:

```json
{
  "name": "my-project",
  "version": "0.0.1",
  "prettier": "@openmfp/config-prettier",
  ...
}

```

In order to use the `@openmfp/eslint-config-typescript` packages in your project:

* Execute npm install command

  ```sh
  npm install --dev-save @openmfp/eslint-config-typescript@latest
  ```

* Add into the file `.eslintrc.json` below setup, alongside your custom configuration:

```json
{
	"extends": "@openmfp/eslint-config-typescript"
}
```

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file in this repository for instructions on how to contribute to openMFP.

## Code of Conduct

Please refer to the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file in this repository for information on the expected Code of Conduct for contributing to openMFP.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and openMFP contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmfp/portal).


