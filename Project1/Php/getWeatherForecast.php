<?php
// Your new API key from WeatherAPI
$apiKey = "4308ba2b229c4a02b83181046251102";

// Fetch latitude and longitude from the URL parameters
$lat = isset($_GET['lat']) ? $_GET['lat'] : '';
$lon = isset($_GET['lon']) ? $_GET['lon'] : '';

// Check if latitude and longitude are provided
if ($lat && $lon) {
    // Validate latitude and longitude
    if (!is_numeric($lat) || !is_numeric($lon)) {
        echo json_encode(["error" => "Invalid latitude or longitude."]);
        exit; // Exit if lat or lon are not valid
    }

    // Build the API request URL (remove the extra space after '?')
    $url = "https://api.weatherapi.com/v1/forecast.json?key=$apiKey&q=$lat,$lon&days=4";

    // Fetch weather data
    $response = file_get_contents($url);

    if ($response) {
        // Decode the JSON response into an array
        $weatherData = json_decode($response, true);

        if (isset($weatherData['error'])) {
            // Handle error if API returns an error
            echo json_encode(["error" => $weatherData['error']['message']]);
        } else {
            // Extract forecast data
            $forecast = [];
            foreach ($weatherData['forecast']['forecastday'] as $day) {
                $forecast[] = [
                    'date' => $day['date'],
                    'min_temp' => $day['day']['mintemp_c'],
                    'max_temp' => $day['day']['maxtemp_c'],
                    'condition' => $day['day']['condition']['text'],
                ];
            }

            // Send the forecast data as JSON
            echo json_encode($forecast);
        }
    } else {
        echo json_encode(["error" => "Unable to fetch weather data."]);
    }
} else {
    echo json_encode(["error" => "Latitude and/or longitude not provided."]);
}
?>
