<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include 'config.php';

header("Content-Type: application/json");

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Fetch personnel with department and location, handling NULL values
$sql = "SELECT 
            p.id,
            p.lastName, 
            p.firstName, 
            p.jobTitle, 
            p.email, 
            COALESCE(d.name, 'Unassigned') AS department, 
            COALESCE(l.name, 'Unassigned') AS location 
        FROM personnel p
        LEFT JOIN department d ON d.id = p.departmentID
        LEFT JOIN location l ON l.id = d.locationID
        ORDER BY p.lastName, p.firstName";

$result = $conn->query($sql);
$personnel = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $personnel]);
} else {
    echo json_encode(["status" => "error", "message" => "Query failed"]);
}

$conn->close();
?>
