// js/area.js
let areaCharts = {};

// Hàm sắp xếp khu vực theo thứ tự mong muốn
function sortKhuVuc(kvList) {
    const order = [
        'KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6',
        'Miền Bắc (Chợ)', 'Miền Trung', 'Miền Nam'
    ];
    
    return [...kvList].sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
}

function updateAreaCharts() {
    if (areaCharts.barKVDetail) areaCharts.barKVDetail.destroy();
    updateBarChartKVDetail();
}

function updateAreaTables() {
    updateAreaTable();
}

function updateBarChartKVDetail() {
    const ctx = document.getElementById('barChartKVDetail').getContext('2d');
    const kvData = {};
    
    // Tính tổng doanh số theo khu vực
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhSoBan || 0);
    });
    
    // Lấy danh sách các ngành hàng
    const nganhHangs = [...new Set(filteredData.map(item => item.nganhHang))];
    
    // Tạo dữ liệu chi tiết theo ngành hàng cho từng khu vực
    const nganhDetailByKV = {};
    const totalQuantityByKV = {};
    
    // Lấy danh sách khu vực và sắp xếp theo thứ tự mong muốn
    const khuVucs = sortKhuVuc(Object.keys(kvData));
    
    khuVucs.forEach(kv => {
        nganhDetailByKV[kv] = {};
        totalQuantityByKV[kv] = 0;
        nganhHangs.forEach(nganh => {
            nganhDetailByKV[kv][nganh] = {
                doanhSo: 0,
                soLuong: 0
            };
        });
    });
    
    // Tính tổng doanh số và số lượng theo ngành hàng và khu vực
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        const nganh = item.nganhHang;
        const doanhSo = item.doanhSoBan || 0;
        const soLuong = item.soLuong || 0;
        
        if (nganhDetailByKV[kv] && nganhDetailByKV[kv][nganh]) {
            nganhDetailByKV[kv][nganh].doanhSo += doanhSo;
            nganhDetailByKV[kv][nganh].soLuong += soLuong;
            totalQuantityByKV[kv] += soLuong;
        }
    });
    
    // Tạo mảng dữ liệu đã sắp xếp theo thứ tự khu vực
    const sortedDoanhSo = khuVucs.map(kv => kvData[kv] || 0);

    // Hủy biểu đồ cũ nếu tồn tại
    if (areaCharts.barKVDetail) {
        areaCharts.barKVDetail.destroy();
    }

    areaCharts.barKVDetail = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: khuVucs,
            datasets: [{
                label: 'Doanh số bán',
                data: sortedDoanhSo,
                backgroundColor: '#ff7300'
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
                    font: { weight: 'bold', size: 14 }
                },
                legend: {
                    labels: { font: { size: 13 } }
                },
                tooltip: {
                    bodyFont: { size: 13 },
                    titleFont: { size: 13 },
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const kv = context.label;
                            const totalDoanhSo = context.raw;
                            const totalSoLuong = totalQuantityByKV[kv] || 0;
                            
                            const nganhDetails = nganhDetailByKV[kv];
                            if (!nganhDetails) return [];
                            
                            const sortedNganh = Object.entries(nganhDetails)
                                .sort((a, b) => b[1].doanhSo - a[1].doanhSo)
                                .filter(([_, data]) => data.doanhSo > 0);
                            
                            const lines = [];
                            lines.push(`Tổng doanh số: ${formatMoney(totalDoanhSo)}`);
                            lines.push(`Tổng số lượng: ${formatNumber(totalSoLuong)}`);
                            lines.push(``);
                            
                            sortedNganh.forEach(([nganh, data]) => {
                                const percentDoanhSo = ((data.doanhSo / totalDoanhSo) * 100).toFixed(1);
                                const percentSoLuong = ((data.soLuong / totalSoLuong) * 100).toFixed(1);
                                lines.push(`📊 ${nganh}:`);
                                lines.push(`   Doanh số: ${formatMoney(data.doanhSo)} (${percentDoanhSo}%)`);
                                lines.push(`   Số lượng: ${formatNumber(data.soLuong)} (${percentSoLuong}%)`);
                                lines.push(``);
                            });
                            
                            return lines;
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
                        font: { size: 13 }
                    }
                },
                x: {
                    title: { display: true, text: 'Khu vực', font: { size: 13, weight: 'bold' } },
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: { size: 13 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateAreaTable() {
    const kvData = {};
    
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        if (!kvData[kv]) {
            kvData[kv] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soDonHang: new Set()
            };
        }
        kvData[kv].doanhSoBan += item.doanhSoBan || 0;
        kvData[kv].chietKhau += item.chietKhau || 0;
        kvData[kv].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.maDon) {
            kvData[kv].soDonHang.add(item.maDon);
        }
    });

    // Sắp xếp các khu vực theo thứ tự mong muốn
    const sortedKVs = sortKhuVuc(Object.keys(kvData));

    // Tạo HTML cho bảng
    let html = `
        <div class="data-table">
            <h3><i class="fas fa-layer-group"></i> Thống kê theo khu vực</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Khu vực</th>
                            <th>Doanh số bán</th>
                            <th>Chiết khấu</th>
                            <th>Doanh thu thuần</th>
                            <th>Số đơn hàng</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedKVs.forEach(kv => {
        const data = kvData[kv];
        html += `
            <tr>
                <td>${kv}</td>
                <td>${formatFullNumber(data.doanhSoBan)}</td>
                <td>${formatFullNumber(data.chietKhau)}</td>
                <td>${formatFullNumber(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soDonHang.size)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('areaTable').innerHTML = html;
}