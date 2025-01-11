<?php
function fetchWeatherForecast($lat, $lon, $cnt = 16) {
    $apiKey = '40239c7b19a7290e280d24cc348eb7f6'; 
    $apiUrl = "https://api.openweathermap.org/data/2.5/forecast/daily?lat=$lat&lon=$lon&cnt=$cnt&units=metric&appid=$apiKey";

    // Make API call
    $response = file_get_contents($apiUrl);

    if ($response === false) {
        return json_encode(['error' => 'Unable to fetch forecast data.']);
    }

    $forecastData = json_decode($response, true);

    // Simplify data for easier use
    $dailyForecasts = [];
    foreach ($forecastData['list'] as $day) {
        $dailyForecasts[] = [
            'date' => date('Y-m-d', $day['dt']),
            'temperature' => [
                'min' => $day['temp']['min'] . '°C',
                'max' => $day['temp']['max'] . '°C',
            ],
            'description' => $day['weather'][0]['description'],
            'icon' => "https://openweathermap.org/img/wn/" . $day['weather'][0]['icon'] . "@2x.png",
        ];
    }
    return json_encode($dailyForecasts);
}

// Handle incoming request
if (isset($_GET['lat']) && isset($_GET['lon'])) {
    $lat = htmlspecialchars($_GET['lat']);
    $lon = htmlspecialchars($_GET['lon']);
    $cnt = isset($_GET['cnt']) ? intval($_GET['cnt']) : 16;
    echo fetchWeatherForecast($lat, $lon, $cnt);
} else {
    echo json_encode(['error' => 'Latitude and longitude parameters are required.']);
}
?>
