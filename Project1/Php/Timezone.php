<?php

$apiKey = "joedrumm12";

// Function to get the timezone directly using a country's capital
function getTimeZoneByCountry($countryCode, $apiKey) {
    $url = "http://api.geonames.org/searchJSON?q=capital&country=$countryCode&featureCode=PPLC&maxRows=1&username=" . $apiKey;

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    $data = json_decode($response, true);

    if (isset($data['geonames'][0]['lat']) && isset($data['geonames'][0]['lng'])) {
        $lat = $data['geonames'][0]['lat'];
        $lng = $data['geonames'][0]['lng'];

        // Now fetch the timezone using the capital's coordinates
        $timezoneUrl = "http://api.geonames.org/timezoneJSON?lat=$lat&lng=$lng&username=" . $apiKey;

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $timezoneUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $timezoneResponse = curl_exec($curl);
        curl_close($curl);

        $timezoneData = json_decode($timezoneResponse, true);

        return $timezoneData['timezoneId'] ?? null;
    }

    return null;
}

// Check if country code is provided
if (isset($_GET['iso2'])) {
    $countryCode = strtoupper($_GET['iso2']); // Convert to uppercase

    // Get timezone directly
    $timezone = getTimeZoneByCountry($countryCode, $apiKey);

    if ($timezone) {
        echo json_encode(["timezone" => $timezone]);
    } else {
        echo json_encode(["error" => "Timezone not found"]);
    }
} else {
    echo json_encode(["error" => "No country code provided"]);
}
?>
