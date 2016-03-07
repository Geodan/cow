module.exports = {
  options: {
    force: false,
    reporter: 'node_modules/jshint-stylish/stylish.js',
    jshintrc: '.jshintrc'
  },
  files: ['<%= dir.src %>/**/*.js']
};
