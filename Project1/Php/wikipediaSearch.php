<?php 
//My GEONAME API Key
$apiKey = "joedrumm12";

function getWikipediaLinks($searchQuery, $apiKey) {
  $url = "http://api.geonames.org/wikipediaSearchJSON?q=" . urlencode($searchQuery) . "&maxRows=10&username=" . $apiKey;

  $curl = curl_init();
  
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
});

  // Execute the API request
    $response = curl_exec($curl);

    // Handle errors
    if (curl_errno($curl)) {
        echo "cURL Error: " . curl_error($curl);
        return null;
    }
    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($response, true);

    return $data['geonames'] ?? null;
}
$searchQuery = "France"; // Replace with the country name or topic
$result = getWikipediaLinks($searchQuery, $apiKey);

// Display Wikipedia links
if ($result) {
    echo "Wikipedia Links for '$searchQuery':\n\n";
    foreach ($result as $item) {
        $title = $item['title'] ?? "N/A";
        $link = $item['wikipediaUrl'] ?? "N/A";
        echo "Title: $title, Link: https://$link\n";
    }
} else {
    echo "Error fetching Wikipedia links for '$searchQuery'.\n";
}

?>
