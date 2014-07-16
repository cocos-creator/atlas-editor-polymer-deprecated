//
var exportCocos2d = (function () {
    var compile;
    require(['text!exporters/cocos2d/template.plist'], function (template) {
        compile = dust.compileFn(template);
    });
    
    return function (atlas, callback) {
        if (!compile) {
            console.error('cocos2d template not loaded');
            return;
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
})();