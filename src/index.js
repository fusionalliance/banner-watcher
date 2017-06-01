'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const md5File = require('md5-file');

const packageName = 'BannerWatcher';

const isFunction = (fn) => typeof fn === 'function';
const invokeIfFunction = (fn, ...params) => isFunction(fn) ? fn(...params) : undefined;
const arrayContains = (arr, val) => arr.indexOf(val) >= 0;
const removeIndex = (arr, idx) => {
	return Array.from(arr).filter((elem, i) => {
		return i !== idx;
	});
};
const removeValue = (arr, val) => {
	return Array.from(arr).filter((elem) => {
		return elem !== val;
	});
};

const escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

const findFilesInDir = function (startPath, filter) {
	var results = [];

	if (!fs.existsSync(startPath)) {
		return;
	}

	var files = fs.readdirSync(startPath);
	for (var i = 0; i < files.length; i++) {
		var filename = path.join(startPath, files[i]);
		var stat = fs.lstatSync(filename);
		if (stat.isDirectory()){
			results = results.concat(findFilesInDir(filename, filter)); //recurse
		} else if (filename.indexOf(filter) >= 0) {
			results.push(filename);
		}
	}
	return results;
};

// const containsValue = (arr, val) => {
// 	return Array.from(arr).some((elem) => {
// 		return elem === val;
// 	});
// };

const addValue = (arr, val) => {
	if (!arrayContains(arr, val)) {
		return [...arr, val];
	}

	return arr;
};

function SandboxStripper(directory = '', extensions = []) {
	this.directory = directory;
	this.extensions = extensions;
	this._checksums = {};
	this._stringToStrip = `this.setAttribute("sandbox","allow-same-origin allow-forms allow-scripts");`;
}

SandboxStripper.prototype.setDirectory = function (directory) {
	this.directory = directory;
};

SandboxStripper.prototype.unsetDirectory = function (directory) {
	this.directory = null;
};

SandboxStripper.prototype.registerExtension = function registerExtension(extension) {
	this.extensions = addValue(this.extensions, extension);
};

SandboxStripper.prototype.unregisterExtension = function unregisterExtension(extension) {
	this.extensions = removeValue(this.extensions, extension);
};

SandboxStripper.prototype.watch = function (onDestroy) {
	// Watch the fs directories.
	this.abort(false);
	if (this.directory && this.extensions && this.extensions.length) {
		this._destroyFunction = onDestroy;

		this.runOnce();
		this._watcher = chokidar.watch(this.directory, {
			awaitWriteFinish: true
		});
		this._watcher.on('all', (event, path) => {
			if (arrayContains(['add', 'change'], event)) {
				this._debounce = setTimeout(() => {
					this.runOnce();
				}, 1000);
			}
		});
	} else {
		console.warn(`${packageName}: Directory is required before watching.`);
		invokeIfFunction(onDestroy);
	}
};

SandboxStripper.prototype.abort = function (invokeDestroy = true) {
	if (this._watcher) {
		this._watcher.close();
	}
	if (this._debounce) {
		clearTimeout(this._debounce);
	}
	this._debounce = null;
	if (invokeDestroy) {
		invokeIfFunction(this._destroyFunction);
		this._destroyFunction = null;
	}
};

SandboxStripper.prototype.runOnce = function (successCallback) {
	if (this.directory && this.extensions && this.extensions.length > 0) {
		for (let extension of this.extensions) {
			const files = findFilesInDir(this.directory, extension);
			for (let file of files) {
				// Essentially memoizing the reads/writes, since reading triggers the watcher again.
				let oldChecksum = this._checksums[file];
				if (!oldChecksum || oldChecksum !== md5File.sync(file)) {
					this._checksums[file] = SandboxStripper.prototype.stripStringFromFile.call(null, file, this.getStringToStrip());
				}
			}
		}
	} else {
		console.warn(`${packageName}: Directory and extensions are required before stripping files.`);
		invokeIfFunction(onDestroy);
	}
};

SandboxStripper.prototype.stripStringFromFile = function stripStringFromFile(file, s) {
	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			return console.err(err);
		}

		if (data.indexOf(s) >= 0) {
			console.log(`stripping '${s}' from ${file}`);
			let regex = new RegExp(escapeRegExp(s));
			let result = data.replace(regex, '');

			fs.writeFile(file, result, 'utf8', function (err) {
				if (err) return console.err(err);
			});
		}
	});

	return md5File.sync(file);
};

SandboxStripper.prototype.getStringToStrip = function getStringToStrip() {
	return this._stringToStrip;
};

SandboxStripper.prototype.setStringToStrip = function setStringToStrip(str) {
	this._stringToStrip = str;
};

module.exports = SandboxStripper;
