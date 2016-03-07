module.exports = {
	buildnumber: {
		options: {
			patterns: [{
				match: 'build-number',
				replacement: '<%= pkg.version %>'
			}],
			prefix: '@@',
			processContentExclude: '**/*{gif,jpg,png,eot,svg,ttf,woff,woff2}'
		},
		expand: true,
		cwd: '<%= dir.dist %>',
		src: ['**/*.js'],
		dest: '<%= dir.dist %>'
	}
};
