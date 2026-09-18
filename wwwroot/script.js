const API_BASE_URL = "https://localhost:7152";

// State variables
let dataTypes = [];
let fieldCounter = 0;
let currentFormId = null; // null = Create Mode, number = Update Mode

// DOM Elements
const dynamicForm = document.getElementById("dynamicForm");
const toggleYes = document.getElementById("toggleYes");
const toggleNo = document.getElementById("toggleNo");
const dynamicFieldsContainer = document.getElementById("dynamicFieldsContainer");
const fieldsList = document.getElementById("fieldsList");
const btnAddField = document.getElementById("btnAddField");
const alertContainer = document.getElementById("alertContainer");
const successBanner = document.getElementById("successBanner");
const savedFormIdDisplay = document.getElementById("savedFormIdDisplay");
const btnViewSaved = document.getElementById("btnViewSaved");
const btnUpdateSaved = document.getElementById("btnUpdateSaved");
const viewFormContainer = document.getElementById("viewFormContainer");
const viewFormDetails = document.getElementById("viewFormDetails");
const btnCloseView = document.getElementById("btnCloseView");
const btnSaveForm = document.getElementById("btnSaveForm");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const formTitle = document.getElementById("formTitle");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    fetchDataTypes();
    setupEventListeners();
});

function setupEventListeners() {
    toggleYes.addEventListener("change", handleToggleChange);
    toggleNo.addEventListener("change", handleToggleChange);
    btnAddField.addEventListener("click", () => addDynamicFieldCard());
    dynamicForm.addEventListener("submit", handleFormSubmit);

    btnViewSaved.addEventListener("click", () => {
        if (currentFormId) loadFormForView(currentFormId);
    });

    btnUpdateSaved.addEventListener("click", () => {
        if (currentFormId) loadFormForUpdate(currentFormId);
    });

    btnCloseView.addEventListener("click", () => {
        viewFormContainer.classList.add("d-none");
        dynamicForm.classList.remove("d-none");
    });

    btnCancelEdit.addEventListener("click", resetFormToCreateState);
}

// Fetch DataTypes from Backend
async function fetchDataTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/datatype`);
        if (!response.ok) throw new Error("Failed to load Data Types from server.");
        dataTypes = await response.json();
    } catch (err) {
        showAlert(`Error loading Data Types: ${err.message}`, "danger");
    }
}

// Handle Add More Radio Change
function handleToggleChange() {
    if (toggleYes.checked) {
        dynamicFieldsContainer.classList.remove("d-none");
        if (fieldsList.children.length === 0) {
            addDynamicFieldCard();
        }
    } else {
        dynamicFieldsContainer.classList.add("d-none");
    }
}

// Add a new dynamic field card
function addDynamicFieldCard(existingData = null) {
    fieldCounter++;
    const fieldId = fieldCounter;

    const card = document.createElement("div");
    card.className = "card mb-3 border dynamic-field-card";
    card.dataset.fieldIndex = fieldId;
    card.dataset.formFieldId = existingData ? (existingData.formFieldId || 0) : 0;

    let optionsSelectHtml = "";
    dataTypes.forEach(dt => {
        optionsSelectHtml += `<option value="${dt.dataTypeId}" data-type-name="${dt.dataTypeName}">${dt.dataTypeName}</option>`;
    });

    card.innerHTML = `
        <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
            <strong class="text-secondary card-title-label">Additional Field #${fieldsList.children.length + 1}</strong>
            <button type="button" class="btn btn-sm btn-outline-danger btn-remove-field">Remove</button>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Data Type</label>
                    <select class="form-select data-type-select" required>
                        <option value="">-- Select Data Type --</option>
                        ${optionsSelectHtml}
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Field Name</label>
                    <input type="text" class="form-control field-name-input" placeholder="e.g. Skills" required />
                </div>
                <div class="col-md-4 options-input-container d-none">
                    <label class="form-label">Options (Comma Separated)</label>
                    <input type="text" class="form-control field-options-input" placeholder="e.g. C#,ASP.NET Core,SQL" />
                    <small class="text-muted">Type options separated by comma</small>
                </div>
            </div>
            <div class="row g-3 mt-1">
                <div class="col-12 value-control-container">
                    <!-- Dynamic rendering of value controls happens here -->
                </div>
            </div>
        </div>
    `;

    fieldsList.appendChild(card);

    // Context Elements
    const dataTypeSelect = card.querySelector(".data-type-select");
    const fieldNameInput = card.querySelector(".field-name-input");
    const optionsInput = card.querySelector(".field-options-input");
    const btnRemove = card.querySelector(".btn-remove-field");

    // Remove Event
    btnRemove.addEventListener("click", () => {
        card.remove();
        updateFieldIndices();
    });

    // DataType Change Listener
    dataTypeSelect.addEventListener("change", () => {
        renderValueControl(card);
    });

    // Unified Options Listener (Fixes Duplicate Issue)
    optionsInput.addEventListener("input", () => {
        renderValueControl(card);
    });

    // Populate data if updating
    if (existingData) {
        fieldNameInput.value = existingData.fieldName || "";
        dataTypeSelect.value = existingData.dataTypeId;

        // Parse options array (Supports string array or object array from GET API)
        let parsedOptions = [];
        if (Array.isArray(existingData.options)) {
            parsedOptions = existingData.options.map(opt => {
                if (typeof opt === 'object' && opt !== null) {
                    return opt.optionValue || opt.OptionValue || '';
                }
                return String(opt);
            });
        }
        optionsInput.value = parsedOptions.join(",");

        // Render value controls with populated values
        renderValueControl(card, existingData.fieldValue);
    }

    updateFieldIndices();
}

function updateFieldIndices() {
    const cards = fieldsList.querySelectorAll(".dynamic-field-card");
    cards.forEach((card, index) => {
        const titleLabel = card.querySelector(".card-title-label");
        if (titleLabel) titleLabel.textContent = `Additional Field #${index + 1}`;
    });
}

// SINGLE UNIFIED RENDER CONTROL FOR FIELD VALUES
function renderValueControl(card, existingFieldValue = null) {
    const dataTypeSelect = card.querySelector(".data-type-select");
    const selectedOption = dataTypeSelect.options[dataTypeSelect.selectedIndex];
    const dataTypeName = selectedOption ? selectedOption.getAttribute("data-type-name") : "";

    const optionsContainer = card.querySelector(".options-input-container");
    const optionsInput = card.querySelector(".field-options-input");
    const valueContainer = card.querySelector(".value-control-container");

    const needsOptions = ["MultiSelect", "Dropdown", "Checkbox"].includes(dataTypeName);

    // Toggle Options Input Visibility
    if (needsOptions) {
        optionsContainer.classList.remove("d-none");
    } else {
        optionsContainer.classList.add("d-none");
    }

    // Parse options input values
    const rawOptions = optionsInput.value.split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let html = "";

    // Handle initial existing values if parsed from string JSON
    let selectedValuesArr = [];
    if (existingFieldValue !== null && existingFieldValue !== undefined) {
        try {
            const parsed = JSON.parse(existingFieldValue);
            if (Array.isArray(parsed)) {
                selectedValuesArr = parsed.map(v => String(v));
            } else {
                selectedValuesArr = [String(existingFieldValue)];
            }
        } catch (e) {
            selectedValuesArr = [String(existingFieldValue)];
        }
    }

    switch (dataTypeName) {
        case "String":
            html = `<label class="form-label">Value</label>
                    <input type="text" class="form-control field-value-element" value="${escapeHtml(selectedValuesArr[0] || '')}">`;
            break;

        case "Number":
            html = `<label class="form-label">Value</label>
                    <input type="number" class="form-control field-value-element" value="${escapeHtml(selectedValuesArr[0] || '')}">`;
            break;

        case "Date":
            html = `<label class="form-label">Value</label>
                    <input type="date" class="form-control field-value-element" value="${escapeHtml(selectedValuesArr[0] || '')}">`;
            break;

        case "Email":
            html = `<label class="form-label">Value</label>
                    <input type="email" class="form-control field-value-element" value="${escapeHtml(selectedValuesArr[0] || '')}">`;
            break;

        case "Boolean":
            const currentBool = selectedValuesArr[0] || "false";
            html = `
                <label class="form-label">Value</label>
                <select class="form-select field-value-element">
                    <option value="true" ${currentBool === "true" ? "selected" : ""}>True</option>
                    <option value="false" ${currentBool === "false" ? "selected" : ""}>False</option>
                </select>`;
            break;

        case "Dropdown":
            let dropdownOptions = `<option value="">-- Select Value --</option>`;
            rawOptions.forEach(opt => {
                const isSelected = selectedValuesArr.includes(opt) ? "selected" : "";
                dropdownOptions += `<option value="${escapeHtml(opt)}" ${isSelected}>${escapeHtml(opt)}</option>`;
            });
            html = `<label class="form-label">Select Value</label>
                    <select class="form-select field-value-element">${dropdownOptions}</select>`;
            break;

        case "MultiSelect":
            let multiSelectOptions = "";
            rawOptions.forEach(opt => {
                const isSelected = selectedValuesArr.includes(opt) ? "selected" : "";
                multiSelectOptions += `<option value="${escapeHtml(opt)}" ${isSelected}>${escapeHtml(opt)}</option>`;
            });
            html = `<label class="form-label">Select Values (Hold Ctrl / Cmd to select multiple)</label>
                    <select class="form-select field-value-element" multiple size="4">${multiSelectOptions}</select>`;
            break;

        case "Checkbox":
            let checkboxesHtml = "";
            if (rawOptions.length === 0) {
                checkboxesHtml = `<p class="text-muted fs-7">Enter options above to generate checkboxes.</p>`;
            } else {
                rawOptions.forEach((opt, idx) => {
                    const isChecked = selectedValuesArr.includes(opt) ? "checked" : "";
                    const chkId = `chk_${card.dataset.fieldIndex}_${idx}`;
                    checkboxesHtml += `
                        <div class="form-check form-check-inline me-3">
                            <input class="form-check-input field-value-checkbox" type="checkbox" id="${chkId}" value="${escapeHtml(opt)}" ${isChecked}>
                            <label class="form-check-label" for="${chkId}">${escapeHtml(opt)}</label>
                        </div>`;
                });
            }
            html = `<label class="form-label d-block">Select Options</label><div>${checkboxesHtml}</div>`;
            break;

        default:
            html = `<p class="text-muted">Select a Data Type to enter values.</p>`;
            break;
    }

    valueContainer.innerHTML = html;
}

// FORM SUBMISSION (SAVE OR UPDATE)
async function handleFormSubmit(e) {
    e.preventDefault();

    const nameVal = document.getElementById("fixedName").value.trim();
    const ageVal = document.getElementById("fixedAge").value.trim();
    const genderVal = document.getElementById("fixedGender").value;

    const dynamicCards = fieldsList.querySelectorAll(".dynamic-field-card");
    const fieldsPayload = [];

    // Helper IDs lookup
    const stringDt = dataTypes.find(d => d.dataTypeName.toLowerCase() === "string");
    const numberDt = dataTypes.find(d => d.dataTypeName.toLowerCase() === "number");

    // 1. Add mandatory Fixed Fields
    fieldsPayload.push({
        formFieldId: 0,
        fieldName: "Name",
        fieldValue: nameVal,
        dataTypeId: stringDt ? stringDt.dataTypeId : 1,
        isRequired: true,
        isActive: true,
        isDeleted: false,
        options: []
    });

    fieldsPayload.push({
        formFieldId: 0,
        fieldName: "Age",
        fieldValue: ageVal,
        dataTypeId: numberDt ? numberDt.dataTypeId : 2,
        isRequired: true,
        isActive: true,
        isDeleted: false,
        options: []
    });

    fieldsPayload.push({
        formFieldId: 0,
        fieldName: "Gender",
        fieldValue: genderVal,
        dataTypeId: stringDt ? stringDt.dataTypeId : 1,
        isRequired: true,
        isActive: true,
        isDeleted: false,
        options: []
    });

    // 2. Add Dynamic Fields if Yes is selected
    if (toggleYes.checked) {
        let hasValidationError = false;

        dynamicCards.forEach(card => {
            if (hasValidationError) return;

            const formFieldId = parseInt(card.dataset.formFieldId, 10) || 0;
            const dataTypeSelect = card.querySelector(".data-type-select");
            const dataTypeId = parseInt(dataTypeSelect.value, 10);
            const fieldName = card.querySelector(".field-name-input").value.trim();
            const optionsInput = card.querySelector(".field-options-input");

            const selectedOption = dataTypeSelect.options[dataTypeSelect.selectedIndex];
            const dataTypeName = selectedOption ? selectedOption.getAttribute("data-type-name") : "";

            if (!dataTypeId || !fieldName) {
                showAlert("Please fill in all Dynamic Field names and Data Types.", "danger");
                hasValidationError = true;
                return;
            }

            const parsedOptions = optionsInput.value.split(",")
                .map(s => s.trim())
                .filter(s => s.length > 0);

            let fieldValueStr = "";

            if (dataTypeName === "MultiSelect") {
                const valElem = card.querySelector(".field-value-element");
                const selectedVals = valElem ? Array.from(valElem.selectedOptions).map(o => o.value) : [];
                fieldValueStr = JSON.stringify(selectedVals);
            } else if (dataTypeName === "Checkbox") {
                const checkedBoxes = card.querySelectorAll(".field-value-checkbox:checked");
                const selectedVals = Array.from(checkedBoxes).map(cb => cb.value);
                fieldValueStr = JSON.stringify(selectedVals);
            } else {
                const valElem = card.querySelector(".field-value-element");
                fieldValueStr = valElem ? valElem.value : "";
            }

            fieldsPayload.push({
                formFieldId: formFieldId,
                fieldName: fieldName,
                fieldValue: fieldValueStr,
                dataTypeId: dataTypeId,
                isRequired: false,
                isActive: true,
                isDeleted: false,
                options: parsedOptions
            });
        });

        if (hasValidationError) return;
    }

    const payload = {
        formName: currentFormId ? `Updated Employee Form` : `Employee Form`,
        fields: fieldsPayload
    };

    try {
        let response;
        if (currentFormId) {
            // PUT Update
            response = await fetch(`${API_BASE_URL}/api/form/${currentFormId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            // POST Save
            response = await fetch(`${API_BASE_URL}/api/form`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Error processing request.");
        }

        const resData = await response.json();
        const savedId = resData.formId || resData.id || currentFormId;

        currentFormId = savedId;
        savedFormIdDisplay.textContent = currentFormId;
        document.getElementById("bannerTitle").textContent = currentFormId ? "Form saved successfully!" : "Form updated successfully!";
        successBanner.classList.remove("d-none");

        showAlert("Form data recorded successfully!", "success");

    } catch (err) {
        showAlert(`Error: ${err.message}`, "danger");
    }
}

// VIEW FORM DETAILS
async function loadFormForView(formId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/form/${formId}`);
        if (!response.ok) throw new Error("Failed to fetch form details.");

        const data = await response.json();
        renderViewMode(data);

    } catch (err) {
        showAlert(`Error loading view: ${err.message}`, "danger");
    }
}

function renderViewMode(formData) {
    dynamicForm.classList.add("d-none");
    viewFormContainer.classList.remove("d-none");

    const fields = formData.fields || formData.Fields || [];
    let html = `<h3 class="mb-4 text-dark">${escapeHtml(formData.formName || 'Saved Form')}</h3><div class="row g-3">`;

    fields.forEach(field => {
        const fName = field.fieldName || field.FieldName;
        const rawValue = field.fieldValue || field.FieldValue || "";
        const dataTypeName = field.dataTypeName || field.DataTypeName || "";

        let displayVal = "";

        // Parse options array safely
        let optionsArr = [];
        const rawOpts = field.options || field.Options || [];
        optionsArr = rawOpts.map(o => typeof o === 'object' ? (o.optionValue || o.OptionValue) : o);

        if (dataTypeName === "MultiSelect" || dataTypeName === "Checkbox") {
            let parsedSelected = [];
            try {
                parsedSelected = JSON.parse(rawValue);
            } catch (e) {
                parsedSelected = [];
            }

            displayVal = `<ul class="list-group list-group-flush mt-1">`;
            optionsArr.forEach(opt => {
                const isChecked = parsedSelected.includes(opt);
                displayVal += `
                    <li class="list-group-item bg-transparent px-0 py-1">
                        ${isChecked ? '<span class="text-success fw-bold">✓ ' : '<span class="text-muted">☐ '}
                        ${escapeHtml(opt)}</span>
                    </li>`;
            });
            displayVal += `</ul>`;
        } else {
            displayVal = `<div class="fw-semibold text-dark">${escapeHtml(rawValue)}</div>`;
        }

        html += `
            <div class="col-md-6 mb-3">
                <div class="p-3 border rounded bg-light">
                    <small class="text-muted text-uppercase fw-bold d-block mb-1">${escapeHtml(fName)}</small>
                    ${displayVal}
                </div>
            </div>`;
    });

    html += `</div>`;
    viewFormDetails.innerHTML = html;
}

// LOAD FORM FOR UPDATE
async function loadFormForUpdate(formId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/form/${formId}`);
        if (!response.ok) throw new Error("Failed to fetch form for editing.");

        const data = await response.json();

        // Switch Mode to Edit
        currentFormId = formId;
        formTitle.textContent = `Update Form (ID: ${formId})`;
        btnSaveForm.textContent = "Update Form";
        btnCancelEdit.classList.remove("d-none");
        viewFormContainer.classList.add("d-none");
        dynamicForm.classList.remove("d-none");

        // Clear existing dynamic fields
        fieldsList.innerHTML = "";

        const fields = data.fields || data.Fields || [];

        // Map fixed fields and dynamic fields
        let hasDynamicFields = false;

        fields.forEach(field => {
            const fName = (field.fieldName || field.FieldName || "").toLowerCase();
            const fVal = field.fieldValue || field.FieldValue || "";

            if (fName === "name") {
                document.getElementById("fixedName").value = fVal;
            } else if (fName === "age") {
                document.getElementById("fixedAge").value = fVal;
            } else if (fName === "gender") {
                document.getElementById("fixedGender").value = fVal;
            } else {
                hasDynamicFields = true;
                addDynamicFieldCard(field);
            }
        });

        if (hasDynamicFields) {
            toggleYes.checked = true;
            dynamicFieldsContainer.classList.remove("d-none");
        } else {
            toggleNo.checked = true;
            dynamicFieldsContainer.classList.add("d-none");
        }

        showAlert("Form loaded into edit mode.", "info");

    } catch (err) {
        showAlert(`Error loading update form: ${err.message}`, "danger");
    }
}

function resetFormToCreateState() {
    currentFormId = null;
    formTitle.textContent = "Dynamic Form Application";
    btnSaveForm.textContent = "Save Form";
    btnCancelEdit.classList.add("d-none");
    successBanner.classList.add("d-none");

    dynamicForm.reset();
    fieldsList.innerHTML = "";
    dynamicFieldsContainer.classList.add("d-none");
}

function showAlert(message, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    setTimeout(() => {
        alertContainer.innerHTML = "";
    }, 5000);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}