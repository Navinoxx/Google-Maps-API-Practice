'use strict'

const mapa = document.getElementById("map")
const toggleMarkers = document.getElementById("toggle-markers")
const delMarkers = document.getElementById("delete-markers")
const search = document.getElementById("search-box")
const sidebar = document.getElementById("sidebar")
const deleteRecientes = document.getElementById("delete-recientes")
const deleteRutas = document.getElementById("delete-rutas")
const canvasRecientes = document.getElementById("canvas-recientes")
const canvasRutas = document.getElementById("canvas-rutas")
const canvasMarcadores = document.getElementById("canvas-marcadores")
const directions = document.getElementById("directions")
const section = document.getElementById("section")
const switchTheme = document.getElementById("flexSwitch")
const body = document.querySelector(".body")
const marks = document.getElementById("marks")
const botones = document.querySelectorAll(".btn-theme")
const templateRecientes = document.querySelector('.template-recientes').content
const templateRutas = document.querySelector('.template-rutas').content
const templateSidebarRecientes = document.querySelector('.template-sidebar-recientes').content
const templateSidebarMarcadores= document.querySelector('.template-sidebar-marcadores').content
const fragment = document.createDocumentFragment()
const fragmentRecientes = document.createDocumentFragment()
const arg = { lat: -34.0000000, lng: -64.0000000 }
const nigthMode = {styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
    ]
}

let markers = []
let rutas = []
let recientes = []
let areMarkersVisible = true
let map

function initMap() {
    map = new google.maps.Map(mapa, {
    center: arg,
    zoom: 4, 
    scaleControl: true,
    })

    map.addListener("click", (e) => {
        addMarker(e.latLng)
    })
    
    toggleMarkers.addEventListener("click", Markers)
    delMarkers.addEventListener("click", deleteMarkers)
    deleteRecientes.addEventListener("click", deleteRecientesSearch)
    deleteRutas.addEventListener("click", deleteRutasSearch)
    
    new AutocompleteDirectionsHandler(map)
    autocompleteSearch()
    savedMarkers()
    showRoute()
}

function addMarker(position) {
    const marker = new google.maps.Marker({
        position: position,
        map: areMarkersVisible ? map : null
    })

    getAddressFromCoordinates(position.lat(), position.lng())
        .then((address) => {
            const markerData = {
                location: address,
                position: {
                    lat: position.lat(),
                    lng: position.lng()
                },
            }

            markers.push(markerData)
            localStorage.setItem("markers", JSON.stringify(markers))

            const clone = templateSidebarMarcadores.cloneNode(true)
            clone.querySelector("h5").textContent = address
            clone.querySelector("span").textContent = position
            fragment.appendChild(clone)
            marks.appendChild(fragment)
        })
}

function Markers() {
    if (markers.length === 0) {
        return
    }

    areMarkersVisible = !areMarkersVisible
    if (areMarkersVisible) {
        markers.forEach(marker => {
            marker.setMap(map)
        })
    } else {
        markers.forEach(marker => {
            marker.setMap(null)
        })
    }
}

function deleteMarkers() {
    for (const marker of markers) {
        marker.setMap(null)
    }
    markers = []
    localStorage.removeItem('markers')
    marks.innerHTML = ""
}  

function deleteRecientesSearch() {
    recientes = []
    localStorage.removeItem('recientes')
    canvasRecientes.innerHTML = ""
}

function deleteRutasSearch() {
    rutas = []
    localStorage.removeItem('rutas')
    canvasRutas.innerHTML = ""
}

function autocompleteSearch() {
    const input = document.getElementById("pac-input")
    const searchBox = new google.maps.places.SearchBox(input)

    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds())
    })

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces()
        if (places.length == 0) {
            return
        }

        markers.forEach((marker) => {
            marker.setMap(null)
        })

        const bounds = new google.maps.LatLngBounds()
        
        places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry")
                return
            }
            
            const icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25),
            }
            
            markers.push(
                new google.maps.Marker({
                    map,
                    icon,
                    title: place.name,
                    position: place.geometry.location,
                })
                )
                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport)
                } else {
                    bounds.extend(place.geometry.location)
                }

            recientes.push(place)  
            localStorage.setItem('recientes', JSON.stringify(recientes))
            const clone = templateSidebarRecientes.cloneNode(true)
            const cloneRecientes = templateRecientes.cloneNode(true)
            sidebar.innerHTML = ""
            clone.querySelector("img").src = place.photos[0].getUrl()
            clone.querySelector("img").alt = place.name
            clone.querySelector("h3").textContent = place.name
            clone.querySelector("p").textContent = place.formatted_address
            clone.querySelector("a").href = place.url
            
            cloneRecientes.querySelector("h5").textContent = place.formatted_address
            cloneRecientes.querySelector("span").textContent = place.geometry.location.toJSON().lat + " " + place.geometry.location.toJSON().lng
            cloneRecientes.querySelector("a").href = place.url
            
            fragment.appendChild(clone)
            fragmentRecientes.appendChild(cloneRecientes)
        })
        sidebar.appendChild(fragment)
        canvasRecientes.appendChild(fragmentRecientes)
        
        map.fitBounds(bounds)
    })
}

function showRoute() {
    const directionsRenderer = new google.maps.DirectionsRenderer()
    const directionsService = new google.maps.DirectionsService()

    const originInput = document.getElementById("origin-input")
    const destinationInput = document.getElementById("destination-input")

    directionsRenderer.setPanel(sidebar)
    
    const onChangeHandler = function () {
        calculateAndDisplayRoute(directionsService, directionsRenderer)
    }

    originInput.addEventListener("change", onChangeHandler)
    destinationInput.addEventListener("change", onChangeHandler)
}

function calculateAndDisplayRoute(directionsService, directionsRenderer) {
    const start = document.getElementById("origin-input").value
    const end = document.getElementById("destination-input").value

    directionsService
        .route({
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            directionsRenderer.setDirections(response)
            rutas.push(response)
            localStorage.setItem('rutas', JSON.stringify(rutas))
            
            const clone = templateRutas.cloneNode(true)
            clone.querySelector("h5").textContent = response.routes[0].legs[0].start_address + " - " + response.routes[0].legs[0].end_address
            clone.querySelector("span").textContent = response.routes[0].legs[0].duration.text + " - " + response.routes[0].summary
            clone.querySelector("a").href = response.routes[0].legs[0].start_address
            
            fragment.appendChild(clone)
            canvasRutas.appendChild(fragment)
        })
}

function getAddressFromCoordinates(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder()

        const latlng = {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude),
        }

        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject("No se pudo obtener la dirección.");
            }
        })
    })
}

class AutocompleteDirectionsHandler {
    map;
    originPlaceId;
    destinationPlaceId;
    travelMode;
    directionsService;
    directionsRenderer;
    constructor(map) {
        this.map = map
        this.originPlaceId = ""
        this.destinationPlaceId = ""
        this.travelMode = google.maps.TravelMode.WALKING
        this.directionsService = new google.maps.DirectionsService()
        this.directionsRenderer = new google.maps.DirectionsRenderer()
        this.directionsRenderer.setMap(map)
    
        const originInput = document.getElementById("origin-input")
        const destinationInput = document.getElementById("destination-input")

        const originAutocomplete = new google.maps.places.Autocomplete(
            originInput,
            { fields: ["place_id"] }
        )

        const destinationAutocomplete = new google.maps.places.Autocomplete(
            destinationInput,
            { fields: ["place_id"] }
        )
    
        this.setupClickListener("changemode-walking", google.maps.TravelMode.WALKING)
        this.setupClickListener("changemode-transit", google.maps.TravelMode.TRANSIT)
        this.setupClickListener("changemode-driving", google.maps.TravelMode.DRIVING)
        this.setupPlaceChangedListener(originAutocomplete, "ORIG")
        this.setupPlaceChangedListener(destinationAutocomplete, "DEST")
    }

    setupClickListener(id, mode) {
        const radioButton = document.getElementById(id)
    
        radioButton.addEventListener("click", () => {
            this.travelMode = mode
            this.route()
        })
    }

    setupPlaceChangedListener(autocomplete, mode) {
        autocomplete.bindTo("bounds", this.map)
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
    
            if (!place.place_id) {
            window.alert("Please select an option from the dropdown list.")
            return
            }
    
            if (mode === "ORIG") {
            this.originPlaceId = place.place_id
            } else {
            this.destinationPlaceId = place.place_id
            }
    
            this.route()
        })
    }

    route() {
        if (!this.originPlaceId || !this.destinationPlaceId) {
            return
        }
    
        const me = this
    
        this.directionsService.route(
            {
            origin: { placeId: this.originPlaceId },
            destination: { placeId: this.destinationPlaceId },
            travelMode: this.travelMode,
            },
            (response, status) => {
                if (status === "OK") {
                    me.directionsRenderer.setDirections(response)
                } else {
                    window.alert("Directions request failed due to " + status)
                }
            })
    }
}

section.addEventListener("click", (e) => {
    searchMode(e)
})    

const searchMode = (e) => {
    if (e.target.classList.contains("sign-turn")) {
        search.classList.add("d-none")
        directions.classList.remove("d-none")
        sidebar.innerHTML = ""
    } 
    if (e.target.classList.contains("close")) {
        search.classList.remove("d-none")
        directions.classList.add("d-none")
        sidebar.innerHTML = ""
    } 
    e.stopPropagation()
}

const savedMarkers = () => {
    const storedMarkers = localStorage.getItem("markers")
    if (storedMarkers) {
        const serializedMarkers = JSON.parse(storedMarkers)
        markers = serializedMarkers.map(serializedMarker => {
        const marker = new google.maps.Marker({
            location: serializedMarker.address,
            position: new google.maps.LatLng(serializedMarker.position),
            map: areMarkersVisible ? map : null
        })
        return marker
        })
    
        if (areMarkersVisible) {
            marks.innerHTML = ""
            markers.map(marker => {
                marker.setMap(map)
                const clone = templateSidebarMarcadores.cloneNode(true)
                clone.querySelector("h5").textContent = marker.location
                clone.querySelector("span").textContent = marker.position
                fragment.appendChild(clone)
            })
            marks.appendChild(fragment)
        }
    }

    const storedRecientes = localStorage.getItem("recientes")
    if (storedRecientes) {
        recientes = JSON.parse(storedRecientes)
        const fragmentRecientes = document.createDocumentFragment()
        recientes.map(serializedReciente => {
            const cloneRecientes = templateRecientes.cloneNode(true)
            cloneRecientes.querySelector("h5").textContent = serializedReciente.formatted_address
            cloneRecientes.querySelector("span").textContent = serializedReciente.geometry.location.lat + " " + serializedReciente.geometry.location.lng
            cloneRecientes.querySelector("a").href = serializedReciente.url
            fragmentRecientes.appendChild(cloneRecientes)
        
        })
        canvasRecientes.appendChild(fragmentRecientes)
    }    

    const storedRutas = localStorage.getItem("rutas")
    if (storedRutas) {
        canvasRutas.innerHTML = ""
        rutas = JSON.parse(storedRutas)
        const fragmentRutas = document.createDocumentFragment()
        rutas.map(serializedRuta => {
            const cloneRutas = templateRutas.cloneNode(true)
            cloneRutas.querySelector("h5").textContent = serializedRuta.routes[0].legs[0].start_address + " - " + serializedRuta.routes[0].legs[0].end_address
            cloneRutas.querySelector("span").textContent = serializedRuta.routes[0].legs[0].duration.text + " - " + serializedRuta.routes[0].summary
            cloneRutas.querySelector("a").href = serializedRuta.routes[0].legs[0].start_address

            fragmentRutas.appendChild(cloneRutas)
        })
        canvasRutas.appendChild(fragmentRutas)
    }

    const themeSaved = localStorage.getItem("theme")
    if (themeSaved) {
            body.setAttribute("data-bs-theme", themeSaved)
            botones.forEach(btn => {
                if(themeSaved === "dark") {
                    btn.classList.remove("btn-light")
                    btn.classList.add("btn-dark")
                } else {
                btn.classList.add("btn-light")
                btn.classList.remove("btn-dark")
                }
            })
            map.setOptions({styles: body.getAttribute("data-bs-theme") === "dark"  ? nigthMode.styles : null})
    }

}

switchTheme.addEventListener("click", (e) => {
    if(e.target.classList.contains("dark")) {
        body.setAttribute("data-bs-theme", "dark")
        localStorage.setItem("theme", "dark")
        botones.forEach(btn => {
            btn.classList.remove("btn-light")
            btn.classList.add("btn-dark")
        })
        map.setOptions({styles: body.getAttribute("data-bs-theme") === "dark"  ? nigthMode.styles : null})
    }
    if(e.target.classList.contains("light")) {
        body.setAttribute("data-bs-theme", "light")
        localStorage.setItem("theme", "light")
        botones.forEach(btn => {
            btn.classList.add("btn-light")
            btn.classList.remove("btn-dark")
        })
        map.setOptions({styles: body.getAttribute("data-bs-theme") === "dark"  ? nigthMode.styles : null})
    }
    e.stopPropagation()
})