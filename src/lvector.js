/**
 * @preserve Copyright (c) 2013, Jason Sanford
 * Leaflet Vector Layers is a library for showing geometry objects
 * from multiple geoweb services in a Leaflet map
 */

/*global lvector */

(function (root) {
    root.lvector = {
        VERSION: '1.5.1',

        noConflict: function () {
            root.lvector = this._originallvector;
            return this;
        },

        _originallvector: root.lvector
    };
}(this));
