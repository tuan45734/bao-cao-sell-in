// js/overview.js
let overviewCharts = {};

function updateOverviewStats() {
    const totalRevenue = enrichedSalesData.reduce((sum, item) => sum + (item.doanhThuThuan || 0), 0);
    const totalSales = enrichedSalesData.reduce((sum, item) => sum + (item.doanhSoBan || 0), 0);
    const totalDiscount = enrichedSalesData.reduce((sum, item) => sum + (item.chietKhau || 0), 0);
    
    const uniqueOrders = new Set(enrichedSalesData.map(item => item.maDon).filter(maDon => maDon));
    const totalTransactions = uniqueOrders.size;

    const statsGrid = document.getElementById('overviewStats');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
            <div class="stat-info">
                <h3>Tổng doanh số bán</h3>
                <div class="value">${formatMoney(totalSales)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-percent"></i></div>
            <div class="stat-info">
                <h3>Tổng chiết khấu</h3>
                <div class="value">${formatMoney(totalDiscount)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-info">
                <h3>Tổng doanh thu thuần</h3>
                <div class="value">${formatMoney(totalRevenue)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
            <div class="stat-info">
                <h3>Số đơn hàng</h3>
                <div class="value">${formatNumber(totalTransactions)}</div>
            </div>
        </div>
    `;
}

function updateOverviewCharts() {
    Object.values(overviewCharts).forEach(chart => {
        if (chart) chart.destroy();
    });

    updatePieChartMien();
    updateLineChartNganhHang();  // Biểu đồ ngành hàng (không hiển thị số)
    updateBarChartKV();          // Biểu đồ khu vực
    updateLineChartDaily();      // Biểu đồ xu hướng theo ngày
}

function updatePieChartMien() {
    const ctx = document.getElementById('pieChartMien').getContext('2d');
    const mienData = {};

    enrichedSalesData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0);
    });

    overviewCharts.pieMien = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(mienData),
            datasets: [{
                data: Object.values(mienData),
                backgroundColor: ['#e78b00', '#bbff00', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    formatter: (value, context) => {
                        let total = context.dataset.data.reduce((a, b) => a + b, 0);
                        let percentage = ((value / total) * 100).toFixed(1);
                        return percentage + '%';
                    },
                    color: 'white',
                    font: { weight: 'bold', size: 14 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateLineChartNganhHang() {
    const ctx = document.getElementById('lineChartNganhHang').getContext('2d');
    if (!ctx) return;
    
    const nganhHangs = [...new Set(enrichedSalesData.map(item => item.nganhHang))];
    
    const miens = [...new Set(enrichedSalesData.map(item => item.mien))];
    
    const totalDoanhSoByMien = {};
    const totalSoLuongByMien = {};
    miens.forEach(mien => {
        totalDoanhSoByMien[mien] = 0;
        totalSoLuongByMien[mien] = 0;
    });
    
    const dataByNganhHang = {};
    const quantityByNganhHang = {};
    
    nganhHangs.forEach(nganh => {
        dataByNganhHang[nganh] = {};
        quantityByNganhHang[nganh] = {};
        miens.forEach(mien => {
            dataByNganhHang[nganh][mien] = 0;
            quantityByNganhHang[nganh][mien] = 0;
        });
    });
    
    enrichedSalesData.forEach(item => {
        const nganh = item.nganhHang;
        const mien = item.mien;
        dataByNganhHang[nganh][mien] += (item.doanhSoBan || 0);
        quantityByNganhHang[nganh][mien] += (item.soLuong || 0);
        totalDoanhSoByMien[mien] += (item.doanhSoBan || 0);
        totalSoLuongByMien[mien] += (item.soLuong || 0);
    });
    
    const colors = ['#ff7300', '#a7b900', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4', '#f39c12', '#e74c3c'];
    
    const datasets = nganhHangs.map((nganh, index) => {
        return {
            label: nganh,
            data: miens.map(mien => dataByNganhHang[nganh][mien]),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.4,
            fill: false,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            quantityData: miens.map(mien => quantityByNganhHang[nganh][mien]),
            totalDoanhSoMien: miens.map(mien => totalDoanhSoByMien[mien]),
            totalSoLuongMien: miens.map(mien => totalSoLuongByMien[mien])
        };
    });
    
    overviewCharts.lineNganhHang = new Chart(ctx, {
        type: 'line',
        data: {
            labels: miens,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                datalabels: {
                    display: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    bodyFont: { size: 12 },
                    titleFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            const label = dataset.label || '';
                            const value = context.raw || 0;
                            const index = context.dataIndex;
                            const quantity = dataset.quantityData ? dataset.quantityData[index] : 0;
                            const totalDoanhSoMien = dataset.totalDoanhSoMien ? dataset.totalDoanhSoMien[index] : 1;
                            const totalSoLuongMien = dataset.totalSoLuongMien ? dataset.totalSoLuongMien[index] : 1;
                            
                            const percentDoanhSo = ((value / totalDoanhSoMien) * 100).toFixed(1);
                            const percentSoLuong = ((quantity / totalSoLuongMien) * 100).toFixed(1);
                            
                            return [
                                `${label}:`,
                                `  Doanh số: ${formatMoney(value)} (${percentDoanhSo}%)`,
                                `  Số lượng: ${formatNumber(quantity)} (${percentSoLuong}%)`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { 
                        display: true, 
                        text: 'Doanh số bán', 
                        font: { size: 12, weight: 'bold' } 
                    },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: { size: 11 }
                    }
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Miền', 
                        font: { size: 12, weight: 'bold' } 
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    const mienData = {};
    const totalAll = enrichedSalesData.reduce((sum, item) => sum + (item.doanhSoBan || 0), 0);

    enrichedSalesData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0);
    });

    overviewCharts.barKV = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(mienData),
            datasets: [{
                label: 'Doanh số bán',
                data: Object.values(mienData),
                backgroundColor: '#ff9216'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        return formatMoney(value);
                    },
                    color: '#333',
                    font: { weight: 'bold', size: 12 }
                },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw || 0;
                            const percent = ((value / totalAll) * 100).toFixed(1);
                            return `${formatMoney(value)} (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Doanh số bán', font: { size: 12, weight: 'bold' } },
                    ticks: {
                        callback: function (value) {
                            return formatMoney(value);
                        },
                        font: { size: 11 }
                    }
                },
                x: {
                    title: { display: true, text: 'Miền', font: { size: 12, weight: 'bold' } },
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: { size: 11 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateLineChartDaily() {
    const ctx = document.getElementById('lineChartDaily').getContext('2d');
    
    const miens = [...new Set(enrichedSalesData.map(item => item.mien))];
    const dailyDataByMien = {};
    const allDates = new Set();
    
    const totalByDate = {};
    
    miens.forEach(mien => {
        dailyDataByMien[mien] = {};
    });
    
    enrichedSalesData.forEach(item => {
        const date = item.ngay;
        const mien = item.mien;
        const doanhSo = item.doanhSoBan || 0;
        allDates.add(date);
        
        if (!dailyDataByMien[mien][date]) {
            dailyDataByMien[mien][date] = 0;
        }
        dailyDataByMien[mien][date] += doanhSo;
        
        if (!totalByDate[date]) {
            totalByDate[date] = 0;
        }
        totalByDate[date] += doanhSo;
    });
    
    const sortedDates = Array.from(allDates).sort((a, b) => {
        return parseDate(a) - parseDate(b);
    });
    
    const colors = ['#ff7300', '#667eea', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4'];
    
    const datasets = miens.map((mien, index) => {
        return {
            label: `Miền ${mien}`,
            data: sortedDates.map(date => dailyDataByMien[mien][date] || 0),
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            borderWidth: 3,
            // Lưu tổng doanh số theo ngày để tính %
            totalByDate: sortedDates.map(date => totalByDate[date] || 1)
        };
    });
    
    overviewCharts.lineDaily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                datalabels: { display: false },
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 13 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    bodyFont: { size: 13 },
                    titleFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            const label = dataset.label || '';
                            const value = context.raw || 0;
                            const index = context.dataIndex;
                            const totalByDate = dataset.totalByDate ? dataset.totalByDate[index] : 1;
                            const percent = ((value / totalByDate) * 100).toFixed(1);
                            return `${label}: ${formatMoney(value)} (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Doanh số bán', font: { size: 13, weight: 'bold' } },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: { size: 12 }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: { size: 11 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// --- Per-chart date-range filter for the daily trend (non-destructive) ---
function initDailyTrendFilter() {
    if (typeof flatpickr === 'undefined') return;

    const opts = {
        dateFormat: 'd/m/Y',
        locale: 'vn',
        allowInput: true,
        prevArrow: '<i class="fas fa-chevron-left"></i>',
        nextArrow: '<i class="fas fa-chevron-right"></i>'
    };

    flatpickr('#dailyStartDate', opts);
    flatpickr('#dailyEndDate', opts);

    const applyBtn = document.getElementById('dailyApplyBtn');
    const clearBtn = document.getElementById('dailyClearBtn');

    if (applyBtn) applyBtn.addEventListener('click', updateDailyFromControls);
    if (clearBtn) clearBtn.addEventListener('click', function() {
        document.getElementById('dailyStartDate').value = '';
        document.getElementById('dailyEndDate').value = '';
        // redraw original chart using full data by calling existing function
        if (typeof updateLineChartDaily === 'function') updateLineChartDaily();
    });
}

function updateDailyFromControls() {
    const start = document.getElementById('dailyStartDate').value;
    const end = document.getElementById('dailyEndDate').value;

    // Build filtered dataset from enrichedSalesData without modifying existing globals
    let dataSource = [...enrichedSalesData];
    if (start && end) {
        const s = parseDate(start);
        const e = parseDate(end);
        dataSource = dataSource.filter(item => {
            const d = parseDate(item.ngay);
            return d >= s && d <= e;
        });
    }

    // Create chart using same structure as original but from filtered data
    renderDailyChartFromData(dataSource);
}

function renderDailyChartFromData(dataSource) {
    const ctx = document.getElementById('lineChartDaily').getContext('2d');
    if (overviewCharts.lineDaily) overviewCharts.lineDaily.destroy();

    const miens = [...new Set(dataSource.map(item => item.mien))];
    const dailyDataByMien = {};
    const allDates = new Set();
    const totalByDate = {};

    miens.forEach(mien => dailyDataByMien[mien] = {});
    dataSource.forEach(item => {
        const date = item.ngay;
        const mien = item.mien;
        const doanhSo = item.doanhSoBan || 0;
        allDates.add(date);
        dailyDataByMien[mien][date] = (dailyDataByMien[mien][date] || 0) + doanhSo;
        totalByDate[date] = (totalByDate[date] || 0) + doanhSo;
    });

    const sortedDates = Array.from(allDates).sort((a, b) => parseDate(a) - parseDate(b));
    const colors = ['#ff7300', '#667eea', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4'];

    const datasets = miens.map((mien, index) => ({
        label: `Miền ${mien}`,
        data: sortedDates.map(date => dailyDataByMien[mien][date] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        borderWidth: 3,
        totalByDate: sortedDates.map(date => totalByDate[date] || 1)
    }));

    overviewCharts.lineDaily = new Chart(ctx, {
        type: 'line',
        data: { labels: sortedDates, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                datalabels: { display: false },
                legend: { position: 'top', labels: { font: { size: 13 }, usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    bodyFont: { size: 13 },
                    titleFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            const label = dataset.label || '';
                            const value = context.raw || 0;
                            const index = context.dataIndex;
                            const total = dataset.totalByDate ? dataset.totalByDate[index] : 1;
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatMoney(value)} (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Doanh số bán', font: { size: 13, weight: 'bold' } }, ticks: { callback: v => formatMoney(v), font: { size: 12 } } },
                x: { ticks: { maxRotation: 30, minRotation: 30, font: { size: 11 } } }
            }
        },
        plugins: [ChartDataLabels]
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initDailyTrendFilter();
});