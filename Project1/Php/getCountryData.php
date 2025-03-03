<?php
header('Content-Type: application/json');

// Get the ISO2 country code from the request
$iso2 = isset($_GET['iso2']) ? $_GET['iso2'] : '';

if (empty($iso2)) {
    echo json_encode(['error' => 'No country code provided']);
    exit;
}

// Make request to REST Countries API
$url = "https://restcountries.com/v3.1/alpha/{$iso2}";
$response = file_get_contents($url);

if ($response === false) {
    echo json_encode(['error' => 'Failed to fetch country data']);
    exit;
}

// Return the data
echo $response;
?>
