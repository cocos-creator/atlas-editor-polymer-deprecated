var gulp = require('gulp');

var gutil = require('gulp-util');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
// var uglifyjs = require('gulp-uglifyjs');
var stylus = require('gulp-stylus');

var paths = {
    ext_core: [ 
        '../core/bin/**/*.js',
    ],
    ext_editor_ui: [ 
        '../editor-ui-polymer/bin/**/*',
    ],
    ext: 'src/third/pngcrush_modified.js',
    img: 'src/img/**/*',
    js: 'src/**/*.js',
    js_in_order: [
        'src/js/freeMoveCanvas.js',
        'src/js/atlasEditor.js',

        // 'src/js/libpngWrapper.js',
        // //'src/third/pinger.js',
        // //'src/third/usain-png/deflate.js',
        // //'src/third/usain-png/usain-png.js',
        // 'src/js/paperUtils.js',
        // 'src/js/app.js',
        // 'src/js/freeMovePaper.js',
        // 'src/js/rightPanelCtrl.js',
        // 'src/js/workSpaceCtrl.js',
    ],
    css: 'src/**/*.styl',
    html: 'src/**/*.html',
};

// clean
gulp.task('clean', function() {
    return gulp.src('bin/**/*', {read: false})
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
gulp.task('cp-3rd', function() {
    return gulp.src(paths.ext)
    .pipe(gulp.dest('ext'))
    ;
});
gulp.task('cp-img', function() {
    return gulp.src(paths.img)
    .pipe(gulp.dest('bin/img'))
    ;
});

// js
gulp.task('js', function() {
    return gulp.src(paths.js_in_order, {base: 'src'})
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(concat('atlas-editor.js'))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});
// js-dev
gulp.task('js-dev', function() {
    return gulp.src(paths.js_in_order, {base: 'src'})
    .pipe(jshint({
        '-W087': true,
    }))
    .pipe(jshint.reporter(stylish))
    .pipe(concat('atlas-editor.js'))
    .pipe(gulp.dest('bin'))
    ;
});

// css
gulp.task('css', function() {
    return gulp.src('src/css/atlas-editor.styl')
    .pipe(stylus({
        compress: false,
        include: 'src'
    }))
    .pipe(gulp.dest('bin'))
    ;
});

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_editor_ui, ['cp-editor-ui']).on ( 'error', gutil.log );
    gulp.watch(paths.ext, ['cp-3rd']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
    gulp.watch(paths.js, ['js-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.css, ['css']).on ( 'error', gutil.log );
});

// tasks
gulp.task('default', ['cp-core', 'cp-editor-ui', 'cp-img', 'cp-3rd', 'js', 'css' ] );
gulp.task('all', ['default'] );
