// 
requirejs.config({
    //baseUrl: "../",
    paths: {
        // exporters
        'exporter-cocos2d': 'exporters/cocos2d/index',
        // RequireJS plugins
        'text': 'ext/requirejs-text/text',
        // others
        'libpng': "bin/libpngWrapper",
        'jszip': "ext/jszip/dist/jszip.min",
        'dust': "ext/dustjs-linkedin/dist/dust-full.min",
        'filesaver': "ext/FileSaver/FileSaver",
    },
});

// pre-load exporters
requirejs([
            'exporter-cocos2d',
        ], function () {
            console.log('exporter(s) loaded');
        }, function (error) {
            console.log(error);
        });

// pre-load png encoder
console.time('load png encoder');
requirejs(['libpng'], function () {
    console.timeEnd('load png encoder');

    // pre-load jszip
    console.time('load jszip');
    requirejs(['jszip'], function () {
        console.timeEnd('load jszip');

        // pre-load filesaver
        requirejs(['filesaver']);
    });
});
