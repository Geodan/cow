module.exports = {
	unit: {
		options: {
			configFile: 'test/karma.conf.js',
			singleRun: true,
			reporters: ['spec', 'junit', 'coverage'],

			junitReporter: {
				outputDir: '<%= dir.temp %>'
			}
		}
	},

	server: {
		options: {
			configFile: 'test/karma.conf.js',
			singleRun: false,
			reporters: ['spec'],
			browsers: ['Chrome']
		}
	}
};
