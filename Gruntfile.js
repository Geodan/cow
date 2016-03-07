module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
          options: {
            // define a string to put between each file in the concatenated output
            separator: '\n'
          },
          node: {
              src: [
             //'lib/loglevel/loglevel.min.js',
            'src/events.js',
            'src/cow2.utils.js',
            'src/cow2.record.js',
            'src/cow2.postgres.js', //this one differs from the browser version
            'src/cow2.syncstore.js',
            'src/cow2.peer.js',
            'src/cow2.socketserver.js',
            'src/cow2.user.js',
            'src/cow2.group.js',
            'src/cow2.item.js',
            'src/cow2.project.js',
            'src/cow2.websocket.node.js',
            'src/cow2.messenger.js',
            'src/cow2.core.js'
            ],
            // the location of the resulting JS file
            dest: 'dist/<%= pkg.name %>.node.js'
          },
          nodb: {
              src: [
             //'lib/loglevel/loglevel.min.js',
            'src/events.js',
            'src/cow2.utils.js',
            'src/cow2.record.js',
            'src/cow2.nodb.js', //this one differs from the db version
            'src/cow2.syncstore.js',
            'src/cow2.peer.js',
            'src/cow2.socketserver.js',
            'src/cow2.user.js',
            'src/cow2.group.js',
            'src/cow2.item.js',
            'src/cow2.project.js',
            'src/cow2.websocket.node.js',
            'src/cow2.messenger.js',
            'src/cow2.core.js'
            ],
            // the location of the resulting JS file
            dest: 'dist/<%= pkg.name %>.nodb.js'
          },
          superpeer: {
          	  src: [
          	  	  'src/superpeer/superpeer.js'
          	  ],
          	  dest: 'dist/superpeer.js'
          },
          dist: {
            // the files to concatenate
            src: [
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
            'src/cow2.core.js'
            ],
            // the location of the resulting JS file
            dest: 'dist/<%= pkg.name %>.js'
          }
        },
       uglify: {
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
        },
        watch: {
          files: ['src/cow2.*.js'],
          tasks: ['jshint', 'qunit']
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    
    grunt.registerTask('watch', ['concat','uglify']);
    grunt.registerTask('default', ['concat','uglify']);
    //Node requires some small differences, most notably the database
    grunt.registerTask('node', ['concat:nodb','uglify:nodb']);
    grunt.registerTask('node', ['concat:node','uglify:node']);
    grunt.registerTask('superpeer', ['concat:superpeer']);
};
