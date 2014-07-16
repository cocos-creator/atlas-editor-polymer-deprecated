// export cocos2d data
define(['text!exporters/cocos2d/template.plist'], function (template) {
    var compile = null;
    var exportData = function (atlas, callback) {
        if (!compile) {
            compile = dust.compileFn(template);
        }
        compile(atlas, function(err, out) {
            if (!err) {
                callback(out);
            }
            else {
                console.log(err);
            }
        });
    };

    var module = {
        name: 'cocos2d',
        fileName: 'cocos2d.plist',
        exportData: exportData,
    };

    return module;
});