<?php
header('Content-Type: application/json'); // Ensure JSON response

// Function to fetch countries
function getFilteredCountries() {
    $url = "https://restcountries.com/v3.1/all?fields=cca2,name,independent";

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
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        exit;
    }

    curl_close($curl);
    $data = json_decode($response, true);

    if (!$data || $httpCode !== 200) {
        echo json_encode(["error" => "API error. Status code: " . $httpCode]);
        exit;
    }

    $countries = [];

    foreach ($data as $country) {
        if (isset($country['cca2'], $country['name']['common'])) {
            if (!isset($country['independent']) || $country['independent'] !== true) continue;

            $countries[] = [
                "iso2" => $country['cca2'],
                "name" => $country['name']['common']
            ];
        }
    }

    usort($countries, fn($a, $b) => strcmp($a['name'], $b['name']));
    $countries = array_slice($countries, 0, 200);

    echo json_encode($countries);
    exit;
}


// If 'iso2' is provided, fetch details for that specific country
function getCountryByISO2($iso2) {
    $url = "https://restcountries.com/v3.1/alpha/{$iso2}";

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
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        exit;
    }

    curl_close($curl);
    $data = json_decode($response, true);

    if (!$data || $httpCode !== 200) {
        echo json_encode(["error" => "API error. Status code: " . $httpCode]);
        exit;
    }

    // Handle object or array format
    $country = is_array($data) ? $data[0] : $data;

    echo json_encode([
        "name" => $country['name']['common'] ?? "N/A",
        "iso2" => $country['cca2'] ?? "N/A",
        "iso3" => $country['cca3'] ?? "N/A",
        "capital" => $country['capital'][0] ?? "N/A",
        "population" => $country['population'] ?? "N/A",
        "timezone" => $country['timezones'][0] ?? "N/A",
    ]);
    exit;
}


// Handle requests
if (isset($_GET['iso2']) && !empty(trim($_GET['iso2']))) {
    $iso2 = strtoupper(trim($_GET['iso2']));

    if (strlen($iso2) !== 2 || !ctype_alpha($iso2)) {
        echo json_encode(["error" => "Invalid ISO2 country code."]);
        exit;
    }

    getCountryByISO2($iso2);
} else {
    getFilteredCountries();
}
?>
