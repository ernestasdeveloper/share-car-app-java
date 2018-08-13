//@flow

import * as React from "react";
import {Map, View, Feature} from "ol";
import {Vector, OSM} from "ol/source";
import {Vector as VectorLayer, Tile} from "ol/layer";
import {Style, Stroke, Icon} from "ol/style";
import {Point} from "ol/geom";
import {Polyline} from "ol/format";
import {fromLonLat, transform} from "ol/proj";
import "../../styles/map.css";
import "../../styles/genericStyles.css";
import "ol/ol.css";
import {RestMapService} from "../../api/RestMapService";
import {RestTripService} from "../../api/RestTripService";
import {RestRideService} from "../../api/RestRideService";
import {RideService} from "../../api/RideService";

type RideRequestMapProps = {
    tripId: number,
    passengerId: number,
    nextStep: Function
}

type RideRequestMapState = {
    pickupPoint: Waypoint,
    trip: {
        id: TripId,
        dateTime: DateTime,
        driver: {
            id: UserId,
            firstName: Name,
            lastName: Name,
            phoneNo: PhoneNo
        },
        route: Geometry,
        startPoint: {
            name: string,
            longitude: number,
            latitude: number
        },
        endPoint: {
            name: string,
            longitude: number,
            latitude: number
        }
    },
}

export class RideRequestMap extends React.Component<RideRequestMapProps, RideRequestMapState> {
    map: Map;

    state = {
        pickupPoint: null
    };

    rideService: RideService = new RestRideService();

    msg_el: element;
    url_osrm_route: string;
    icon_url: string;
    vectorSource: Vector;
    vectorLayer: VectorLayer;
    styles: {
        route: any;
        icon: any;
    }

    mapService = new RestMapService();
    tripService = new RestTripService();

    to4326(coord) {
        return transform([
            parseFloat(coord[0]), parseFloat(coord[1])
        ], "EPSG:3857", "EPSG:4326");
    }
    createFeature(coord) {
        let feature = new Feature({
            type: "place",
            geometry: new Point(fromLonLat(coord))
        });
        feature.setStyle(this.styles.icon);
        this.vectorSource.addFeature(feature);
    }
    
    addCoord(coord) {
        if (this.state.pickupPoint !== null) {
            return;
        }
        let coord4326 = this.to4326(coord);
        this.setState({pickupPoint: {
                        longitude: coord4326[0],
                        latitude: coord4326[1],
                        name: ""}});
        this.createFeature(coord4326);
    }

    handleClick(evt) {
        this.addCoord(evt.coordinate);
    }

    createRoute(polyline: Geometry) {
        this.setState({geometry: polyline});
        // route is LineString
        let route = new Polyline({
            factor: 1e5
        }).readGeometry(polyline, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857"
        });
        let feature = new Feature({
            type: "route",
            geometry: route
        });;
        feature.setStyle(this.styles.route);
        this.vectorSource.addFeature(feature);
    }

    drawRoute() {
        this.createFeature([this.state.trip.startPoint.longitude, this.state.trip.startPoint.latitude]);
        this.createFeature([this.state.trip.endPoint.longitude, this.state.trip.endPoint.latitude]);
        this.createRoute(this.state.trip.route);
    }

    async loadTrip() {
        const data = await this.tripService.getSingle(this.props.tripId);
        await new Promise(resolve => setTimeout(resolve, 1000)); //sleep 1000ms
        this.setState({isLoading: false, trip: data});
    }

    async submitRide() {
        await this.rideService.add({passengerId: this.props.passengerId,
                                    tripId: this.props.tripId,
                                    pickupPoint: this.state.pickupPoint
        });
        this.props.nextStep();
    };

    async componentDidMount() {
        await this.loadTrip();

        this.msg_el = document.getElementById("msg");
        this.icon_url = "//cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png";
        this.vectorSource = new Vector();
        this.vectorLayer = new VectorLayer({
            source: this.vectorSource
        });
        this.styles = {
            route: new Style({
                stroke: new Stroke({
                    width: 6, color: [40, 40, 40, 0.8]
                })
            }),
            icon: new Style({
                image: new Icon({
                    anchor: [0.5, 1],
                    src: this.icon_url
                })
            })
        };

        this.map = new Map({
            target: "map",
            layers: [
                new Tile({
                    source: new OSM()
                }),
                this.vectorLayer
            ],
            view: new View({
                center: fromLonLat([25.272932, 54.679042]),
                zoom: 11
            })
        });

        // Register map events
        this.map.on("click", this.handleClick.bind(this));

        this.drawRoute();

        this.msg_el.innerHTML = "Choose a pickup point";
    }

    render() {
        return (
            <div>
                <div id="map"></div>
                <div id="msg"></div>
                <div className="map-buttons-container">
                    <button className="gen-button btn-lg" onClick={this.submitRide.bind(this)}>Submit request</button>
                </div>
            </div>
        );
    }
}