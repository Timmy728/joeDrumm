<?php
// remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);
$executionStartTime = microtime(true);

// API URL to get currency names
$currenciesUrl = "https://openexchangerates.org/api/currencies.json";

// Get the selected country ISO2 code from the query string
$iso2 = strtoupper(trim($_GET['iso2'])); // e.g., 'US'

// Check if the country code is provided
if (empty($iso2)) {
    echo json_encode(["error" => "No country code provided."]);
    exit;
}

// Fetch Currency Names from the API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $currenciesUrl);
$currenciesResult = curl_exec($ch);
curl_close($ch);

// Check if API call was successful
if (!$currenciesResult) {
    echo json_encode(["error" => "Failed to fetch currency data."]);
    exit;
}

$currenciesData = json_decode($currenciesResult, true);

// Predefined currency mappings for countries (you can extend this list as needed)
$countryCurrencies = [
    'US' => 'USD', // US uses USD
    'GB' => 'GBP', // UK uses GBP
    'IN' => 'INR', // India uses INR
    'CA' => 'CAD', // Canada uses CAD
    'AU' => 'AUD', // Australia uses AUD
    'JP' => 'JPY', // Japan uses JPY
    'DE' => 'EUR', // Germany uses EUR
    'FR' => 'EUR', // France uses EUR
    'BR' => 'BRL', // Brazil uses BRL
    'CN' => 'CNY', // China uses CNY
    'RU' => 'RUB', // Russia uses RUB
    'IT' => 'EUR', // Italy uses EUR
    'MX' => 'MXN', // Mexico uses MXN
    'AF' => 'AFN', // Afghanistan uses AFN
    'AL' => 'ALL', // Albania uses ALL
    'DZ' => 'DZD', // Algeria uses DZD
    'AS' => 'USD', // American Samoa uses USD
    'AD' => 'EUR', // Andorra uses EUR
    'AO' => 'AOA', // Angola uses AOA
    'AI' => 'XCD', // Anguilla uses XCD
    'AG' => 'XCD', // Antigua and Barbuda uses XCD
    'AR' => 'ARS', // Argentina uses ARS
    'AM' => 'AMD', // Armenia uses AMD
    'AW' => 'AWG', // Aruba uses AWG
    'AU' => 'AUD', // Australia uses AUD
    'AT' => 'EUR', // Austria uses EUR
    'AZ' => 'AZN', // Azerbaijan uses AZN
    'BS' => 'BSD', // Bahamas uses BSD
    'BH' => 'BHD', // Bahrain uses BHD
    'BD' => 'BDT', // Bangladesh uses BDT
    'BB' => 'BBD', // Barbados uses BBD
    'BY' => 'BYN', // Belarus uses BYN
    'BE' => 'EUR', // Belgium uses EUR
    'BZ' => 'BZD', // Belize uses BZD
    'BJ' => 'XOF', // Benin uses XOF
    'BM' => 'BMD', // Bermuda uses BMD
    'BT' => 'BTN', // Bhutan uses BTN
    'BO' => 'BOB', // Bolivia uses BOB
    'BA' => 'BAM', // Bosnia-Herzegovina uses BAM
    'BW' => 'BWP', // Botswana uses BWP
    'BV' => 'NOK', // Bouvet Island uses NOK
    'BR' => 'BRL', // Brazil uses BRL
    'IOT' => 'GBP', // British Indian O. Terr. uses GBP
    'VG' => 'USD', // British Virgin Islands uses USD
    'BN' => 'BND', // Brunei Darussalam uses BND
    'BG' => 'BGN', // Bulgaria uses BGN
    'BF' => 'XOF', // Burkina Faso uses XOF
    'BI' => 'BIF', // Burundi uses BIF
    'KH' => 'KHR', // Cambodia uses KHR
    'CM' => 'XAF', // Cameroon uses XAF
    'CA' => 'CAD', // Canada uses CAD
    'CV' => 'CVE', // Cape Verde uses CVE
    'ANT' => 'XCG', // Caribbean uses XCG
    'KY' => 'KYD', // Cayman Islands uses KYD
    'CF' => 'XAF', // Central African Rep. uses XAF
    'TD' => 'XAF', // Chad uses XAF
    'CL' => 'CLP', // Chile uses CLP
    'CN' => 'CNY', // China uses CNY
    'CX' => 'AUD', // Christmas Island uses AUD
    'CC' => 'AUD', // Cocos Islands uses AUD
    'CO' => 'COP', // Colombia uses COP
    'KM' => 'KMF', // Comoros uses KMF
    'CG' => 'XAF', // Congo (Brazzaville) uses XAF
    'CK' => 'NZD', // Cook Islands uses NZD
    'CR' => 'CRC', // Costa Rica uses CRC
    'HR' => 'HRV', // Croatia uses HRV
    'CU' => 'CUC', // Cuba uses CUC
    'CY' => 'EUR', // Cyprus uses EUR
    'CS' => 'CZK', // Czechia uses CZK
    'CD' => 'CDF', // Democratic Republic of Congo uses CDF
    'DK' => 'DKK', // Denmark uses DKK
    'DJ' => 'DJF', // Djibouti uses DJF
    'DM' => 'XCD', // Dominica uses XCD
    'DO' => 'DOP', // Dominican Republic uses DOP
    'EC' => 'USD', // Ecuador uses USD
    'EG' => 'EGP', // Egypt uses EGP
    'SV' => 'USD', // El Salvador uses USD
    'GNQ' => 'XAF', // Equatorial Guinea uses XAF
    'ERI' => 'ERN', // Eritrea uses ERN
    'EE' => 'EUR', // Estonia uses EUR
    'SZ' => 'SZL', // Eswatini uses SZL
    'ETH' => 'ETB', // Ethiopia uses ETB
    'EU' => 'EUR', // European Union uses EUR
    'FK' => 'FKP', // Falkland Islands uses FKP
    'FO' => 'DKK', // Faroe Islands uses DKK
    'FJ' => 'FJD', // Fiji uses FJD
    'FI' => 'EUR', // Finland uses EUR
    'FR' => 'EUR', // France uses EUR
    'FXX' => 'EUR', // France, Metropolitan uses EUR
    'GF' => 'EUR', // French Guiana uses EUR
    'PF' => 'XPF', // French Polynesia uses XPF
    'TF' => 'EUR', // French Southern Terr. uses EUR
    'GA' => 'XAF', // Gabon uses XAF
    'GM' => 'GMD', // Gambia uses GMD
    'GEO' => 'GEL', // Georgia uses GEL
    'DE' => 'EUR', // Germany uses EUR
    'GH' => 'GHS', // Ghana uses GHS
    'GI' => 'GIP', // Gibraltar uses GIP
    'GBR' => 'GBP', // Great Britain uses GBP
    'GR' => 'EUR', // Greece uses EUR
    'GRL' => 'DKK', // Greenland uses DKK
    'GD' => 'XCD', // Grenada uses XCD
    'GP' => 'EUR', // Guadeloupe uses EUR
    'GUM' => 'USD', // Guam uses USD
    'GT' => 'GTQ', // Guatemala uses GTQ
    'GGY' => 'GGP', // Guernsey uses GGP
    'GIN' => 'GNF', // Guinea uses GNF
    'GNB' => 'XOF', // Guinea Bissau uses XOF
    'GUY' => 'GYD', // Guyana uses GYD
    'HTI' => 'HTG', // Haiti uses HTG
    'HM' => 'AUD', // Heard and McDonald Islands uses AUD
    'HN' => 'HNL', // Honduras uses HNL
    'HKG' => 'HKD', // Hong Kong uses HKD
    'HUN' => 'HUF', // Hungary uses HUF
    'ISL' => 'ISK', // Iceland uses ISK
    'IND' => 'INR', // India uses INR
    'IDN' => 'IDR', // Indonesia uses IDR
    'IRN' => 'IRR', // Iran uses IRR
    'IRQ' => 'IQD', // Iraq uses IQD
    'IRL' => 'EUR', // Ireland uses EUR
    'IMP' => 'IMP', // Isle of Man uses IMP
    'ISR' => 'ILS', // Israel uses ILS
    'ITA' => 'EUR', // Italy uses EUR
    'CI' => 'XOF', // Ivory Coast uses XOF
    'JAM' => 'JMD', // Jamaica uses JMD
    'JPN' => 'JPY', // Japan uses JPY
    'JEY' => 'USD', // Jersey uses USD
    'JOR' => 'JOD', // Jordan uses JOD
    'KAZ' => 'KZT', // Kazakhstan uses KZT
    'KEN' => 'KES', // Kenya uses KES
    'KIR' => 'AUD', // Kiribati uses AUD
    'KWT' => 'KWD', // Kuwait uses KWD
    'KGZ' => 'KGS', // Kyrgyzstan uses KGS
    'LAO' => 'LAK', // Laos uses LAK
    'LVA' => 'EUR', // Latvia uses EUR
    'LSO' => 'LSL', // Lesotho uses LSL
    'LBR' => 'LRD', // Liberia uses LRD
    'LBY' => 'LYD', // Libya uses LYD
    'LIE' => 'CHF', // Liechtenstein uses CHF
    'LTU' => 'LTL', // Lithuania uses LTL
    'LUX' => 'EUR', // Luxembourg uses EUR
    'MAC' => 'MOP', // Macau uses MOP
    'MDG' => 'MGA', // Madagascar uses MGA
    'MWI' => 'MWK', // Malawi uses MWK
    'MYS' => 'MYR', // Malaysia uses MYR
    'MDV' => 'MVR', // Maldives uses MVR
    'MLI' => 'MLF', // Mali uses MLF
    'MLT' => 'EUR', // Malta uses EUR
    'MHL' => 'USD', // Marshall Islands uses USD
    'MEX' => 'MXN', // Mexico uses MXN
    'FSM' => 'USD', // Micronesia uses USD
    'MDA' => 'MDL', // Moldova uses MDL
    'MCO' => 'EUR', // Monaco uses EUR
    'MNG' => 'MNT', // Mongolia uses MNT
    'MNE' => 'EUR', // Montenegro uses EUR
    'MSR' => 'XCD', // Montserrat uses XCD
    'MAR' => 'MAD', // Morocco uses MAD
    'MOZ' => 'MZN', // Mozambique uses MZN
    'MMR' => 'MMK', // Myanmar uses MMK
    'NAM' => 'NAD', // Namibia uses NAD
    'NRU' => 'AUD', // Nauru uses AUD
    'NPL' => 'NPR', // Nepal uses NPR
    'NLD' => 'EUR', // Netherlands uses EUR
    'NCL' => 'XPF', // New Caledonia uses XPF
    'NZL' => 'NZD', // New Zealand uses NZD
    'NIC' => 'NIO', // Nicaragua uses NIO
    'NER' => 'CFA', // Niger uses CFA
    'NGA' => 'NGN', // Nigeria uses NGN
    'PRK' => 'KPW', // North Korea uses KPW
    'MNP' => 'USD', // Northern Mariana Islands uses USD
    'NOR' => 'NOK', // Norway uses NOK
    'OMN' => 'OMR', // Oman uses OMR
    'PAK' => 'PKR', // Pakistan uses PKR
    'PLW' => 'USD', // Palau uses USD
    'PAN' => 'PAB', // Panama uses PAB
    'PNG' => 'PGK', // Papua New Guinea uses PGK
    'PRT' => 'PTE', // Portugal uses PTE
    'PLW' => 'USD', // Palau uses USD
    'PER' => 'PEN', // Peru uses PEN
    'PHL' => 'PHP', // Philippines uses PHP
    'POL' => 'PLN', // Poland uses PLN
    'PNG' => 'PGK', // Papua New Guinea uses PGK
    'PRI' => 'USD', // Puerto Rico uses USD
    'PRY' => 'PYG', // Paraguay uses PYG
    'QAT' => 'QAR', // Qatar uses QAR
    'ROU' => 'RON', // Romania uses RON
    'RUS' => 'RUB', // Russia uses RUB
    'RWA' => 'RWF', // Rwanda uses RWF
    'STP' => 'STP', // São Tomé and Príncipe uses STP
    'SEN' => 'SEN', // Senegal uses SEN
    'SYC' => 'SCR', // Seychelles uses SCR
    'SLE' => 'SLL', // Sierra Leone uses SLL
    'SGP' => 'SGD', // Singapore uses SGD
    'SVK' => 'EUR', // Slovakia uses EUR
    'SVN' => 'EUR', // Slovenia uses EUR
    'SLB' => 'SBD', // Solomon Islands uses SBD
    'SOM' => 'SOS', // Somalia uses SOS
    'SUR' => 'SRD', // Suriname uses SRD
    'SSD' => 'SSP', // South Sudan uses SSP
    'STP' => 'STP', // São Tomé and Príncipe uses STP
    'SWE' => 'SEK', // Sweden uses SEK
    'SWZ' => 'SZL', // Swaziland uses SZL
    'SYR' => 'SYP', // Syria uses SYP
    'TGA' => 'TOP', // Tonga uses TOP
    'THA' => 'THB', // Thailand uses THB
    'TGO' => 'TGO', // Togo uses TGO
    'TKL' => 'NZD', // Tokelau uses NZD
    'TON' => 'TOP', // Tonga uses TOP
    'TUN' => 'TND', // Tunisia uses TND
    'TUR' => 'TRY', // Turkey uses TRY
    'TCA' => 'BBD', // Turks and Caicos Islands uses BBD
    'TUV' => 'AUD', // Tuvalu uses AUD
    'TWN' => 'TWD', // Taiwan uses TWD
    'TJK' => 'TJS', // Tajikistan uses TJS
    'TKM' => 'TMT', // Turkmenistan uses TMT
    'TZA' => 'TZS', // Tanzania uses TZS
    'UGA' => 'UGX', // Uganda uses UGX
    'UKR' => 'UAH', // Ukraine uses UAH
    'ARE' => 'AED', // UAE uses AED
    'GB' => 'GBP', // United Kingdom uses GBP
    'USA' => 'USD', // United States uses USD
    'URY' => 'UYU', // Uruguay uses UYU
    'UZB' => 'UZS', // Uzbekistan uses UZS
    'VAN' => 'VUV', // Vanuatu uses VUV
    'VEN' => 'VES', // Venezuela uses VES
    'VNM' => 'VND', // Vietnam uses VND
    'VGB' => 'USD', // Virgin Islands uses USD
    'WLF' => 'USD', // Wallis and Futuna uses USD
    'WSM' => 'WST', // Samoa uses WST
    'YEM' => 'YER', // Yemen uses YER
    'ZMB' => 'ZMW', // Zambia uses ZMW
    'ZWE' => 'ZWL', // Zimbabwe uses ZWL
];

// Check if the country code exists in the countryCurrencies mapping
if (!isset($countryCurrencies[$iso2])) {
    echo json_encode(["error" => "Currency not found for the given country: " . $iso2]);
    exit;
}

$currencyCode = $countryCurrencies[$iso2];

// Get the full currency name
$currencyName = $currenciesData[$currencyCode] ?? 'Unknown Currency';

// Prepare output
$output = [
    'status' => [
        'code' => "200",
        'name' => "ok",
        'description' => "success",
        'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    'currencyCode' => $currencyCode,
    'currencyName' => $currencyName
];

// Return the result as JSON
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
