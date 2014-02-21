'use strict';

module.exports = function(grunt) {

    // Configuration goes here
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        license: grunt.file.read('LICENSE.txt'),
        banner: '/*! \n<%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '<%= license %>*/ \n\n',
        clean: ['dist'],
        compass: {
            main: {
                options: {
                    sassDir: 'plugin/sass',
                    cssDir: 'plugin'
                }
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            main: {
                files : {
                    'dist/src/gridvar.css' : ['plugin/gridvar.css'],
                    'dist/src/<%= pkg.filename %>.js' : ['plugin/<%= pkg.filename %>.js']
                }
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            main: {
                src: 'dist/src/<%= pkg.filename %>.js',
                dest: 'dist/src/<%= pkg.filename %>.min.js'
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, src: ['plugin/test/*'], dest: 'dist/src/test', flatten: true, filter: 'isFile'}
                ]
            }
        },
        qunit: {
            files: ['plugin/test/qunit-tests.html']
        },
        jshint: {
            gruntfile: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: 'Gruntfile.js'
            },
            src: {
                options: {
                    jshintrc: 'plugin/.jshintrc'
                },
                src: ['plugin/jquery.nibrGridVar.js']
            },
            test: {
                options: {
                    jshintrc: 'plugin/test/.jshintrc'
                },
                src: ['plugin/test/tests.js']
            }
        },
        compress: {
            options: {
                mode: 'zip',
                archive: 'dist/jquery.nibrGridVar.js.zip'
            },
            main: {
                files: [
                    {expand: true, src: ['dist/src/*'], dest: '', flatten: true}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['clean', 'compass', 'concat', 'uglify', 'copy', 'qunit', 'jshint', 'compress']);
    grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('build', ['clean', 'compass', 'concat', 'uglify', 'copy', 'qunit', 'jshint', 'compress']);
    grunt.registerTask('scrub', ['clean', 'compass']);
};