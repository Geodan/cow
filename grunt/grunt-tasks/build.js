module.exports = function (grunt) {
	grunt.registerTask(
		'precommit',
		'Check code, build code',
		[
			'jshint'
		]
	);

	grunt.registerTask(
		'default',
		'Check code, build code',
		[
			'concat',
			'replace:buildnumber',
			'uglify'
		]
	);
};


