var GeoMap = {

    map: null,

    marker: null,

    buildMap: function(lat, lng) {
        var loc = {lat: lat, lng: lng}, hasMap = this.map === null;
        this.map = new google.maps.Map(document.getElementById('gmap'), {
          zoom: 9,
          center: loc
        });
        this.marker = new google.maps.Marker({
          position: loc,
          draggable: true,
          animation: google.maps.Animation.DROP,
          map: this.map
        });
        this.addDragendEvent(this.marker);
    },

    addDragendEvent: function(marker) {
        google.maps.event.addListener(marker, "dragend", function (e) {
            var lat = e.latLng.lat(),
            lng = e.latLng.lng();
            GeoMap.updateCoords(lat,lng);
            GeoMap.updateMap(lat,lng,false);
        });
    },

    updateMap: function(lat,lng,updateMarker) {
        var pos = {
           lat: lat,
           lng: lng 
        };
        this.map.setCenter(pos);
        if (updateMarker) {
            this.marker.setPosition(pos);
            this.addDragendEvent(this.marker);
        }
    },

    matchLocation: function(position) {
        var coords = position.coords; 
        this.buildMap(coords.latitude,coords.longitude);
        this.updateCoords(coords);
    },

    updateCoords: function(coords,lng) {
        if (typeof coords != 'object') {
            coords = {
                latitude: coords,
                longitude: lng
            };
        }
        /*document.getElementById('form-lat').setAttribute('value',coords.latitude);
        document.getElementById('form-lng').setAttribute('value',coords.longitude);*/
        document.getElementById('form-lat').value = coords.latitude;
        document.getElementById('form-lng').value = coords.longitude;

    },

    init: function() {
        var geoOn = false;
        if (navigator.geolocation) {
            if (/\bChrome\b/i.test(navigator.userAgent) == false) {
                navigator.geolocation.getCurrentPosition(GeoMap.matchLocation,GeoMap.errorHandler);
                geoOn = true;
            }  
        }
        setTimeout(function() {
            if (!geoOn) {
                if (document.getElementById('form-lat')) {
                    var lat = document.getElementById('form-lat').getAttribute('value'),
                    lng = document.getElementById('form-lng').getAttribute('value');
                    if (/^\s*-?\d+/.test(lat) && /^\s*-?\d+/.test(lng)) {
                        lat = parseFloat(lat);
                        lng = parseFloat(lng);
                        GeoMap.buildMap(lat,lng);
                    }
                    
                }
            }
        },500);
    }
};

function initMap() {
    console.log('pp');
    return GeoMap.init();
}

(function($) {

    $( document ).ready(function() {
        var astroDisc = {
            snap: null,

            bounds: [0,30,60,90,120,150,180,210,240,270,300,330,360],

            radius: 720,

            offset: 30,

            colors: ['#882222','#228822','#222288','#777711','#117777','#996633','#669933','#339966','#aa1122','#11aa22','#2211aa','#55aa55'],

            segments: [],

            bodies: [],

            degreeLines: [],

            indian: null,

            central: null,
            topCircles: null,
            lines: null,
            houseSymbols: [],
            degreeOverlay: null,
            planetarium: null,

            outer: null,
            inner: null,
            disc: null,
            ascendant: null,
            rd: 57,

            orientation: 'counter',

            calcArcX: function(degs) {
                return (1- Math.sin((90-degs)/this.rd)) * this.radius;
            },

            calcArcY: function(degs) {
                return Math.cos((90-degs)/this.rd) * this.radius;
            },

            calcSegmentD: function(spanDeg,startDeg) {
                var r = this.radius,
                    ry = this.calcArcX(spanDeg),
                    rx = this.calcArcY(spanDeg);
                return "M0,0 A"+r+","+r+" 0 0,1 "+rx+","+ry+" L0,"+r+" Z";
            },

            addSegment: function(spanDeg,startDeg,color,index) {
                var r =this.radius, 
                    c = r + this.offset,
                    d = this.calcSegmentD(spanDeg,startDeg);
                var path = this.snap.path(d).attr({
                    "fill": color,
                    'class': "segment",
                    id: 'house-' + (index+1)
                }),
                tx = r + this.calcArcY(spanDeg),
                ty = this.calcArcX(spanDeg);
                var matrix = new Snap.Matrix();
                matrix.translate(r,0);
                if (startDeg) {
                    matrix.rotate(startDeg,0,r);
                }
                path.attr({
                    transform: matrix
                });
                var num = index+1;
                if (num < 10) {
                    num = '0' + num.toString();
                } else {
                    num = num.toString();
                }
                var matrix = new Snap.Matrix();
                
                matrix.rotate(startDeg + (spanDeg/2),c,c);
                matrix.translate(r/24,r/24);
                var sym = this.snap.image('/svgs/signs/glyph/'+num+'.svg',r/24,r,(r/12),(r/12)).attr({
                    transform: matrix,
                    class: 'house-symbol',
                    id: 'house-symbol-'+num 
                });
                this.degreeOverlay.append(sym);
                this.houseSymbols[index] = sym;
                return path;
            },

            tweenSegment: function(spanDeg,startDeg,index) {
                var r = this.radius, c = r + this.offset,
                segment = this.segments[index],
                matrix = new Snap.Matrix();
                matrix.translate(r,0);
                if (startDeg) {
                    matrix.rotate(startDeg,0,r);
                }
                if (this.orientation == 'counter') {
                    startDeg = 360-startDeg-spanDeg;
                }
                segment.attr({
                    d: this.calcSegmentD(spanDeg,startDeg)
                });
                segment.animate({
                    transform: matrix
                },500,mina.easein);
                /*matrix = new Snap.Matrix();
                matrix.rotate(startDeg + (spanDeg/2),c,c);
                matrix.translate(r/24,r/24);
                this.houseSymbols[index].attr({
                    transform: matrix
                });*/
            },
            
            addSegments: function() {
                var hb = this.bounds, r = this.radius,
                    i=0, seg, spanDeg, startDeg;
                this.segments = [],
                numHouses = hb.length -1;
                for (; i < numHouses;i++) {
                    spanDeg = (hb[(i+1)]-hb[i]);
                    startDeg = hb[i];
                    if (this.orientation == 'counter') {
                        startDeg = 360-startDeg-spanDeg;
                    }
                    seg = this.addSegment(spanDeg,startDeg,this.colors[i%this.colors.length],i);
                    this.central.append(seg);
                    this.segments.push(seg);
                    /*this.snap.text(r + calcArcX(startDeg),(r - this.calcArcY(startDeg)),(i+1)).attr({
                        'class': 'label'
                    });*/
                }
            },
            
            tweenSegments: function(newBounds) {
                var valid = false, r = this.radius;
                if (newBounds instanceof Array) {
                    if (newBounds.length>1) {
                        valid = true;
                    }
                }
                if (valid) {
                    var m = new Snap.Matrix(),
                    startDeg = newBounds[0];
                    if (this.orientation == 'counter') {
                        startDeg = 360-startDeg;
                    }
                    m.rotate(startDeg,r+this.offset,r+this.offset);
                    m.translate(this.offset,this.offset);
                    this.central.animate({
                        transform: m
                    },500,mina.easein);
                    m.translate(0-this.offset,0-this.offset);
                    this.lines.animate({
                        transform: m
                    },500);
                    this.degreeOverlay.animate({
                        transform: m
                    },500);
                    this.planetarium.animate({
                        transform: m
                    },500);
                    var numHouses = newBounds.length-1, i=0, hb = [],
                        hv, spanDeg, startDeg, endDeg;
                    for (;i<(newBounds.length+1);i++) {
                        hv = newBounds[i] - newBounds[0];
                        if (hv < 0) {
                            hv += 360;
                        }
                        hb.push(hv);
                    }
                    this.setBounds(hb);
                    for (i=0; i < numHouses;i++) {
                        startDeg = hb[i];
                        endDeg = hb[(i+1)];
                        if (endDeg < startDeg) {
                            endDeg += 360;
                        }
                        spanDeg = endDeg - startDeg;
                        if (i < this.segments.length) {
                            this.tweenSegment(spanDeg,startDeg,i);
                        }
                    }
                }
                
            },

            placeBody: function(bodyName,lng,pos) {
                var r= this.radius, c = r + this.offset,
                    ofs=30,xd = r - ofs, yd = (r * 0.4) - ofs;
                if (this.orientation == 'counter') {
                    lng = 360-lng - (360/6);
                }
                var matrix = new Snap.Matrix();
                    matrix.rotate(lng,c,c);
                if (this.bodies[bodyName]) {
                    if (this.bodies[bodyName].image) {
                        this.bodies[bodyName].image.animate({
                            transform: matrix
                        },1000);
                        this.bodies[bodyName].image.attr({
                            title: bodyName + ': ' + pos
                        });
                   } else {
                    this.bodies[bodyName].image = this.snap.image('/svgs/grahas/glyph/'+bodyName+'-sign.svg',0,0,(r/12),(r/12)).attr({'class':'body ' + bodyName,'id': bodyName + '-sign'});
                        this.bodies[bodyName].image.attr({
                            transform: matrix,
                            x: xd,
                            y: yd
                        });
                   }
                   this.planetarium.append(this.bodies[bodyName].image);
                    
                }
            },

            tweenBody: function(k,data) {
                if (this.bodies[k]) {
                    if (this.bodies[k].image) {
                        var yv = (data.lng-180) / 360,
                        xv = data.lat / 6;
                        this.bodies[k].attr({
                            x: yv,
                            y: xv
                        })
                    }
                }
            },

            tweenBodies: function(bodies) {
                var r = this.radius;
                if (typeof bodies == 'object') {
                    if (bodies.sun) {
                        if (typeof bodies.sun == 'object') {
                            var b, xv, yv;
                            for (k in bodies) {
                               b = bodies[k];
                               if (this.bodies[k]) {
                                   this.bodies[k].lng = b.lng;
                                   this.bodies[k].lat = b.lat;
                                   this.bodies[k].ecl = b.ecl;
                                   this.placeBody(k, b.lng,b.house);
                               } 
                            }
                        }
                    }
                }
            },

            placeBodies: function() {
                var b, k;
                for (k in this.bodies) {
                    b = this.bodies[k];
                    this.placeBody(k,b.lng);
                }
            },

            setBounds: function(bounds) {
                if (bounds instanceof Array) {
                    this.bounds = bounds;
                }
            },

            buildIndian: function() {
                this.indian = this.snap.select('#indian');
            },

            init: function() {
                this.radius = 720;
                var r = this.radius, c = r + this.offset;
                this.snap = new Snap('#astro-disc');
                this.central = this.snap.select('#segments');
                this.lines = this.snap.select('#degree-lines');
                this.degreeOverlay = this.snap.select('#degree-overlay');
                this.rd = 180/Math.PI;
                
                this.outer = this.inner = this.snap.select('circle.outer');
                this.addSegments();
                var i=0, ofs = this.offset, c = r+ofs,clNames, ln, lbl, len, lc, st;
                for (;i<180;i++) {
                    clNames='degree-line';
                    if (i%10 == 0) {
                        len = (r*2)+(ofs*2);
                        clNames += ' ten-degrees';
                        st = 0;
                    } else if (i%5 == 0) {
                        len = (r*2)+(ofs*1.75);
                        clNames += ' five-degrees';
                        st = ofs * 0.125;
                    } else {
                        len = (r*2) + (ofs*1.5);
                        clNames += ' one-degree';
                        st = ofs * 0.25;
                    }
                    ln = this.snap.line(c, st, c, len).attr({
                        class: clNames,
                        transform: "rotate("+i+"deg)"
                    });
                    this.degreeLines[i] = ln;
                    this.lines.append(ln);
                    if (i%30 == 0) {
                        var m = new Snap.Matrix();
                        m.rotate(i,c,c);
                        var lbl = this.snap.text(0, r, i.toString()).attr({
                            transform: m,
                            class: 'degree-label'
                        });
                        this.degreeOverlay.append(lbl);
                    }
  
                }
                this.topCircles = this.snap.select('#top-circles');

                this.inner = this.snap.select('circle.inner');
                
                this.bodies = {
                    sun: { lng: 72, lat: -0.0015, ecl: 0.9472557500000001, house: 10.668 },
                    moon: { lng: 250, lat: 3.353, ecl: 17.1252025, house: 4.640 },
                    mercury: { lng: 78, lat: -4.413, ecl: -0.5935002500000001, house: 10.620 },
                    venus: { lng: 29, lat: -2.997, ecl: 0.9983701111111111, house: 9.140 },
                    mars: { lng: 127, lat: 1.143, ecl: 0.5873172222222223, house: 12.3343 },
                    jupiter: { lng: 283, lat: -0.540, ecl: -0.09629297222222222, house: 5.574 },
                    saturn: { lng: 276, lat: -0.123, ecl: -0.06542327777777779, house: 5.342 },
                    uranus: { lng: 121, lat: 0.707, ecl: 0.04723602777777778, house: 12.1301 },
                    neptune: { lng: 196, lat: 1.806, ecl: -0.011241, house: 2.699 },
                    pluto: { lng: 134, lat: 12.669, ecl: 0.020179944444444445, house: 12.531 },
                };
                this.planetarium = this.snap.select('#planetarium');

                this.placeBodies();

   
                this.ascendant = this.snap.line(r, 0, r, r).attr({
                    'stroke': "white",
                    'stroke-width': '3px'
                });
                this.topCircles.append(this.ascendant);



            }
        };
        

        astroDisc.init();

        var cf = $('form#control-form');


        var toEuroDate = function(strDate) {
            return strDate.split("-").reverse().join(".");
        };

        var zeroPad2 = function(num) {
            var isString = typeof num == 'string',
            isNum = typeof num == 'number', str;
            if (isString || isNum) {
               if (isNum && /^\s*\d+\s*$/.test(num)) {
                    num = parseInt(num)
               }
               if (num < 10) {
                    str = '0' + num;
               } else {
                    str = num.toString();
               }
            }
            return str;
        };

        var toSwissEphTime = function(strTime) {
            var parts = strTime.split(":"), t;
            if (parts.length>1) {
                t= zeroPad2(parts[0]) + '.' + zeroPad2(parts[1]);
                if (parts.length>2) {
                    t += zeroPad2(parts[2]);
                }
            }
            return t;
        };

        function objToString(obj) {
            if (typeof obj == 'object') {
                var parts = [], tp;
                for (var sk in obj) {
                    tp = typeof obj[sk];
                    switch (tp) {
                        case 'string':
                        case 'number':
                            parts.push(sk + ': ' + obj[sk]);
                            break;
                    }
                }
                return parts.join(', ');
            }
        }


        var buildBodyDataView = function(body,key) {
            var ul = $('<ul class="details-'+key+'"></ul>'),hasData=false,content, li, tp;
            for (k in body) {
                hasData = false;
                tp = typeof body[k];
                if (tp == 'object') {
                    content = objToString(body[k]);
                } else {
                    content = body[k];
                }
                if (content) {
                    hasData = true;
                    li = $('<li class="'+k+'"><strong class="label">'+k+':</strong> <span class="value">'+content+'</span></li>');
                }
                if (hasData) {
                    ul.append(li);
                }
            }
            return ul;
        };

        var buildDataView = function(data) {
            var dl = $('<dl id="astro-data"></dl>'),
            info = $('<dl id="astro-info"></dl>'),
            dt,dd,hasData,dataType,kn;
            for ( k in data) {
                kn = k;
                if (k != 'house_bounds') {
                   dt = $('<dt class="'+k+'">'+k.split('_').join(' ')+'</dt>');
                    hasData = false;
                    dd = $('<dd class="'+k+'"></dd>');
                    dataType = typeof data[k];
                    switch (dataType) {
                        case 'string':
                        case 'number':
                            hasData = true;
                            dd.text(data[k]);
                            break;
                        case 'object':
                            hasData = true;
                            dd.append(buildBodyDataView(data[k],k));
                            break;
                    }
                    
                    if (hasData) {

                        switch (kn) {
                            case 'msg':
                                break;
                            case 'swetest':
                            case 'cmd':
                                info.append(dt);
                                info.append(dd);
                                break;
                            default:
                                dl.append(dt);
                                dl.append(dd);
                                break;
                        }
                    } 
                }
                
                
            }
            $('#results-pane .inner').html(dl);
            $('#results-pane .inner').append(info);
        };

        var updateChart = function(data) {
            if (astroDisc) {
                if (data.house_bounds) {
                    var i=0,houses=[],end=0,h;
                    for (;i<data.house_bounds.length;i++) {
                        h = data.house_bounds[i];
                        if (typeof h == 'object') {
                            if (i==0) {
                                end = h.lng;
                            }
                            houses.push(h.lng);
                        }
                    }
                    if (end == 0) {
                        end = 360;
                    }
                    houses.push(end);
                    astroDisc.tweenSegments(houses);
                }
                if (data.bodies) {
                    astroDisc.tweenBodies(data.bodies);
                }
            }
        }

        var appendAyamansa = function(params) {
            var href = '/ayanamsa';
            $.ajax({
                url: href,
                data: params,
                success: function(data) {
                    var dl = $('#astro-data');
                    if (dl.length > 0) {
                        var dt = $('<dt class="ayanamsa">Ayanamsa</dt>'),
                            dd = $('<dd class="ayanamsa">'+data.ayanamsa+'</dd>');
                        dl.append(dt);
                        dl.append(dd);
                    }
                }
            });
        }

        var kuteMorph = function() {
            var morph1 = KUTE.allFromTo('#symbol-path',
            { path: '#path-a', fill: "#990000" },{ path: '#path-b', fill: "#009900" }, {
                duration: 2000,
                keepHex: true
            });
            var morph2 = KUTE.fromTo('#symbol-path',
            { path: '#path-b',fill: "#009900" },{ path: '#path-c',fill: "#000099" }, {
                duration: 2000,
                keepHex: true,
                delay: 4000,
            });
            var morph3 = KUTE.fromTo('#symbol-path',
            { path: '#path-c', fill: "#000099" },{ path: '#path-d',fill: "#660066" }, {
                duration: 2000,
                delay: 7000,
                keepHex: true
            });
            var morph4 = KUTE.fromTo('#symbol-path',
            { path: '#path-d', fill: "#660066" },{ path: '#path-a',fill: "#990000" }, {
                duration: 2000,
                delay: 11000,
                keepHex: true
            });
            morph1.start();
            morph2.start();
            morph3.start();
            morph4.start();
            $('#tween-symbol').on('click',function(){
                morph1.start();
                morph2.start();
                morph3.start();
                morph4.start();
            });
        }

        var geofinder = $('#geobirth-finder');
        if (geofinder.length>0) {
            geofinder.on('click', function(e){
                e.preventDefault();
                var adEl = $('#form-geobirth');
                $('#geo-address').addClass('hidden');
                if (adEl.length>0) {
                    var adStr = adEl.val();
                    var href = '/geocode/' + adStr;
                    $.ajax({
                        url: href,
                        success: function(data) {
                            var msg = '';
                            if (data.valid) {
                                if (data.lat) {
                                    $('#form-lat').val(data.lat);
                                }
                                if (data.lng) {
                                    $('#form-lng').val(data.lng);
                                }
                                $('#form-geobirth').val("");
                                if (GeoMap) {
                                   if (GeoMap.map !== null) {
                                        GeoMap.updateMap(data.lat, data.lng, true);
                                    } else {
                                        GeoMap.buildMap(data.lat, data.lng);
                                    }
                                }
                                msg = data.address;
                            } else if (data.message) {
                                msg = data.message;
                            }
                            if (msg.length > 1) {
                                $('#geo-address').html(msg).removeClass('hidden');
                                if (data.message && !data.valid) {
                                    setTimeout(function() {
                                        $('#geo-address').addClass('hidden');
                                    },5000);
                                }
                            }
                        }
                    });
                }
            });
        }

        cf.on('submit',function(e){
            e.preventDefault();
            e.stopImmediatePropagation();
            var dob =$('#form-dob'),
            tob =$('#form-tob'),
            lng = $('#form-lng'),
            lat = $('#form-lat'),
            alt = $('#form-alt'),
            hsy = $('#form-hsy'),
            aya = $('#form-ayanamsa'),
            mod = $('#form-mode input.mode:checked');
            if (dob.length>0 && lng.length>0) {
                var dobV = dob.val(),
                tobV = tob.val(),
                lngV = lng.val(),
                latV = lat.val(),
                altV = alt.val();
                var href='/sweph',params={},
                geopos = lngV + ',' + latV + ',' + altV,
                isGeo = false;
                params.b = toEuroDate(dob.val());
                params.ut = toSwissEphTime(tob.val());
                params.elev = alt.val();
                if (mod.length>0) {
                    isGeo = mod.val() == 'geo';
                }
                if (isGeo) {
                    params.geopos = geopos;
                } else {
                    params.topo = geopos;
                }
                if (hsy.length>0) {
                    params.system = hsy.val();
                }
                if (aya.length>0) {
                    params.sid = aya.val();
                }
                
                $.ajax({
                    url: href,
                    data: params,
                    success: function(data) {
                        if (data.valid) {
                            buildDataView(data);
                            updateChart(data);
                        }
                    }
                });

            }

        });
        

        $('#main .hor-tabs li').on('click',function(e){
            e.stopImmediatePropagation();
            var it = $(this), main = $('#main');
            if (it.hasClass('active') == false) {
                var cl = it.attr('class');
                if (cl) {
                   var pane = $('#'+cl.split(' ').shift() + '-pane');
                   if (pane.length>0) {
                        main.find('> .active').removeClass('active').addClass('behind');
                        pane.removeClass('behind').addClass('active');
                        it.parent().find('.active').removeClass('active');
                        it.addClass('active');
                   }
                }
               
            }
        });

        $('#chart-mode li').on('click',function(e) {
            var it = $(this);
            if (it.hasClass('indian')) {
                $('#astro-disc').addClass('show-indian').removeClass('show-european');

            } else {
                $('#astro-disc').addClass('show-european').removeClass('show-indian');
            }
            it.parent().find('li.active').removeClass('active');
            it.addClass('active');
        });

        setTimeout(function(){
            var gMapApi = $('#gmap-api-key');
            if (gMapApi.length>0) {
                var gMapApiKey = gMapApi.attr('data-key'),st;
                if (gMapApiKey) {
                   st = $('<script async defer src="https://maps.googleapis.com/maps/api/js?key='+gMapApiKey+'&callback=initMap"></script>');
                    $('body').append(st);
                }
            }
        },250);

        kuteMorph();
    });
})(jQuery);