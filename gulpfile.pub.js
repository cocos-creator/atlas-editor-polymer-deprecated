var path = require('path');
// var Q = require('q');
// var es = require('event-stream');

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
// var zip = require('gulp-zip');


var paths = {
    ext: [
        'ext/bluebird.min.js',
        'ext/FileSaver.min.js',
        'ext/pngcrush.min.fixed.js',
        'ext/require.min.nw.js',
        'ext/requirejs-text.node.min.js',
        'ext/web-animations.min.js',

        'ext/dustjs-linkedin/dist/dust-full.min.js',
        'ext/fire-core/core.min.js',
        'ext/fire-editor-ui/**/*',
        'ext/fontawesome/css/font-awesome.css',
        'ext/fontawesome/fonts/fontawesome-webfont.woff',
        'ext/jszip/dist/jszip.min.js',
        'ext/mousetrap/mousetrap.min.js',
        'ext/paper/dist/paper-core.min.js',
        'ext/platform/platform.js',
        'ext/polymer/layout.html',
        'ext/polymer/polymer.html',
        'ext/polymer/polymer.js',
    ],
    exporter: 'exporters/**/*',
    bin: [
        'bin/**/*',
        '!bin/app/app.js',
        '!bin/app/elements/**/*',
    ],
    nw: [
        'index.html',
        'package.json',
    ],
    web: [
        'index.html',
        'favicon.ico',
    ],

    output: 'publish/',
    output_nw: 'publish/nw',
    output_web: 'publish/web',
};

// clean
gulp.task('clean', function() {
    return gulp.src(paths.output, {read: false})
           .pipe(clean())
           ;
});

// publish
gulp.task('cp-dist', function() {
    var src = [].concat(
        paths.ext,
        paths.exporter,
        paths.bin
    );

    return gulp.src(src, { base: './'})
           .pipe(gulp.dest(paths.output_nw))
           .pipe(gulp.dest(paths.output_web))
           ;
});

gulp.task('build-nw', ['cp-dist'], function () {
    return gulp.src(paths.nw, { base: './'})
           .pipe(gulp.dest(paths.output_nw))
           ;
    //return gulp.src('src/*')
    //.pipe(zip('archive.zip'));
});

gulp.task('build-web', ['cp-dist'], function () {
    return gulp.src(paths.web, { base: './'})
           .pipe(gulp.dest(paths.output_web))
           ;
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// short commands
gulp.task('default', ['build-nw', 'build-web' ] );
