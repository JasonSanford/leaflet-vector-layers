/**
 * @preserve Using portions of Leaflet code (https://github.com/CloudMade/Leaflet)
 */

/*
 * lvector.Util is a namespace for various utility functions.
 */

lvector.Util = {
	extend: function(/*Object*/ dest) /*-> Object*/ {	// merge src properties into dest
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var j = 0, len = sources.length, src; j < len; j++) {
			src = sources[j] || {};
			for (var i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},
	
	setOptions: function(obj, options) {
		obj.options = lvector.Util.extend({}, obj.options, options);
	}

};
