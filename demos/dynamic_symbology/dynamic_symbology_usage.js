/**
 * example of how to make a layer with dynamic symbols based on feature properties
 */

dove_cartodb = new lvector.CartoDB({
	user : "cartodb_user",
	table : "cartodb_table",
	scaleRange : [11, 20],
	uniqueField : "cartodb_id",
	// make sure you request fields needed by the formatter function
	fields : "field1,field2,category,size,the_geom",
	symbology : {
		type : "dynamic",
		vectorOptions : {
			icon : getCustomIcon
		}
		
	},
	popupTemplate : 'blah',
	singlePopup : true
});
function getCustomIcon(feature) {
	var thisIconUrl = getIconUrl(feature);
	var thisIconSize = getIconSize(feature);
	var customIcon = L.Icon.extend({
		iconUrl : thisIconUrl,
		iconSize : thisIconSize,
		shadowUrl : "singleShadowImage.png"
	});
	return new customIcon();

}

function getIconUrl(input) {
	/* Return appropriate icon image based on one property */
	var iconFile;
	var iconSpecifier = input.properties.category;
	if(iconSpecifier == 6) {
		iconFile = "bell_6.png";
	} else if(iconSpecifier == 8) {
		iconFile = "bell_8.png";
	} else if(iconSpecifier == 10) {
		iconFile = "bell_10.png";
	} else if(iconSpecifier > 10) {
		iconFile = "bell_12.png";
	} else {
		iconFile = "bell_lt6.png";
	}
	return "images/icons/" + iconFile;
}

var categoryMeans = {
	// retrieved from cartodb with group by query
	3 : 7.27,
	4 : 8.34,
	5 : 9.73,
	6 : 10.51,
	8 : 14.27,
	9 : 11,
	10 : 20.59,
	12 : 27.27,
	14 : 36,
	16 : 37.67,
}

function getIconSize(input) {
	/* Return icon size according to the size property of that feature compared to the average for all features
	 * of that category
	 */
	var iconSize;
	var categoryValue = input.properties.category;
	// features with average size value for their category get icon size 48 pixels. maybe too big
	// create the icon images to have an actual pixel size something like this to minimise scaling
	// smaller / larger ones get smaller / larger icon according to square root of the change so overall
	// area occupied by icon is in proportion... change to suit.
	// also, maybe set size according to map size / screen resolution (smaller on mobile etc?)
	var iconsize = Math.round(Math.sqrt(input.properties.size / categoryMeans[categoryValue]) * 48)
	return new L.Point(iconsize, iconsize);
}