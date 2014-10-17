/**
 * @preserve Using portions of Leaflet code (http://github.com/Leaflet/Leaflet)
 */
(function() {
    
    var scripts = [
        'lvector.js',
        
        'layer/Layer.js',
        'layer/GeoJSONLayer.js',
        'layer/EsriJSONLayer.js',

        'layer/AGS.js',
        'layer/A2E.js',
        'layer/GeoIQ.js',
        'layer/CartoDB.js',
        'layer/PRWSF.js',
        'layer/GISCloud.js',
        'layer/GitSpatial.js'
    ];
    
    function getSrcUrl() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src) {
                var res = src.match(/^(.*)lvector-include\.js$/);
                if (res) {
                    return res[1] + '../src/';
                }
            }
        }
    }
    
    var path = getSrcUrl();
    for (var i = 0; i < scripts.length; i++) {
        document.writeln("<script type='text/javascript' src='" + path + "../src/" + scripts[i] + "'></script>");
    }
})();
