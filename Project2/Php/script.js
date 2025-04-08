$(document).ready(function () {
    loadPersonnel();
    loadDepartments();
    loadLocations();
});

// ✅ Fix Bootstrap ARIA issue where focus is retained while aria-hidden remains true
$(".modal").on("shown.bs.modal", function () {
    $(this).attr("aria-hidden", "false");
    // Remove backdrop and add primary background
    $(this).data('bs.modal')._config.backdrop = false;
    $(this).find('.modal-header').addClass('bg-primary text-white');
});

// 🔁 Reload correct table when switching tabs
$('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    const target = $(e.target).attr('id');

    if (target === "personnelBtn") {
        loadPersonnel();
    } else if (target === "departmentsBtn") {
        loadDepartments();
    } else if (target === "locationsBtn") {
        loadLocations();
    }
});

// 🟢 SEARCH FUNCTION
$("#searchInp").on("keyup", function () {
    let searchQuery = $(this).val().trim();

    console.log("🔍 Searching for:", searchQuery);

    if (searchQuery.length < 1) {
        console.log("🔍 Search query is empty. Reloading all personnel.");
        loadPersonnel();
        return;
    }

    $.ajax({
        url: "Php/searchAll.php",
        type: "GET",
        data: { txt: searchQuery },
        dataType: "json",
        success: function (response) {
            console.log("✅ Debug - Full response:", response);

            if (response.status.code == 200) {
                let personnelTable = $("#personnelTableBody")[0];
                const fragment = document.createDocumentFragment();
                personnelTable.innerHTML = ''; // Clear previous results

                if (!response.data || !Array.isArray(response.data.found)) {
                    console.log("⚠️ No valid personnel data found.");
                    const row = document.createElement('tr');
                    
                    const cell = document.createElement('td');
                    cell.colSpan = 5;
                    cell.className = 'text-center';
                    cell.textContent = 'No results found';
                    row.appendChild(cell);

                    fragment.appendChild(row);
                    personnelTable.appendChild(fragment);
                    return;
                }

                let personnelList = response.data.found;
                console.log("✅ Processed search results:", personnelList);

                if (personnelList.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="5" class="text-center">No results found</td>';
                    fragment.appendChild(row);
                } else {
                    personnelList.forEach(person => {
                        const row = document.createElement('tr');
                        
                        const nameCell = document.createElement('td');
                        nameCell.className = 'align-middle text-nowrap';
                        nameCell.textContent = `${person.lastName}, ${person.firstName}`;
                        row.appendChild(nameCell);

                        const deptCell = document.createElement('td');
                        deptCell.className = 'align-middle text-nowrap d-none d-md-table-cell';
                        deptCell.textContent = person.departmentName ?? 'Unassigned';
                        row.appendChild(deptCell);

                        const locCell = document.createElement('td');
                        locCell.className = 'align-middle text-nowrap d-none d-md-table-cell';
                        locCell.textContent = person.locationName ?? 'Unassigned';
                        row.appendChild(locCell);

                        const emailCell = document.createElement('td');
                        emailCell.className = 'align-middle text-nowrap d-none d-md-table-cell';
                        emailCell.textContent = person.email;
                        row.appendChild(emailCell);

                        const actionsCell = document.createElement('td');
                        actionsCell.className = 'text-end text-nowrap';
                        
                        const editButton = document.createElement('button');
                        editButton.type = 'button';
                        editButton.className = 'btn btn-outline-primary myBtn me-1';
                        editButton.setAttribute('data-bs-toggle', 'modal');
                        editButton.setAttribute('data-bs-target', '#editPersonnelModal');
                        editButton.setAttribute('data-id', person.id);

                        const editIcon = document.createElement('i');
                        editIcon.className = 'fa-solid fa-pen-to-square fa-fw';
                        editButton.appendChild(editIcon);
                        
                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'button';
                        deleteButton.className = 'btn btn-outline-primary myBtn';
                        deleteButton.setAttribute('data-bs-toggle', 'modal');
                        deleteButton.setAttribute('data-bs-target', '#deleteConfirmModal');
                        deleteButton.setAttribute('data-id', person.id);
                        deleteButton.setAttribute('data-type', 'personnel');

                        const deleteIcon = document.createElement('i');
                        deleteIcon.className = 'fa-solid fa-trash fa-fw';
                        deleteButton.appendChild(deleteIcon);
                        
                        actionsCell.appendChild(editButton);
                        actionsCell.appendChild(deleteButton);
                        row.appendChild(actionsCell);

                        fragment.appendChild(row);
                    });
                }
                personnelTable.appendChild(fragment);
            } else {
                console.log("❌ Search failed:", response.status.description);
                showToast("Error searching personnel.");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("❌ AJAX Error:", textStatus, errorThrown);
            showToast("Error searching personnel.");
        }
    });
});

//Handle for Personnel, Department & location
$("#addBtn").off("click").on("click", function () {
    if ($("#personnel-tab-pane").hasClass("active")) {
        $("#addPersonnelModal").modal("show");
        loadDepartmentsForDropdown();
    } else if ($("#departments-tab-pane").hasClass("active")) {
        $("#addDepartmentModal").modal("show");
        loadLocationsForDropdown();
    } else if ($("#locations-tab-pane").hasClass("active")) {
        $("#addLocationModal").modal("show");
    }
});

// 🟢 REFRESH BUTTON FUNCTION
$("#refreshBtn").click(function () {
    if ($("#personnelBtn").hasClass("active")) {
        loadPersonnel();
    } else if ($("#departmentsBtn").hasClass("active")) {
        loadDepartments();
    } else {
        loadLocations();
    }
});

// 🟢 FILTER FUNCTION (Open Modal for Filtering)
$("#filterBtn").click(function () {
    $("#filterModal").modal("show");
});

// 🟢 LOAD PERSONNEL FROM DATABASE
function loadPersonnel() {
    $("#searchInp").val(""); //Clears the search input
    
    $.ajax({
        url: "Php/getAll.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            console.log("✅ Debug - Full personnel response:", response);

            const personnelTable = $("#personnelTableBody")[0];
            const fragment = document.createDocumentFragment();
            personnelTable.innerHTML = '';

            if (!response.data || !Array.isArray(response.data)) {
                console.log("⚠️ No valid personnel data found.");
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" class="text-center">No personnel data available</td>';
                fragment.appendChild(row);
                personnelTable.appendChild(fragment);
                return;
            }

            let personnelList = response.data;
            console.log("✅ Processed personnel data:", personnelList);

            personnelList.forEach(person => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = `${person.lastName}, ${person.firstName}`;
                row.appendChild(nameCell);

                const deptCell = document.createElement('td');
                deptCell.textContent = person.department ?? "Unassigned";
                row.appendChild(deptCell);

                const locCell = document.createElement('td');
                locCell.textContent = person.location ?? "Unassigned";
                row.appendChild(locCell);

                const emailCell = document.createElement('td');
                emailCell.textContent = person.email;
                row.appendChild(emailCell);

                const actionsCell = document.createElement('td');
                actionsCell.className = 'text-end text-nowrap';
                
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'btn btn-outline-primary myBtn me-1';
                editButton.setAttribute('data-bs-toggle', 'modal');
                editButton.setAttribute('data-bs-target', '#editPersonnelModal');
                editButton.setAttribute('data-id', person.id);

                const editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-pencil fa-fw';
                editButton.appendChild(editIcon);
                
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn btn-outline-primary myBtn';
                deleteButton.setAttribute('data-bs-toggle', 'modal');
                deleteButton.setAttribute('data-bs-target', '#deleteConfirmModal');
                deleteButton.setAttribute('data-id', person.id);
                deleteButton.setAttribute('data-type', 'personnel');

                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fa-solid fa-trash fa-fw';
                deleteButton.appendChild(deleteIcon);
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);

                fragment.appendChild(row);
            });

            personnelTable.appendChild(fragment);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("❌ Error loading personnel:", textStatus, errorThrown);
            showToast("Error loading personnel.");
        }
    });
}

// 🟢 LOAD DEPARTMENTS FROM DATABASE
function loadDepartments() {
    $.ajax({
        url: "Php/getAllDepartments.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            const departmentTable = $("#departmentTableBody")[0];
            const fragment = document.createDocumentFragment();
            departmentTable.innerHTML = '';

            response.data.forEach((dept) => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = dept.name;
                row.appendChild(nameCell);

                const locCell = document.createElement('td');
                locCell.textContent = dept.location;
                row.appendChild(locCell);

                const actionsCell = document.createElement('td');
                actionsCell.className = 'text-end text-nowrap';
                
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'btn btn-outline-primary myBtn me-1';
                editButton.setAttribute('data-bs-toggle', 'modal');
                editButton.setAttribute('data-bs-target', '#editDepartmentModal');
                editButton.setAttribute('data-id', dept.id);

                const editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-pencil fa-fw';
                editButton.appendChild(editIcon);
                
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn btn-outline-primary myBtn';
                deleteButton.setAttribute('data-bs-toggle', 'modal');
                deleteButton.setAttribute('data-bs-target', '#deleteConfirmModal');
                deleteButton.setAttribute('data-id', dept.id);
                deleteButton.setAttribute('data-type', 'department');

                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fa-solid fa-trash fa-fw';
                deleteButton.appendChild(deleteIcon);
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);

                fragment.appendChild(row);
            });
            
            departmentTable.appendChild(fragment);
        },
        error: function () {
            showToast("Error loading departments.");
        }
    });
}

// 🟢 LOAD LOCATIONS FROM DATABASE
function loadLocations() {
    $.ajax({
        url: "Php/getAllLocations.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            const locationTable = $("#locationTableBody")[0];
            const fragment = document.createDocumentFragment();
            locationTable.innerHTML = '';

            response.data.forEach(location => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.className = 'align-middle text-nowrap';
                nameCell.textContent = location.name;
                row.appendChild(nameCell);

                const actionsCell = document.createElement('td');
                actionsCell.className = 'align-middle text-end text-nowrap';
                
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'btn btn-outline-primary myBtn me-1';
                editButton.setAttribute('data-bs-toggle', 'modal');
                editButton.setAttribute('data-bs-target', '#editLocationModal');
                editButton.setAttribute('data-id', location.id);

                const editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-pencil fa-fw';
                editButton.appendChild(editIcon);
                
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn btn-outline-primary myBtn';
                deleteButton.setAttribute('data-bs-toggle', 'modal');
                deleteButton.setAttribute('data-bs-target', '#deleteConfirmModal');
                deleteButton.setAttribute('data-id', location.id);
                deleteButton.setAttribute('data-type', 'location');

                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fa-solid fa-trash fa-fw';
                deleteButton.appendChild(deleteIcon);
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);

                fragment.appendChild(row);
            });

            locationTable.appendChild(fragment);
            console.log("Locations loaded successfully."); // Debugging
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Error loading locations:", textStatus, errorThrown);
        }
    });
}

// 🟢 HANDLE EDIT PERSONNEL MODAL
$(document).on("click", "[data-bs-target='#editPersonnelModal']", function () {
    const personID = $(this).data("id");
    
    $.ajax({
        url: "Php/getPersonnelByID.php",
        type: "POST",
        dataType: "json",
        data: { id: personID },
        success: function (result) {
            if (result.status.code == 200) {
                $("#editPersonnelEmployeeID").val(result.data.personnel[0].id);
                $("#editPersonnelFirstName").val(result.data.personnel[0].firstName);
                $("#editPersonnelLastName").val(result.data.personnel[0].lastName);
                $("#editPersonnelJobTitle").val(result.data.personnel[0].jobTitle);
                $("#editPersonnelEmailAddress").val(result.data.personnel[0].email);
                
                $("#editPersonnelDepartment").html("");
                $.each(result.data.department, function () {
                    $("#editPersonnelDepartment").append(
                        $("<option>", {
                            value: this.id,
                            text: this.name
                        })
                    );
                });
                $("#editPersonnelDepartment").val(result.data.personnel[0].departmentID);
            } else {
                showToast("Error retrieving data.");
            }
        },
        error: function () {
            showToast("Error retrieving data.");
        }
    });
});

// 🟢 HANDLE FORM SUBMIT FOR PERSONNEL EDIT
$("#editPersonnelForm").on("submit", function (e) {
    e.preventDefault();

    let formData = {
        id: $("#editPersonnelEmployeeID").val(),
        firstName: $("#editPersonnelFirstName").val(),
        lastName: $("#editPersonnelLastName").val(),
        jobTitle: $("#editPersonnelJobTitle").val(),
        email: $("#editPersonnelEmailAddress").val(),
        departmentID: $("#editPersonnelDepartment").val()
    };

    $.ajax({
        url: "Php/updatePersonnel.php",
        type: "POST",
        data: formData,
        success: function (response) {
            showToast(response.message);
            $("#editPersonnelModal").modal("hide");
            loadPersonnel();
        },
        error: function () {
            showToast("Error updating personnel.");
        }
    });
});

// DELETE PERSONNEL
$(document).on("click", "[data-bs-target='#deleteConfirmModal']", function () {
    const id = $(this).data("id");
    const type = $(this).data("type");
    
    let url = "";
    let checkUrl = "";
    
    if (type === "personnel") {
        url = "Php/getPersonnelByID.php";
    } else if (type === "department") {
        url = "Php/getDepartmentByID.php";
        checkUrl = "Php/checkDepartmentDependencies.php";
    } else if (type === "location") {
        url = "Php/getLocationByID.php";
        checkUrl = "Php/checkLocationDependencies.php";
    }

    function showDeleteConfirm(data) {
        let message = "";
        if (type === "personnel") {
            message = `Delete ${data.firstName} ${data.lastName}?`;
        } else if (type === "department") {
            message = `Delete department "${data.name}"?`;
        } else if (type === "location") {
            message = `Delete location "${data.name}"?`;
        }

        $("#confirmDeleteMessage").text(message);
        $("#deleteEntityID").val(data.id);
        $("#confirmDeleteModal").data("type", type);

        $("#confirmDeleteModal .modal-footer").html(`
            <button type="submit" form="confirmDeleteForm" class="btn btn-outline-primary myBtn">YES</button>
            <button type="button" class="btn btn-outline-primary myBtn" data-bs-dismiss="modal">CANCEL</button>
        `);

        $("#confirmDeleteModal").modal("show");
    }

    if (checkUrl) {
        // Check dependencies first
        $.ajax({
            url: checkUrl,
            type: "POST",
            data: type === "department" ? { departmentID: id } : { locationID: id },
            dataType: "json",
            success: function (res) {
                if ((type === "department" && res.status.hasPersonnel) || 
                    (type === "location" && res.status.hasDepartments)) {
                    $("#confirmDeleteMessage").text(
                        type === "department" 
                            ? "❌ Cannot delete this department. It has one or more employees assigned."
                            : "❌ Cannot delete this location. It has one or more departments assigned."
                    );
                    $("#confirmDeleteModal .modal-footer").html(`
                        <button type="button" class="btn btn-outline-primary myBtn" data-bs-dismiss="modal">CLOSE</button>
                    `);
                    $("#deleteEntityID").val("");
                    $("#confirmDeleteModal").data("type", "").modal("show");
                } else {
                    // If no dependencies, get the entity details
                    $.ajax({
                        url: url,
                        type: "POST",
                        data: { id },
                        dataType: "json",
                        success: function (res) {
                            if (res.status.code == 200) {
                                showDeleteConfirm(type === "department" ? res.data.department : res.data);
                            } else {
                                showToast(`❌ Could not fetch ${type} details.`);
                            }
                        },
                        error: function () {
                            showToast(`❌ Error fetching ${type} details.`);
                        }
                    });
                }
            },
            error: function () {
                showToast(`❌ Failed to check ${type} dependencies.`);
            }
        });
    } else {
        // For personnel, just get the details
        $.ajax({
            url: url,
            type: "POST",
            data: { id },
            dataType: "json",
            success: function (res) {
                if (res.status.code == 200) {
                    showDeleteConfirm(res.data.personnel[0]);
                } else {
                    showToast("❌ Could not fetch person details.");
                }
            },
            error: function () {
                showToast("❌ Error fetching person details.");
            }
        });
    }
});

//Handle the modal's form submission
$(document).on("submit", "#confirmDeleteForm", function (e) {
    e.preventDefault();

    const id = $("#deleteEntityID").val();
    const type = $("#confirmDeleteModal").data("type");

    if (!id || !type) {
        $("#confirmDeleteModal").modal("hide");
        return;
    }

    let url = "";
    if (type === "personnel") url = "Php/deletePersonnelByID.php";
    else if (type === "department") url = "Php/deleteDepartmentByID.php";
    else if (type === "location") url = "Php/deleteLocationByID.php";

    $.ajax({
        url,
        type: "POST",
        data: { id },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200 || res.status === "success") {
                $("#confirmDeleteModal").modal("hide");
                showToast(`✅ ${type} deleted successfully!`);

                if (type === "personnel") loadPersonnel();
                else if (type === "department") loadDepartments();
                else if (type === "location") loadLocations();
            } else {
                showToast("❌ Deletion failed.");
            }
        },
        error: function () {
            showToast("❌ Error deleting.");
        }
    });
});

// 🟢 Load Departments into Add Personnel Dropdown
function loadDepartmentsForDropdown() {
    $.ajax({
        url: "Php/getAllDepartments.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let departmentDropdown = $("#addPersonnelDepartment");
            departmentDropdown.empty();
            departmentDropdown.append('<option value="">Unassigned</option>');

            response.data.forEach((dept) => {
                departmentDropdown.append(`<option value="${dept.id}">${dept.name}</option>`);
            });
        },
        error: function () {
            console.log("❌ Error loading departments for dropdown");
        }
    });
}

// 🟢 Handle Add Personnel Form Submission
$("#addPersonnelForm").on("submit", function (e) {
    e.preventDefault();

    let formData = {
        firstName: $("#addPersonnelFirstName").val(),
        lastName: $("#addPersonnelLastName").val(),
        jobTitle: $("#addPersonnelJobTitle").val(),
        email: $("#addPersonnelEmailAddress").val(),
        departmentID: $("#addPersonnelDepartment").val() || null
    };

    $.ajax({
        url: "Php/insertPersonnel.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200) {
                showToast("✅ Employee added successfully!");
                $("#addPersonnelModal").modal("hide");
                loadPersonnel();
            } else {
                showToast("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            showToast("❌ Error adding employee.");
        }
    });
});

//🟢 Adding Departments
$(document).on("click", "#addDepartmentBtn", function () {
    $("#addDepartmentModal").modal("show");
    loadLocationsForDropdown();
});

$(document).off("submit", "#addDepartmentForm").on("submit", "#addDepartmentForm", function (e) {
    e.preventDefault();

    let formData = {
        name: $("#addDepartmentName").val(),
        locationID: $("#addDepartmentLocation").val() || null
    };

    console.log("📤 Sending:", formData);

    $.ajax({
        url: "Php/insertDepartment.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            console.log("✅ Insert Response:", response);

            if (response.status.code == 200) {
                showToast("✅ Department added successfully!");
                $("#addDepartmentModal").modal("hide");
                loadDepartments();
            } else if (response.status.code == 409) {
                showToast("❌ " + response.status.description);
            } else {
                showToast("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            showToast("❌ Error adding department.");
        }
    });
});

// Editing Departments
$(document).on("click", "[data-bs-target='#editDepartmentModal']", function () {
    let deptID = $(this).data("id");
    console.log("Editing Department ID:", deptID);

    if (!deptID) {
        console.log("❌ Error: No ID found on button");
        return;
    }

    $.ajax({
        url: "Php/getDepartmentByID.php",
        type: "POST",
        dataType: "json",
        data: { id: deptID },
        success: function (result) {
            console.log("✅ Full response from server:", result);

            if (result.status.code == 200) {
                let department = result.data.department;
                let locations = result.data.locations;

                console.log("🎯 Selected Department:", department);
                console.log("📍 Available Locations:", locations);

                $("#editDepartmentID").val(department.id || "");
                $("#editDepartmentName").val(department.name || "");

                let locationDropdown = $("#editDepartmentLocation");
                locationDropdown.empty();
                locationDropdown.append('<option value="">Select a Location</option>');

                if (Array.isArray(locations) && locations.length > 0) {
                    locations.forEach(location => {
                        let isSelected = (parseInt(location.id) === parseInt(department.locationID)) ? "selected" : "";
                        locationDropdown.append(`<option value="${location.id}" ${isSelected}>${location.name}</option>`);
                    });
                } else {
                    console.log("❌ No locations found in response.");
                }

                $("#editDepartmentModal").modal("show");
            } else {
                showToast("❌ Error retrieving department data.");
            }
        },
        error: function () {
            showToast("❌ Error retrieving department data.");
        }
    });
});

// Updating Departments
$(document).on("submit", "#editDepartmentForm", function (e) {
    e.preventDefault();
    
    let formData = {
        id: $("#editDepartmentID").val(),
        name: $("#editDepartmentName").val(),
        locationID: $("#editDepartmentLocation").val()
    };

    $.ajax({
        url: "Php/updateDepartment.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200) {
                showToast("✅ Department updated successfully!");
                $("#editDepartmentModal").modal("hide");
                loadDepartments();
            } else {
                showToast("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            showToast("❌ Error updating department.");
        }
    });
});

// Load Locations into the Dropdown
function loadLocationsForDropdown() {
    $.ajax({
        url: "Php/getAllLocations.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let locationDropdown = $("#addDepartmentLocation");
            locationDropdown.empty();
            locationDropdown.append('<option value="">Select Location</option>');

            response.data.forEach((location) => {
                locationDropdown.append(`<option value="${location.id}">${location.name}</option>`);
            });
        },
        error: function () {
            console.log("❌ Error loading locations for dropdown");
        }
    });
}

// Handle Add Location Modal Submit
$(document).on("submit", "#addLocationForm", function (e) {
    e.preventDefault();

    const name = $("#addLocationName").val().trim();
    if (!name) return alert("Please enter a location name.");

    $.ajax({
        url: "Php/insertLocation.php",
        type: "POST",
        data: { name },
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200 || response.status === "success") {
                showToast("✅ Location added!");
                $("#addLocationModal").modal("hide");
                loadLocations();
            } else {
                showToast("❌ " + (response.status.description || response.message));
            }
        },
        error: function () {
            showToast("❌ Failed to add location.");
        }
    });
});

//Handle Edit Location Button click + Modal Submit
$(document).on("click", "[data-bs-target='#editLocationModal']", function () {
    const id = $(this).data("id");

    $.ajax({
        url: "Php/getLocationByID.php",
        type: "POST",
        data: { id },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200) {
                $("#editLocationID").val(res.data.id);
                $("#editLocationName").val(res.data.name);
                $("#editLocationModal").modal("show");
            } else {
                showToast("❌ Location not found.");
            }
        },
        error: function () {
            showToast("❌ Error fetching location.");
        }
    });
});

$(document).on("submit", "#editLocationForm", function (e) {
    e.preventDefault();

    const id = $("#editLocationID").val();
    const name = $("#editLocationName").val().trim();

    if (!name) return alert("Please enter a location name.");

    $.ajax({
        url: "Php/updateLocation.php",
        type: "POST",
        data: { id, name },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200 || res.status === "success") {
                showToast("✅ Location updated!");
                $("#editLocationModal").modal("hide");
                loadLocations();
            } else {
                showToast("❌ " + (res.status.description || res.message));
            }
        },
        error: function () {
            showToast("❌ Error updating location.");
        }
    });
});

// 🟢 Open Add Location Modal
$(document).on("click", "#addLocationBtn", function () {
    $("#addLocationModal").modal("show");
});

// 🟢 Handle Add Location Form Submission
$(document).off("submit", "#addLocationForm").on("submit", "#addLocationForm", function (e) {
    e.preventDefault();
  
    let name = $("#addLocationName").val().trim();
  
    if (name === "") {
        showToast("❌ Location name is required.");
        return;
    }
  
    $.ajax({
        url: "Php/insertLocation.php",
        type: "POST",
        data: { name: name },
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200) {
                showToast("✅ Location added successfully!");
                $("#addLocationModal").modal("hide");
                $("#addLocationForm")[0].reset();
                loadLocations();
            } else {
                showToast("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            showToast("❌ Failed to add location.");
        }
    });
});

// Filter functionality
$("#filterModal").on("show.bs.modal", function () {
    // Store current values
    const currentDepartment = $('#filterDepartment').val();
    const currentLocation = $('#filterLocation').val();

    // Load Departments
    $.getJSON("Php/getAllDepartments.php", function (res) {
        let deptSelect = $("#filterDepartment");
        deptSelect.empty().append(`<option value="all">All</option>`);
        res.data.forEach(dept => {
            deptSelect.append(`<option value="${dept.id}">${dept.name}</option>`);
        });
        // Restore previous selection
        deptSelect.val(currentDepartment);
    });

    // Load Locations
    $.getJSON("Php/getAllLocations.php", function (res) {
        let locSelect = $("#filterLocation");
        locSelect.empty().append(`<option value="all">All</option>`);
        res.data.forEach(loc => {
            locSelect.append(`<option value="${loc.id}">${loc.name}</option>`);
        });
        // Restore previous selection
        locSelect.val(currentLocation);
    });

    // Remove backdrop
    $(this).data('bs.modal')._config.backdrop = false;
    // Add primary background to header
    $(this).find('.modal-header').addClass('bg-primary text-white');
});

// Handle filter changes
$("#filterDepartment").on("change", function () {
    const deptID = $(this).val();
    $("#filterLocation").val("all");
    $("#filterLocation").css('opacity', deptID === 'all' ? '1' : '0.5');
    applyFilter(deptID, "all");
});

$("#filterLocation").on("change", function () {
    const locID = $(this).val();
    $("#filterDepartment").val("all");
    $("#filterDepartment").css('opacity', locID === 'all' ? '1' : '0.5');
    applyFilter("all", locID);
});

function applyFilter(deptID, locID) {
    $.ajax({
        url: "Php/filterPersonnel.php",
        type: "GET",
        data: {
            departmentID: deptID,
            locationID: locID
        },
        dataType: "json",
        success: function (response) {
            if (response.status.code === 200) {
                const personnelTable = $("#personnelTableBody")[0];
                const fragment = document.createDocumentFragment();
                personnelTable.innerHTML = '';

                if (response.data.length === 0) {
                    const row = document.createElement('tr');
                    
                    const cell = document.createElement('td');
                    cell.colSpan = 5;
                    cell.className = 'text-center';
                    cell.textContent = 'No results found';
                    row.appendChild(cell);

                    fragment.appendChild(row);
                } else {
                    response.data.forEach(person => {
                        const row = document.createElement('tr');
                        
                        const nameCell = document.createElement('td');
                        nameCell.textContent = `${person.lastName}, ${person.firstName}`;
                        row.appendChild(nameCell);

                        const deptCell = document.createElement('td');
                        deptCell.textContent = person.department ?? "Unassigned";
                        row.appendChild(deptCell);

                        const locCell = document.createElement('td');
                        locCell.textContent = person.location ?? "Unassigned";
                        row.appendChild(locCell);

                        const emailCell = document.createElement('td');
                        emailCell.textContent = person.email;
                        row.appendChild(emailCell);

                        const actionsCell = document.createElement('td');
                        actionsCell.className = 'text-end text-nowrap';
                        
                        const editButton = document.createElement('button');
                        editButton.type = 'button';
                        editButton.className = 'btn btn-outline-primary myBtn me-1';
                        editButton.setAttribute('data-bs-toggle', 'modal');
                        editButton.setAttribute('data-bs-target', '#editPersonnelModal');
                        editButton.setAttribute('data-id', person.id);

                        const editIcon = document.createElement('i');
                        editIcon.className = 'fa-solid fa-pencil fa-fw';
                        editButton.appendChild(editIcon);
                        
                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'button';
                        deleteButton.className = 'btn btn-outline-primary myBtn';
                        deleteButton.setAttribute('data-bs-toggle', 'modal');
                        deleteButton.setAttribute('data-bs-target', '#deleteConfirmModal');
                        deleteButton.setAttribute('data-id', person.id);
                        deleteButton.setAttribute('data-type', 'personnel');

                        const deleteIcon = document.createElement('i');
                        deleteIcon.className = 'fa-solid fa-trash fa-fw';
                        deleteButton.appendChild(deleteIcon);
                        
                        actionsCell.appendChild(editButton);
                        actionsCell.appendChild(deleteButton);
                        row.appendChild(actionsCell);

                        fragment.appendChild(row);
                    });
                }
                personnelTable.appendChild(fragment);
                $("#filterModal").modal("hide");
            } else {
                showToast("❌ Filter failed.");
            }
        },
        error: function () {
            showToast("❌ Error applying filter.");
        }
    });
}

// Modal Reset Handlers
$('#addPersonnelModal').on('hidden.bs.modal', function () {
    $('#addPersonnelForm')[0].reset();
});

$('#editPersonnelModal').on('hidden.bs.modal', function () {
    $('#editPersonnelForm')[0].reset();
});

$('#addDepartmentModal').on('hidden.bs.modal', function () {
    $('#addDepartmentForm')[0].reset();
});

$('#editDepartmentModal').on('hidden.bs.modal', function () {
    $('#editDepartmentForm')[0].reset();
});

$('#addLocationModal').on('hidden.bs.modal', function () {
    $('#addLocationForm')[0].reset();
});

$('#editLocationModal').on('hidden.bs.modal', function () {
    $('#editLocationForm')[0].reset();
});

// Modal focus management
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Store the element that triggered the modal
        let triggerElement = null;

        modal.addEventListener('show.bs.modal', function(event) {
            // Store the element that triggered the modal
            triggerElement = event.relatedTarget;
            // Remove backdrop
            $(this).data('bs.modal')._config.backdrop = false;
            // Add primary background to header
            $(this).find('.modal-header').addClass('bg-primary text-white');
        });

        modal.addEventListener('shown.bs.modal', function() {
            // Focus the first input or button in the modal
            const firstInput = this.querySelector('input:not([type="hidden"]), select, button:not([data-bs-dismiss="modal"])');
            if (firstInput) {
                firstInput.focus();
            }
        });

        modal.addEventListener('hidden.bs.modal', function() {
            // Return focus to the trigger element when modal closes
            if (triggerElement) {
                triggerElement.focus();
            }
        });
    });
});

//Helper function
function showToast(message, type = "success") {
    const toastEl = $("#statusToast");
    const toastMsg = $("#statusToastMessage");

    toastMsg.text(message);

    // Change toast style based on type
    toastEl.removeClass("text-bg-success text-bg-danger text-bg-warning");
    toastEl.addClass(`text-bg-${type}`);

    const toast = new bootstrap.Toast(toastEl[0]);
    toast.show();
}
