//
// Extend Layer to support EsriJSON geometry parsing
//
lvector.EsriJSONLayer = lvector.Layer.extend({
    //
    // Turn EsriJSON into Leaflet vectors
    //
    _esriJsonGeometryToLeaflet: function(geometry, opts) {
        //
        // Create a variable for a single vector and for multi part vectors.
        //
        var vector, vectors;
        
        if (geometry.x && geometry.y) {
            //
            // A Point
            //
            vector = new L.Marker(new L.LatLng(geometry.y, geometry.x), opts);
        } else if (geometry.points) {
            //
            // A MultiPoint
            //
            vectors = [];
            for (var i = 0, len = geometry.points.length; i < len; i++) {
                vectors.push(new L.Marker(new L.LatLng(geometry.points[i].y, geometry.points[i].x), opts));
            }
        } else if (geometry.paths) {
            if (geometry.paths.length > 1) {
                //
                // A MultiLineString
                //
                vectors = [];
                for (var i = 0, len = geometry.paths.length; i < len; i++) {
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.paths[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.paths[i][i2][1], geometry.paths[i][i2][0]));
                    }
                    vectors.push(new L.Polyline(latlngs, opts));
                }
            } else {
                //
                // A LineString
                //
                var latlngs = [];
                for (var i = 0, len = geometry.paths[0].length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.paths[0][i][1], geometry.paths[0][i][0]));
                }
                vector = new L.Polyline(latlngs, opts);
            }
        } else if (geometry.rings) {
            if (geometry.rings.length > 1) {
                //
                // A MultiPolygon
                //
                vectors = [];
                for (var i = 0, len = geometry.rings.length; i < len; i++) {
                    var latlngss = [];
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.rings[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.rings[i][i2][1], geometry.rings[i][i2][0]));
                    }
                    latlngss.push(latlngs);
                    vectors.push(new L.Polygon(latlngss, opts));
                }
            } else {
                //
                // A Polygon
                //
                var latlngss = [];
                var latlngs = [];
                for (var i = 0, len = geometry.rings[0].length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.rings[0][i][1], geometry.rings[0][i][0]));
                }
                latlngss.push(latlngs);
                vector = new L.Polygon(latlngss, opts);
            }
        }
        return vector || vectors;
    }
});
