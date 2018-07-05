#!/usr/bin/env node
const package = require('./package');
const rl = require('readline-sync');
const fs = require('fs');
const path = require('path');
const args = process.argv.splice(2);

const Watcher = require('./watcher');
const Compiler = require('./compiler');

const DEFAULT_TLUX_FILE = 'tlux.json';
const DEFAULT_ENTRYPOINT = 'main.lux';

const exit = (code = 0) => process.exit(code);
const error = msg => console.error(msg) & exit(1);
const question = (msg, defaultInput) => rl.question(msg, { defaultInput });
const readTluxProject = (file = DEFAULT_TLUX_FILE) => {
  if (!fs.existsSync(file)) {
    error(`Tlux file '${file}' does not exist!`);
  }
  return JSON.parse(fs.readFileSync(file).toString());
};

console.log(`Tlux :: LuaX parser v${package.version}\n`);

if (args.length === 0 || args.find(a => ['--help', '-h'].includes(a)) || args[0] === 'help') {
  console.log('Usage: tlux build [tlux.json]')
  console.log('       tlux watch [tlux.json]')
  console.log('       tlux init')
  console.log('       tlux help')
} else if (args[0] === 'init') {
  if (fs.existsSync(DEFAULT_TLUX_FILE)) {
    error(`This directory already has a Tlux file '${DEFAULT_TLUX_FILE}'!`);
  }
  console.log('Initializing a new Tlux project...\n');
  const currentDir = path.basename(process.cwd());
  const projectName = question(`Project name: (${currentDir}) `, currentDir);
  const version = question(`Version: (1.0.0) `, '1.0.0');
  const author = question(`Author: `);
  const entrypoint = question(`Entry point: (${DEFAULT_ENTRYPOINT}) `, DEFAULT_ENTRYPOINT);
  fs.writeFileSync(DEFAULT_TLUX_FILE, JSON.stringify({
    name: projectName,
    version,
    author,
    main: entrypoint,
  }, null, 2) + '\n');
} else if (args[0] === 'build') {
  const project = readTluxProject(args[1]);
  new Compiler(project).build();
} else if (args[0] === 'watch') {
  const project = readTluxProject(args[0] === 'watch' ? args[1] : args[0]);
  const compiler = new Compiler(project);
  const watcher = new Watcher(project, compiler.rebuild);
  watcher.start();
} else {
  error('Unknown arguments, type \'tlux help\' for more information');
}
