call gulp clean
call gulp

rem call gulp --gulpfile gulpfile.pub.js clean
rem call gulp --gulpfile gulpfile.pub.js

rename gulpfile.js gulpfile.js.bak
rename gulpfile.pub.js gulpfile.js

call gulp clean
call gulp

rename gulpfile.js gulpfile.pub.js
rename gulpfile.js.bak gulpfile.js

pause