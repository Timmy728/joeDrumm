<?php

$location = isset($_GET['location']) ? $_GET['location'] : '';

if (!$location) {
    echo json_encode(["error" => "Location not provided."]);
    exit;
}

$geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" . urlencode($location) . "&count=1&format=json";
$geoResponse = file_get_contents($geoUrl);
$geoData = json_decode($geoResponse, true);

if (!isset($geoData['results'][0])) {
    echo json_encode(["error" => "Invalid location. Please enter a valid city or country."]);
    exit;
}

$lat = $geoData['results'][0]['latitude'];
$lon = $geoData['results'][0]['longitude'];

// Step 2: Get Weather Forecast for Last 10 Days
$weatherUrl = "https://archive-api.open-meteo.com/v1/archive?latitude=$lat&longitude=$lon&start_date=" . date('Y-m-d', strtotime('-10 days')) . "&end_date=" . date('Y-m-d') . "&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto";
$weatherResponse = file_get_contents($weatherUrl);
$weatherData = json_decode($weatherResponse, true);

if (!$weatherData) {
    echo json_encode(["error" => "Failed to retrieve weather data."]);
    exit;
}

$forecast = [];
foreach ($weatherData['daily']['time'] as $index => $date) {
    $forecast[] = [
        "date" => $date,
        "min_temp" => $weatherData['daily']['temperature_2m_min'][$index],
        "max_temp" => $weatherData['daily']['temperature_2m_max'][$index],
        "weather_code" => $weatherData['daily']['weathercode'][$index]
    ];
}

echo json_encode($forecast);
?>
