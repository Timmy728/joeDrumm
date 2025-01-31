<?php
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

// If the 'countryName' is passed as a GET parameter
if (isset($_GET['countryName'])) {
    $countryName = $_GET['countryName'];  // Get country name from request
    $result = getCountryByName($countryName, $apiKey);

    // Return the result as a JSON response
    if ($result && !isset($result['error'])) {
        // Output the country data as JSON
        echo json_encode($result);
    } else {
        // Return an error if the data couldn't be fetched
        echo json_encode(['error' => 'Error fetching country data.']);
    }
} else {
    // Return an error if no country name is provided
    echo json_encode(['error' => 'No country name provided.']);
}
?>
