import { memo, useEffect } from "react";
import * as echarts from 'echarts';
import "./style.scss";

const DashboardPage = () => {
    useEffect(() => {
    const chartDom = document.getElementById('main-chart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);

    const option = {
        
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['Nhẫn', 'Dây chuyền', 'Bông tai', 'Lắc tay'],
            axisTick: { alignWithLabel: true }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: 'Số lượng bán',
                type: 'bar',
                barWidth: '60%',
                data: [150, 120, 200, 90, 110],
                itemStyle: {
                    color: '#414c62' // màu phù hợp mỹ phẩm
                }
            }
        ]
    };

    myChart.setOption(option);
    myChart.resize();

    window.addEventListener('resize', myChart.resize);

    return () => {
        window.removeEventListener('resize', myChart.resize);
        myChart.dispose();
    };
}, []);


    return (
        <>
            <div className="container">
                <div className="container_admin">
                    <div className="card h-md-100">
                        <div className="card-header pb-0">
                            <h6 className="mb-0 mt-2 d-flex align-items-center">
                                Doanh thu trong tháng
                                <span
                                    className="ml-1 text-400"
                                    data-toggle="tooltip"
                                    data-placement="top"
                                    title="Calculated according to last week's sales"
                                >
                                    <span className="far fa-question-circle" data-fa-transform="shrink-1"></span>
                                </span>
                            </h6>
                        </div>
                        <div className="card-body d-flex align-items-end">
                            <div className="row flex-grow-1">
                                <div className="col">
                                    <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                                        $47K
                                    </div>
                                    <span className="badge badge-pill fs--2 badge-soft-success">+3.5%</span>
                                </div>
                                <div className="col-auto pl-0">
                                    <div className="echart-bar-weekly-sales h-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card h-md-100">
                        <div className="card-header pb-0">
                            <h6 className="mb-0 mt-2 d-flex align-items-center">
                                Tổng số đơn hàng
                                <span
                                    className="ml-1 text-400"
                                    data-toggle="tooltip"
                                    data-placement="top"
                                    title="Calculated according to last week's sales"
                                >
                                    <span className="far fa-question-circle" data-fa-transform="shrink-1"></span>
                                </span>
                            </h6>
                        </div>
                        <div className="card-body d-flex align-items-end">
                            <div className="row flex-grow-1">
                                <div className="col">
                                    <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                                        $47K
                                    </div>
                                    <span className="badge badge-pill fs--2 badge-soft-success">+3.5%</span>
                                </div>
                                <div className="col-auto pl-0">
                                    <div className="echart-bar-weekly-sales h-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card h-md-100">
                        <div className="card-header pb-0">
                            <h6 className="mb-0 mt-2 d-flex align-items-center">
                                Sản phẩm bán chạy
                                <span
                                    className="ml-1 text-400"
                                    data-toggle="tooltip"
                                    data-placement="top"
                                    title="Calculated according to last week's sales"
                                >
                                    <span className="far fa-question-circle" data-fa-transform="shrink-1"></span>
                                </span>
                            </h6>
                        </div>
                        <div className="card-body d-flex align-items-end">
                            <div className="row flex-grow-1">
                                <div className="col">
                                    <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                                        $47K
                                    </div>
                                    <span className="badge badge-pill fs--2 badge-soft-success">+3.5%</span>
                                </div>
                                <div className="col-auto pl-0">
                                    <div className="echart-bar-weekly-sales h-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="chart-row">
                    <div className="chart-container">
                        <h6 className="mb-3">Top 5 sản phẩm bán chạy nhất</h6>
                        <div className="echart-full-width" id="main-chart"></div>
                    </div>
                    <div className="new-customers">
                        <h6 className="mb-3">Khách hàng mới</h6>
                        <ul className="customer-list">
                        {[
                            { name: "Jimmy Denis", desc: "Nhà thiết kế đồ họa", icon: "J" },
                            { name: "Chandra Felix", desc: "Khuyến mãi tận hàng", icon: "C" },
                            { name: "Talha", desc: "Nhà thiết kế giao diện", icon: "T" },
                            { name: "Tchad", desc: "Tổng giám đốc điều hành Zekaf", icon: "T" },
                            { name: "Tiếng Hizia", desc: "Nhà thiết kế web", icon: "H" },
                            { name: "Farrah", desc: "Tập tin", icon: "F" },
                        ].map((user, idx) => (
                            <li key={idx} className="customer-item">
                            <div className="avatar">{user.icon}</div>
                            <div className="info">
                                <div className="name">{user.name}</div>
                                <div className="desc">{user.desc}</div>
                            </div>
                            <div className="actions">
                                <span className="email">✉️</span>
                                <span className="block">🚫</span>
                            </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            </div>
        
        </>
    );
};

export default memo(DashboardPage);
