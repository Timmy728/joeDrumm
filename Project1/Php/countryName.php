<?php
header('Content-Type: application/json'); // Ensure JSON response

// Your API Key
$apiKey = "405e0adb0071520e14c73f914452342b";

function getCountryByISO2($iso2, $apiKey) {
    // API URL with query parameters
    $url = "https://api.countrylayer.com/v2/alpha/" . urlencode($iso2) . "?access_key=" . $apiKey;

    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE); // Get HTTP status code

    // Handle cURL errors
    if (curl_errno($curl)) {
        curl_close($curl);
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        exit;
    }

    curl_close($curl);

    // Decode JSON response
    $data = json_decode($response, true);

    // Check if the response is valid
    if (!$data) {
        return ["error" => "Error decoding the API response."];
    }

    // Handle API errors (e.g., invalid country code, API limits, etc.)
    if ($httpCode !== 200) {
        return ["error" => "API error. Status code: " . $httpCode];
    }

    if (isset($data['error'])) {
        return ["error" => "API Error: " . $data['error']['info']];
    }

    return $data;
}

// Check if 'iso2' is provided in the GET request
if (!isset($_GET['iso2']) || empty(trim($_GET['iso2']))) {
    echo json_encode(["error" => "No ISO2 country code provided."]);
    exit;
}

$iso2 = trim($_GET['iso2']); // Sanitize input

// Call the function and get the result
$result = getCountryByISO2($iso2, $apiKey);

// Return the result as JSON
echo json_encode($result);
?>
