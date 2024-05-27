import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
	Col,
	Container,
	Nav,
	NavItem,
	NavLink,
	Progress,
	Row,
	Table,
} from "reactstrap";
import { Bar, Line, Pie, Doughnut, HorizontalBar } from "react-chartjs-2";
import React, { useState } from "react";
import Pagination from "components/Pagination";
import {
	barChartOptions,
	doughnutOptions,
	horizontalBarOptions,
} from "./chartOptions.js";

const Utilization = (props) => {
	// Sample data for the chart
	const barChartData = {
		labels: ["A", "B", "C", "D", "E", "F", "J", "K", "M"],
		datasets: [
			{
				label: "Utilization",
				backgroundColor: "rgba(166,167,247,1)",
				data: [65, 59, 80, 81, 56, 55, 40, 220, 50, 80],
			},
		],
	};

	const doughnutData = {
		datasets: [
			{
				data: [30, 40, 50],
				backgroundColor: ["#051548", "#33FAFF", "#a0a0a0"],
			},
		],
		labels: ["Electronics", "Furniture", "Toys"],
	};

	const sampleData = [
		{
			machine: "Machine 1",
			date: "2024-05-01",
			startTime: "08:00 AM",
			endTime: "04:00 PM",
			runTime: "7 hours",
			downTime: "1 hour",
			breakRest: "0.5 hour",
			utilization: "85%",
		},
		{
			machine: "Machine 1",
			date: "2024-05-01",
			startTime: "08:00 AM",
			endTime: "04:00 PM",
			runTime: "7 hours",
			downTime: "1 hour",
			breakRest: "0.5 hour",
			utilization: "85%",
		},
		{
			machine: "Machine 1",
			date: "2024-05-01",
			startTime: "08:00 AM",
			endTime: "04:00 PM",
			runTime: "7 hours",
			downTime: "1 hour",
			breakRest: "0.5 hour",
			utilization: "85%",
		},
		{
			machine: "Machine 2",
			date: "2024-05-02",
			startTime: "07:30 AM",
			endTime: "03:30 PM",
			runTime: "7 hours",
			downTime: "0.5 hour",
			breakRest: "0.75 hour",
			utilization: "90%",
		},
		{
			machine: "Machine 3",
			date: "2024-05-03",
			startTime: "08:15 AM",
			endTime: "04:15 PM",
			runTime: "7 hours",
			downTime: "0.75 hour",
			breakRest: "0.25 hour",
			utilization: "88%",
		},
		{
			machine: "Machine 4",
			date: "2024-05-04",
			startTime: "07:45 AM",
			endTime: "03:45 PM",
			runTime: "7 hours",
			downTime: "1.5 hour",
			breakRest: "0.5 hour",
			utilization: "82%",
		},
		{
			machine: "Machine 5",
			date: "2024-05-05",
			startTime: "08:30 AM",
			endTime: "04:30 PM",
			runTime: "7 hours",
			downTime: "0.25 hour",
			breakRest: "0.5 hour",
			utilization: "87%",
		},
	];

	const horizontalBarData = {
		labels: [""],
		datasets: [
			{
				label: "Stack 1",
				backgroundColor: "rgba(255, 99, 132, 0.5)",
				data: [20],
				barThickness: 20,
			},
			{
				label: "Stack 2",
				backgroundColor: "rgba(54, 162, 235, 0.5)",
				data: [30],
				barThickness: 20,
			},
			{
				label: "Stack 3",
				backgroundColor: "rgba(75, 192, 192, 0.5)",
				data: [50],
				barThickness: 20,
			},
		],
	};

	const [currentPage, setCurrentPage] = useState(1);
	let pageSize = 4;

	const firstPageIndex = (currentPage - 1) * pageSize;
	const lastPageIndex = firstPageIndex + pageSize;
	const currentTableData = sampleData.slice(firstPageIndex, lastPageIndex);

	return (
		<>
			<div className="header pb-8 pt-5 pt-md-8">
				<Container fluid>
					<div className="fromToDateSelection">
						<div
							className="mb-3 mx-auto p-2"
							style={{
								width: "fit-content",
								backgroundColor: "rgb(225 236 255)",
								borderRadius: "10px",
							}}
						>
							<form className="text-center d-flex align-items-center">
								<label for="fromDate" className="mb-0 mr-2">
									From:{" "}
								</label>
								<input
									type="date"
									id="fromDate"
									className="form-control mr-2 p-1"
									style={{ height: "fit-content" }}
								></input>

								<label for="toDate" className="mb-0 mr-2">
									To:{" "}
								</label>
								<input
									type="date"
									id="toDate"
									className="form-control mr-2 p-1"
									style={{ height: "fit-content" }}
								></input>

								<input
									type="submit"
									value={"go"}
									className="btn btn-primary py-1 px-2"
								/>
							</form>
						</div>
					</div>
					<Row className="mb-4">
						<Col md="8">
							<Card>
								<CardHeader>Utilization Per Day</CardHeader>
								<CardBody>
									<Bar
										data={barChartData}
										options={barChartOptions}
									/>
								</CardBody>
							</Card>
						</Col>
						<Col md="4">
							<Card>
								<CardHeader>Overall Utilization</CardHeader>
								<CardBody>
									<Doughnut
										data={doughnutData}
										options={doughnutOptions}
									/>
								</CardBody>
							</Card>
						</Col>
					</Row>
					<Row className="mb-4">
						<Col>
							<div>
								<Card>
									<CardHeader>Summary</CardHeader>
									<Table
										className="align-items-center table-flush"
										responsive
									>
										<thead>
											<tr className="tableHeader">
												<th scope="col">Machine</th>
												<th scope="col">Date</th>
												<th scope="col">Start Time</th>
												<th scope="col">End Time</th>
												<th scope="col">Run Time</th>
												<th scope="col">DownTime</th>
												<th scope="col">
													Break/Rest(Hr)
												</th>
												<th scope="col">Utilization</th>
											</tr>
										</thead>
										<tbody>
											{currentTableData.map(
												(data, index) => (
													<tr key={index}>
														<td>{data.machine}</td>
														<td>{data.date}</td>
														<td>
															{data.startTime}
														</td>
														<td>{data.endTime}</td>
														<td>{data.runTime}</td>
														<td>{data.downTime}</td>
														<td>
															{data.breakRest}
														</td>
														<td>
															{data.utilization}
														</td>
													</tr>
												)
											)}
										</tbody>
										<tr>
											<td colSpan={8}>
												<div className="pagination d-flex justify-content-center">
													<Pagination
														className="pagination-bar mb-0"
														currentPage={
															currentPage
														}
														totalCount={
															sampleData.length
														}
														pageSize={pageSize}
														onPageChange={(page) =>
															setCurrentPage(page)
														}
													/>
												</div>
											</td>
										</tr>
									</Table>
								</Card>
							</div>
						</Col>
					</Row>
					<Row>
						<Col>
							<div>
								<Card>
									<CardHeader>Machine Status</CardHeader>
									<CardBody>
										<div style={{ height: "100px" }}>
											<HorizontalBar
												data={horizontalBarData}
												options={horizontalBarOptions}
											/>
										</div>
									</CardBody>
								</Card>
							</div>
						</Col>
					</Row>
				</Container>
			</div>
		</>
	);
};

export default Utilization;