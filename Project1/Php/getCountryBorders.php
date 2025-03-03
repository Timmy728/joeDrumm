<?php
header('Content-Type: application/json');

// Get the ISO2 country code from the request
$iso2 = isset($_GET['iso2']) ? $_GET['iso2'] : '';

if (empty($iso2)) {
    echo json_encode(['error' => 'No country code provided']);
    exit;
}

// Read the GeoJSON file
$geoJsonPath = '../Data/countryBorders.geo.json';
$geoJsonContent = file_get_contents($geoJsonPath);

if ($geoJsonContent === false) {
    echo json_encode(['error' => 'Failed to read GeoJSON file']);
    exit;
}

// Parse the GeoJSON
$geoJson = json_decode($geoJsonContent, true);

// Find the specific country
$country = null;
foreach ($geoJson['features'] as $feature) {
    if ($feature['properties']['iso_a2'] === $iso2) {
        $country = $feature;
        break;
    }
}

if ($country === null) {
    echo json_encode(['error' => 'Country not found in GeoJSON']);
    exit;
}

// Return just the country data
echo json_encode($country);
?>
