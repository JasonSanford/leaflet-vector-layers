/*
 Copyright (c) 2012, Jason Sanford
 Leaflet Vector Layers is a library for showing geometry objects
 from multiple geoweb services in a Leaflet map
*/
(function(a){a.lvector={VERSION:"1.1.1",noConflict:function(){a.lvector=this._originallvector;return this},_originallvector:a.lvector};if(!L.LatLngBounds.equals)L.LatLngBounds=L.LatLngBounds.extend({equals:function(a){var d=!1;a!==null&&(d=this._southWest.lat==a.getSouthWest().lat&&this._southWest.lng==a.getSouthWest().lng&&this._northEast.lat==a.getNorthEast().lat&&this._northEast.lng==a.getNorthEast().lng);return d}});L.Popup=L.Popup.extend({_close:function(){this._opened&&(this._map.closePopup(),
this._map.removeLayer(this))}})})(this);/*
 Using portions of Leaflet code (https://github.com/CloudMade/Leaflet)
*/
lvector.Util={extend:function(a){for(var b=Array.prototype.slice.call(arguments,1),d=0,c=b.length,e;d<c;d++){e=b[d]||{};for(var f in e)e.hasOwnProperty(f)&&(a[f]=e[f])}return a},setOptions:function(a,b){a.options=lvector.Util.extend({},a.options,b)}};/*
 Using portions of Leaflet code (https://github.com/CloudMade/Leaflet)
*/
lvector.Class=function(){};
lvector.Class.extend=function(a){var b=function(){this.initialize&&this.initialize.apply(this,arguments)},d=function(){};d.prototype=this.prototype;d=new d;d.constructor=b;b.prototype=d;b.superclass=this.prototype;for(var c in this)this.hasOwnProperty(c)&&c!="prototype"&&c!="superclass"&&(b[c]=this[c]);a.statics&&(lvector.Util.extend(b,a.statics),delete a.statics);a.includes&&(lvector.Util.extend.apply(null,[d].concat(a.includes)),delete a.includes);if(a.options&&d.options)a.options=lvector.Util.extend({},
d.options,a.options);lvector.Util.extend(d,a);b.extend=arguments.callee;b.include=function(a){lvector.Util.extend(this.prototype,a)};return b};lvector.Layer=lvector.Class.extend({options:{fields:"",scaleRange:null,map:null,uniqueField:null,visibleAtScale:!0,dynamic:!1,autoUpdate:!1,autoUpdateInterval:null,popupTemplate:null,popupOptions:{},singlePopup:!1,symbology:null,showAll:!1},initialize:function(a){lvector.Util.setOptions(this,a)},setMap:function(a){if(!a||!this.options.map)if(a){this.options.map=a;if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2){var a=this.options.map.getZoom(),
b=this.options.scaleRange;this.options.visibleAtScale=a>=b[0]&&a<=b[1]}this._show()}else if(this.options.map)this._hide(),this.options.map=a},getMap:function(){return this.options.map},setOptions:function(){},_show:function(){this._addIdleListener();this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2&&this._addZoomChangeListener();if(this.options.visibleAtScale){if(this.options.autoUpdate&&this.options.autoUpdateInterval){var a=this;this._autoUpdateInterval=
setInterval(function(){a._getFeatures()},this.options.autoUpdateInterval)}this.options.map.fire("moveend").fire("zoomend")}},_hide:function(){this._idleListener&&this.options.map.off("moveend",this._idleListener);this._zoomChangeListener&&this.options.map.off("zoomend",this._zoomChangeListener);this._autoUpdateInterval&&clearInterval(this._autoUpdateInterval);this._clearFeatures();this._lastQueriedBounds=null;if(this._gotAll)this._gotAll=!1},_hideVectors:function(){for(var a=0;a<this._vectors.length;a++){if(this._vectors[a].vector)if(this.options.map.removeLayer(this._vectors[a].vector),
this._vectors[a].popup)this.options.map.removeLayer(this._vectors[a].popup);else if(this.popup&&this.popup.associatedFeature&&this.popup.associatedFeature==this._vectors[a])this.options.map.removeLayer(this.popup),this.popup=null;if(this._vectors[a].vectors&&this._vectors[a].vectors.length)for(var b=0;b<this._vectors[a].vectors.length;b++)if(this.options.map.removeLayer(this._vectors[a].vectors[b]),this._vectors[a].vectors[b].popup)this.options.map.removeLayer(this._vectors[a].vectors[b].popup);else if(this.popup&&
this.popup.associatedFeature&&this.popup.associatedFeature==this._vectors[a])this.options.map.removeLayer(this.popup),this.popup=null}},_showVectors:function(){for(var a=0;a<this._vectors.length;a++)if(this._vectors[a].vector&&this.options.map.addLayer(this._vectors[a].vector),this._vectors[a].vectors&&this._vectors[a].vectors.length)for(var b=0;b<this._vectors[a].vectors.length;b++)this.options.map.addLayer(this._vectors[a].vectors[b])},_clearFeatures:function(){this._hideVectors();this._vectors=
[]},_addZoomChangeListener:function(){this._zoomChangeListener=this._zoomChangeListenerTemplate();this.options.map.on("zoomend",this._zoomChangeListener,this)},_zoomChangeListenerTemplate:function(){var a=this;return function(){a._checkLayerVisibility()}},_idleListenerTemplate:function(){var a=this;return function(){if(a.options.visibleAtScale)if(a.options.showAll){if(!a._gotAll)a._getFeatures(),a._gotAll=!0}else a._getFeatures()}},_addIdleListener:function(){this._idleListener=this._idleListenerTemplate();
this.options.map.on("moveend",this._idleListener,this)},_checkLayerVisibility:function(){var a=this.options.visibleAtScale,b=this.options.map.getZoom(),d=this.options.scaleRange;this.options.visibleAtScale=b>=d[0]&&b<=d[1];if(a!==this.options.visibleAtScale)this[this.options.visibleAtScale?"_showVectors":"_hideVectors"]();if(a&&!this.options.visibleAtScale&&this._autoUpdateInterval)clearInterval(this._autoUpdateInterval);else if(!a&&this.options.autoUpdate&&this.options.autoUpdateInterval){var c=
this;this._autoUpdateInterval=setInterval(function(){c._getFeatures()},this.options.autoUpdateInterval)}},_setPopupContent:function(a){var b=a.popupContent,d=a.attributes||a.properties,c;if(typeof this.options.popupTemplate=="string"){c=this.options.popupTemplate;for(var e in d)c=c.replace(RegExp("{"+e+"}","g"),d[e])}else if(typeof this.options.popupTemplate=="function")c=this.options.popupTemplate(d);else return;a.popupContent=c;a.popup?a.popupContent!==b&&a.popup.setContent(a.popupContent):this.popup&&
this.popup.associatedFeature==a&&a.popupContent!==b&&this.popup.setContent(a.popupContent)},_showPopup:function(a,b){var d=b.latlng;d||L.Util.extend(this.options.popupOptions,{offset:b.target.options.icon.popupAnchor});var c;if(this.options.singlePopup){if(this.popup)this.options.map.removeLayer(this.popup),this.popup=null;this.popup=new L.Popup(this.options.popupOptions,a.vector);this.popup.associatedFeature=a;c=this}else a.popup=new L.Popup(this.options.popupOptions,a.vector),c=a;c.popup.setLatLng(d?
b.latlng:b.target.getLatLng());c.popup.setContent(a.popupContent);this.options.map.addLayer(c.popup)},_getFeatureVectorOptions:function(a){var b={},a=a.attributes||a.properties;if(this.options.symbology)switch(this.options.symbology.type){case "single":for(var d in this.options.symbology.vectorOptions)b[d]=this.options.symbology.vectorOptions[d];break;case "unique":for(var c=this.options.symbology.property,e=0,f=this.options.symbology.values.length;e<f;e++)if(a[c]==this.options.symbology.values[e].value)for(d in this.options.symbology.values[e].vectorOptions)b[d]=
this.options.symbology.values[e].vectorOptions[d];break;case "range":c=this.options.symbology.property;e=0;for(f=this.options.symbology.ranges.length;e<f;e++)if(a[c]>=this.options.symbology.ranges[e].range[0]&&a[c]<=this.options.symbology.ranges[e].range[1])for(d in this.options.symbology.ranges[e].vectorOptions)b[d]=this.options.symbology.ranges[e].vectorOptions[d]}return b},_getPropertiesChanged:function(a,b){var d=!1,c;for(c in a)a[c]!=b[c]&&(d=!0);return d},_getPropertyChanged:function(a,b,d){return a[d]!=
b[d]},_getGeometryChanged:function(a,b){var d=!1;a.coordinates&&a.coordinates instanceof Array?a.coordinates[0]==b.coordinates[0]&&a.coordinates[1]==b.coordinates[1]||(d=!0):a.x==b.x&&a.y==b.y||(d=!0);return d},_makeJsonpRequest:function(a){var b=document.getElementsByTagName("head")[0],d=document.createElement("script");d.type="text/javascript";d.src=a;b.appendChild(d)},_processFeatures:function(a){if(this.options.map){var b=this.options.map.getBounds();if(!this._lastQueriedBounds||!this._lastQueriedBounds.equals(b)||
this.options.autoUpdate){this._lastQueriedBounds=b;this instanceof lvector.GeoIQ&&(a=JSON.parse(a));if(this instanceof lvector.PRWSF){a.features=a.rows;delete a.rows;for(var b=0,d=a.features.length;b<d;b++){a.features[b].type="Feature";a.features[b].properties={};for(var c in a.features[b].row)c=="geojson"?a.features[b].geometry=a.features[b].row.geojson:a.features[b].properties[c]=a.features[b].row[c];delete a.features[b].row}}if(this instanceof lvector.GISCloud){a.features=a.data;delete a.data;
b=0;for(d=a.features.length;b<d;b++)a.features[b].type="Feature",a.features[b].properties=a.features[b].data,a.features[b].properties.id=a.features[b].__id,delete a.features[b].data,a.features[b].geometry=a.features[b].__geometry,delete a.features[b].__geometry}if(a&&a.features&&a.features.length)for(b=0;b<a.features.length;b++){if(this instanceof lvector.EsriJSONLayer)a.features[b].properties=a.features[b].attributes,delete a.features[b].attributes;c=!1;if(this.options.uniqueField)for(d=0;d<this._vectors.length;d++)if(a.features[b].properties[this.options.uniqueField]==
this._vectors[d].properties[this.options.uniqueField]&&(c=!0,this.options.dynamic)){if(this._getGeometryChanged(this._vectors[d].geometry,a.features[b].geometry)&&!isNaN(a.features[b].geometry.coordinates[0])&&!isNaN(a.features[b].geometry.coordinates[1]))this._vectors[d].geometry=a.features[b].geometry,this._vectors[d].vector.setLatLng(new L.LatLng(this._vectors[d].geometry.coordinates[1],this._vectors[d].geometry.coordinates[0]));if(this._getPropertiesChanged(this._vectors[d].properties,a.features[b].properties)){var e=
this._getPropertyChanged(this._vectors[d].properties,a.features[b].properties,this.options.symbology.property);this._vectors[d].properties=a.features[b].properties;this.options.popupTemplate&&this._setPopupContent(this._vectors[d]);if(this.options.symbology&&this.options.symbology.type!="single"&&e)if(this._vectors[d].vectors)for(var e=0,f=this._vectors[d].vectors.length;e<f;e++)this._vectors[d].vectors[e].setStyle?this._vectors[d].vectors[e].setStyle(this._getFeatureVectorOptions(this._vectors[d])):
this._vectors[d].vectors[e].setIcon&&this._vectors[d].vectors[e].setIcon(this._getFeatureVectorOptions(this._vectors[d]).icon);else this._vectors[d].vector&&(this._vectors[d].vector.setStyle?this._vectors[d].vector.setStyle(this._getFeatureVectorOptions(this._vectors[d])):this._vectors[d].vector.setIcon&&this._vectors[d].vector.setIcon(this._getFeatureVectorOptions(this._vectors[d]).icon))}}if(!c||!this.options.uniqueField){this instanceof lvector.GeoJSONLayer?(c=this._geoJsonGeometryToLeaflet(a.features[b].geometry,
this._getFeatureVectorOptions(a.features[b])),a.features[b][c instanceof Array?"vectors":"vector"]=c):this instanceof lvector.EsriJSONLayer&&(c=this._esriJsonGeometryToLeaflet(a.features[b].geometry,this._getFeatureVectorOptions(a.features[b])),a.features[b][c instanceof Array?"vectors":"vector"]=c);if(a.features[b].vector)this.options.map.addLayer(a.features[b].vector);else if(a.features[b].vectors&&a.features[b].vectors.length)for(e=0;e<a.features[b].vectors.length;e++)this.options.map.addLayer(a.features[b].vectors[e]);
this._vectors.push(a.features[b]);if(this.options.popupTemplate){var g=this;c=a.features[b];this._setPopupContent(c);(function(a){if(a.vector)a.vector.on("click",function(b){g._showPopup(a,b)});else if(a.vectors)for(var b=0,c=a.vectors.length;b<c;b++)a.vectors[b].on("click",function(b){g._showPopup(a,b)})})(c)}}}}}}});lvector.GeoJSONLayer=lvector.Layer.extend({_geoJsonGeometryToLeaflet:function(a,b){var d,c;switch(a.type){case "Point":d=new L.Marker(new L.LatLng(a.coordinates[1],a.coordinates[0]),b);break;case "MultiPoint":c=[];for(var e=0,f=a.coordinates.length;e<f;e++)c.push(new L.Marker(new L.LatLng(a.coordinates[e][1],a.coordinates[e][0]),b));break;case "LineString":for(var g=[],e=0,f=a.coordinates.length;e<f;e++)g.push(new L.LatLng(a.coordinates[e][1],a.coordinates[e][0]));d=new L.Polyline(g,b);break;case "MultiLineString":c=
[];e=0;for(f=a.coordinates.length;e<f;e++){for(var g=[],h=0,j=a.coordinates[e].length;h<j;h++)g.push(new L.LatLng(a.coordinates[e][h][1],a.coordinates[e][h][0]));c.push(new L.Polyline(g,b))}break;case "Polygon":for(var i=[],e=0,f=a.coordinates.length;e<f;e++){g=[];h=0;for(j=a.coordinates[e].length;h<j;h++)g.push(new L.LatLng(a.coordinates[e][h][1],a.coordinates[e][h][0]));i.push(g)}d=new L.Polygon(i,b);break;case "MultiPolygon":c=[];e=0;for(f=a.coordinates.length;e<f;e++){i=[];h=0;for(j=a.coordinates[e].length;h<
j;h++){for(var g=[],k=0,l=a.coordinates[e][h].length;k<l;k++)g.push(new L.LatLng(a.coordinates[e][h][k][1],a.coordinates[e][h][k][0]));i.push(g)}c.push(new L.Polygon(i,b))}break;case "GeometryCollection":c=[];e=0;for(f=a.geometries.length;e<f;e++)c.push(this._geoJsonGeometryToLeaflet(a.geometries[e],b))}return d||c}});lvector.EsriJSONLayer=lvector.Layer.extend({_esriJsonGeometryToLeaflet:function(a,b){var d,c;if(a.x&&a.y)d=new L.Marker(new L.LatLng(a.y,a.x),b);else if(a.points){c=[];for(var e=0,f=a.points.length;e<f;e++)c.push(new L.Marker(new L.LatLng(a.points[e].y,a.points[e].x),b))}else if(a.paths)if(a.paths.length>1){c=[];e=0;for(f=a.paths.length;e<f;e++){for(var g=[],h=0,j=a.paths[e].length;h<j;h++)g.push(new L.LatLng(a.paths[e][h][1],a.paths[e][h][0]));c.push(new L.Polyline(g,b))}}else{g=[];e=0;for(f=a.paths[0].length;e<
f;e++)g.push(new L.LatLng(a.paths[0][e][1],a.paths[0][e][0]));d=new L.Polyline(g,b)}else if(a.rings)if(a.rings.length>1){c=[];e=0;for(f=a.rings.length;e<f;e++){for(var i=[],g=[],h=0,j=a.rings[e].length;h<j;h++)g.push(new L.LatLng(a.rings[e][h][1],a.rings[e][h][0]));i.push(g);c.push(new L.Polygon(i,b))}}else{i=[];g=[];e=0;for(f=a.rings[0].length;e<f;e++)g.push(new L.LatLng(a.rings[0][e][1],a.rings[0][e][0]));i.push(g);d=new L.Polygon(i,b)}return d||c}});lvector.AGS=lvector.EsriJSONLayer.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');this._globalPointer="AGS_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;a.url.substr(a.url.length-1,1)!=="/"&&(a.url+="/");this._originalOptions=lvector.Util.extend({},a);if(a.esriOptions)if(typeof a.esriOptions=="object")lvector.Util.extend(a,this._convertEsriOptions(a.esriOptions));
else{this._getEsriOptions();return}lvector.Layer.prototype.initialize.call(this,a);if(this.options.where)this.options.where=encodeURIComponent(this.options.where);this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2)a=this.options.map.getZoom(),b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}},options:{where:"1=1",url:null,useEsriOptions:!1},_requiredParams:["url"],_convertEsriOptions:function(a){var b=
{};if(!(a.minScale==void 0||a.maxScale==void 0)){var d=this._scaleToLevel(a.minScale),c=this._scaleToLevel(a.maxScale);c==0&&(c=20);b.scaleRange=[d,c]}if(a.drawingInfo&&a.drawingInfo.renderer)b.symbology=this._renderOptionsToSymbology(a.drawingInfo.renderer);return b},_getEsriOptions:function(){this._makeJsonpRequest(this._originalOptions.url+"?f=json&callback="+this._globalPointer+"._processEsriOptions")},_processEsriOptions:function(a){var b=this._originalOptions;b.esriOptions=a;this.initialize(b)},
_scaleToLevel:function(a){var b=[5.91657527591555E8,2.95828763795777E8,1.47914381897889E8,7.3957190948944E7,3.6978595474472E7,1.8489297737236E7,9244648.868618,4622324.434309,2311162.217155,1155581.108577,577790.554289,288895.277144,144447.638572,72223.819286,36111.909643,18055.954822,9027.977411,4513.988705,2256.994353,1128.497176,564.248588,282.124294];if(a==0)return 0;for(var d=0,c=0;c<b.length-1;c++){var e=b[c+1];if(a<=b[c]&&a>e){d=c;break}}return d},_renderOptionsToSymbology:function(a){symbology=
{};switch(a.type){case "simple":symbology.type="single";symbology.vectorOptions=this._parseSymbology(a.symbol);break;case "uniqueValue":symbology.type="unique";symbology.property=a.field1;for(var b=[],d=0;d<a.uniqueValueInfos.length;d++){var c=a.uniqueValueInfos[d],e={};e.value=c.value;e.vectorOptions=this._parseSymbology(c.symbol);e.label=c.label;b.push(e)}symbology.values=b;break;case "classBreaks":symbology.type="range";symbology.property=rend.field;b=[];c=a.minValue;for(d=0;d<a.classBreakInfos.length;d++){var e=
a.classBreakInfos[d],f={};f.range=[c,e.classMaxValue];c=e.classMaxValue;f.vectorOptions=this._parseSymbology(e.symbol);f.label=e.label;b.push(f)}symbology.ranges=b}return symbology},_parseSymbology:function(a){var b={};switch(a.type){case "esriSMS":case "esriPMS":a=L.Icon.extend({iconUrl:"data:"+a.contentType+";base64,"+a.imageData,shadowUrl:null,iconSize:new L.Point(a.width,a.height),iconAnchor:new L.Point(a.width/2+a.xoffset,a.height/2+a.yoffset),popupAnchor:new L.Point(0,-(a.height/2))});b.icon=
new a;break;case "esriSLS":b.weight=a.width;b.color=this._parseColor(a.color);b.opacity=this._parseAlpha(a.color[3]);break;case "esriSFS":a.outline?(b.weight=a.outline.width,b.color=this._parseColor(a.outline.color),b.opacity=this._parseAlpha(a.outline.color[3])):(b.weight=0,b.color="#000000",b.opacity=0),a.style!="esriSFSNull"?(b.fillColor=this._parseColor(a.color),b.fillOpacity=this._parseAlpha(a.color[3])):(b.fillColor="#000000",b.fillOpacity=0)}return b},_parseColor:function(a){red=this._normalize(a[0]);
green=this._normalize(a[1]);blue=this._normalize(a[2]);return"#"+this._pad(red.toString(16))+this._pad(green.toString(16))+this._pad(blue.toString(16))},_normalize:function(a){return a<1&&a>0?Math.floor(a*255):a},_pad:function(a){return a.length>1?a.toUpperCase():"0"+a.toUpperCase()},_parseAlpha:function(a){return a/255},_getFeatures:function(){this.options.uniqueField||this._clearFeatures();var a=this.options.url+"query?returnGeometry=true&outSR=4326&f=json&outFields="+this.options.fields+"&where="+
this.options.where+"&callback="+this._globalPointer+"._processFeatures";this.options.showAll||(a+="&inSR=4326&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&geometry="+this.options.map.getBounds().toBBoxString());this._makeJsonpRequest(a)},_processFeatures:function(a){if(this.options.map){var b=this.options.map.getBounds();if(!this._lastQueriedBounds||!this._lastQueriedBounds.equals(b)||this.options.autoUpdate)if(this._lastQueriedBounds=b,a&&a.features&&a.features.length)for(b=
0;b<a.features.length;b++){var d=!1;if(this.options.uniqueField)for(var c=0;c<this._vectors.length;c++)if(a.features[b].attributes[this.options.uniqueField]==this._vectors[c].attributes[this.options.uniqueField]&&(d=!0,this.options.dynamic)){if(this._getGeometryChanged(this._vectors[c].geometry,a.features[b].geometry)&&!isNaN(a.features[b].geometry.x)&&!isNaN(a.features[b].geometry.y))this._vectors[c].geometry=a.features[b].geometry,this._vectors[c].vector.setLatLng(new L.LatLng(this._vectors[c].geometry.y,
this._vectors[c].geometry.x)),this._vectors[c].popup?this._vectors[c].popup.setLatLng(new L.LatLng(this._vectors[c].geometry.y,this._vectors[c].geometry.x)):this.popup&&this.popup.associatedFeature==this._vectors[c]&&this.popup.setLatLng(new L.LatLng(this._vectors[c].geometry.y,this._vectors[c].geometry.x));if(this._getPropertiesChanged(this._vectors[c].attributes,a.features[b].attributes)&&(this._vectors[c].attributes=a.features[b].attributes,this.options.popupTemplate&&this._setPopupContent(this._vectors[c]),
this.options.symbology&&this.options.symbology.type!="single"))if(this._vectors[c].vectors)for(var e=0,f=this._vectors[c].vectors.length;e<f;e++)this._vectors[c].vectors[e].setStyle?this._vectors[c].vectors[e].setStyle(this._getFeatureVectorOptions(this._vectors[c])):this._vectors[c].vectors[e].setIcon&&this._vectors[c].vectors[e].setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon);else this._vectors[c].vector&&(this._vectors[c].vector.setStyle?this._vectors[c].vector.setStyle(this._getFeatureVectorOptions(this._vectors[c])):
this._vectors[c].vector.setIcon&&this._vectors[c].vector.setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon))}if(!d||!this.options.uniqueField){d=this._esriJsonGeometryToLeaflet(a.features[b].geometry,this._getFeatureVectorOptions(a.features[b]));a.features[b][d instanceof Array?"vectors":"vector"]=d;if(a.features[b].vector)this.options.map.addLayer(a.features[b].vector);else if(a.features[b].vectors&&a.features[b].vectors.length)for(e=0;e<a.features[b].vectors.length;e++)this.options.map.addLayer(a.features[b].vectors[e]);
this._vectors.push(a.features[b]);if(this.options.popupTemplate){var g=this,d=a.features[b];this._setPopupContent(d);(function(a){if(a.vector)a.vector.on("click",function(b){g._showPopup(a,b)});else if(a.vectors)for(var b=0,c=a.vectors.length;b<c;b++)a.vectors[b].on("click",function(b){g._showPopup(a,b)})})(d)}}}}}});lvector.A2E=lvector.AGS.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');this._globalPointer="A2E_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;a.url.substr(a.url.length-1,1)!=="/"&&(a.url+="/");this._originalOptions=lvector.Util.extend({},a);if(a.esriOptions)if(typeof a.esriOptions=="object")lvector.Util.extend(a,this._convertEsriOptions(a.esriOptions));
else{this._getEsriOptions();return}lvector.Layer.prototype.initialize.call(this,a);if(this.options.where)this.options.where=encodeURIComponent(this.options.where);this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2)a=this.options.map.getZoom(),b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}if(this.options.autoUpdate&&this.options.esriOptions.editFeedInfo){this._makeJsonpRequest("http://cdn.pubnub.com/pubnub-3.1.min.js");
var c=this;this._pubNubScriptLoaderInterval=setInterval(function(){window.PUBNUB&&c._pubNubScriptLoaded()},200)}},_pubNubScriptLoaded:function(){clearInterval(this._pubNubScriptLoaderInterval);this.pubNub=PUBNUB.init({subscribe_key:this.options.esriOptions.editFeedInfo.pubnubSubscribeKey,ssl:!1,origin:"pubsub.pubnub.com"});var a=this;this.pubNub.subscribe({channel:this.options.esriOptions.editFeedInfo.pubnubChannel,callback:function(){a._getFeatures()},error:function(){}})}});lvector.GeoIQ=lvector.GeoJSONLayer.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');lvector.Layer.prototype.initialize.call(this,a);this._globalPointer="GeoIQ_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2)a=this.options.map.getZoom(),
b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}},options:{dataset:null},_requiredParams:["dataset"],_getFeatures:function(){this.options.uniqueField||this._clearFeatures();var a="http://geocommons.com/datasets/"+this.options.dataset+"/features.json?geojson=1&callback="+this._globalPointer+"._processFeatures&limit=999";this.options.showAll||(a+="&bbox="+this.options.map.getBounds().toBBoxString()+"&intersect=full");this._makeJsonpRequest(a)},_processFeatures:function(a){if(this.options.map){var a=
JSON.parse(a),b=this.options.map.getBounds();if(!this._lastQueriedBounds||!this._lastQueriedBounds.equals(b)||this.options.autoUpdate)if(this._lastQueriedBounds=b,a&&a.features&&a.features.length)for(b=0;b<a.features.length;b++){var d=!1;if(this.options.uniqueField)for(var c=0;c<this._vectors.length;c++)if(a.features[b].properties[this.options.uniqueField]==this._vectors[c].properties[this.options.uniqueField]&&(d=!0,this.options.dynamic)){if(this._getGeometryChanged(this._vectors[c].geometry,a.features[b].geometry)&&
!isNaN(a.features[b].geometry.coordinates[0])&&!isNaN(a.features[b].geometry.coordinates[1]))this._vectors[c].geometry=a.features[b].geometry,this._vectors[c].vector.setLatLng(new L.LatLng(this._vectors[c].geometry.coordinates[1],this._vectors[c].geometry.coordinates[0]));if(this._getPropertiesChanged(this._vectors[c].properties,a.features[b].properties)&&(this._vectors[c].properties=a.features[b].properties,this.options.popupTemplate&&this._setPopupContent(this._vectors[c]),this.options.symbology&&
this.options.symbology.type!="single"))if(this._vectors[c].vectors)for(var e=0,f=this._vectors[c].vectors.length;e<f;e++)this._vectors[c].vectors[e].setStyle?this._vectors[c].vectors[e].setStyle(this._getFeatureVectorOptions(this._vectors[c])):this._vectors[c].vectors[e].setIcon&&this._vectors[c].vectors[e].setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon);else this._vectors[c].vector&&(this._vectors[c].vector.setStyle?this._vectors[c].vector.setStyle(this._getFeatureVectorOptions(this._vectors[c])):
this._vectors[c].vector.setIcon&&this._vectors[c].vector.setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon))}if(!d||!this.options.uniqueField){d=this._geoJsonGeometryToLeaflet(a.features[b].geometry,this._getFeatureVectorOptions(a.features[b]));a.features[b][d instanceof Array?"vectors":"vector"]=d;if(a.features[b].vector)this.options.map.addLayer(a.features[b].vector);else if(a.features[b].vectors&&a.features[b].vectors.length)for(e=0;e<a.features[b].vectors.length;e++)this.options.map.addLayer(a.features[b].vectors[e]);
this._vectors.push(a.features[b]);if(this.options.popupTemplate){var g=this,d=a.features[b];this._setPopupContent(d);(function(a){if(a.vector)a.vector.on("click",function(b){g._showPopup(a,b)});else if(a.vectors)for(var b=0,c=a.vectors.length;b<c;b++)a.vectors[b].on("click",function(b){g._showPopup(a,b)})})(d)}}}}}});lvector.CartoDB=lvector.GeoJSONLayer.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');lvector.Layer.prototype.initialize.call(this,a);this._globalPointer="CartoDB_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2)a=
this.options.map.getZoom(),b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}},options:{version:1,user:null,table:null,fields:"*",where:null,limit:null,uniqueField:"cartodb_id"},_requiredParams:["user","table"],_getFeatures:function(){var a=this.options.where||"";if(!this.options.showAll)for(var b=this.options.map.getBounds(),d=b.getSouthWest(),b=b.getNorthEast(),c=this.options.table.split(",").length,e=0;e<c;e++)a+=(a.length?" AND ":"")+(c>1?this.options.table.split(",")[e].split(".")[0]+
".the_geom":"the_geom")+" && st_setsrid(st_makebox2d(st_point("+d.lng+","+d.lat+"),st_point("+b.lng+","+b.lat+")),4326)";this.options.limit&&(a+=(a.length?" ":"")+"limit "+this.options.limit);a=a.length?" "+a:"";this._makeJsonpRequest("http://"+this.options.user+".cartodb.com/api/v"+this.options.version+"/sql?q="+encodeURIComponent("SELECT "+this.options.fields+" FROM "+this.options.table+(a.length?" WHERE "+a:""))+"&format=geojson&callback="+this._globalPointer+"._processFeatures")}});lvector.PRWSF=lvector.GeoJSONLayer.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');a.url.substr(a.url.length-1,1)!=="/"&&(a.url+="/");lvector.Layer.prototype.initialize.call(this,a);this._globalPointer="PRWSF_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof
Array&&this.options.scaleRange.length===2)a=this.options.map.getZoom(),b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}},options:{geotable:null,srid:null,geomFieldName:"the_geom",fields:"",where:null,limit:null,uniqueField:null},_requiredParams:["url","geotable"],_getFeatures:function(){var a=this.options.where||"";if(!this.options.showAll){var b=this.options.map.getBounds(),d=b.getSouthWest(),b=b.getNorthEast();a+=a.length?" AND ":"";a+=this.options.srid?this.options.geomFieldName+
" && transform(st_setsrid(st_makebox2d(st_point("+d.lng+","+d.lat+"),st_point("+b.lng+","+b.lat+")),4326),"+this.options.srid+")":"transform("+this.options.geomFieldName+",4326) && st_setsrid(st_makebox2d(st_point("+d.lng+","+d.lat+"),st_point("+b.lng+","+b.lat+")),4326)"}this.options.limit&&(a+=(a.length?" ":"")+"limit "+this.options.limit);d=(this.options.fields.length?this.options.fields+",":"")+"st_asgeojson(transform("+this.options.geomFieldName+",4326)) as geojson";this._makeJsonpRequest(this.options.url+
"v1/ws_geo_attributequery.php?parameters="+encodeURIComponent(a)+"&geotable="+this.options.geotable+"&fields="+encodeURIComponent(d)+"&format=json&callback="+this._globalPointer+"._processFeatures")},_processFeatures:function(a){if(this.options.map){var b=this.options.map.getBounds();if(!this._lastQueriedBounds||!this._lastQueriedBounds.equals(b)||this._autoUpdateInterval)if(this._lastQueriedBounds=b,a&&parseInt(a.total_rows))for(b=0;b<a.rows.length;b++){a.rows[b].geometry=a.rows[b].row.geojson;delete a.rows[b].row.geojson;
a.rows[b].properties=a.rows[b].row;delete a.rows[b].row;var d=!1;if(this.options.uniqueField)for(var c=0;c<this._vectors.length;c++)if(a.rows[b].properties[this.options.uniqueField]==this._vectors[c].properties[this.options.uniqueField]&&(d=!0,this.options.dynamic)){if(this._getGeometryChanged(this._vectors[c].geometry,a.rows[b].geometry)&&!isNaN(a.rows[b].geometry.coordinates[0])&&!isNaN(a.rows[b].geometry.coordinates[1]))this._vectors[c].geometry=a.rows[b].geometry,this._vectors[c].vector.setPosition(new L.LatLng(this._vectors[c].geometry.coordinates[1],
this._vectors[c].geometry.coordinates[0]));if(this._getPropertiesChanged(this._vectors[c].properties,a.rows[b].properties)&&(this._vectors[c].properties=a.rows[b].properties,this.options.infoWindowTemplate&&this._setInfoWindowContent(this._vectors[c]),this.options.symbology&&this.options.symbology.type!="single"))if(this._vectors[c].vector)this._vectors[c].vector.setOptions(this._getFeatureVectorOptions(this._vectors[c]));else if(this._vectors[c].vectors)for(var e=0,f=this._vectors[c].vectors.length;e<
f;e++)this._vectors[c].vectors[e].setOptions(this._getFeatureVectorOptions(this._vectors[c]))}if(!d||!this.options.uniqueField){d=this._geoJsonGeometryToLeaflet(a.rows[b].geometry,this._getFeatureVectorOptions(a.rows[b]));a.rows[b][d instanceof Array?"vectors":"vector"]=d;if(a.rows[b].vector)this.options.map.addLayer(a.rows[b].vector);else if(a.rows[b].vectors&&a.rows[b].vectors.length)for(e=0;e<a.rows[b].vectors.length;e++)this.options.map.addLayer(a.rows[b].vectors[e]);this._vectors.push(a.rows[b]);
if(this.options.popupTemplate){var g=this,d=a.rows[b];this._setPopupContent(d);(function(a){if(a.vector)a.vector.on("click",function(b){g._showPopup(a,b)});else if(a.vectors)for(var b=0,c=a.vectors.length;b<c;b++)a.vectors[b].on("click",function(b){g._showPopup(a,b)})})(d)}}}}}});lvector.GISCloud=lvector.GeoJSONLayer.extend({initialize:function(a){for(var b=0,d=this._requiredParams.length;b<d;b++)if(!a[this._requiredParams[b]])throw Error('No "'+this._requiredParams[b]+'" parameter found.');lvector.Layer.prototype.initialize.call(this,a);this._globalPointer="GISCloud_"+Math.floor(Math.random()*1E5);window[this._globalPointer]=this;this._vectors=[];if(this.options.map){if(this.options.scaleRange&&this.options.scaleRange instanceof Array&&this.options.scaleRange.length===2)a=
this.options.map.getZoom(),b=this.options.scaleRange,this.options.visibleAtScale=a>=b[0]&&a<=b[1];this._show()}},options:{mapID:null,layerID:null,uniqueField:"id"},_requiredParams:["mapID","layerID"],_getFeatures:function(){var a="http://api.giscloud.com/1/maps/"+this.options.mapID+"/layers/"+this.options.layerID+"/features.json?geometry=geojson&epsg=4326&callback="+this._globalPointer+"._processFeatures";this.options.showAll||(a+="&bounds="+this.options.map.getBounds().toBBoxString());this.options.where&&
(a+="&where="+encodeURIComponent(this.options.where));this._makeJsonpRequest(a)}});
