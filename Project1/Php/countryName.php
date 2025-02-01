<?php
header('Content-Type: application/json'); // Ensure JSON response

// My API Key
$apiKey = "405e0adb0071520e14c73f914452342b";

function getCountryByName($countryName, $apiKey) {
    // API URL with query parameters
    $url = "https://api.countrylayer.com/v2/name/" . urlencode($countryName) . "?access_key=" . $apiKey . "&fullText=true";

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

    // Handle API errors (e.g., invalid country name, API limits, etc.)
    if ($httpCode !== 200 || isset($data['error'])) {
        return ["error" => "Invalid country name or API error."];
    }

    return $data;
}

// Check if 'countryName' is provided in the GET request
if (!isset($_GET['countryName']) || empty(trim($_GET['countryName']))) {
    echo json_encode(["error" => "No country name provided."]);
    exit;
}

$countryName = trim($_GET['countryName']); // Sanitize input
$result = getCountryByName($countryName, $apiKey);

// Return the result as JSON
echo json_encode($result);
?>
