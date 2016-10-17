'use strict';
var fs = require('fs');
var path = require('path');

var babel = require('babel-core');
var findCacheDir = require('find-cache-dir');
var md5hex = require('md5-hex');
var objectAssign = require('object-assign');
var pirates = require('pirates');

function runTest(testPath, babelConfig) {
	var options = objectAssign({
		filename: testPath,
		sourceMaps: true,
		ast: false,
		babelrc: false
	}, babelConfig);

	var start = Date.now();
	var code = fs.readFileSync(testPath, 'utf8');
	var result = babel.transform(code, options);
	console.error('transformation took', Date.now() - start);

	var hash = md5hex(code);
	var cacheDir = findCacheDir({name: 'ava', create: true});
	var cachedFile = path.join(cacheDir, hash + '.js');
	fs.writeFileSync(cachedFile, result.code);

	var revert = pirates.addHook(
		function () {
			return result.code;
		},
		{
			exts: [path.extname(testPath)],
			matcher: function (filename) {
				return filename === testPath;
			}
		}
	);
	require(testPath); // eslint-disable-line import/no-dynamic-require
	revert();
}
exports.runTest = runTest;