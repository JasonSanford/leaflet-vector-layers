/**
 * @preserve Using portions of Leaflet code (https://github.com/CloudMade/Leaflet)
 */
(function() {
    
    var scripts = [
        'lvector.js',
        
        'core/Util.js', 
        'core/Class.js',
        
        'layer/Layer.js',
        'layer/AGS.js',
        'layer/GeoIQ.js',
        'layer/CartoDB.js'
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
