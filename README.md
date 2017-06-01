# Banner Watcher

## Command line
1. `npm install -g banner-watcher`
1. `cd /path/to/my/output/directory`
1. `banner-watcher`

## As a code package
1. `npm install --save banner-watcher` or `npm install --save-dev banner-watcher` (for use as devDependency).
1. Import the package.
1. Set your directory.
1. Register the extensions you want to watch ('.html' recommended).
1. Call runOnce to run it a single time or...
1. Call watch, and give it a destructor callback if you like.

```javascript
const BannerWatcher = require('banner-watcher');

const extensions = ['html'];

let bannerWatcher = new BannerWatcher();
bannerWatcher.setDirectory(`${process.cwd()}/tests`);
for (let ext of extensions) {
	bannerWatcher.registerExtension('.' + ext);
}
bannerWatcher.watch(function onDestroy() {
	console.log('Done watching!');
});

setTimeout(function () {
	bannerWatcher.abort();
}, 5000);
```
