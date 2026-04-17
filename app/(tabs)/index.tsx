import Ionicons from '@expo/vector-icons/Ionicons';
import Mapbox, { Camera, CircleLayer, FillLayer, LineLayer, MapView, ShapeSource, StyleURL, UserLocation, UserTrackingMode } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { FeatureCollection } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import geoJSON from '../../src/assets/mockData.json';


Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "This wont happen");

const CharlotteMapTest = () => {
  const CLT_CENTER = [-80.8431, 35.2271];
  const router = useRouter();
  const [followUser, setFollowUser] = useState(false);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);

  const mapRef = useRef<MapView>(null);
  const [visibleBounds, setVisibleBounds] = useState<number[][] | null>(null);


  const isInBounds = (coordinates: number[], bounds: number[][]) => {
  const [minLng, minLat, maxLng, maxLat] = [
    bounds[1][0], bounds[1][1], bounds[0][0], bounds[0][1]
  ];
  return (
    coordinates[0] >= minLng &&
    coordinates[0] <= maxLng &&
    coordinates[1] >= minLat &&
    coordinates[1] <= maxLat
  );
};


  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission denied');
      } if (status === 'granted') {
        const result = await Location.getCurrentPositionAsync({});
        setUserLocation(result.coords);
      }
    })();
  }, []);
  const geoJ = geoJSON as FeatureCollection;

  const handlePress = (e: any) => {
    const feature = e.features[0];
    if (feature && feature.properties) {
      const id = feature.properties.OBJECTID;
      // alert(id);
      router.push({
        pathname: "/details",
        params: { id: id }
      });
    }
  }



const activeGeoJSON = useMemo(() => { //begins here
  let features = geoJ.features.filter(f=> f.properties?.status !== 'archive');
  if (!visibleBounds){
    features = features.slice(0, 50);
  } else {
    features = features.filter(f=>{
      if (!f.geometry) return false;
      if (f.geometry.type === 'Point') {
        return isInBounds(f.geometry.coordinates, visibleBounds);
      }
      if (f.geometry.type === 'LineString') {
        return f.geometry.coordinates.some(coord => isInBounds(coord, visibleBounds));
      }
      if (f.geometry.type === 'Polygon') {
        return f.geometry.coordinates[0].some(coord => isInBounds(coord, visibleBounds));
      }
      return false;
    });
  } //ends here
  return {
    ...geoJ,
    features
    //features: geoJ.features.filter(f => f.properties?.status !== 'archive')
  };
}, [geoJ, visibleBounds]);


  const cameraRef = useRef<Camera>(null);

  const moveToUser = () => {
    cameraRef.current?.setCamera({
      animationDuration: 1000
    });
  }


  return (
    <View style={styles.page}>
      <MapView ref = {mapRef}
        style={styles.map}
        styleURL={StyleURL.Street}
        logoEnabled={false}
        onMapIdle={async() => {
          const bounds = await mapRef.current?.getVisibleBounds();
          if (bounds) setVisibleBounds(bounds);
        }}
        >
        <Camera
          zoomLevel={13}
          defaultSettings={{ centerCoordinate: CLT_CENTER }}
          animationDuration={0}
          followUserLocation={followUser}
          followUserMode={UserTrackingMode.Follow}
          ref={cameraRef}
          followZoomLevel={13}
          onUserTrackingModeChange={(event) => {
            if (!event.nativeEvent.payload.followUserLocation) {
              setFollowUser(false);
            }
          }}

        />
        {/* Styleimport could be useful here? Unsure if worth the effort or if it does much of anything */}
        {/* https://docs.mapbox.com/help/tutorials/getting-started-react-native/?step=5 */}

        <ShapeSource id="combinedSource"
        shape={activeGeoJSON}
        onPress={handlePress}
        //cluster = {true}
        //clusterRadius = {50}
        //clusterMaxZoomLevel = {14}
        >
          <FillLayer
            id="combinedPolygons"
            filter={['==', ['geometry-type'], 'Polygon']}
            style={{ fillColor: 'green', fillOpacity: 0.15, lineBorderColor: 'black', lineBorderWidth: 2, visibility: showPolygons ? 'visible' : 'none' }}
          />
          <LineLayer
            id="polygonOutline"
            filter={['==', ['geometry-type'], 'Polygon']}
            style={{
              lineColor: '#1b5e20',
              lineWidth: 2,      
              lineJoin: 'round',  
              visibility: showPolygons ? 'visible' : 'none'
            }}
          />
          <LineLayer
            id="combinedLines"
            filter={['==', ['geometry-type'], 'LineString']}
            style={{ lineColor: 'blue', visibility: showLines ? 'visible' : 'none' }}
          />
          <CircleLayer
            id="combinedPoints"
            filter={['==', ['geometry-type'], 'Point']}
            style={{ circleColor: 'red', circleRadius: 5,visibility: showPoints ? 'visible' : 'none', circleOpacity: ['step', ['zoom'], 0, 11, 1]}}
          />
        </ShapeSource>
        <UserLocation visible={true} />
      </MapView>

      <View style={styles.layerControlContainer}>

        {/** BUTTONS */}
        <TouchableOpacity
          style={[styles.floatingButton, !showPoints && styles.buttonDisabled]}
          onPress={() => setShowPoints(!showPoints)}
        >
          <Text style={styles.buttonText}>Small Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingButton, !showLines && styles.buttonDisabled]}
          onPress={() => setShowLines(!showLines)}
        >
          <Text style={styles.buttonText}>Road & Lightrail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingButton, !showPolygons && styles.buttonDisabled]}
          onPress={() => setShowPolygons(!showPolygons)}
        >
          <Text style={styles.buttonText}>Construction & Renovation</Text>
        </TouchableOpacity>
      </View>
      {!followUser && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => setFollowUser(true)}
        >
          <Text style={styles.buttonText}><Ionicons name="location" color={"grey"} size={32}/></Text>
        </TouchableOpacity>
      )}
    </View>

  );
};

export default CharlotteMapTest;
const styles = StyleSheet.create({
  // Temporary AI Styling and Centering: Will Remove
  page: {
    flex: 1,
  },
  map: {
    height: '100%',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },
  // Container for the layer toggle stack
  layerControlContainer: {
    position: 'absolute',
    top: 50, // Below the status bar
    right: 15,
    gap: 10, // Adds space between buttons
  },
  // Individual button style
  floatingButton: {
    backgroundColor: '#2e7d32', // maybe change the color to '#2e7d32' so when its activated it matches the green in the navigation bar
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    //added to make it pop
    borderWidth: 1,
    borderColor: '#1b5e20',
    borderBottomWidth: 3,
    borderBottomColor: '#1b5e20',
  },
  buttonDisabled: {
    backgroundColor: '#969c9f', // Gray out when hidden; this makes since but we could also do a version of this color '#d4f5d0', to tie in with the navigation bar
    borderColor: '#999',
    borderBottomColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Recenter button specific style
  recenterButton: {
    position: 'absolute',
    bottom: 30,
    right: 15,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
