# GitHub action cache
this project is to enable caching of GitHub actions build artifacts and test coverage

for now this only works for Angular projects, but it can be extended to support other technologies

## Usage
1. create a `cache.config.js` file in your project with the following content:
```javascript
export const cacheMap = {
    ui: {
        path: 'project-name-ui.tar.gz', // this is the path to a file that will be uploaded, it can be of any type.
    },
    wc: {
        path: 'project-name-wc.tar.gz',
    },
    lib: {
        path: 'dist-lib',
        isDirectory: true, // this is mandatory for directories, otherwise it will be ignored
    },
};
```
2. add this step to your workflow file:
```yaml
      - name: Expose actions cache variables
        if: fromJSON(inputs.active-steps-map)[github.job]['npmExecuteScripts'] == true
        uses: actions/github-script@v6
        with:
          script: |
            core.exportVariable('ACTIONS_RUNTIME_URL', process.env['ACTIONS_RUNTIME_URL'])
            core.exportVariable('ACTIONS_RUNTIME_TOKEN', process.env['ACTIONS_RUNTIME_TOKEN'])
```

3. install the package in your project as a dev dependency
```shell
npm i @openmfp/gha-cache -D
```

4. run the script instead of build & test steps like that
```shell
ACCESS_TOKEN=$TOKEN_TO_GITHUB node node_modules/@openmfp/gha-cache/angular.js
```
