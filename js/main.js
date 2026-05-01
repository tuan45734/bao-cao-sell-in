// js/main.js
let filteredData = [];

document.addEventListener('DOMContentLoaded', function () {
    // Không tự động khởi tạo nữa, để login.js quản lý
    // Chỉ khởi tạo sau khi đăng nhập thành công qua onLoginSuccess
});

// Hàm này sẽ được gọi từ login.js sau khi đăng nhập thành công
window.onLoginSuccess = function() {
    initializeDatePickers();
    // Sử dụng enrichedSalesData thay vì salesData
    filteredData = [...enrichedSalesData];
    updateAll();
};

function initializeDatePickers() {
    flatpickr.localize({
        weekdays: {
            shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            longhand: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
        },
        months: {
            shorthand: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
            longhand: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
        },
        firstDayOfWeek: 1,
        rangeSeparator: ' đến ',
        weekAbbreviation: 'Tuần',
        scrollTitle: 'Cuộn để tăng',
        toggleTitle: 'Nhấn để chuyển',
        amPM: ['SA', 'CH'],
        yearAriaLabel: 'Năm'
    });

    flatpickr(".datepicker", {
        dateFormat: "d/m/Y",
        locale: 'vn',
        onChange: function () {
            applyFilters();
        },
        prevArrow: '<i class="fas fa-chevron-left"></i>',
        nextArrow: '<i class="fas fa-chevron-right"></i>',
        placeholder: 'dd/mm/yyyy'
    });
}

// Chỉ giữ 1 hàm applyFilters - sử dụng enrichedSalesData
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (startDate && endDate) {
        filteredData = enrichedSalesData.filter(item => {
            const itemDate = parseDate(item.ngay);
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            return itemDate >= start && itemDate <= end;
        });
    } else {
        filteredData = [...enrichedSalesData];
    }

    updateAll();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function updateAll() {
    // Kiểm tra các hàm có tồn tại không trước khi gọi
    if (typeof updateOverviewStats === 'function') updateOverviewStats();
    if (typeof updateOverviewCharts === 'function') updateOverviewCharts();
    if (typeof updateRegionTables === 'function') updateRegionTables();
    if (typeof updateRegionCharts === 'function') updateRegionCharts();
    if (typeof updateAreaTables === 'function') updateAreaTables();
    if (typeof updateAreaCharts === 'function') updateAreaCharts();
    if (typeof updateProvinceData === 'function') updateProvinceData();
    if (typeof updateNPPData === 'function') updateNPPData();
}

function switchTab(tabId, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'byProvince') {
        if (typeof openProvinceModal === 'function') openProvinceModal();
        if (typeof updateProvinceData === 'function') updateProvinceData();
    } else if (tabId === 'byNPP') {
        if (typeof openNPPModal === 'function') openNPPModal();
        if (typeof updateNPPData === 'function') updateNPPData();
    }
}

// Window click handler for modals
window.onclick = function(event) {
    const modals = [
        'provinceModal', 'nppModal', 'nppDetailModal', 
        'provinceDetailModal', 'nppByProductModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target == modal) {
            if (modalId === 'provinceModal' && typeof closeProvinceModal === 'function') closeProvinceModal();
            if (modalId === 'nppModal' && typeof closeNPPModal === 'function') closeNPPModal();
            if (modalId === 'nppDetailModal' && typeof closeNPPDetailModal === 'function') closeNPPDetailModal();
            if (modalId === 'provinceDetailModal' && typeof closeProvinceDetailModal === 'function') closeProvinceDetailModal();
            if (modalId === 'nppByProductModal' && typeof closeNPPByProductModal === 'function') closeNPPByProductModal();
        }
    });
};