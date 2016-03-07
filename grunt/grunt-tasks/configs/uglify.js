module.exports = {
	options: {
		// the banner is inserted at the top of the output
		banner: '/*! <%= pkg.name %> VERSION: <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
	},
	dist: {
		files: {
			'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
		}
	},
	nodb: {
		files: {
			'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
		}
	},
	node: {
		files: {
			'dist/<%= pkg.name %>.node.min.js': ['<%= concat.node.dest %>']
		}
	}
};
