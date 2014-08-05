Atlas Editor
=========

User Manual
---------
[English](https://github.com/fireball-x/atlas-editor-polymer/blob/master/doc/README.md) | [中文](https://github.com/fireball-x/atlas-editor-polymer/blob/master/doc/README_CN.md)

Build
---------

### bash ###
```
bower update
npm update
gulp
```

### how to build 3rd/bluebird.js ###
```
bower install
cd ext/bluebird
npm install
grunt build --features="core timers"
copy js/browser/bluebird.js ../../3rd
```

### how to build 3rd/*.min.js ###
```
gulp ext-min
```