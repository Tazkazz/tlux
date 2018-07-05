const fs = require('fs');
const path = require('path');
const luamin = require('luamin');

const BUILD_TIMEOUT = 100;
const BUILD_FILE = 'build.lua';

const REGEXP_IMPORT = /@import\('(.*)'\)/g;
const REGEXP_VARIABLE = /@variable\('(.*)'\)/g;

const fileError = (file, error) => new Error(`ERROR [${file}] ${error}`);

class Compiler {
  constructor(project) {
    this.building = false;
    this.needRebuild = false;
    this.mainFile = project.main;
    this.variables = { ...project, ...project.variables };

    this.buildFile = this.buildFile.bind(this);
    this.build = this.build.bind(this);
    this.rebuild = this.rebuild.bind(this);
  }

  buildFile(file, importedFiles, stacktrace = []) {
    stacktrace.push(file);
    return fs.readFileSync(file).toString()
      .replace(REGEXP_VARIABLE, (match, v) => {
        if (this.variables[v] === undefined) {
          throw fileError(file, `Trying to resolve unknown variable: ${v}!`);
        }
        return this.variables[v];
      })
      .replace(REGEXP_IMPORT, (match, f) => {
        const importFile = path.join(path.dirname(file), f);
        if (importFile.startsWith('../')) {
          throw fileError(file, `Trying to import a file from outside: ${importFile}!`);
        }
        importedFiles.add(importFile);
        if (stacktrace.includes(importFile)) {
          throw fileError(file, `Circular dependency found: ${[...stacktrace, importFile].join(' -> ')}!`);
        }
        if (!fs.existsSync(importFile)) {
          throw fileError(file, `Import file not found: ${importFile}`);
        }
        return this.buildFile(importFile, importedFiles, [...stacktrace]);
      });
  }

  build() {
    this.needRebuild = true;
    this.building = true;
    const result = {
      importedFiles: new Set([this.mainFile]),
      build: null,
    };
    try {
      while (this.needRebuild) {
        this.needRebuild = false;
        console.log('Rebuilding...');
        let build = null;
        result.build = this.buildFile(this.mainFile, result.importedFiles);
      }
      if (result.build !== null) {
        const minimied = luamin.minify(result.build);
        fs.writeFileSync(BUILD_FILE, minimied);
      }
      console.log('Build was successful!');
    } catch (e) {
      console.error('Could not compile a build!');
      console.error(e.message);
    }
    this.building = false;
    if (this.importedFilesCallback) this.importedFilesCallback(result.importedFiles);
  }

  rebuild(importedFilesCallback) {
    this.importedFilesCallback = importedFilesCallback;
    this.needRebuild = true;
    if (this.building) {
      return;
    }
    clearTimeout(this.buildPending);
    this.buildPending = setTimeout(this.build, BUILD_TIMEOUT);
  }
}

module.exports = Compiler;
