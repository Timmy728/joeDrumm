<?php
function fetchCurrentWeather($lat, $lon) {
    $apiKey = '40239c7b19a7290e280d24cc348eb7f6'; // Your OpenWeather API key
    $apiUrl = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&units=metric&appid=$apiKey";

    // Make API call
    $response = file_get_contents($apiUrl);

    if ($response === false) {
        return json_encode(['error' => 'Unable to fetch weather data.']);
    }

    $weatherData = json_decode($response, true);

    $currentWeather = [
        'temperature' => $weatherData['main']['temp'] . '°C',
        'description' => $weatherData['weather'][0]['description'],
        'icon' => "https://openweathermap.org/img/wn/" . $weatherData['weather'][0]['icon'] . "@2x.png",
        'city' => $weatherData['name'],
        'country' => $weatherData['sys']['country'],
    ];

    return json_encode($currentWeather);
}

// Handle incoming request
if (isset($_GET['lat']) && isset($_GET['lon'])) {
    $lat = htmlspecialchars($_GET['lat']);
    $lon = htmlspecialchars($_GET['lon']);
    echo fetchCurrentWeather($lat, $lon);
} else {
    echo json_encode(['error' => 'Latitude and longitude parameters are required.']);
}
?>
