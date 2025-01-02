<?php
// Enable error reporting for debugging; remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);

// Measure execution time
$executionStartTime = microtime(true);

// Validate that latitude and longitude are provided
if (!isset($_REQUEST['lat']) || !isset($_REQUEST['lng'])) {
    $output = [
        'status' => [
            'code' => 400,
            'name' => 'error',
            'description' => 'Missing required parameters: lat and lng',
        ],
        'data' => null
    ];

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
    exit;
}

// Sanitize and retrieve latitude and longitude
$lat = htmlspecialchars($_REQUEST['lat']);
$lng = htmlspecialchars($_REQUEST['lng']);

// Construct API URL
$url = 'http://api.geonames.org/countryCodeJSON?lat=' . $lat . '&lng=' . $lng . '&username=joedrumm12';

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Execute and close cURL
$result = curl_exec($ch);

// Check for cURL errors
if ($result === false) {
    $output = [
        'status' => [
            'code' => 500,
            'name' => 'error',
            'description' => 'cURL error: ' . curl_error($ch),
        ],
        'data' => null
    ];

    curl_close($ch);

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
    exit;
}

curl_close($ch);

// Decode JSON response
$data = json_decode($result, true);

// Check if the API response is valid
if (!isset($data['countryCode'])) {
    $output = [
        'status' => [
            'code' => 404,
            'name' => 'error',
            'description' => 'No country code found for the given coordinates.',
        ],
        'data' => $data
    ];

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
    exit;
}

// Prepare output
$output = [
    'status' => [
        'code' => 200,
        'name' => 'ok',
        'description' => 'success',
        'returnedIn' => (intval((microtime(true) - $executionStartTime) * 1000)) . " ms",
    ],
    'data' => $data
];

// Return JSON response
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
