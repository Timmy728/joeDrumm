<?php
// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// OpenWeatherMap API key
$api_key = '40239c7b19a7290e280d24cc348eb7f6';

// Get coordinates from request
$lat = isset($_GET['lat']) ? $_GET['lat'] : null;
$lon = isset($_GET['lon']) ? $_GET['lon'] : null;

if (!$lat || !$lon) {
    echo json_encode([
        'status' => ['code' => 400, 'message' => 'Missing parameters'],
        'error' => 'Latitude and longitude are required'
    ]);
    exit;
}

// API endpoint for current weather
$url = "https://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&appid={$api_key}&units=metric";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode([
        'status' => ['code' => 500, 'message' => 'API Error'],
        'error' => 'Failed to fetch weather data: ' . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);
$data = json_decode($response, true);

if (!$data || isset($data['cod']) && $data['cod'] !== 200) {
    echo json_encode([
        'status' => ['code' => 500, 'message' => 'API Error'],
        'error' => 'Invalid response from weather API'
    ]);
    exit;
}

echo json_encode([
    'status' => ['code' => 200, 'message' => 'Success'],
    'data' => [
        'city' => $data['name'],
        'country' => $data['sys']['country'],
        'description' => ucfirst($data['weather'][0]['description']),
        'temperature' => round($data['main']['temp']),
        'icon' => "https://openweathermap.org/img/wn/" . $data['weather'][0]['icon'] . "@2x.png"
    ]
]);
?>
