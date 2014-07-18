// 
require.config({
    baseUrl: "../",
    paths: {
        // exporters
        'exporter-cocos2d': 'exporters/cocos2d/index',
        // require plugins
        'text': 'ext/requirejs-text/text',
        // others
        'libpng': "bin/libpngWrapper",
    },
});

// load exporters
require([
            'exporter-cocos2d',
        ], function () {
            console.log('exporter(s) loaded');
        });

// pre-load png encoder
console.time('load png encoder');
require(['libpng'], function () {
    console.timeEnd('load png encoder');
});
