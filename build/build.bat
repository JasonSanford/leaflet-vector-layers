@echo off
java -jar ../lib/closure-compiler/compiler.jar ^
--js ../src/gvector.js ^
--js ../src/core/Util.js ^
--js ../src/core/Class.js ^
--js ../src/layer/Layer.js ^
--js ../src/layer/AGS.js ^
--js ../src/layer/GeoIQ.js ^
--js ../src/layer/CartoDB.js ^
--js_output_file ../dist/gvector.js