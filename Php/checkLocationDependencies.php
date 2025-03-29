<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

include("config.php");

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if ($conn->connect_error) {
    echo json_encode ([
        "status" => ["code" => 300, "description" => "Database connection failed"]
    ]);
    exit;
}

$locationID = $_POST['locationID'] ?? null;

if (!$locationID) {
    echo json_encode ([
        "status" => ["code" => 400, "description" => "No location ID provided"]
    ]);
    exit;
}

$query = $conn->prepare("SELECT id FROM department WHERE locationID = ?");
$query->bind_param("i", $locationID);
$query->execute();
$query->store_result();

$hasDepartments = $query->num_rows > 0;

echo json_encode ([
    "status" => [
        "code" => 200,
        "description" => "✅ Check complete",
        "hasDepartments" => $hasDepartments
    ]
    ]);

$conn->close();

?>