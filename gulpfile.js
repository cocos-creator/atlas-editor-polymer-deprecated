var Path = require('path');
var Q = require('q');
var es = require('event-stream');
var stylish = require('jshint-stylish');

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var stylus = require('gulp-stylus');
var vulcanize = require('gulp-vulcanize');
var rename = require('gulp-rename');
var zip = require('gulp-zip');


var paths = {
    ext_core: [ 
        '../core/bin/**/*.js',
    ],
    ext_editor_ui: [ 
        '../editor-ui/bin/editor-ui.css',
        '../editor-ui/bin/editor-ui.html',
        '../editor-ui/bin/img/**/*.png',
    ],
    img: 'src/img/**/*',
    cssToBuild: 'src/app/**/*.styl',
    htmlToBuild: 'src/app/**/*.html',
    js_in_app: 'src/app/**/*.js',
    js:        'src/*.js',
    minify_3rd: [
        '3rd/bluebird.js',
        '3rd/requirejs-text.node.js',
        'ext/web-animations-js/web-animations.js',
        'ext/FileSaver/FileSaver.js',
    ],
    dist: {
        cp_3rd: [
            '3rd/*.min.+(|*.)js',
        ],
        cp_ext: [
            // 以下是除了3rd外index.html引用到的文件
            'ext/fontawesome/css/font-awesome.css',
            'ext/fontawesome/fonts/fontawesome-webfont.woff',

            'ext/fire-editor-ui/editor-ui.css',
            'ext/platform/platform.js',
            'ext/fire-core/core.min.js',
            'ext/paper/dist/paper-core.min.js',
            'ext/mousetrap/mousetrap.min.js',

            'ext/polymer/polymer.html',
            'ext/polymer/layout.html',
            'ext/polymer/polymer.js',

            'ext/fire-editor-ui/editor-ui.html',
        ],
        cp_exporter: 'exporters/**/*',
        cp_deferred_lib: [
            // 以下对应requireIndex.js里面的配置(除3rd外)
            'bin/libpngWrapper.js',
            'ext/jszip/dist/jszip.min.js',
            'ext/dustjs-linkedin/dist/dust-full.min.js',
        ],
        cp_nw: [
            'index.html',
            'package.json',
        ],
        cp_web: [
            'index.html',
            'favicon.ico',
        ],
        output: 'publish/',
        output_nw: 'publish/nw',
        output_web: 'publish/web',
    },
};

// clean
gulp.task('clean', function() {
    return gulp.src(['bin/', paths.dist.output], {read: false})
    .pipe(clean());
});

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

task_copy_dist = function (src, destDir, base) {
    if (base) {
        base = { base: base };
    }
    return gulp.src(src, base)
           .pipe(gulp.dest(destDir))
           .pipe(gulp.dest(Path.join(paths.dist.output_nw, destDir)))
           .pipe(gulp.dest(Path.join(paths.dist.output_web, destDir)));
};

gulp.task('cp-core', ['clean'], function() {
    var dest = 'ext/fire-core';
    var dev = gulp.src(paths.ext_core)
              .pipe(gulp.dest(dest));
    var min = task_copy_dist(paths.ext_core.concat('!../**/*.dev.*'), dest);
    return es.merge(dev, min);
});

gulp.task('cp-editor-ui', ['clean'], function() {
    var deferred = Q.defer();
    // deferred 1 second to prevent copy editor-ui.html while it is in the building phase
    setTimeout(function () {
        task_copy_dist(paths.ext_editor_ui, 'ext/fire-editor-ui', '../editor-ui/bin/');
        deferred.resolve();
    }, process.platform === 'win32' ? 0 : 1000);

    return deferred.promise;
});

gulp.task('cp-img', ['clean'], function() {
    return task_copy_dist(paths.img, 'bin', 'src');
});

gulp.task('cp-html', ['clean'], function() {
    return gulp.src(paths.htmlToBuild, {base: paths.htmlToBuild.split('*')[0]} )
    .pipe(gulp.dest('bin'));
});

gulp.task('cp-all', ['cp-core', 'cp-editor-ui', 'cp-img', 'cp-html' ] );

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

// css
gulp.task('css', ['clean'], function() {
    return gulp.src(paths.cssToBuild)
    .pipe(stylus({
        compress: true,
        include: 'src'
    }))
    .pipe(gulp.dest('bin'));
});

// js
var pkg = require('./package.json');
var writeVersion = function (filename) {
    return es.map(function(file, callback) {
        if (Path.basename(file.path) !== filename) {
            callback(null, file);
            return;
        }
        var date = new Date();
        var yy = date.getFullYear().toString().substring(2);
        var m = (date.getMonth()+1).toString();
        var mm = m.length == 2 ? m : '0' + m;
        var d = date.getDate().toString();
        var dd = d.length == 2 ? d : '0' + d;
        var build = yy + mm + dd;

        var data = { file: file, gulp_version: pkg.version, gulp_build: build };
        file.contents = new Buffer(gutil.template(file.contents, data));
        callback(null, file);
    });
};

var buildJs_dev = function (src) {
    return gulp.src(src, { base: src.split('*')[0] })
           .pipe(writeVersion('atlas-editor.js'));
};

var buildJs = function build(src) {
    return buildJs_dev(src)
           .pipe(jshint())
           .pipe(jshint.reporter(stylish))
           .pipe(uglify());
};

var task_js = function (builder) {
    return function () {
        var dest = 'bin';
        var building = builder(paths.js_in_app)
                       .pipe(gulp.dest(dest));
        var dist = builder(paths.js)
                   .pipe(gulp.dest(dest))
                   .pipe(gulp.dest(Path.join(paths.dist.output_nw, dest)))
                   .pipe(gulp.dest(Path.join(paths.dist.output_web, dest)));
        return es.merge(building, dist);
    };
};

gulp.task('js', ['clean'], task_js(buildJs));
gulp.task('js-dev', task_js(buildJs_dev));

// minify third 这些文件会提交git，只要build过一次就行
gulp.task('minify-3rd', function() {
    return gulp.src(paths.minify_3rd/*, {base: './'}*/)
    .pipe(uglify())
    .pipe(rename(function (path) {
        //path
        path.extname = ".min" + path.extname;
    }))
    .pipe(gulp.dest('3rd'));
});

// html
var task_build_html = function (strip) {
    return function () {
        var dest = 'bin';
        return gulp.src('bin/app.html')
        .pipe(vulcanize({
            dest: dest,
            inline: true,
            strip: strip,
        }))
        .pipe(gulp.dest(dest));
    }
}

gulp.task('build-html', ['cp-html', 'css', 'js'], task_build_html(true));
gulp.task('build-html-dev', ['cp-html', 'css', 'js-dev'], task_build_html(false));

/////////////////////////////////////////////////////////////////////////////
// publish
/////////////////////////////////////////////////////////////////////////////

gulp.task('cp-dist', ['clean', 'default'], function() {
    var src = [].concat(
        paths.dist.cp_3rd,
        paths.dist.cp_ext, 
        paths.dist.cp_exporter,
        paths.dist.cp_deferred_lib, // 这里依赖于default task
        'bin/app.html'
    );
    var cp1 = gulp.src(src, {base: './'} )
    .pipe(gulp.dest(paths.dist.output_nw))
    .pipe(gulp.dest(paths.dist.output_web));
});

//gulp.task('build-index', ['default', 'cp-deferred-lib'], function() {
//    return gulp.src('index.html')
//    .pipe(vulcanize({
//        dest: paths.dist.output_nw,
//        inline: true,//require???
//        strip: false,
//    }))
//    .pipe(gulp.dest(paths.dist.output_nw))
//    .pipe(gulp.dest(paths.dist.output_web));
//});

gulp.task('build-nw', ['clean', 'default', 'cp-dist'], function () {
    var cp_nw = gulp.src(paths.dist.cp_nw).pipe(gulp.dest(paths.dist.output_nw));
    return cp_nw;
    //return gulp.src('src/*')
    //.pipe(zip('archive.zip'));
});

gulp.task('build-web', ['clean', 'default', 'cp-dist'], function () {
    var cp_web = gulp.src(paths.dist.cp_web).pipe(gulp.dest(paths.dist.output_web));
    return cp_web;
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_editor_ui, ['cp-editor-ui']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
    gulp.watch(paths.cssToBuild, ['css', 'build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.js, ['build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.htmlToBuild, ['build-html-dev']).on ( 'error', gutil.log );
});

// tasks
gulp.task('dev', ['cp-all', 'build-html-dev' ] );
gulp.task('default', ['cp-all', 'build-html' ] );
gulp.task('all', ['default', 'minify-3rd', 'build-nw', 'build-web'] );
