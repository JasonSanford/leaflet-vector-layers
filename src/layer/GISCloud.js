lvector.GISCloud = lvector.GeoJSONLayer.extend({
    initialize: function(options) {
        
        // Check for required parameters
        for (var i = 0, len = this._requiredParams.length; i < len; i++) {
            if (!options[this._requiredParams[i]]) {
                throw new Error("No \"" + this._requiredParams[i] + "\" parameter found.");
            }
        }
        
        // Extend Layer to create GISCloud
        lvector.Layer.prototype.initialize.call(this, options);
        
        // _globalPointer is a string that points to a global function variable
        // Features returned from a JSONP request are passed to this function
        this._globalPointer = "GISCloud_" + Math.floor(Math.random() * 100000);
        window[this._globalPointer] = this;
        
        // Create an array to hold the features
        this._vectors = [];
        
        
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
                var z = this.options.map.getZoom();
                var sr = this.options.scaleRange;
                this.options.visibleAtScale = (z >= sr[0] && z <= sr[1]);
            }
            this._show();
        }
    },
    
    options: {
        mapID: null,
        layerID: null,
        uniqueField: "id"
    },
    
    _requiredParams: ["mapID", "layerID"],
    
    _getFeatures: function() {
        
        // Build URL
        var url = "http://api.giscloud.com/1/maps/" + this.options.mapID + // GISCloud Map ID
            "/layers/" + this.options.layerID + 
            "/features.json?" + // JSON please
            "geometry=geojson" + // Return GeoJSON formatted data
            "&epsg=4326" + // Using Lat Lng for bounding box units
            "&callback=" + this._globalPointer + "._processFeatures"; // Need this for JSONP
        if (!this.options.showAll) {
            url += "&bounds=" + this.options.map.getBounds().toBBoxString(); // Build bbox geometry
        }
        if (this.options.where) {
            url += "&where=" + encodeURIComponent(this.options.where);
        }
        
        // JSONP request
        this._makeJsonpRequest(url);
        
    }    
});
