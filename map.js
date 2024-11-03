
var map = L.map('map').setView([28, -92], 10, {
    crs: L.CRS.EPSG4326
});

var basemaps = {
    'Topo Map': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crs: L.CRS.EPSG4326
    }),

    'Geo World Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        crs: L.CRS.EPSG4326
    }),
    
    'OSM':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}, {
        crs: L.CRS.EPSG4326
    }),

};

L.control.layers(basemaps).addTo(map);
basemaps["OSM"].addTo(map);

// generating all time and dates for the available raster data
function generateDateTimes(startTime, endTime, interval) {
    var start = new Date(startTime);
    var end = new Date(endTime);
    var dateTimes = [];
    
    while (start <= end) {
        var name = start.getFullYear()+'_'+`${start.getMonth()+1}`.padStart(2, '0')+'_'+`${start.getDate()}`.padStart(2, '0')+'_'+`${start.getHours()}`.padStart(2, '0');
        dateTimes.push(name); // Add the current date to the array
        start.setHours(start.getHours() + interval); // Move the time forward by the interval
    }

    return dateTimes;
};

// Time step generation in a list format
var startTime = '2023-08-12T01:00:00';
var endTime = '2023-09-28T00:00:00';
var interval = 1; // Interval in hours

var dateTimes = generateDateTimes(startTime, endTime, interval);


//setting max value of the slider
document.getElementById("slider").max = ""+dateTimes.length+"";

//setting default label of the slider
document.getElementById("sliderLabel").innerHTML = dateTimes[0];

var bounds = new L.LatLngBounds(
    new L.LatLng(30.806529, -98.232739),
    new L.LatLng(22.896634, -87.769914));
map.fitBounds(bounds);

var urlPrefix = "/v/"
var urlPrefix_image = "/resampled_speed/"

var url = urlPrefix+dateTimes[0]+".json"
var url_image = urlPrefix_image+'speed_'+dateTimes[0]+'.tif'
let vel_line = L.layerGroup();
let decorator = L.layerGroup();

function updatePolyline(data) {
    // If a polyline already exists, remove it
    if (vel_line) {
        vel_line.clearLayers();
    }
    if (decorator){
        decorator.clearLayers();
    }
    var myStyle = {
        "color": "black",
        "weight": 1,
        "opacity": 0.4
    };

   L.geoJSON(data,  {
        onEachFeature: function(feature, layer){
            layer.setStyle(myStyle);
             L.polylineDecorator(layer, {
                patterns: [
                    {
                        offset: '100%',
                        repeat: 0,
                        symbol: L.Symbol.arrowHead({
                            pixelSize: 4,
                            polygon: true,
                            pathOptions: { stroke: true, weight: 0.5, color:"black", opacity: 0.4 }
                        })
                    }
                ]
            }).addTo(decorator)
    
        }
    }
    
    ).addTo(vel_line);

    decorator.addTo(map);
    vel_line.addTo(map);

    // Create a new polyline and add it to the map
    // vel_line = L.geoJSON(data, {style:myStyle}).addTo(map);
    // decorator = L.polylineDecorator(vel_line, {
    //     patterns: [

    //         // Arrowhead at the end
    //         {
    //             offset: '100%',
    //             repeat: 0,
    //             symbol: L.Symbol.arrowHead({
    //                 pixelSize: 10,
    //                 polygon: true,
    //                 pathOptions: { stroke: true, weight: 10, color: 'black' }
    //             })
    //         }
    //     ]
    // }).addTo(map);

}
// Fetch polyline data
fetch(url)
    .then(response => response.json())
    .then(data => {
        // Add the polyline to the map using L.geoJSON()
        updatePolyline(data);
    })
    .catch(error => console.error('Error fetching polyline:', error));

//velocity raster start
let image_layer = L.layerGroup();
let key_track = []
var color_sc = plotty.addColorScale("mycolorscale", ['#fffdcdff', '#d8c55fff', '#8ea20bff', '#32801fff', '#10542cff', '#172313ff'], 
    [0, 0.2, 0.4, 0.6, 0.79999999, 1]);

const options = {
displayMin: 0,
displayMax: 4,
applyDisplayRange: false,
clampLow: true,
clampHigh: true,
//   // Optional. Plotty color scale used to render the image.
  colorScale: 'mycolorscale'

};

const option_render = {

    noDataValue:NaN,
    renderer: L.LeafletGeotiff.plotty(options)
}
    function imageUpdate(url_image) {
        // If a polyline already exists, remove it
        // if (image_layer) {
        //     map.removeLayer(image_layer);
        // }
        image_layer = L.leafletGeotiff(url_image, option_render).addTo(map);
        // image_layer.addTo(map);
        const layerCount = Object.keys(map._layers).length;
        console.log('layer count', layerCount);
    };

    imageUpdate(url_image);
//velocity raster ends
//function when sliding
slider.oninput = function() {
    //changing the label
    document.getElementById("sliderLabel").innerHTML = dateTimes[this.value-1]
    //setting the url of the overlay
    // map.removeLayer(vel_line)
    fetch(urlPrefix+dateTimes[this.value-1]+".json")
    .then(response => response.json())
    .then(data => {
        // Add the polyline to the map using L.geoJSON()
        updatePolyline(data);
    })
    .catch(error => console.error('Error fetching polyline:', error));
    imageUpdate(urlPrefix_image+'speed_'+dateTimes[this.value-1]+".tif");
  }
  
  var playTimeOut;
  
  function play() {
      playTimeOut = setTimeout(function () {
          //increasing the slider by 1 (if not already at the end)
          var val = document.getElementById("slider").value
          console.log(val)
          //if end of slider, stopping
          if(val == document.getElementById("slider").max){
              clearTimeout(playTimeOut);
                //hidding the stop button
                document.getElementById('stop').style.display = "none";
                //showing the play button
                document.getElementById('play').style.display = "block";
          }
          else{
          document.getElementById("slider").value = Number(val)+1
          play()
          }
          //changing the label
          document.getElementById("sliderLabel").innerHTML = dateTimes[Number(val)-1]
          //setting the url of the overlay

          fetch(urlPrefix+dateTimes[Number(val)-1]+".json")
            .then(response => response.json())
            .then(data => {
                // Add the polyline to the map using L.geoJSON()
                updatePolyline(data);
            })
            .catch(error => console.error('Error fetching polyline:', error));
            imageUpdate(urlPrefix_image+'speed_'+dateTimes[Number(val)-1]+".tif");
        //   imageOverlay.setUrl(urlPrefix+dateTimes[Number(val)-1]+".png")
  
      }, 800);
  }
  
  document.getElementById('play').onclick = function(e){
    play()
    //showing the stop button
    document.getElementById('stop').style.display = "block";
    //hidding the play button
    document.getElementById('play').style.display = "none";
  }
  
  document.getElementById('stop').onclick = function(e){
    clearTimeout(playTimeOut);
    //hidding the stop button
    document.getElementById('stop').style.display = "none";
    //showing the play button
    document.getElementById('play').style.display = "block";
  }
  
  //hidding the stop button by default
  document.getElementById('stop').style.display = "none";


  function getColor(d) {
    return d > 3.9 ? '#172313ff' :
           d > 3.1 ? '#10542cff' :
           d > 2.4 ? '#32801fff' :
           d > 1.6 ? '#8ea20bff' :
           d > 0.8 ? '#d8c55fff' :
                    '#fffdcdff';
}

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 0.8, 1.6, 2.4, 3.1, 3.9],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);



  let popup;
map.on("click", function(e) {
  if (!popup) {
    popup = L.popup()
      .setLatLng([e.latlng.lat, e.latlng.lng])
      .openOn(map);
  } else {
    popup.setLatLng([e.latlng.lat, e.latlng.lng]);
  }
  const value = image_layer.getValueAtLatLng(+e.latlng.lat, +e.latlng.lng);
  popup.setContent(`Speed(m/s): ${value.toFixed(2)}`).openOn(map);
});

