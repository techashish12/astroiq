const mongoose = require('mongoose');

var simpleStringType = {
  type: String,
   required: true,
   minlength: 1,
   trim: true
};

var simpleNumberType = {
  type: Number,
  required: true,
};

var optionalNumberType = {
  type: Number,
  required: false,
};

var planetType = {
  lng: simpleNumberType,
  lat: simpleNumberType,
  ecl: simpleNumberType,
  house: optionalNumberType
};

var Nested = mongoose.model('Nested', {
  cmd: simpleStringType,
  name: simpleStringType,
  gender: simpleStringType,
  chartType: simpleStringType,
  datetime: {
     type: Date,
     required: true
  },
  dateinfo: {
    calendar: simpleStringType,
    zone: simpleStringType,
    gmtOffset: simpleNumberType
  },
  geo: {
    lat: simpleNumberType,
    lng: simpleNumberType,
    alt: simpleNumberType,
    address: simpleStringType
  },
  astro: {
    ut: {
      value: simpleNumberType,
      delta: simpleNumberType,
      deltaType: simpleStringType,
      unit: simpleStringType
    },
    et: simpleNumberType,
    epsilon_true: {
      lng: simpleNumberType,
      lat: optionalNumberType,
      ecl: optionalNumberType
    },
    nutation: [
      simpleNumberType,
      simpleNumberType
    ],
    mean_node: {
      lng: simpleNumberType,
      lat: simpleNumberType,
      ecl: simpleNumberType
    },
    true_node: {
      lng: simpleNumberType,
      lat: simpleNumberType,
      ecl: -simpleNumberType
    },
    mean_apogee: {
      lng: simpleNumberType,
      lat: simpleNumberType,
      ecl: simpleNumberType
    },
    ascendant: simpleNumberType,
    mc: simpleNumberType,
    armc: simpleNumberType,
    vertex: simpleNumberType
  },
  ayanamsa: simpleNumberType,
  houseData: {
    letter: simpleStringType,
    mode: simpleStringType,
    lng: simpleNumberType,
    lat: simpleNumberType
  },
  houses: [
    simpleNumberType
  ],
  bodies: {
    sun: planetType,
    moon: planetType,
    mercury: planetType,
    venus: planetType,
    mars: planetType,
    jupiter: planetType,
    saturn: planetType,
    uranus: planetType,
    neptune: planetType,
    pluto: planetType/*,
    ketu: planetType*/
  },
});

module.exports = {Nested};