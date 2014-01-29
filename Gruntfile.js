grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
        build: {
            src: ['public/assets/*.js', '!**/build/**'],
            dest: 'public/assets/build/evemap.min.js'
        }
    }
});