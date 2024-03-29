//******************************************************************************
//this file contains quality assessment functionality for OpenAddresses project
//author: Hans-J�rg Stark
//date: December 2010
//******************************************************************************

Ext.namespace("openaddresses");

//global variables to store oid and for comparison purpose
var g_oid;
var g_str;
var g_addr;
var g_hnr;
var g_zip;
var g_city;
var g_lat;
var g_lng;
var g_date;
var g_country;

////*******************************************************************************
////general functions**************************************************************
////*******************************************************************************
function comparison(val1, val2) {
		//Comparison of address-information
		if (val1.toLowerCase() == val2.toLowerCase()) {	//str & hnr are equal
			return 'TRUE';
		} else {
			return 'FALSE';	
		}
}

function computedist(lat1, lon1, lat2, lon2) {
//source: http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
	var R = 6371; // Radius of the earth in km
	var dLat = (lat2-lat1)/180*Math.PI;  // Javascript functions in radians
	var dLon = (lon2-lon1)/180*Math.PI; 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1/180*Math.PI) * Math.cos(lat2/180*Math.PI) * 
			Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km

	return d.toPrecision(10)*1000;

}
	   
function getTimeStamp() {
//get cur timestamp
var d = new Date();
var ts;
ts=d.getFullYear();
if(d.getMonth()<=9){
	ts = ts + "-0" + (d.getMonth()+1);
} else {
	ts=ts+ "-" + (d.getMonth()+1);
}
if(d.getDate()<=9){
	ts = ts + "-0" + (d.getDate());
} else {
	ts=ts+ "-" + (d.getDate());
}
if(d.getHours()<=9){
	ts = ts + "-0" + (d.getHours());
} else {
	ts=ts+ "-" + (d.getHours());
}
if(d.getMinutes()<=9){
	ts = ts + ":0" + (d.getMinutes());
} else {
	ts=ts+ ":" + (d.getMinutes());
}
if(d.getSeconds()<=9){
	ts = ts + ":0" + (d.getSeconds());
} else {
	ts=ts+ ":" + (d.getSeconds());
}
return ts;

}

//the following functions provided by http://www.somacon.com/p355.php
function ltrim(str) { 
	for(var k = 0; k < str.length && isWhitespace(str.charAt(k)); k++);
	return str.substring(k, str.length);
}
function rtrim(str) {
	for(var j=str.length-1; j>=0 && isWhitespace(str.charAt(j)) ; j--) ;
	return str.substring(0,j+1);
}
function trim(str) {
	return ltrim(rtrim(str));
}
function isWhitespace(charToCheck) {
	var whitespaceChars = " \t\n\r\f";
	return (whitespaceChars.indexOf(charToCheck) != -1);
}

////*******************************************************************************
////Bing*******************************************************************************
////*******************************************************************************
function send2BingGeocoder(str,hnr,zip,city,country) {

	//processes address information from DB via Bing geocoder
	//API Info found at 
	//http://msdn.microsoft.com/en-us/library/bb429645.aspx
	//http://msdn.microsoft.com/en-us/library/bb429615.aspx and others
	if (country=='FR' || country=='GB') {
		g_addr = hnr + " " + str;
	} else {
	   g_addr = str + " " + hnr;	
	}

	var adrInfo=str + " " + hnr + ", " + zip + " " + city + " " + country;
	g_country = adrInfo.substring(adrInfo.length-2);
	results = bingmap.Find(null,adrInfo,null,null,0,1,false,false,false,false,evaluateResults);
}

function evaluateResults(layer, resultsArray, places, hasMore, veErrorMessage){
	var addr = "";
	var zip = "";
	var city = "";
	var lat = 0;
	var lng = 0;
	var PlaceMatchCode = "";
	var PlaceMatchConfidence =  "";
	var PlacePrecision = "";
	var acc = "";
	

	if(places)	{
	
		if (places.length>0) {
			var place = places[0];

			var addr_array=place.Name.split(",");
			lat = place.LatLong.Latitude;
			lng = place.LatLong.Longitude;

			if (addr_array.length == 1) {
				addr = "";
				zip = parseInt(addr_array[0]);
				if (zip === 0) {
					city = addr_array[0];
				} else {
					city = "";
				}				
			} 

			if (addr_array.length == 2) {			  // two values comma-separated
				if (g_country=='GB') {
					addr = addr_array[0];
					city = addr_array[1].split(" ")[1];
					zip = addr_array[1].replace(city,"");
				} else {
					if (addr_array[1]== " Switzerland"){
						city = addr_array[0];
					} else {
						addr = addr_array[0];
						zip = addr_array[1].split(" ")[1];
						city = addr_array[1].split(" ")[2];
					}
				}

			}
			if (addr_array.length == 3) {			  // two values comma-separated
				if (g_country=='GB') {
					if ((addr_array[2]) == " United Kingdom") {
						zip = addr_array[0];
						city = addr_array[1];
					} else {
						addr = addr_array[0];
						city = addr_array[1].split(" ")[1];
						zip = addr_array[1].replace(city,"");
					}
				}
				else if (g_country=='ES') {
					addr = addr_array[0] + " " + addr_array[1];
					zip = addr_array[2].split(" ")[1];
					city = addr_array[2].replace(zip,"");
				} 
				else {
					addr = addr_array[0];
					zip = addr_array[1].split(" ")[1];
					city = addr_array[1].split(" ")[2];
				}
			}

			//Determine MatchConfidence
			if (place.MatchConfidence==VEMatchConfidence.High){
				PlaceMatchConfidence = "High";
			}
			if (place.MatchConfidence==VEMatchConfidence.Medium){
				PlaceMatchConfidence = "Medium";
			} 
			if (place.MatchConfidence==VEMatchConfidence.Low){
				PlaceMatchConfidence = "Low";
			}
			//Determine MatchCode
			if (place.MatchCode==VEMatchCode.None){
				PlaceMatchCode = "None";
			}
			if (place.MatchCode==VEMatchCode.Good){
				PlaceMatchCode = "Good";
			}
			if (place.MatchCode==VEMatchCode.Ambiguous){
				PlaceMatchCode = "Ambiguous";
			}
			if (place.MatchCode==VEMatchCode.UpHierarchy){
				PlaceMatchCode = "UpHierarchy";
			}
			if (place.MatchCode==VEMatchCode.Modified){
				PlaceMatchCode = "Modified";
			}
			//Determine LocationPrecision
			if (place.Precision==VELocationPrecision.Interpolated){
				PlacePrecision = "Interpolated";
			}
			if (place.Precision==VELocationPrecision.Rooftop){
				PlacePrecision = "Rooftop";
			}
		}
	}

		//get rid of leading spaces
		if (addr.length>0){
			addr=ltrim(addr);
		}
		if (zip.length>0){
			zip=ltrim(zip);
		}
		if (city.length>0){
			city=ltrim(city);
		}
	
		//geocoding accuracy
		acc = PlaceMatchCode + " / " + PlaceMatchConfidence + " / " + PlacePrecision;

		//Comparison of address-information
		c_addr = comparison(addr, g_addr);
		c_zip = comparison(zip, g_zip);
		c_city = comparison(city, g_city);
		//compute distance
		c_dist = computedist(g_lat, g_lng, lat, lng);

		//check geocoding precision
		if (acc.substring(0,11) == 'Good / High') {
			c_acc = "TRUE";
		} else {
			c_acc = "FALSE";
		}

		var curtimestamp = getTimeStamp();
		var paramlist = "bing_dist=" + c_dist + "&bing_addr=" + c_addr + "&bing_precision=" + c_acc + "&bing_zip=" + c_zip + "&bing_city=" + c_city + "&date=" + curtimestamp;			
		//http://127.0.0.1:5000/qa/doupdate/13898308?type=keiner&yahoo_addr=TRUE&yahoo_dist=99.123
		var qaurl= "qa/doupdate/" + g_oid + "?" + paramlist;
		var conn1 = new Ext.data.Connection();
		conn1.request({
			url: qaurl,
			method: 'GET',
			success: function(resp, opt) {
				//seems to work all right;
			},
			failure: function(resp, opt) {
				alert(OpenLayers.i18n('Error during data storage'));
			}
		});
		
}	//function Bing geocoding


////*******************************************************************************
////Google*******************************************************************************
////*******************************************************************************
function send2GMGeocoder(str,hnr,zip,city,country) {
	//processes address information from DB via GM geocoder

	var u_addr;
	if (country=='FR' || country=='GB') {
		u_addr = hnr + " " + str;
	} else {
		if (country=='ES'){
		   u_addr = str + ", " + hnr;	
		} else {
		   u_addr = str + " " + hnr;	
		}
	}

	var adrInfo = hnr + "+" + str + "+" + zip + "+" + city + "+" + country;
	var geocoder = new GClientGeocoder();
	geocoder.getLocations(adrInfo, 
		function showAddress(response) {

			var lng = 0;
			var lat = 0;
			var adr = "-";
			var zip = "";
			var cty = "-";
			var acc;
			var accN = "";
			var warn = "";

			//if no good response from GM...
			if (!response || response.Status.code != 200) {
				switch (response.Status.code)
					{
					case 400:
						warn = "Bad request";
						break;
					case 500:
						warn = "Server error";
						break;
					case 601:
						warn = "Missing query parameter q";
						break;
					case 602:
						warn = "Unknown address";
						break;
					case 603:
						warn = "Unavailable address";
						break;
					case 604:
						warn = "Unknown directions";
						break;
					case 610:
						warn = "Bad key";
						break;
					case 620:
						warn = "Too many queries for this key in 24h";
						break;
					default:
					   warn ="unknown problem";
					}
			
			} else {
				place = response.Placemark[0];
				lng = place.Point.coordinates[0];
				lat = place.Point.coordinates[1];

				if (place.AddressDetails.Accuracy) { 
					accN = place.AddressDetails.Accuracy;

					switch (accN)
					{
					case 1:
					   acc="country";
					   break;
					case 2:
					   acc="region";	//Canton
					   break;
					case 3:
					   acc="municipality";
					   break;
					case 4:
					   acc="city";
						if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea) {
							if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality) { 
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName) { 
									cty = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
								}
							}	
						}
					   break;
					case 5:
					   acc="zip";
						if (place.AddressDetails.Country.AdministrativeArea) {
							if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea) {
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName) { 
										cty = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
									}
								}	
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber) { 
										zip = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber;
									}
								}
							}
						} else if (place.AddressDetails.Country.PostalCode) {
							if (place.AddressDetails.Country.PostalCode.PostalCodeNumber) {
								zip = place.AddressDetails.Country.PostalCode.PostalCodeNumber;
							}	
						}
	
					   break;
					case 6:
					   acc="street";
						if (place.AddressDetails.Country) { 
							if (place.AddressDetails.Country.Thoroughfare) { 
								if (place.AddressDetails.Country.Thoroughfare.ThoroughfareName) { 
									adr = place.AddressDetails.Country.Thoroughfare.ThoroughfareName;
								}
							}
							if (place.AddressDetails.Country.AdministrativeArea) { 
								if (place.AddressDetails.Country.AdministrativeArea.Locality) { 
									if (place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare) { 
										if (place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName) { 
											adr = place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
										}
									}
									if (place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode) { 
										if (place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber) { 
											zip = place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber;
										}
									}
										if (place.AddressDetails.Country.AdministrativeArea.Locality.LocalityName) { 
										cty = place.AddressDetails.Country.AdministrativeArea.Locality.LocalityName;
									}
								}
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality) { 
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare) { 
											if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare.ThoroughfareName) { 
												adr = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
											}
										}
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode) { 
											if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber) { 
												zip = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber;
											}
										}
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName) { 
											cty = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
										}
									}
								}
							}
						}
						break;
					case 7:
					   acc="intersection";
					   break;
					case 8:
					   acc="address";

						if (place.AddressDetails.Country.AdministrativeArea) { 
							if (place.AddressDetails.Country.AdministrativeArea.Locality) { 
								if (place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare) { 
									if (place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName) { 
										adr = place.AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
									}
								}
								if (place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode) { 
									if (place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber) { 
										zip = place.AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber;
									}
								}
								if (place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality) { 
									if (place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.Thoroughfare) { 
										if (place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.Thoroughfare.ThoroughfareName) { 
											adr = place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.Thoroughfare.ThoroughfareName;
										}
									}
									if (place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.PostalCode) { 
										if (place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.PostalCode.PostalCodeNumber) { 
											zip = place.AddressDetails.Country.AdministrativeArea.Locality.DependentLocality.PostalCode.PostalCodeNumber;
										}
									}
								}
								if (place.AddressDetails.Country.AdministrativeArea.Locality.LocalityName) { 
									cty = place.AddressDetails.Country.AdministrativeArea.Locality.LocalityName;
								}
							}
							if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea) { 
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare) { 
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare.ThoroughfareName) { 
											adr = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
										}
									}
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode) { 
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber) { 
											zip = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.PostalCode.PostalCodeNumber;
										}
									}
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName) { 
										cty = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
									}
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality) { 
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.Thoroughfare) { 
											if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.Thoroughfare.ThoroughfareName) { 
												adr = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.Thoroughfare.ThoroughfareName;
												adr = adr.split(",")[0];
												}
										}
										if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.PostalCode) { 
											if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.PostalCode.PostalCodeNumber) { 
												zip = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.DependentLocality.PostalCode.PostalCodeNumber;
											}
										}
									}
								}
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Thoroughfare) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Thoroughfare.ThoroughfareName) { 
										adr = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Thoroughfare.ThoroughfareName;
										adr = adr.split(",")[0];
										}
								}
								if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.PostalCode) { 
									if (place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.PostalCode.PostalCodeNumber) { 
										zip = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.PostalCode.PostalCodeNumber;
									}
								}
								
							}
						}	
					   break;
					default:
					   acc="-";
					}
				}
			
			} //if - response ok
			//get rid of leading spaces
			if (adr.length>0){
				adr=ltrim(adr);
			}
			if (zip.length>0){
				zip=ltrim(zip);
			}
			if (cty.length>0){
				cty=ltrim(cty);
			}

			//Comparison of address-information
			c_addr = comparison(adr, u_addr);
			c_zip = comparison(zip, g_zip);
			c_city = comparison(cty, g_city);
			//compute distance
			c_dist = computedist(g_lat, g_lng, lat, lng);

			//check geocoding precision
			if (acc == 'address') {
				c_acc = "TRUE";
			} else {
				c_acc = "FALSE";
			}

			var curtimestamp = getTimeStamp();
			var paramlist = "google_dist=" + c_dist + "&google_addr=" + c_addr + "&google_precision=" + c_acc + "&google_zip=" + c_zip + "&google_city=" + c_city + "&date=" + curtimestamp;			
			//http://127.0.0.1:5000/qa/doupdate/13898308?type=keiner&yahoo_addr=TRUE&yahoo_dist=99.123
			var qaurl= "qa/doupdate/" + g_oid + "?" + paramlist;
			var conn1 = new Ext.data.Connection();
			conn1.request({
				url: qaurl,
				method: 'GET',
				success: function(resp, opt) {
					//seems to work all right;
				},
				failure: function(resp, opt) {
					alert(OpenLayers.i18n('Error during data storage'));
				}
			});
		
		}
	);	
}


//**********************************************************************
//Function that handles the qa procedure when an address is created
//**********************************************************************
//**********************************************************************
//**********************************************************************

function qa_ComparisonWithOWMS(str,hnr,adrzusatz,zip,city,usr,lng,lat,oid,country) {
//this function calls bing, google, yahoo geocoders
//populate global variables
g_oid = oid;
g_zip = zip;
g_city = city;
g_lat = lat;
g_lng = lng;

//call bing maps & Google Maps
send2BingGeocoder(str,hnr,zip,city,country);
send2GMGeocoder(str,hnr,zip,city,country);


//call yahoo maps
var paramlist = "street=" + str + "&house=" + hnr + "&postal=" + zip + "&city=" + city + "&country=" + country + "&lat=" + lat + "&lng=" + lng;			
//test url: http://127.0.0.1:5000/yahoo/doupdate/13898437?street=Kriegackerstrasse&house=40&postal=4132&city=Muttenz
var qaurl= "yahoo/doupdate/" + g_oid + "?" + paramlist;

var conn1 = new Ext.data.Connection();
conn1.request({
	url: qaurl,
	method: 'GET',
	success: function(resp, opt) {
		//seems to work all right;
	},
	failure: function(resp, opt) {
		alert(OpenLayers.i18n('Error during data storage'));
	}
});

}