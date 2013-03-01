lvector.Geoserver=lvector.GeoJSONLayer.extend({
	initialize: function(options){
		for (var i=0,len=this._requiredParams.length; i<len; i++){
			if (!options[this._requiredParams[i]]){
				throw new Error("No \""+this._requiredParams[i]+"\" parameter found.");
			}
		}

		lvector.Layer.prototype.initialize.call(this, options);

		this._globalPointer="Geoserver_"+Math.floor(Math.random()*100000);
		window[this._globalPointer]=this;

		this._vectors=[];

		if (this.options.map){
			if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length===2){
				var z=this.options.map.getZoom();
				var sr=this.options.scaleRange();
				this.options.visibleAtScale=(z>=sr[0] && z<=sr[1]);
			}
			this._show();
		}
	},

	options: {
		workspace:null,
		typeName: null
	},

	_requiredParams: ["workspace","typeName"],
	_getFeatures:function(){
		var url="http://localhost:8080/geoserver/" + this.options.workspace + "/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=" +
			this.options.typeName + "&outputFormat=json&format_options=callback:" + this._globalPointer + "._processFeatures";
		if (!this.options.showAll){
			url += "&bbox=" + this.options.map.getBounds().toBBoxString();
		}

		this._makeJsonpRequest(url);
	}
});
	









	

