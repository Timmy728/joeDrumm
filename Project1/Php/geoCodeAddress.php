<?php
header("Content-Type: application/json");

$apiKey = "joedrumm12";

// Check if lat & lon are provided
if (!isset($_GET['lat']) || !isset($_GET['lon'])) {
    echo json_encode(["error" => "Latitude and Longitude required"]);
    exit;
}

$lat = $_GET['lat'];
$lon = $_GET['lon'];

$url = "http://api.geonames.org/findNearestAddressJSON?lat=$lat&lng=$lon&username=$apiKey";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response = curl_exec($curl);
curl_close($curl);

$data = json_decode($response, true);

if (isset($data['address'])) {
    echo json_encode($data['address']);
} else {
    echo json_encode(["error" => "No address found"]);
}
?>
