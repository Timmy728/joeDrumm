<?php
header('Content-Type: application/json'); // Ensure JSON response

// Your API Key
$apiKey = "405e0adb0071520e14c73f914452342b";

// Function to fetch all countries
function getAllCountries($apiKey) {
    $url = "https://api.countrylayer.com/v2/all?access_key=" . $apiKey;

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if (curl_errno($curl)) {
        curl_close($curl);
        return ["error" => "cURL Error: " . curl_error($curl)];
    }

    curl_close($curl);
    $data = json_decode($response, true);

    if (!$data) {
        return ["error" => "Error decoding API response."];
    }

    if ($httpCode !== 200 || isset($data['error'])) {
        return ["error" => "API error. Status code: " . $httpCode];
    }

    // Process API response to match expected format
    $countries = [];
    foreach ($data as $country) {
        if (isset($country['alpha2Code']) && isset($country['name'])) {
            $countries[] = [
                "iso2" => $country['alpha2Code'],
                "name" => $country['name']
            ];
        }
    }

    return $countries;
}

// Fetch details for a specific country by ISO2 code
function getCountryByISO2($iso2, $apiKey) {
    $url = "https://api.countrylayer.com/v2/alpha/{$iso2}?access_key=" . $apiKey;

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if (curl_errno($curl)) {
        curl_close($curl);
        return ["error" => "cURL Error: " . curl_error($curl)];
    }

    curl_close($curl);
    $data = json_decode($response, true);

    if (!$data) {
        return ["error" => "Error decoding API response."];
    }

    if ($httpCode !== 200 || isset($data['error'])) {
        return ["error" => "API error. Status code: " . $httpCode];
    }

    return [
        "name" => $data['name'],
        "iso2" => $data['alpha2Code'],
        "iso3" => $data['alpha3Code'],
        "capital" => $data['capital'],
        "population" => $data['population'],
        "timezone" => $data['timezones'][0], // Assuming single timezone
    ];
}

// If 'iso2' is provided, fetch details for that specific country
if (isset($_GET['iso2']) && !empty(trim($_GET['iso2']))) {
    $iso2 = strtoupper(trim($_GET['iso2']));

    if (strlen($iso2) !== 2 || !ctype_alpha($iso2)) {
        echo json_encode(["error" => "Invalid ISO2 country code."]);
        exit;
    }

    echo json_encode(getCountryByISO2($iso2, $apiKey));
} else {
    // No ISO2 provided, return all countries
    echo json_encode(getAllCountries($apiKey));
}
?>
