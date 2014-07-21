// 
require.config({
    baseUrl: "../",
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
require([
            'exporter-cocos2d',
        ], function () {
            console.log('exporter(s) loaded');
        });

// pre-load png encoder
console.time('load png encoder');
require(['libpng'], function () {
    console.timeEnd('load png encoder');

    // pre-load jszip
    console.time('load jszip');
    require(['jszip'], function () {
        console.timeEnd('load jszip');

        // pre-load filesaver
        require(['filesaver']);
    });
});
