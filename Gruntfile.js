module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            internal: {
                src: ["public/assets/js/evemap.js", "public/assets/js/evemap*.js", "!**/build/**"],
                dest: "public/assets/js/build/evemap.js"
            }
        },
        uglify: {
            js: {
                src: "public/assets/js/build/evemap.js",
                dest: "public/assets/js/build/evemap.min.js"
            }
        },
        cssmin: {
            css: {
                src: "public/assets/css/style.css",
                dest: "public/assets/css/style.min.css"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-css");
    grunt.registerTask("default", ["concat", "uglify", "cssmin"]);
};