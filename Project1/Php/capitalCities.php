<?php

// My API Access key
$apiKey = "405e0adb0071520e14c73f914452342b";

// Function to fetch all capitals
function getAllCapitals($apiKey) {
    // API URL to fetch all countries
    $url = "https://api.countrylayer.com/v2/all?access_key=" . $apiKey;

    // Initialize cURL
    $curl = curl_init();

    // Set cURL options
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    // Execute the API request
    $response = curl_exec($curl);

    // Handle errors
    if (curl_errno($curl)) {
        echo "cURL Error: " . curl_error($curl);
        return null;
    }

    // Close cURL session
    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($response, true);

    return $data;
}

$result = getAllCapitals($apiKey);

// Display all capitals
if ($result && !isset($result['error'])) {
    echo "List of Capitals:\n\n";
    foreach ($result as $country) {
        $capital = $country['capital'] ?? "N/A";
        echo "$capital\n";
    }
} else {
    echo "Error fetching capitals.\n";
}

?>
