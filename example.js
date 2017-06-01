// Expose the package so it can be used via a code package
// const BannerWatcher = require('banner-watcher');
const BannerWatcher = require('./src');

const extensions = ['html'];

let bannerWatcher = new BannerWatcher();
bannerWatcher.setDirectory(`${process.cwd()}/tests`);
for (let ext of extensions) {
	bannerWatcher.registerExtension(`.${ext}`);
}
bannerWatcher.watch(function onDestroy() {
	console.log('Done watching!');
});

setTimeout(function () {
	bannerWatcher.abort();
}, 5000);
