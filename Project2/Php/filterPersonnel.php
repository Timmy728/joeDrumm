<?php
header('Content-Type: application/json');
include("db.php");

$departmentID = $_GET['departmentID'] ?? null;
$locationID = $_GET['locationID'] ?? null;

// ✅ Enforce EITHER department OR location
if (($departmentID && $locationID) || (!$departmentID && !$locationID)) {
    echo json_encode([
        "status" => ["code" => 400, "description" => "Choose either department or location, not both."],
        "data" => []
    ]);
    exit;
}

try {
    if ($departmentID) {
        $query = "SELECT p.id, p.firstName, p.lastName, p.email, p.jobTitle,
                         d.name AS department, l.name AS location
                  FROM personnel p
                  LEFT JOIN department d ON p.departmentID = d.id
                  LEFT JOIN location l ON d.locationID = l.id
                  WHERE p.departmentID = :deptID
                  ORDER BY p.lastName ASC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':deptID', $departmentID, PDO::PARAM_INT);
    } else {
        $query = "SELECT p.id, p.firstName, p.lastName, p.email, p.jobTitle,
                         d.name AS department, l.name AS location
                  FROM personnel p
                  LEFT JOIN department d ON p.departmentID = d.id
                  LEFT JOIN location l ON d.locationID = l.id
                  WHERE l.id = :locID
                  ORDER BY p.lastName ASC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':locID', $locationID, PDO::PARAM_INT);
    }

    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => ["code" => 200, "description" => "Success"],
        "data" => $result
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => ["code" => 500, "description" => "Database query failed"],
        "data" => []
    ]);
}
?>
