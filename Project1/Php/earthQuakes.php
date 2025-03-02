<?php
// Enable error reporting for debugging (Remove for production)
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// ✅ Check if all required parameters are set
if (!isset($_GET['north'], $_GET['south'], $_GET['east'], $_GET['west'])) {
    echo json_encode(["error" => "❌ Missing bounding box parameters (north, south, east, west)."]);
    exit;
}

// ✅ Get parameters safely
$north = $_GET['north'];
$south = $_GET['south'];
$east = $_GET['east'];
$west = $_GET['west'];

$url = "http://api.geonames.org/earthquakesJSON?formatted=true&north=$north&south=$south&east=$east&west=$west&username=joedrumm12&style=full";

// ✅ Fetch data from GeoNames API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(["error" => "❌ cURL Error: " . curl_error($ch)]);
    exit;
}

curl_close($ch);

$decode = json_decode($result, true);

// ✅ Check if earthquakes exist in response
if (!isset($decode['earthquakes']) || empty($decode['earthquakes'])) {
    echo json_encode(["error" => "⚠️ No earthquake data found."]);
    exit;
}

// ✅ Return data as JSON
$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode['earthquakes'];

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
?>
