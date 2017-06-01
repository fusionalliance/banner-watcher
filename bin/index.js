#! /usr/bin/env node
'use strict';

const BannerWatcher = require('../src');
const program = require('commander');
const path = require('path');

const defaultExtensions = ['html']; // e.g. --ext html,js
const defaultDirectory = process.cwd(); // e.g. --dir myDirectoryHere
const defaultRunWatch = true; // e.g. --run-once

program
	.option(`-o, --run-once`, `Run once, don't watch.`, false)
	.option(`-e, --ext <extensions>`, `Comma separated list of extensions (no spaces)`, (val) => val.split(','))
	.option(`-d, --dir [directory]`, `The directory in which to run`)
	.parse(process.argv);

let config = {
	runOnce: program.runOnce,
	ext: program.ext || defaultExtensions,
	dir: path.normalize(program.dir || defaultDirectory)
};

var bannerWatcher = new BannerWatcher();
bannerWatcher.setDirectory(config.dir);
for (let ext of (config.ext)) {
	bannerWatcher.registerExtension(`.${ext}`);
}
console.log(`Running ${config.runOnce ? 'once' : 'constantly'} in directory ${config.dir} on extensions ${config.ext}...\n`);
if (config.runOnce) {
	bannerWatcher.runOnce();
	setTimeout(() => {
		process.exit(0);
	}, 3000);
} else {
	bannerWatcher.watch(function onDestroy() {
		console.log('Done watching!');
	});
}
