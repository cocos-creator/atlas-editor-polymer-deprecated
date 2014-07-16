// 
require.config({
    baseUrl: "../",
    paths: {
        // register require plugins
        'text': 'ext/requirejs-text/text',
        // register exporters
        'exporter-cocos2d': 'exporters/cocos2d/index',
    },
});

// load exporters
require([
            'exporter-cocos2d',
        ], function () {
            console.log('exporter(s) loaded');
        });