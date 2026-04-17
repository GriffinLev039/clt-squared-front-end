import Mapbox, {
    Camera,
    CircleLayer,
    FillLayer,
    LineLayer,
    MapView,
    ShapeSource,
    StyleURL
} from "@rnmapbox/maps";
import { useLocalSearchParams } from "expo-router";
import { Feature, FeatureCollection } from "geojson";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import geoJSONData from '../src/assets/mockData.json';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "This wont happen");

const DetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const geoJ = geoJSONData as FeatureCollection;

    const selectedFeature = geoJ.features.find(
        (f) => f.properties?.OBJECTID?.toString() === id
    ) as Feature;

    const getCoordinates = (f: Feature) => {
        if (!f) {
            return [-80.8431, 35.2271]; // CENTER OF CLT
        }
        const geoType = f.geometry.type;
        if (geoType == "Point") {
            return f.geometry.coordinates;
        } else if (geoType == "Polygon") {
            return f.geometry.coordinates[0][0];
        } else if (geoType == "LineString") {
            return f.geometry.coordinates[0];
        } else {
            return [-80.8431, 35.2271];
        }
    };

    const [center] = useState(getCoordinates(selectedFeature));

    if (!selectedFeature) {
        return (
            <View style={styles.container}>
                <Text>Project not found for ID: {id}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                styleURL={StyleURL.Street}
                style={styles.mapContainer}
                logoEnabled={false}
            >
                <Camera
                    zoomLevel={16}
                    centerCoordinate={center}
                    animationDuration={0}
                />
                <ShapeSource id="combinedSource" shape={selectedFeature}>
                    <FillLayer
                        id="combinedPolygons"
                        filter={['==', ['geometry-type'], 'Polygon']}
                        style={{ fillColor: 'green' }}
                    />
                    <LineLayer
                        id="combinedLines"
                        filter={['==', ['geometry-type'], 'LineString']}
                        style={{ lineColor: 'blue' }}
                    />
                    <CircleLayer
                        id="combinedPoints"
                        filter={['==', ['geometry-type'], 'Point']}
                        style={{ circleColor: 'red' }}
                    />
                </ShapeSource>
            </MapView>

            {/* Forced separation section */}
            <View style={styles.detailsSection}>
                <Text style={styles.sectionHeader}>Project Details</Text>
                <View style={styles.divider} />

                <View style={styles.textContainer}>
                    <Text style={styles.detailText}>
                        <Text style={styles.label}>Name: </Text>
                        {selectedFeature.properties?.Project_Name}
                    </Text>

                    <Text style={styles.detailText}>
                        <Text style={styles.label}>ID: </Text>
                        {selectedFeature.properties?.OBJECTID}
                    </Text>

                    <Text style={styles.detailText}>
                        <Text style={styles.label}>Location Description: </Text>
                        {selectedFeature.properties?.Location_Description}
                    </Text>

                    <Text style={styles.detailText}>
                        <Text style={styles.label}>Project Description: </Text>
                        {selectedFeature.properties?.Public_Project_Description}
                    </Text>

                    <Text style={styles.detailText}>
                        <Text style={styles.label}>Status: </Text>
                        {selectedFeature.properties?.Status || "N/A"}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white'
    },

    mapContainer: {
        width: '100%',
        height: 180,
        marginVertical: 15,
        borderRadius: 20,
        overflow: 'hidden',
    },

    detailsSection: {
        marginTop: 10
    },

    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6
    },

    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 10
    },

    textContainer: {
        // no flex here
    },

    label: {
        fontWeight: 'bold'
    },

    detailText: {
        fontSize: 16,
        marginBottom: 8,
        lineHeight: 22
    }
});

export default DetailsScreen;

