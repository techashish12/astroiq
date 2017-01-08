const request = require('request');
const {mongoose} = require('./../server/db/mongoose');
const {Geo} = require('./../server/models/geo');
const {HospitalData} = require('./../server/models/hospitalData');
const googleApiKey = 'AIzaSyAOeXTgZTB_cJUyV9B2DOiZI_6LoVU2vs8';
const googleApiBaseUrl = 'https://maps.googleapis.com/maps/api/';
const googleGeocodeBaseUrl = googleApiBaseUrl + 'geocode/json';
const googlePlacesBaseUrl = googleApiBaseUrl + 'place/nearbysearch/json';

var geocode = {

	buildRequest: (data,type = 'geocode') => {
		var href='',searchStr='';	
    switch (type) {
      case 'hospital':
      case 'hospitals':
        if (data instanceof Array) {
          searchStr = data.join(',');
        } else {
          searchStr = data.toString();
        }
        href = `${googlePlacesBaseUrl}?location=${searchStr}&type=hospital&keyword=maternity&radius=10000`;
        break;
      default:
        searchStr = encodeURIComponent(data);
        href = `${googleGeocodeBaseUrl}?address=${searchStr}`;
        break;
    }
    href += `&key=${googleApiKey}`;
		return {
		  url: href,
		  json: true,
		  rejectUnauthorized: false,
		  port: 443
		}
	},

  filterHospitals: (results) => {
    var data = {
        items: [],
        valid: false
      },
      numRes=results.length,
      i=0,res,item;
      for (;i<numRes;i++) {
        res = results[i];
        if (res.types) {
          if (res.types[0] == 'hospital') {
            item = {};
            item.id = res.id;
            item.name = res.name;
            item.coords = res.geometry.location;
            item.vicinity = res.vicinity;
            item.types = res.types.map(tp => tp.toString());
            data.items.push(item);
          }
        }
        
        
      }
      data.num_items = data.items.length;
      return data;
  },

  handlePlaceSearch: (body,callback) => {
    var results = body.results;
    if (results.length>0) {
      var data = geocode.filterHospitals(results);
      if (data.num_items > 0) {
        data.valid = true;
      }
      callback(undefined,data);
    }
  },

  handleLocationSearch: (body,callback,type) => {
    var result = body.results[0];
    if (result.geometry) {
      var numRes = body.results.length,other=[];
      if (numRes > 1) {
        body.results.shift()
        other = body.results;
      }
      var geo = result.geometry,
        data = {
          address: result.formatted_address,
          lat: geo.location.lat,
          lng: geo.location.lng,
          components: result.address_components[0],
          type: geo.location_type,
          other: other
        };
        if (data.type == 'APPROXIMATE') {
          type = 'full';
        }
        if (type == 'full') {
          geocode.mergeHospitals(data,callback);
        } else {
          callback(undefined,data);
        }
    }
  },

  mergeHospitals: (data,callback) => {
    var coords = data.lat + ',' + data.lng;
    request(geocode.buildRequest(coords,'hospital'), (error, response, body) => {
      if (error){
        res.status(404).send({valid:false,message:error});
      } else {
        if (body.results) {
          data.hospitals = geocode.filterHospitals(body.results);
        }
        callback(undefined,data);
      }
    });
  },

	handleResponse: (type='geocode',error, body, callback) => {
		if (error) {
			callback('Unable to connect to Google servers' + JSON.stringify(error));
		} else if (body.status === 'ZERO_RESULTS') {
			callback('Unable to find a matching address');
		} else if (body.status === 'OK') {
		  if (body.results) {
		  	switch (type) {
          case 'hospital':
          case 'hospitals':
            geocode.handlePlaceSearch(body,callback);
            break;
          default:
            geocode.handleLocationSearch(body,callback,type);
            break;
        }
		  }
		  
		}
	},

	geocodeAddress: (data,type,callback) => {
		request(geocode.buildRequest(data,type), (error, response, body) => {
			geocode.handleResponse(type,error,body, callback);
		});
	},

  fetchHospitals: (searchString,res) => {
    geocode.geocodeAddress(searchString,'hospital', (errorMessage, result) => {
      if (errorMessage){
        res.status(404).send({valid:false,message:errorMessage});
      } else {
        var parts = searchString.split(','),
        coords = {
          lat: parseFloat(parts[0]),
          lng: parseFloat(parts[1])
        };
        var hd = new HospitalData({
            coords: coords,
            radius: 10000,
            items: result.items
          });
          hd.save().then((doc) => {
            var result = {};
            result.coords = doc.coords;
            result.radius = doc.radius;
            result.items = doc.items;
            result.num_items = doc.items.length;
            result.valid = true;
            result.stored = true;
            res.send(result);
          }, (e) => {
            res.status(404).send({valid:false,message:errorMessage});
          });
        }
    });
  },

	fetchData: (searchString,res) => {
		geocode.geocodeAddress(searchString,'geocode', (errorMessage, result) => {
		if (errorMessage){
			res.status(404).send({valid:false,message:errorMessage});
		} else {
      var geo = new Geo({
        string: searchString.toLowerCase(),
        address: result.address,
          location: {
            lat: result.lat,
            lng: result.lng
          },
          location_type: result.type,
          address_components: result.components
        });
        geo.save().then((doc) => {
            //
        }, (e) => {
            console.log(e);
        })
  			result.valid = true;
  			res.send(result);
  		}
  	});
  },

  matchLocation: (searchString, res) => {
    Geo.findOne({
      string: searchString.toLowerCase()
    }).then((doc) => {
      var matched = false;
      if (doc !== null) {
        var data = {};
        data.lat = doc.location.lat;
        data.lng = doc.location.lng;
        if (doc.address) {
          data.address = doc.address;
        } else {
          data.address = doc.string.capitalize();
        }
        data.type = doc.location_type;
        data.components = doc.address_components;
        matched = true;
        data.valid = true;
        if (data.type == 'APPROXIMATE') {
          geocode.mergeHospitals(data,(error,data) => {
            res.send(data);
          });
        } else {
          res.send(data);
        }
      }
      if (!matched) {
        geocode.fetchData(searchString, res);
      }
    }).catch((e) => {
      res.send(e);
    });
  }
};


module.exports = geocode;