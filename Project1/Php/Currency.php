<?php
// remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);
$executionStartTime = microtime(true);

// API URLs
$currenciesUrl = "https://openexchangerates.org/api/currencies.json";
$exchangeRateUrl = "https://openexchangerates.org/api/latest.json?app_id=39e1723bbec3413181d6bbe3c3d1d3c8";

// Fetch Currency Names
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $currenciesUrl);
$currenciesResult = curl_exec($ch);
curl_close($ch);

$currenciesData = json_decode($currenciesResult, true);

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $exchangeRateUrl);
$exchangeRateResult = curl_exec($ch);
curl_close($ch);

$exchangeRateData = json_decode($exchangeRateResult, true);

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['currencies'] = $currenciesData;
$output['exchangeRates'] = $exchangeRateData['rates'];

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);

?>
