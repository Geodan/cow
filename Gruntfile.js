(function a() {
	'use strict';

	//tijdelijk test commentaar
	module.exports = function(grunt) {
		// define settings
		var settings = {
			dir: {
				src: 'src/',
				dist: 'dist/',
				doc: 'docs/',
				test: 'test/',
				temp: 'temp',
				coverage: 'temp/coverage/'
			},
			pkg: grunt.file.readJSON('bower.json'),

			applicationName: 'cow',

			modules: [
				{
					// The requirejs include which makes the application:
					name: 'cow',
					exclude: []
				}
			],

			// array of bower modules that need to be update before builds (mostly because they are changing prereleases)
			bowerModulesToUpdate: []
		};

		//autoload all grunt plugins mentioned in devDependencies package.json
		require('load-grunt-tasks')(grunt);

		grunt.config.init(settings);

		// load task configurations
		var configs = require('load-grunt-configs')(grunt, {
			config: {
				src: 'grunt/grunt-tasks/configs/*.js'
			}
		});

		grunt.config.merge(configs);

		// load task definitions
		grunt.loadTasks('grunt/grunt-tasks');

		// finally overwrite configuration with project specific information

		//load local-task configurations, if they are present
		var localconfigs = require('load-grunt-configs')(grunt, {
			config: {
				src: 'grunt-tasks-local/configs/*.js'
			}
		});
		grunt.config.merge(localconfigs);
		// load local task definitions
		grunt.loadTasks('grunt-tasks-local');

		// end of local overwrites

		// Time how long tasks take. Can help when optimizing build times
		require('time-grunt')(grunt);
	};
}());
