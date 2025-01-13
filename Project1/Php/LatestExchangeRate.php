<?php 
//MY APP ID Request
$app_id = '39e1723bbec3413181d6bbe3c3d1d3c8';

//App Endpoint
$url = "https://openexchangerates.org/api/latest.json?app_id=$app_id&base=EUR";

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //Returns the response as a string

//Executes the API request
$response = curl_exec($ch);

if (curl_errno($ch)) {
  echo 'cURL Error: ' . curl_error($ch);
  exit;
}

curl_close($ch);

$data = json_decode($response, true);

//Checks if API returned rates
if (isset($data['rates'])) {
    echo "Exchange rates relative to 1 EUR:\n";
    foreach ($data['rates'] as $currency => $rate) {
        echo "$currency: $rate\n";
    }
} else {
    echo "Failed to retrieve exchange rates. Response:\n";
    print_r($data);
}
?>
