// JavaScript ทั้งหมดของคุณยังคงเหมือนเดิม
let accounts = {};
let currentAccount = '';
let defaultTypes = ['อาหาร', 'เดินทาง', 'ค่าใช้จ่ายบ้าน', 'เสื้อผ้า', 'บันเทิง', 'สุขภาพ', 'การศึกษา', 'อื่นๆ'];
let currentSummaryData = null;
let currentSummaryType = '';

// ฟังก์ชันพื้นฐาน
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast-notification ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = section.previousElementSibling;
    section.classList.toggle('active');
    header.classList.toggle('active');
}

function formatCurrency(amount) {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(timeString) {
    if (!timeString) return '';
    const time = new Date(`1970-01-01T${timeString}`);
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    };
}

// ฟังก์ชันจัดการบัญชี
function initializeApp() {
    loadFromLocalStorage();
    populateAccountSelect();
    populateImportAccountSelect();
    updateMultiAccountCheckboxes();
    updateTypeList();
    
    const { date, time } = getCurrentDateTime();
    document.getElementById('entryDate').value = date;
    document.getElementById('entryTime').value = time;
    
    if (!currentAccount) {
        if (Object.keys(accounts).length === 0) {
            addAccount();
        } else {
            currentAccount = Object.keys(accounts)[0];
            updateAccountDisplay();
        }
    } else {
        updateAccountDisplay();
    }
    
    displayRecords();
    
    document.getElementById('backup-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        setBackupPassword();
    });
    
    document.getElementById('show-backup-password').addEventListener('change', function(e) {
        const type = e.target.checked ? 'text' : 'password';
        document.getElementById('backup-password').type = type;
        document.getElementById('backup-password-confirm').type = type;
    });
}

function loadFromLocalStorage() {
    const savedAccounts = localStorage.getItem('moneyTrackerAccounts');
    const savedCurrentAccount = localStorage.getItem('currentMoneyTrackerAccount');
    const savedTypes = localStorage.getItem('moneyTrackerTypes');
    const savedBackupPassword = localStorage.getItem('backupPassword');
    
    if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
    }
    if (savedCurrentAccount) {
        currentAccount = savedCurrentAccount;
    }
    if (savedTypes) {
        defaultTypes = JSON.parse(savedTypes);
    }
    if (savedBackupPassword) {
        document.getElementById('backup-password').value = savedBackupPassword;
        document.getElementById('backup-password-confirm').value = savedBackupPassword;
    }
}

function saveToLocal() {
    localStorage.setItem('moneyTrackerAccounts', JSON.stringify(accounts));
    localStorage.setItem('currentMoneyTrackerAccount', currentAccount);
    localStorage.setItem('moneyTrackerTypes', JSON.stringify(defaultTypes));
    showToast('บันทึกข้อมูลชั่วคราวเรียบร้อยแล้ว!', 'success');
}

function populateAccountSelect() {
    const accountSelect = document.getElementById('accountSelect');
    const importAccountSelect = document.getElementById('importAccountSelect');
    
    accountSelect.innerHTML = '';
    importAccountSelect.innerHTML = '';
    
    Object.keys(accounts).forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        accountSelect.appendChild(option);
        
        const importOption = document.createElement('option');
        importOption.value = account;
        importOption.textContent = account;
        importAccountSelect.appendChild(importOption);
    });
    
    if (currentAccount) {
        accountSelect.value = currentAccount;
    }
}

function populateImportAccountSelect() {
    const importAccountSelect = document.getElementById('importAccountSelect');
    importAccountSelect.innerHTML = '';
    
    Object.keys(accounts).forEach(account => {
        if (account !== currentAccount) {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            importAccountSelect.appendChild(option);
        }
    });
}

function updateAccountDisplay() {
    document.getElementById('accountName').textContent = currentAccount;
    document.getElementById('singleDateAccountName').textContent = currentAccount;
    populateImportAccountSelect();
    updateMultiAccountCheckboxes();
    displayRecords();
}

function changeAccount() {
    currentAccount = document.getElementById('accountSelect').value;
    updateAccountDisplay();
    saveToLocal();
}

function addAccount() {
    const accountName = prompt('กรุณากรอกชื่อบัญชีใหม่:');
    if (accountName && accountName.trim() !== '') {
        if (accounts[accountName]) {
            alert('มีบัญชีนี้อยู่แล้ว!');
            return;
        }
        accounts[accountName] = [];
        currentAccount = accountName;
        populateAccountSelect();
        updateAccountDisplay();
        saveToLocal();
        showToast(`เพิ่มบัญชี "${accountName}" เรียบร้อยแล้ว!`, 'success');
    }
}

function deleteAccount() {
    if (Object.keys(accounts).length <= 1) {
        alert('ไม่สามารถลบบัญชีได้ เนื่องจากต้องมีอย่างน้อย 1 บัญชี');
        return;
    }
    
    if (confirm(`คุณแน่ใจว่าต้องการลบบัญชี "${currentAccount}" และข้อมูลทั้งหมดในบัญชีนี้?`)) {
        delete accounts[currentAccount];
        currentAccount = Object.keys(accounts)[0];
        populateAccountSelect();
        updateAccountDisplay();
        saveToLocal();
        showToast('ลบบัญชีเรียบร้อยแล้ว!', 'success');
    }
}

function editAccount() {
    const newName = prompt('กรุณากรอกชื่อบัญชีใหม่:', currentAccount);
    if (newName && newName.trim() !== '' && newName !== currentAccount) {
        if (accounts[newName]) {
            alert('มีบัญชีนี้อยู่แล้ว!');
            return;
        }
        accounts[newName] = accounts[currentAccount];
        delete accounts[currentAccount];
        currentAccount = newName;
        populateAccountSelect();
        updateAccountDisplay();
        saveToLocal();
        showToast('แก้ไขชื่อบัญชีเรียบร้อยแล้ว!', 'success');
    }
}

// ฟังก์ชันจัดการประเภท
function updateTypeList() {
    const typeList = document.getElementById('typeList');
    typeList.innerHTML = '';
    defaultTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        typeList.appendChild(option);
    });
}

function showAllTypes(input) {
    const savedValue = input.value;
    input.setAttribute('list', 'typeList');
    input.value = savedValue;
}

function restoreType(input) {
    setTimeout(() => {
        if (!input.value) {
            input.setAttribute('list', 'typeList');
        }
    }, 200);
}

function addNewType() {
    const newType = prompt('กรุณากรอกประเภทใหม่:');
    if (newType && newType.trim() !== '') {
        if (defaultTypes.includes(newType)) {
            alert('มีประเภทนี้อยู่แล้ว!');
            return;
        }
        defaultTypes.push(newType);
        updateTypeList();
        saveToLocal();
        showToast(`เพิ่มประเภท "${newType}" เรียบร้อยแล้ว!`, 'success');
    }
}

function deleteType() {
    const typeToDelete = prompt('กรุณากรอกประเภทที่ต้องการลบ:');
    if (typeToDelete && defaultTypes.includes(typeToDelete)) {
        if (confirm(`คุณแน่ใจว่าต้องการลบประเภท "${typeToDelete}"?`)) {
            defaultTypes = defaultTypes.filter(type => type !== typeToDelete);
            updateTypeList();
            saveToLocal();
            showToast(`ลบประเภท "${typeToDelete}" เรียบร้อยแล้ว!`, 'success');
        }
    } else {
        alert('ไม่พบประเภทที่ต้องการลบ!');
    }
}

function editType() {
    const oldType = prompt('กรุณากรอกประเภทที่ต้องการแก้ไข:');
    if (oldType && defaultTypes.includes(oldType)) {
        const newType = prompt('กรุณากรอกชื่อประเภทใหม่:', oldType);
        if (newType && newType.trim() !== '' && newType !== oldType) {
            if (defaultTypes.includes(newType)) {
                alert('มีประเภทนี้อยู่แล้ว!');
                return;
            }
            defaultTypes = defaultTypes.map(type => type === oldType ? newType : type);
            
            Object.keys(accounts).forEach(account => {
                accounts[account] = accounts[account].map(entry => 
                    entry.type === oldType ? {...entry, type: newType} : entry
                );
            });
            
            updateTypeList();
            displayRecords();
            saveToLocal();
            showToast(`แก้ไขประเภท "${oldType}" เป็น "${newType}" เรียบร้อยแล้ว!`, 'success');
        }
    } else {
        alert('ไม่พบประเภทที่ต้องการแก้ไข!');
    }
}

// ฟังก์ชันจัดการรายการ
function addEntry() {
    const date = document.getElementById('entryDate').value;
    const time = document.getElementById('entryTime').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!date || !time || isNaN(amount) || !type || !description) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง!');
        return;
    }
    
    const newEntry = {
        date,
        time,
        amount,
        type,
        description,
        timestamp: new Date().toISOString()
    };
    
    accounts[currentAccount].push(newEntry);
    
    const selectedAccounts = Array.from(document.querySelectorAll('#multiAccountCheckboxes input:checked'))
        .map(checkbox => checkbox.value)
        .filter(account => account !== currentAccount);
    
    selectedAccounts.forEach(account => {
        accounts[account].push({...newEntry});
    });
    
    document.getElementById('amount').value = '';
    document.getElementById('type').value = '';
    document.getElementById('description').value = '';
    
    displayRecords();
    saveToLocal();
    showToast('เพิ่มข้อมูลเรียบร้อยแล้ว!', 'success');
}

function displayRecords() {
    const recordBody = document.getElementById('recordBody');
    recordBody.innerHTML = '';
    
    if (!accounts[currentAccount] || accounts[currentAccount].length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; color: #999;">ไม่มีข้อมูล</td>`;
        recordBody.appendChild(row);
        return;
    }
    
    const sortedRecords = [...accounts[currentAccount]].sort((a, b) => 
        new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time)
    );
    
    sortedRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateForDisplay(record.date)}</td>
            <td>${record.time}</td>
            <td>${record.type}</td>
            <td>${record.description}</td>
            <td style="text-align: right;">${formatCurrency(record.amount)}</td>
            <td style="text-align: center;">
                <button onclick="editRecord(${index})" style="background-color: #ffc107; color: black; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin: 2px;">แก้ไข</button>
                <button onclick="deleteRecord(${index})" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin: 2px;">ลบ</button>
            </td>
        `;
        recordBody.appendChild(row);
    });
}

function editRecord(index) {
    const record = accounts[currentAccount][index];
    
    document.getElementById('entryDate').value = record.date;
    document.getElementById('entryTime').value = record.time;
    document.getElementById('amount').value = record.amount;
    document.getElementById('type').value = record.type;
    document.getElementById('description').value = record.description;
    
    accounts[currentAccount].splice(index, 1);
    displayRecords();
    saveToLocal();
    showToast('กำลังแก้ไขรายการ... กรุณากด "เพิ่มข้อมูล" อีกครั้งเมื่อแก้ไขเสร็จ', 'info');
}

function deleteRecord(index) {
    if (confirm('คุณแน่ใจว่าต้องการลบรายการนี้?')) {
        accounts[currentAccount].splice(index, 1);
        displayRecords();
        saveToLocal();
        showToast('ลบรายการเรียบร้อยแล้ว!', 'success');
    }
}

function deleteRecordsByDate() {
    const selectedDate = document.getElementById('deleteByDateInput').value;
    if (!selectedDate) {
        alert('กรุณาเลือกวันที่ที่ต้องการลบข้อมูล');
        return;
    }
    
    if (!confirm(`คุณแน่ใจว่าต้องการลบข้อมูลทั้งหมดในวันที่ ${formatDateForDisplay(selectedDate)}?`)) {
        return;
    }
    
    const initialLength = accounts[currentAccount].length;
    accounts[currentAccount] = accounts[currentAccount].filter(record => record.date !== selectedDate);
    const deletedCount = initialLength - accounts[currentAccount].length;
    
    displayRecords();
    saveToLocal();
    showToast(`ลบข้อมูลในวันที่ ${formatDateForDisplay(selectedDate)} เรียบร้อยแล้ว (${deletedCount} รายการ)`, 'success');
    document.getElementById('deleteByDateInput').value = '';
}

function toggleRecordsVisibility() {
    const detailsSection = document.getElementById('detailsSection');
    if (detailsSection.style.display === 'none') {
        detailsSection.style.display = 'block';
    } else {
        detailsSection.style.display = 'none';
    }
}

function updateMultiAccountCheckboxes() {
    const container = document.getElementById('multiAccountCheckboxes');
    const multiAccountSelector = document.getElementById('multiAccountSelector');
    
    container.innerHTML = '';
    
    const otherAccounts = Object.keys(accounts).filter(account => account !== currentAccount);
    
    if (otherAccounts.length > 0) {
        multiAccountSelector.style.display = 'block';
        
        otherAccounts.forEach(account => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'checkbox-item';
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="account_${account}" value="${account}">
                <label for="account_${account}">${account}</label>
            `;
            container.appendChild(checkboxDiv);
        });
    } else {
        multiAccountSelector.style.display = 'none';
    }
}

// ฟังก์ชันจัดการไฟล์
function saveToFile() {
    document.getElementById('formatSelectionModal').style.display = 'flex';
}

function closeFormatModal() {
    document.getElementById('formatSelectionModal').style.display = 'none';
}

function handleSaveAs(format) {
    closeFormatModal();
    
    let dataStr, mimeType, fileExtension;
    
    if (format === 'json') {
        const backupPassword = localStorage.getItem('backupPassword');
        let dataToExport = { accounts, defaultTypes };
        
        if (backupPassword) {
            dataToExport = { encrypted: btoa(JSON.stringify(dataToExport)) };
        }
        
        dataStr = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    } else if (format === 'csv') {
        const allEntries = [];
        Object.keys(accounts).forEach(account => {
            accounts[account].forEach(entry => {
                allEntries.push({
                    account: account,
                    date: entry.date,
                    time: entry.time,
                    type: entry.type,
                    description: entry.description,
                    amount: entry.amount
                });
            });
        });
        
        const csvHeaders = ['บัญชี', 'วันที่', 'เวลา', 'ประเภท', 'รายละเอียด', 'จำนวนเงิน'];
        const csvRows = allEntries.map(entry => [
            entry.account,
            formatDateForDisplay(entry.date),
            entry.time,
            entry.type,
            entry.description,
            entry.amount
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        dataStr = '\uFEFF' + csvContent;
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
    }
    
    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บันทึกข้อมูลบัญชี_${new Date().toISOString().slice(0,10)}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`บันทึกไฟล์ ${format.toUpperCase()} เรียบร้อยแล้ว!`, 'success');
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (fileExtension === 'json') {
                const data = JSON.parse(e.target.result);
                
                if (data.encrypted) {
                    const backupPassword = localStorage.getItem('backupPassword');
                    if (!backupPassword) {
                        alert('ไฟล์นี้ถูกเข้ารหัส กรุณาตั้งรหัสผ่านสำหรับไฟล์สำรองก่อน');
                        return;
                    }
                    
                    try {
                        const decryptedData = JSON.parse(atob(data.encrypted));
                        processLoadedData(decryptedData);
                    } catch (decryptError) {
                        alert('ไม่สามารถถอดรหัสไฟล์ได้ อาจเป็นเพราะรหัสผ่านไม่ถูกต้อง');
                        return;
                    }
                } else {
                    processLoadedData(data);
                }
            } else if (fileExtension === 'csv') {
                const csvData = e.target.result;
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        processCSVData(results.data);
                    },
                    error: function(error) {
                        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
                    }
                });
            } else if (fileExtension === 'xlsx') {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                processXLSXData(jsonData);
            } else {
                alert('รูปแบบไฟล์ไม่รองรับ! กรุณาเลือกไฟล์ JSON, CSV หรือ XLSX');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการโหลดไฟล์: ' + error.message);
        }
    };
    
    if (fileExtension === 'xlsx') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    
    event.target.value = '';
}

function processLoadedData(data) {
    if (data.accounts) {
        accounts = data.accounts;
    }
    if (data.defaultTypes) {
        defaultTypes = data.defaultTypes;
    }
    
    if (Object.keys(accounts).length > 0) {
        currentAccount = Object.keys(accounts)[0];
    } else {
        accounts = { 'บัญชีหลัก': [] };
        currentAccount = 'บัญชีหลัก';
    }
    
    populateAccountSelect();
    updateAccountDisplay();
    updateTypeList();
    saveToLocal();
    showToast('โหลดข้อมูลเรียบร้อยแล้ว!', 'success');
}

function processCSVData(data) {
    const newAccounts = {};
    
    data.forEach(row => {
        if (!row['บัญชี'] || !row['วันที่'] || !row['จำนวนเงิน']) return;
        
        const account = row['บัญชี'];
        const dateParts = row['วันที่'].split('/');
        const date = `${parseInt(dateParts[2])-543}-${dateParts[1]}-${dateParts[0]}`;
        const time = row['เวลา'] || '00:00';
        const type = row['ประเภท'] || 'อื่นๆ';
        const description = row['รายละเอียด'] || '';
        const amount = parseFloat(row['จำนวนเงิน']);
        
        if (!newAccounts[account]) {
            newAccounts[account] = [];
        }
        
        newAccounts[account].push({
            date,
            time,
            type,
            description,
            amount,
            timestamp: new Date().toISOString()
        });
    });
    
    accounts = newAccounts;
    if (Object.keys(accounts).length > 0) {
        currentAccount = Object.keys(accounts)[0];
    } else {
        accounts = { 'บัญชีหลัก': [] };
        currentAccount = 'บัญชีหลัก';
    }
    
    populateAccountSelect();
    updateAccountDisplay();
    saveToLocal();
    showToast('นำเข้าข้อมูลจาก CSV เรียบร้อยแล้ว!', 'success');
}

function processXLSXData(data) {
    const newAccounts = {};
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || !row[1] || !row[5]) continue;
        
        const account = row[0];
        const dateParts = row[1].split('/');
        const date = `${parseInt(dateParts[2])-543}-${dateParts[1]}-${dateParts[0]}`;
        const time = row[2] || '00:00';
        const type = row[3] || 'อื่นๆ';
        const description = row[4] || '';
        const amount = parseFloat(row[5]);
        
        if (!newAccounts[account]) {
            newAccounts[account] = [];
        }
        
        newAccounts[account].push({
            date,
            time,
            type,
            description,
            amount,
            timestamp: new Date().toISOString()
        });
    }
    
    accounts = newAccounts;
    if (Object.keys(accounts).length > 0) {
        currentAccount = Object.keys(accounts)[0];
    } else {
        accounts = { 'บัญชีหลัก': [] };
        currentAccount = 'บัญชีหลัก';
    }
    
    populateAccountSelect();
    updateAccountDisplay();
    saveToLocal();
    showToast('นำเข้าข้อมูลจาก XLSX เรียบร้อยแล้ว!', 'success');
}

// ฟังก์ชันสรุปข้อมูล
function summarizeToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    summarizeByDateRange(todayStr, todayStr, 'สรุปข้อมูลวันนี้');
}

function summarizeAll() {
    if (!accounts[currentAccount] || accounts[currentAccount].length === 0) {
        alert('ไม่มีข้อมูลในบัญชีนี้!');
        return;
    }
    
    const dates = accounts[currentAccount].map(record => record.date);
    const startDate = dates.reduce((a, b) => a < b ? a : b);
    const endDate = dates.reduce((a, b) => a > b ? a : b);
    
    summarizeByDateRange(startDate, endDate, 'สรุปข้อมูลทั้งหมด');
}

function summarizeByDayMonth() {
    const selectedDate = document.getElementById('customDayMonth').value;
    if (!selectedDate) {
        alert('กรุณาเลือกวันที่!');
        return;
    }
    
    summarizeByDateRange(selectedDate, selectedDate, `สรุปข้อมูลวันที่ ${formatDateForDisplay(selectedDate)}`);
}

function summarize() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด!');
        return;
    }
    
    if (startDate > endDate) {
        alert('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด!');
        return;
    }
    
    summarizeByDateRange(startDate, endDate, `สรุปข้อมูลจากวันที่ ${formatDateForDisplay(startDate)} ถึง ${formatDateForDisplay(endDate)}`);
}

function summarizeByDateRange(startDate, endDate, title) {
    const filteredRecords = accounts[currentAccount].filter(record => 
        record.date >= startDate && record.date <= endDate
    );
    
    if (filteredRecords.length === 0) {
        alert('ไม่มีข้อมูลในช่วงวันที่เลือก!');
        return;
    }
    
    const summary = {};
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredRecords.forEach(record => {
        if (!summary[record.type]) {
            summary[record.type] = { income: 0, expense: 0 };
        }
        
        if (record.amount >= 0) {
            summary[record.type].income += record.amount;
            totalIncome += record.amount;
        } else {
            summary[record.type].expense += Math.abs(record.amount);
            totalExpense += Math.abs(record.amount);
        }
    });
    
    const netBalance = totalIncome - totalExpense;
    
    currentSummaryData = {
        title,
        startDate: formatDateForDisplay(startDate),
        endDate: formatDateForDisplay(endDate),
        summary,
        totalIncome,
        totalExpense,
        netBalance,
        recordCount: filteredRecords.length
    };
    
    currentSummaryType = 'display';
    displaySummaryModal();
}

function displaySummaryModal() {
    const modalBody = document.getElementById('modalBodyContent');
    
    let html = `
        <h2 style="color: #e91e63; margin-bottom: 10px; text-align: center;">${currentSummaryData.title}</h2>
        <p style="text-align: center; margin-bottom: 15px; color: #333;">
            วันที่ ${currentSummaryData.startDate} ถึง ${currentSummaryData.endDate}<br>
            จำนวนรายการทั้งหมด: ${currentSummaryData.recordCount} รายการ
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
                <tr style="background-color: #4CAF50; color: white;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">ประเภท</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">รายรับ</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">รายจ่าย</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">ยอดคงเหลือ</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.keys(currentSummaryData.summary).forEach(type => {
        const typeData = currentSummaryData.summary[type];
        const balance = typeData.income - typeData.expense;
        
        html += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${type}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: green;">${formatCurrency(typeData.income)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: red;">${formatCurrency(typeData.expense)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${balance >= 0 ? 'green' : 'red'};">${formatCurrency(balance)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr style="background-color: #f2f2f2; font-weight: bold;">
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">รวมทั้งหมด</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: green;">${formatCurrency(currentSummaryData.totalIncome)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: red;">${formatCurrency(currentSummaryData.totalExpense)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${currentSummaryData.netBalance >= 0 ? 'green' : 'red'};">${formatCurrency(currentSummaryData.netBalance)}</td>
                </tr>
            </tfoot>
        </table>
    `;
    
    modalBody.innerHTML = html;
    document.getElementById('summaryModal').style.display = 'flex';
    
    initializeSummaryControls();
}

function initializeSummaryControls() {
    const fontSizeSlider = document.getElementById('summaryFontSizeSlider');
    const fontSizeValue = document.getElementById('summaryFontSizeValue');
    const lineHeightSlider = document.getElementById('summaryLineHeightSlider');
    const lineHeightValue = document.getElementById('summaryLineHeightValue');
    const saveImageBtn = document.getElementById('saveSummaryAsImageBtn');
    
    fontSizeSlider.value = 1.0;
    lineHeightSlider.value = 0.5;
    fontSizeValue.textContent = 'ขนาด: 100%';
    lineHeightValue.textContent = 'ความสูงของบรรทัด: 0.5';
    
    fontSizeSlider.oninput = function() {
        const scale = this.value;
        document.getElementById('modalBodyContent').style.fontSize = `${scale * 100}%`;
        fontSizeValue.textContent = `ขนาด: ${Math.round(scale * 100)}%`;
    };
    
    lineHeightSlider.oninput = function() {
        const lineHeight = this.value;
        document.getElementById('modalBodyContent').style.lineHeight = lineHeight;
        lineHeightValue.textContent = `ความสูงของบรรทัด: ${lineHeight}`;
    };
    
    saveImageBtn.onclick = function() {
        saveSummaryAsImage();
    };
}

function closeSummaryModal() {
    document.getElementById('summaryModal').style.display = 'none';
}

function saveSummaryAsImage() {
    const summaryContent = document.getElementById('modalBodyContent');
    
    html2canvas(summaryContent, {
        backgroundColor: '#FAFAD2',
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `สรุปข้อมูล_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('บันทึกรูปภาพเรียบร้อยแล้ว!', 'success');
    });
}

// ฟังก์ชันจัดการ Modal
function openExportOptionsModal() {
    document.getElementById('exportOptionsModal').style.display = 'flex';
}

function closeExportOptionsModal() {
    document.getElementById('exportOptionsModal').style.display = 'none';
}

function exportSelectedAccount() {
    closeExportOptionsModal();
    document.getElementById('exportSingleAccountModal').style.display = 'flex';
}

function closeExportSingleAccountModal() {
    document.getElementById('exportSingleAccountModal').style.display = 'none';
}

function handleExportSelectedAs(format) {
    closeExportSingleAccountModal();
    
    let dataStr, mimeType, fileExtension;
    const accountData = { [currentAccount]: accounts[currentAccount] };
    
    if (format === 'json') {
        dataStr = JSON.stringify(accountData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    } else if (format === 'csv') {
        const csvHeaders = ['วันที่', 'เวลา', 'ประเภท', 'รายละเอียด', 'จำนวนเงิน'];
        const csvRows = accounts[currentAccount].map(entry => [
            formatDateForDisplay(entry.date),
            entry.time,
            entry.type,
            entry.description,
            entry.amount
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        dataStr = '\uFEFF' + csvContent;
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
    }
    
    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บัญชี_${currentAccount}_${new Date().toISOString().slice(0,10)}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`บันทึกไฟล์ ${format.toUpperCase()} สำหรับบัญชี ${currentAccount} เรียบร้อยแล้ว!`, 'success');
}

function initiateSingleDateExport() {
    closeExportOptionsModal();
    document.getElementById('singleDateExportModal').style.display = 'flex';
}

function closeSingleDateExportModal() {
    document.getElementById('singleDateExportModal').style.display = 'none';
}

function processSingleDateExport() {
    const selectedDate = document.getElementById('exportSingleDate').value;
    if (!selectedDate) {
        alert('กรุณาเลือกวันที่!');
        return;
    }
    
    const filteredRecords = accounts[currentAccount].filter(record => record.date === selectedDate);
    
    if (filteredRecords.length === 0) {
        alert('ไม่มีข้อมูลในวันที่เลือก!');
        return;
    }
    
    closeSingleDateExportModal();
    document.getElementById('singleDateExportFormatModal').style.display = 'flex';
    
    window.tempExportData = {
        date: selectedDate,
        records: filteredRecords
    };
}

function closeSingleDateExportFormatModal() {
    document.getElementById('singleDateExportFormatModal').style.display = 'none';
    window.tempExportData = null;
}

function handleSingleDateExportAs(format) {
    if (!window.tempExportData) {
        alert('ไม่พบข้อมูลที่จะส่งออก!');
        return;
    }
    
    const { date, records } = window.tempExportData;
    closeSingleDateExportFormatModal();
    
    let dataStr, mimeType, fileExtension;
    const exportData = { [currentAccount]: records };
    
    if (format === 'json') {
        dataStr = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    } else if (format === 'csv') {
        const csvHeaders = ['วันที่', 'เวลา', 'ประเภท', 'รายละเอียด', 'จำนวนเงิน'];
        const csvRows = records.map(entry => [
            formatDateForDisplay(entry.date),
            entry.time,
            entry.type,
            entry.description,
            entry.amount
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        dataStr = '\uFEFF' + csvContent;
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
    }
    
    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บัญชี_${currentAccount}_วันที่_${formatDateForDisplay(date)}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`บันทึกไฟล์ ${format.toUpperCase()} สำหรับวันที่ ${formatDateForDisplay(date)} เรียบร้อยแล้ว!`, 'success');
    window.tempExportData = null;
}

function openSummaryOutputModal() {
    document.getElementById('summaryOutputModal').style.display = 'flex';
}

function closeSummaryOutputModal() {
    document.getElementById('summaryOutputModal').style.display = 'none';
}

function handleSummaryOutput(outputType) {
    closeSummaryOutputModal();
    currentSummaryType = outputType;
    
    if (outputType === 'display') {
        displaySummaryModal();
    } else if (outputType === 'xlsx') {
        exportSummaryAsXLSX();
    } else if (outputType === 'pdf') {
        exportSummaryAsPDF();
    }
}

function exportSummaryAsXLSX() {
    const wb = XLSX.utils.book_new();
    
    const summaryArray = [
        [currentSummaryData.title],
        [`วันที่ ${currentSummaryData.startDate} ถึง ${currentSummaryData.endDate}`],
        [`จำนวนรายการทั้งหมด: ${currentSummaryData.recordCount} รายการ`],
        [],
        ['ประเภท', 'รายรับ', 'รายจ่าย', 'ยอดคงเหลือ']
    ];
    
    Object.keys(currentSummaryData.summary).forEach(type => {
        const typeData = currentSummaryData.summary[type];
        const balance = typeData.income - typeData.expense;
        summaryArray.push([type, typeData.income, typeData.expense, balance]);
    });
    
    summaryArray.push([]);
    summaryArray.push(['รวมทั้งหมด', currentSummaryData.totalIncome, currentSummaryData.totalExpense, currentSummaryData.netBalance]);
    
    const ws = XLSX.utils.aoa_to_sheet(summaryArray);
    XLSX.utils.book_append_sheet(wb, ws, 'สรุปข้อมูล');
    
    XLSX.writeFile(wb, `สรุปข้อมูล_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('บันทึกไฟล์ XLSX เรียบร้อยแล้ว!', 'success');
}

function exportSummaryAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.setTextColor(233, 30, 99);
    doc.text(currentSummaryData.title, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`วันที่ ${currentSummaryData.startDate} ถึง ${currentSummaryData.endDate}`, 105, 22, { align: 'center' });
    doc.text(`จำนวนรายการทั้งหมด: ${currentSummaryData.recordCount} รายการ`, 105, 27, { align: 'center' });
    
    const headers = [['ประเภท', 'รายรับ', 'รายจ่าย', 'ยอดคงเหลือ']];
    const data = [];
    
    Object.keys(currentSummaryData.summary).forEach(type => {
        const typeData = currentSummaryData.summary[type];
        const balance = typeData.income - typeData.expense;
        data.push([type, formatCurrency(typeData.income), formatCurrency(typeData.expense), formatCurrency(balance)]);
    });
    
    data.push(['รวมทั้งหมด', formatCurrency(currentSummaryData.totalIncome), formatCurrency(currentSummaryData.totalExpense), formatCurrency(currentSummaryData.netBalance)]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [76, 175, 80], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`สรุปข้อมูล_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('บันทึกไฟล์ PDF เรียบร้อยแล้ว!', 'success');
}

// ฟังก์ชันนำเข้าข้อมูล
function importEntriesFromAccount() {
    const sourceAccount = document.getElementById('importAccountSelect').value;
    const selectedDate = document.getElementById('importDate').value;
    
    if (!sourceAccount) {
        alert('กรุณาเลือกบัญชีต้นทาง!');
        return;
    }
    
    if (!selectedDate) {
        alert('กรุณาเลือกวันที่!');
        return;
    }
    
    const sourceRecords = accounts[sourceAccount].filter(record => record.date === selectedDate);
    
    if (sourceRecords.length === 0) {
        alert(`ไม่มีข้อมูลในบัญชี ${sourceAccount} สำหรับวันที่ ${formatDateForDisplay(selectedDate)}`);
        return;
    }
    
    const existingDates = [...new Set(accounts[currentAccount].map(record => record.date))];
    if (existingDates.includes(selectedDate)) {
        if (!confirm(`ในบัญชีปัจจุบันมีข้อมูลสำหรับวันที่ ${formatDateForDisplay(selectedDate)} อยู่แล้ว คุณต้องการเพิ่มข้อมูลจากบัญชี ${sourceAccount} เข้าไปด้วยหรือไม่?`)) {
            return;
        }
    }
    
    sourceRecords.forEach(record => {
        accounts[currentAccount].push({
            ...record,
            timestamp: new Date().toISOString()
        });
    });
    
    displayRecords();
    saveToLocal();
    showToast(`นำเข้าข้อมูลจากบัญชี ${sourceAccount} สำหรับวันที่ ${formatDateForDisplay(selectedDate)} เรียบร้อยแล้ว (${sourceRecords.length} รายการ)`, 'success');
    
    document.getElementById('importDate').value = '';
}

function importFromFileForMerging(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (fileExtension === 'json') {
                const data = JSON.parse(e.target.result);
                processMergeData(data);
            } else if (fileExtension === 'csv') {
                const csvData = e.target.result;
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        processCSVMergeData(results.data);
                    },
                    error: function(error) {
                        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
                    }
                });
            } else {
                alert('รูปแบบไฟล์ไม่รองรับ! กรุณาเลือกไฟล์ JSON หรือ CSV');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการโหลดไฟล์: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function processMergeData(data) {
    let importedRecords = [];
    const importedAccount = Object.keys(data)[0];
    
    if (data[importedAccount] && Array.isArray(data[importedAccount])) {
        importedRecords = data[importedAccount];
    } else {
        alert('รูปแบบไฟล์ไม่ถูกต้อง!');
        return;
    }
    
    if (importedRecords.length === 0) {
        alert('ไม่มีข้อมูลในไฟล์ที่เลือก!');
        return;
    }
    
    const importDates = [...new Set(importedRecords.map(record => record.date))];
    
    if (importDates.length > 1) {
        alert('ไฟล์ที่เลือกมีข้อมูลมากกว่าหนึ่งวัน! กรุณาเลือกไฟล์ที่บันทึกเฉพาะวันที่เลือกเท่านั้น');
        return;
    }
    
    mergeRecordsIntoAccount(importedRecords, importedAccount);
}

function processCSVMergeData(data) {
    const importedRecords = [];
    
    data.forEach(row => {
        if (!row['วันที่'] || !row['จำนวนเงิน']) return;
        
        const dateParts = row['วันที่'].split('/');
        const date = `${parseInt(dateParts[2])-543}-${dateParts[1]}-${dateParts[0]}`;
        const time = row['เวลา'] || '00:00';
        const type = row['ประเภท'] || 'อื่นๆ';
        const description = row['รายละเอียด'] || '';
        const amount = parseFloat(row['จำนวนเงิน']);
        
        importedRecords.push({
            date,
            time,
            type,
            description,
            amount,
            timestamp: new Date().toISOString()
        });
    });
    
    if (importedRecords.length === 0) {
        alert('ไม่มีข้อมูลในไฟล์ CSV ที่เลือก!');
        return;
    }
    
    const importDates = [...new Set(importedRecords.map(record => record.date))];
    
    if (importDates.length > 1) {
        alert('ไฟล์ CSV ที่เลือกมีข้อมูลมากกว่าหนึ่งวัน! กรุณาเลือกไฟล์ที่บันทึกเฉพาะวันที่เลือกเท่านั้น');
        return;
    }
    
    mergeRecordsIntoAccount(importedRecords, 'จากไฟล์ CSV');
}

function mergeRecordsIntoAccount(importedRecords, sourceName) {
    const importDate = importedRecords[0].date;
    const existingDates = [...new Set(accounts[currentAccount].map(record => record.date))];
    
    if (existingDates.includes(importDate)) {
        if (!confirm(`ในบัญชีปัจจุบันมีข้อมูลสำหรับวันที่ ${formatDateForDisplay(importDate)} อยู่แล้ว คุณต้องการเพิ่มข้อมูลจาก ${sourceName} เข้าไปด้วยหรือไม่?`)) {
            return;
        }
    }
    
    let addedCount = 0;
    importedRecords.forEach(record => {
        const isDuplicate = accounts[currentAccount].some(existingRecord =>
            existingRecord.date === record.date &&
            existingRecord.time === record.time &&
            existingRecord.type === record.type &&
            existingRecord.description === record.description &&
            existingRecord.amount === record.amount
        );
        
        if (!isDuplicate) {
            accounts[currentAccount].push({
                ...record,
                timestamp: new Date().toISOString()
            });
            addedCount++;
        }
    });
    
    displayRecords();
    saveToLocal();
    showToast(`นำเข้าข้อมูลจาก ${sourceName} สำหรับวันที่ ${formatDateForDisplay(importDate)} เรียบร้อยแล้ว (เพิ่ม ${addedCount} รายการ)`, 'success');
}

// ฟังก์ชันจัดการรหัสผ่าน
function setBackupPassword() {
    const password = document.getElementById('backup-password').value;
    const confirmPassword = document.getElementById('backup-password-confirm').value;
    const statusElement = document.getElementById('password-status');
    
    if (password !== confirmPassword) {
        statusElement.textContent = 'รหัสผ่านไม่ตรงกัน!';
        statusElement.style.color = 'red';
        return;
    }
    
    if (password === '') {
        localStorage.removeItem('backupPassword');
        statusElement.textContent = 'ลบรหัสผ่านเรียบร้อยแล้ว!';
        statusElement.style.color = 'green';
    } else {
        localStorage.setItem('backupPassword', password);
        statusElement.textContent = 'ตั้งรหัสผ่านเรียบร้อยแล้ว!';
        statusElement.style.color = 'green';
    }
    
    document.getElementById('backup-password').value = '';
    document.getElementById('backup-password-confirm').value = '';
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

// เริ่มต้นแอปพลิเคชัน
document.addEventListener('DOMContentLoaded', initializeApp);