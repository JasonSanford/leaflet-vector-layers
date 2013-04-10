//
// Extend Layer to support GeoJSON geometry parsing
//
lvector.GeoJSONLayer = lvector.Layer.extend({
    //
    // Convert GeoJSON to Leaflet vectors
    //
    _geoJsonGeometryToLeaflet: function(geometry, opts) {
        //
        // Create a variable for a single vector and for multi part vectors.
        //
        var vector, vectors;
        
        switch (geometry.type) {
            case "Point":
                if (opts.circleMarker) {
                    vector = new L.CircleMarker(new L.LatLng(geometry.coordinates[1], geometry.coordinates[0]), opts);
                }
                else {
                    vector = new L.Marker(new L.LatLng(geometry.coordinates[1], geometry.coordinates[0]), opts);
                }
                break;
            
            case "MultiPoint":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    vectors.push(new L.Marker(new L.LatLng(geometry.coordinates[i][1], geometry.coordinates[i][0]), opts));
                }
                break;
                        
            case "LineString":
                var latlngs = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.coordinates[i][1], geometry.coordinates[i][0]));
                }
                vector = new L.Polyline(latlngs, opts);
                break;
            
            case "MultiLineString":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++){
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++){
                        latlngs.push(new L.LatLng(geometry.coordinates[i][i2][1], geometry.coordinates[i][i2][0]));
                    }
                    vectors.push(new L.Polyline(latlngs, opts));
                }
                break;
                
            case "Polygon":
                var latlngss = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.coordinates[i][i2][1], geometry.coordinates[i][i2][0]));
                    }
                    latlngss.push(latlngs);
                }
                vector = new L.Polygon(latlngss, opts);
                break;
            
            case "MultiPolygon":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    latlngss = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++) {
                        var latlngs = [];
                        for (var i3 = 0, len3 = geometry.coordinates[i][i2].length; i3 < len3; i3++) {
                            latlngs.push(new L.LatLng(geometry.coordinates[i][i2][i3][1], geometry.coordinates[i][i2][i3][0]));
                        }
                        latlngss.push(latlngs);
                    }
                    vectors.push(new L.Polygon(latlngss, opts));
                }
                break;
                
            case "GeometryCollection":
                vectors = [];
                for (var i = 0, len = geometry.geometries.length; i < len; i++) {
                    vectors.push(this._geoJsonGeometryToLeaflet(geometry.geometries[i], opts));
                }
                break;
        }
        return vector || vectors;
    }
});
