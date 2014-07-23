atlas-editor
=========

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

