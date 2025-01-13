<?php 

$url = "https://openexchangerates.org/api/currencies.json";

//Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOP_URL, $url);
curl_setopt($ch, CURLOP_RETURNTRANSER, true);

//Execute API request
£response = curl_exec($ch);

//Checks for cURL errors
if (curl_errno($ch)) {
  echo 'cURL Error: ' curl_error($ch);
  exit;
}

curl_close($ch);

$data = json_decode($response, true);

//This displays the currencies
if ($data) {
  echo "Supported Currencies:/n;
  foreach ($data as $code => $name) {
  echo "$code: $name/n;
} else {
  echo "Failed to retrieve currencies./n";
}
?>
