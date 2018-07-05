const chokidar = require('chokidar');

class Watcher {
  constructor(project, rebuildCallback) {
    this.watchedFiles = new Set([project.main]);
    this.rebuildCallback = rebuildCallback;

    this.setWatchedFiles = this.setWatchedFiles.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  start() {
    console.log(`Watching source files for changes...`);
    this.watcher = chokidar.watch('.').on('all', this.trigger);
  }

  setWatchedFiles(watchedFiles) {
    this.watchedFiles = watchedFiles;
  }

  trigger(event, file) {
    if (!this.watchedFiles.has(file)) return;
    this.rebuildCallback(this.setWatchedFiles);
  }
}

module.exports = Watcher;
