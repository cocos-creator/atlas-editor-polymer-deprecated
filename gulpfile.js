var gulp = require('gulp');

var gutil = require('gulp-util');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');
var stylus = require('gulp-stylus');
var vulcanize = require('gulp-vulcanize');

var paths = {
    ext_core: [ 
        '../core/bin/**/*.js',
    ],
    ext_editor_ui: [ 
        '../editor-ui-polymer/bin/editor-ui.css',
        '../editor-ui-polymer/bin/editor-ui.html',
    ],
    ext: 'src/ext/pngcrush_modified.js',
    img: 'src/img/**/*',
    css: 'src/**/*.styl',
    html: 'src/**/*.html',
    js: [
        'src/**/*.js',
        '!src/ext/**/*.js',
    ],
};

// clean
gulp.task('clean', function() {
    return gulp.src('bin/', {read: false})
    .pipe(clean())
    ;
});

// copy
gulp.task('cp-core', function() {
    return gulp.src(paths.ext_core)
    .pipe(gulp.dest('ext/fire-core'))
    ;
});
gulp.task('cp-editor-ui', function() {
    return gulp.src(paths.ext_editor_ui)
    .pipe(gulp.dest('ext/fire-editor-ui'))
    ;
});
gulp.task('cp-ext', function() {
    return gulp.src(paths.ext)
    .pipe(gulp.dest('ext'))
    ;
});
gulp.task('cp-img', function() {
    return gulp.src(paths.img)
    .pipe(gulp.dest('bin/img'))
    ;
});
gulp.task('cp-html', function() {
    return gulp.src(paths.html, {base: 'src'} )
    .pipe(gulp.dest('bin'))
    ;
});

// css
gulp.task('css', function() {
    return gulp.src(paths.css)
    .pipe(stylus({
        compress: true,
        include: 'src'
    }))
    .pipe(gulp.dest('bin'))
    ;
});

// js
gulp.task('js', function() {
    return gulp.src(paths.js, {base: 'src'})
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

// js-no-uglify
gulp.task('js-no-uglify', function() {
    return gulp.src(paths.js, {base: 'src'})
    .pipe(gulp.dest('bin'))
    ;
});

// html
gulp.task('build-html', ['cp-html', 'css', 'js-no-uglify'], function() {
    return gulp.src('bin/all.html')
    .pipe(vulcanize({
        dest: 'bin',
        inline: true,
        strip: true,
    }))
    .pipe(gulp.dest('bin'))
    ;
});
gulp.task('build-html-dev', ['cp-html', 'css', 'js-no-uglify'], function() {
    return gulp.src('bin/all.html')
    .pipe(vulcanize({
        dest: 'bin',
        inline: true,
        strip: false,
    }))
    .pipe(gulp.dest('bin'))
    ;
});

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_editor_ui, ['cp-editor-ui']).on ( 'error', gutil.log );
    gulp.watch(paths.ext, ['cp-ext']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
    gulp.watch(paths.css, ['css', 'build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.js, ['js-no-uglify', 'build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.html, ['build-html-dev']).on ( 'error', gutil.log );
});

// tasks
gulp.task('cp-all', ['cp-core', 'cp-editor-ui', 'cp-img', 'cp-ext', 'cp-html' ] );
gulp.task('dev', ['cp-all', 'build-html-dev' ] );
gulp.task('default', ['cp-all', 'build-html' ] );
gulp.task('all', ['dev'] );
