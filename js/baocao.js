let baoCaoChartInstance = null;
const BAOCAO_COLORS = ['#667eea', '#ff7300', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];

function getAvailableYears() {
    const years = new Set();
    (enrichedSalesData || []).forEach(item => {
        const parts = item.ngay.split('/');
        years.add(parts[2]);
    });
    return Array.from(years).sort();
}

function getWeekOfMonth(date) {
    const d = date.getDate();
    if (d <= 7) return 1;
    if (d <= 14) return 2;
    if (d <= 21) return 3;
    if (d <= 28) return 4;
    return 5;
}

function getQuarter(month) {
    return Math.ceil(month / 3);
}

function onBaoCaoTypeChange() {
    const type = document.getElementById('baoCaoType').value;
    const container = document.getElementById('baoCaoParamControls');
    const years = getAvailableYears();
    if (years.length === 0) return;
    const currentYear = years.includes(new Date().getFullYear().toString())
        ? new Date().getFullYear().toString()
        : years[years.length - 1];

    let html = '';
    if (type === 'week') {
        html = `
            <select id="baoCaoMonth" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">Tháng ${i+1}</option>`).join('')}
            </select>
            <select id="baoCaoYear" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
        `;
    } else if (type === 'month') {
        html = `
            <select id="baoCaoQuarter" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                <option value="1">Quý 1</option>
                <option value="2">Quý 2</option>
                <option value="3">Quý 3</option>
                <option value="4">Quý 4</option>
            </select>
            <select id="baoCaoYear" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
        `;
    } else if (type === 'quarter') {
        html = `
            <select id="baoCaoYear" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
        `;
    } else if (type === 'year') {
        html = `
            <select id="baoCaoFromYear" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${years.map(y => `<option value="${y}" ${y === years[0] ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <span style="line-height: 38px;"> đến </span>
            <select id="baoCaoToYear" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
        `;
    }
    container.innerHTML = html;
}

function getFilterParams() {
    const type = document.getElementById('baoCaoType').value;
    const params = { type: type };

    if (type === 'week') {
        params.month = parseInt(document.getElementById('baoCaoMonth').value);
        params.year = document.getElementById('baoCaoYear').value;
    } else if (type === 'month') {
        params.quarter = parseInt(document.getElementById('baoCaoQuarter').value);
        params.year = document.getElementById('baoCaoYear').value;
    } else if (type === 'quarter') {
        params.year = document.getElementById('baoCaoYear').value;
    } else if (type === 'year') {
        params.fromYear = document.getElementById('baoCaoFromYear').value;
        params.toYear = document.getElementById('baoCaoToYear').value;
    }

    return params;
}

function applyBaoCaoFilter() {
    const params = getFilterParams();
    updateBaoCaoReport(params);
}

function updateBaoCaoData() {
    const params = getFilterParams();
    updateBaoCaoReport(params);
}

function updateBaoCaoReport(params) {
    const data = window.baoCaoFilteredData && window.baoCaoFilteredData.length > 0
        ? window.baoCaoFilteredData
        : filteredData;

    if (!data || data.length === 0) {
        document.getElementById('baoCaoContent').style.display = 'none';
        return;
    }

    const result = aggregateData(data, params);
    if (!result || result.periods.length === 0) {
        document.getElementById('baoCaoContent').style.display = 'none';
        return;
    }

    document.getElementById('baoCaoContent').style.display = 'block';
    renderBaoCaoChart(result, params);
    renderBaoCaoTable(result, params);
}

function aggregateData(data, params) {
    const type = params.type;
    const nganhHangs = [...new Set(data.map(d => d.nganhHang || 'Khác'))].sort();
    const periodMap = {};
    const periodOrder = [];

    data.forEach(item => {
        const date = parseDate(item.ngay);
        if (!date) return;

        const year = date.getFullYear().toString();
        const month = date.getMonth() + 1;
        let periodKey = '';
        let periodLabel = '';

        if (type === 'week') {
            if (parseInt(month) !== params.month || year !== params.year) return;
            const week = getWeekOfMonth(date);
            periodKey = 'W' + week;
            periodLabel = 'Tuần ' + week;
        } else if (type === 'month') {
            const q = getQuarter(month);
            if (q !== params.quarter || year !== params.year) return;
            periodKey = 'M' + month;
            periodLabel = 'Tháng ' + month;
        } else if (type === 'quarter') {
            if (year !== params.year) return;
            const q = getQuarter(month);
            periodKey = 'Q' + q;
            periodLabel = 'Quý ' + q;
        } else if (type === 'year') {
            const yNum = parseInt(year);
            const fromY = parseInt(params.fromYear);
            const toY = parseInt(params.toYear);
            if (yNum < fromY || yNum > toY) return;
            periodKey = 'Y' + year;
            periodLabel = 'Năm ' + year;
        }

        if (!periodMap[periodKey]) {
            periodMap[periodKey] = { label: periodLabel, order: periodKey, nganhData: {} };
            periodOrder.push(periodKey);
        }

        const nganh = item.nganhHang || 'Khác';
        if (!periodMap[periodKey].nganhData[nganh]) {
            periodMap[periodKey].nganhData[nganh] = { doanhSo: 0, soLuong: 0, chietKhau: 0, doanhThuThuan: 0 };
        }
        periodMap[periodKey].nganhData[nganh].doanhSo += item.doanhSoBan || 0;
        periodMap[periodKey].nganhData[nganh].soLuong += item.soLuong || 0;
        periodMap[periodKey].nganhData[nganh].chietKhau += item.chietKhau || 0;
        periodMap[periodKey].nganhData[nganh].doanhThuThuan += item.doanhThuThuan || 0;
    });

    periodOrder.sort();
    const sortedPeriods = periodOrder.map(k => periodMap[k]);

    return { periods: sortedPeriods, nganhHangs: nganhHangs };
}

function computeChanges(periods, nganhHangs) {
    return periods.map((p, i) => {
        const prev = i > 0 ? periods[i - 1] : null;
        const total = nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].doanhSo : 0), 0);
        const prevTotal = prev
            ? nganhHangs.reduce((sum, n) => sum + (prev.nganhData[n] ? prev.nganhData[n].doanhSo : 0), 0)
            : 0;
        const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
        const totalSL = nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].soLuong : 0), 0);
        return { total, change, isIncrease: change >= 0, totalSL };
    });
}

function changeArrow(change, isIncrease) {
    const arrow = isIncrease ? '<i class="fas fa-arrow-up" style="color: #28a745;"></i>' : '<i class="fas fa-arrow-down" style="color: #dc3545;"></i>';
    const pct = Math.abs(change).toFixed(1);
    const color = isIncrease ? '#28a745' : '#dc3545';
    return `<span style="color: ${color}; font-weight: bold;">${arrow} ${pct}%</span>`;
}

function renderBaoCaoChart(result, params) {
    const ctx = document.getElementById('baoCaoChart').getContext('2d');
    if (baoCaoChartInstance) baoCaoChartInstance.destroy();

    const { periods, nganhHangs } = result;
    const labels = periods.map(p => p.label);
    const changes = computeChanges(periods, nganhHangs);

    let title = 'Báo cáo doanh số';
    if (params.type === 'week') title = 'So sánh doanh số theo tuần - Tháng ' + params.month + '/' + params.year;
    else if (params.type === 'month') title = 'So sánh doanh số theo tháng - Quý ' + params.quarter + '/' + params.year;
    else if (params.type === 'quarter') title = 'So sánh doanh số theo quý - Năm ' + params.year;
    else if (params.type === 'year') title = 'So sánh doanh số theo năm ' + params.fromYear + ' - ' + params.toYear;
    document.getElementById('baoCaoChartTitle').textContent = title;

    const datasets = nganhHangs.map((nganh, idx) => ({
        label: nganh,
        data: periods.map(p => (p.nganhData[nganh] ? p.nganhData[nganh].doanhSo : 0)),
        backgroundColor: BAOCAO_COLORS[idx % BAOCAO_COLORS.length],
        borderRadius: 4
    }));

    datasets.push({
        label: 'Tổng doanh số',
        data: changes.map(c => c.total),
        type: 'line',
        borderColor: '#ff7300',
        backgroundColor: 'rgba(255, 115, 0, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#ff7300',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
        yAxisID: 'y'
    });

    baoCaoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') {
                            if (context.dataIndex === 0) return false;
                            return true;
                        }
                        if (context.dataset.label === 'Tổng số lượng') return false;
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    anchor: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') return 'end';
                        return 'end';
                    },
                    align: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') return 'top';
                        return 'top';
                    },
                    offset: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') return 4;
                        return 2;
                    },
                    formatter: function(value, context) {
                        if (context.dataset.label === 'Tổng doanh số') {
                            const c = changes[context.dataIndex];
                            const arrow = c.isIncrease ? '\u2191' : '\u2193';
                            return `${arrow} ${Math.abs(c.change).toFixed(1)}%`;
                        }
                        return formatMoney(value);
                    },
                    color: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') {
                            return changes[context.dataIndex].isIncrease ? '#28a745' : '#dc3545';
                        }
                        return '#333';
                    },
                    font: function(context) {
                        if (context.dataset.label === 'Tổng doanh số') {
                            return { weight: 'bold', size: 13 };
                        }
                        return { weight: 'bold', size: 10 };
                    }
                },
                legend: {
                    labels: { font: { size: 13 } },
                    position: 'top'
                },
                tooltip: {
                    bodyFont: { size: 13 },
                    titleFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Tổng doanh số') {
                                const c = changes[context.dataIndex];
                                const sign = c.isIncrease ? '+' : '';
                                return 'Tổng: ' + formatMoney(context.raw) + ' (' + sign + c.change.toFixed(1) + '%)';
                            }
                            const nganh = context.dataset.label;
                            const p = periods[context.dataIndex];
                            const info = p.nganhData[nganh];
                            if (info) {
                                return context.dataset.label + ': ' + formatMoney(context.raw) + ' (SL: ' + formatNumber(info.soLuong) + ')';
                            }
                            return context.dataset.label + ': ' + formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: { display: true, text: 'Doanh số bán', font: { size: 12, weight: 'bold' } },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: { size: 11 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderBaoCaoTable(result, params) {
    const { periods, nganhHangs } = result;
    const changes = computeChanges(periods, nganhHangs);
    const totalsByNganh = {};
    let grandTotalDoanhSo = 0;
    let grandTotalSL = 0;

    nganhHangs.forEach(n => {
        totalsByNganh[n] = { doanhSo: 0, soLuong: 0 };
    });

    periods.forEach(p => {
        nganhHangs.forEach(n => {
            const info = p.nganhData[n];
            if (!info) return;
            totalsByNganh[n].doanhSo += info.doanhSo || 0;
            totalsByNganh[n].soLuong += info.soLuong || 0;
        });
        grandTotalDoanhSo += nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].doanhSo : 0), 0);
        grandTotalSL += nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].soLuong : 0), 0);
    });

    let title = 'Báo cáo doanh số';
    if (params.type === 'week') title = 'So sánh doanh số theo tuần - Tháng ' + params.month + '/' + params.year;
    else if (params.type === 'month') title = 'So sánh doanh số theo tháng - Quý ' + params.quarter + '/' + params.year;
    else if (params.type === 'quarter') title = 'So sánh doanh số theo quý - Năm ' + params.year;
    else if (params.type === 'year') title = 'So sánh doanh số theo năm ' + params.fromYear + ' - ' + params.toYear;

    let html = `
        <h3><i class="fas fa-table"></i> ${title}</h3>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th rowspan="2">Kỳ</th>
                        <th rowspan="2">Tăng/Giảm</th>
                        ${nganhHangs.map(n => `<th colspan="2" style="text-align: center;">${n}</th>`).join('')}
                        <th colspan="2" style="text-align: center;">Tổng cộng</th>
                    </tr>
                    <tr>
                        ${nganhHangs.map(() => '<th>Doanh số</th><th>SL</th>').join('')}
                        <th>Doanh số</th><th>SL</th>
                    </tr>
                </thead>
                <tbody>
    `;

    periods.forEach((p, i) => {
        const total = nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].doanhSo : 0), 0);
        const totalSL = nganhHangs.reduce((sum, n) => sum + (p.nganhData[n] ? p.nganhData[n].soLuong : 0), 0);
        const c = changes[i];
        html += `<tr><td><strong>${p.label}</strong></td>`;
        if (i === 0) {
            html += `<td style="text-align: center; color: #999;">—</td>`;
        } else {
            html += `<td style="text-align: center;">${changeArrow(c.change, c.isIncrease)}</td>`;
        }
        nganhHangs.forEach(n => {
            const ds = p.nganhData[n] ? p.nganhData[n].doanhSo : 0;
            const sl = p.nganhData[n] ? p.nganhData[n].soLuong : 0;
            html += `<td>${ds > 0 ? formatFullNumber(ds) : '-'}</td>`;
            html += `<td style="text-align: right;">${sl > 0 ? formatNumber(sl) : '-'}</td>`;
        });
        const prevTotal = i > 0 ? changes[i - 1].total : 0;
        html += `<td><strong>${formatFullNumber(total)}</strong>`;
        if (i > 0 && prevTotal > 0) {
            const diff = total - prevTotal;
            const color = diff >= 0 ? '#28a745' : '#dc3545';
            const sign = diff >= 0 ? '+' : '';
            html += `<br><small style="color: ${color}; font-weight: bold;">${sign}${formatFullNumber(diff)}</small>`;
        }
        html += `</td>`;
        html += `<td style="text-align: right;"><strong>${formatNumber(totalSL)}</strong></td></tr>`;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="background: #f8f9fa; font-weight: bold;">
                        <td colspan="2">Tổng cộng</td>
    `;

    nganhHangs.forEach(n => {
        const totals = totalsByNganh[n];
        html += `
                        <td>${totals.doanhSo > 0 ? formatFullNumber(totals.doanhSo) : '-'}</td>
                        <td style="text-align: right;">${totals.soLuong > 0 ? formatNumber(totals.soLuong) : '-'}</td>
        `;
    });

    html += `
                        <td>${grandTotalDoanhSo > 0 ? formatFullNumber(grandTotalDoanhSo) : '-'}</td>
                        <td style="text-align: right;">${grandTotalSL > 0 ? formatNumber(grandTotalSL) : '-'}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    document.getElementById('baoCaoTable').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('baoCaoType')) {
        onBaoCaoTypeChange();
    }
});
