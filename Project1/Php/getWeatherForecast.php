<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$location = isset($_GET['location']) ? $_GET['location'] : '';

if (!$location) {
    echo json_encode([
        'status' => ['code' => 400, 'message' => 'Missing parameters'],
        'error' => 'Location parameter is required.'
    ]);
    exit;
}

// Get capital city for this country code
$countryApiUrl = "https://restcountries.com/v3.1/alpha/" . $location;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $countryApiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$countryData = curl_exec($ch);
curl_close($ch);

if ($countryData === false) {
    echo json_encode([
        'status' => ['code' => 500, 'message' => 'API Error'],
        'error' => 'Could not fetch country data'
    ]);
    exit;
}

$countryInfo = json_decode($countryData, true);
if (!isset($countryInfo[0]['capital'][0])) {
    echo json_encode([
        'status' => ['code' => 404, 'message' => 'Not Found'],
        'error' => 'No capital city found for this country'
    ]);
    exit;
}

$capital = $countryInfo[0]['capital'][0];

// Special handling for USA's capital
if ($location === 'US') {
    $lat = 38.8951; // Washington DC coordinates
    $lon = -77.0364;
} else {
    // Get coordinates for other capital cities
    $geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" . urlencode($capital) . "&count=1&format=json";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $geoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $geoResponse = curl_exec($ch);
    curl_close($ch);

    $geoData = json_decode($geoResponse, true);

    if (!isset($geoData['results'][0])) {
        echo json_encode([
            'status' => ['code' => 404, 'message' => 'Not Found'],
            'error' => 'Could not find coordinates for capital city'
        ]);
        exit;
    }

    $lat = $geoData['results'][0]['latitude'];
    $lon = $geoData['results'][0]['longitude'];
}

// Get Weather Forecast
$apiKey = '40239c7b19a7290e280d24cc348eb7f6'; // OpenWeather API key
$weatherUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lon&units=metric&appid=$apiKey";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $weatherUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$weatherResponse = curl_exec($ch);
curl_close($ch);

$weatherData = json_decode($weatherResponse, true);

if (!$weatherData || isset($weatherData['cod']) && $weatherData['cod'] !== "200") {
    echo json_encode([
        'status' => ['code' => 500, 'message' => 'API Error'],
        'error' => 'Failed to retrieve weather forecast data'
    ]);
    exit;
}

// Process forecast data
$dailyData = [];
foreach ($weatherData['list'] as $reading) {
    $date = date('Y-m-d', strtotime($reading['dt_txt']));
    
    if (!isset($dailyData[$date])) {
        $dailyData[$date] = [
            'minC' => $reading['main']['temp_min'],
            'maxC' => $reading['main']['temp_max'],
            'conditionText' => ucfirst($reading['weather'][0]['description']),
            'conditionIcon' => "https://openweathermap.org/img/wn/" . $reading['weather'][0]['icon'] . "@2x.png"
        ];
    } else {
        $dailyData[$date]['minC'] = min($dailyData[$date]['minC'], $reading['main']['temp_min']);
        $dailyData[$date]['maxC'] = max($dailyData[$date]['maxC'], $reading['main']['temp_max']);
    }
}

// Format the forecast data - now including 4 days (today + 3 forecast days)
$forecast = [];
foreach (array_slice(array_keys($dailyData), 0, 4) as $date) {
    $forecast[] = array_merge(
        ['date' => $date],
        [
            'minC' => round($dailyData[$date]['minC']),
            'maxC' => round($dailyData[$date]['maxC']),
            'conditionText' => $dailyData[$date]['conditionText'],
            'conditionIcon' => $dailyData[$date]['conditionIcon']
        ]
    );
}

echo json_encode([
    'status' => ['code' => 200, 'message' => 'Success'],
    'data' => [
        'location' => $capital,
        'country' => $location,
        'lastUpdated' => date('Y-m-d H:i:s'),
        'forecast' => $forecast
    ]
]);
?>
