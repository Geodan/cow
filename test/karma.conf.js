module.exports = function (config) {
	config.set({
		basePath: '../',

		frameworks: ['jasmine'],

		// list of files / patterns to load in the browser
		files: [
			'http://d3js.org/d3.v3.min.js',
		    'bower_components/underscore/underscore.js',
			'src/events.js',
			'src/cow2.utils.js',
			'src/cow2.record.js',
			'src/cow2.indexeddb.js',
			'src/cow2.syncstore.js',
			'src/cow2.peer.js',
			'src/cow2.socketserver.js',
			'src/cow2.user.js',
			'src/cow2.group.js',
			'src/cow2.item.js',
			'src/cow2.project.js',
			'src/cow2.websocket.js',
			'src/cow2.messenger.js',
			'src/cow2.core.js',
			'src/*.spec.js',
			{pattern: 'test/data/*', included: false},
			// {pattern: 'bower_components/sw-*/dist/sw-*.js.map', included: false}
		],

		// list of files to exclude
		exclude: [],

		// use dolts reporter, as travis terminal does not support escaping sequences
		// possible values: 'dots', 'progress', 'junit', 'teamcity'
		// CLI --reporters progress
		reporters: ['progress', 'spec', 'junit', 'coverage'],

		// web server port
		port: 9876,

		// cli runner port
		runnerPort: 9100,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS (Cannot use: https://github.com/google/traceur-compiler/issues/1611)
		// - IE (only Windows)
		browsers: ['Firefox'],

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,

		// How long will Karma wait for a message from a browser before disconnecting from it (in ms).
		browserNoActivityTimeout: 60000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false,

		junitReporter: {
			outputFile: 'TESTS-xunit.xml'
		},

		preprocessors: {
			'js/**/!(*spec).js': ['coverage']
		},

		coverageReporter: {
			/*instrumenters: {isparta: require('isparta')},
			 instrumenter: {
			 '**        /*.js': 'isparta'
			 },*/
			dir: 'temp/coverage',
			// no subdir per browser
			subdir: '.',
			includeAllSources: true,
			reporters: [
				{type: 'html'},
				{type: 'text-summary'},
				{type: 'lcov'},
				{type: 'teamcity'}
			]
		},

		plugins: [
			'karma-jasmine',
			'karma-firefox-launcher',
			'karma-chrome-launcher',
			//'karma-ie-launcher',
			'karma-junit-reporter',
			//'karma-teamcity-reporter',
			'karma-spec-reporter',
			'karma-coverage'
		]
	});
};
