lvector.CartoDB = lvector.GeoJSONLayer.extend({
    initialize: function(options) {
        
        // Check for required parameters
        for (var i = 0, len = this._requiredParams.length; i < len; i++) {
            if (!options[this._requiredParams[i]]) {
                throw new Error("No \"" + this._requiredParams[i] + "\" parameter found.");
            }
        }
        
        // Extend Layer to create CartoDB
        lvector.Layer.prototype.initialize.call(this, options);
        
        // _globalPointer is a string that points to a global function variable
        // Features returned from a JSONP request are passed to this function
        this._globalPointer = "CartoDB_" + Math.floor(Math.random() * 100000);
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
        version: 1,
        user: null,
        table: null,
        fields: "*",
        where: null,
        limit: null,
        uniqueField: "cartodb_id"
    },
    
    _requiredParams: ["user", "table"],
    
    _getFeatures: function() {        
        // Build Query
        var where = this.options.where || "";
        if (!this.options.showAll) {
            var bounds = this.options.map.getBounds();
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();
            var tableCount = this.options.table.split(",").length;
            for (var i = 0; i < tableCount; i++) {
                where += (where.length ? " AND " : "") + (tableCount > 1 ? this.options.table.split(",")[i].split(".")[0] + ".the_geom" : "the_geom") + " && st_setsrid(st_makebox2d(st_point(" + sw.lng + "," + sw.lat + "),st_point(" + ne.lng + "," + ne.lat + ")),4326)";
            }
        }
        if (this.options.limit) {
            where += (where.length ? " " : "") + "limit " + this.options.limit;
        }
        where = (where.length ? " " + where : "");
        var query = "SELECT " + this.options.fields + " FROM " + this.options.table + (where.length ? " WHERE " + where : "");
        
        // Build URL
        var url = "http://" + this.options.user + ".cartodb.com/api/v" + this.options.version + "/sql" + // The API entry point
            "?q=" + encodeURIComponent(query) + // The SQL statement
            "&format=geojson" + // GeoJSON please
            "&callback=" + this._globalPointer + "._processFeatures"; // Need this for JSONP
        
        // JSONP request
        this._makeJsonpRequest(url);
    }
    
});
