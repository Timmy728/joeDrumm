<?php
// My GEONAME API Key
$apiKey = "joedrumm12";

// Check if query parameter is set
if (!isset($_GET['query'])) {
    echo json_encode(["error" => "No query provided"]);
    exit;
}

$searchQuery = urlencode($_GET['query']);
$url = "http://api.geonames.org/wikipediaSearchJSON?q={$searchQuery}&maxRows=5&username={$apiKey}";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($curl);
curl_close($curl);

if (!$response) {
    echo json_encode(["error" => "No response from API"]);
    exit;
}

$data = json_decode($response, true);

if (!isset($data['geonames']) || empty($data['geonames'])) {
    echo json_encode(["error" => "No Wikipedia entries found"]);
    exit;
}

// Process data
$results = [];
foreach ($data['geonames'] as $entry) {
    $results[] = [
        "title" => $entry['title'] ?? "No Title",
        "summary" => $entry['summary'] ?? "No summary available.",
        "link" => isset($entry['wikipediaUrl']) ? "https://" . $entry['wikipediaUrl'] : "#",
        "image" => $entry['thumbnailImg'] ?? "https://via.placeholder.com/150" // Default placeholder
    ];
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode(["results" => $results]);
?>
