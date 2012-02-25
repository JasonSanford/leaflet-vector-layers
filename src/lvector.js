/**
 * @preserve Copyright (c) 2012, Jason Sanford
 * Leaflet Vector Layers is a library for showing geometry objects
 * from multiple geoweb services in a Leaflet map
 */

/*global lvector */

(function (root) {
    root.lvector = {
        VERSION: '1.2.0',

        noConflict: function () {
            root.lvector = this._originallvector;
            return this;
        },

        _originallvector: root.lvector
    };
    
    // TODO: Remove if LatLngBounds.equals method gets pull into core.
    if (!L.LatLngBounds.equals) {
        L.LatLngBounds = L.LatLngBounds.extend({
            equals: function(/*LatLngBounds*/ bounds) {
                var equals = false;
                if (bounds !== null) {
                    equals = (
                        (this._southWest.lat == bounds.getSouthWest().lat) &&
                        (this._southWest.lng == bounds.getSouthWest().lng) &&
                        (this._northEast.lat == bounds.getNorthEast().lat) &&
                        (this._northEast.lng == bounds.getNorthEast().lng));
                }
                return equals;
            }
        });
    }
    
    L.Popup = L.Popup.extend({
        _close: function () {
            if (this._opened) {
    		    this._map.closePopup();
    		    this._map.removeLayer(this);
    	    }
        }
    });
}(this));
