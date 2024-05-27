import Chart from "chart.js";
import classnames from "classnames";
import pflImage from "../assets/img/pfl.png";
import { useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import Pagination from "components/Pagination";
import { barChartOptions, doughnutOptions } from "./chartOptions.js";
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

const Quality = (props) => {
	const barChartData = {
		labels: ["A", "B", "C", "D", "E", "F", "J", "K", "M"],
		datasets: [
			{
				label: "Utilization",
				backgroundColor: "rgba(166,167,247,1)",
				borderWidth: 1,
				hoverBackgroundColor: "rgba(196,187,247,1)",
				data: [65, 59, 80, 81, 56, 55, 40, 20, 50, 80],
			},
		],
	};

	const doughnutData = {
		datasets: [
			{
				data: [30, 40],
				backgroundColor: ["#051548", "#33FAFF", "#a0a0a0"],
			},
		],
		labels: ["Good", "Bad"],
	};

	const sampleData = [
		{
			machine: "A",
			date: "2024-05-12",
			target: 1000,
			output: 950,
			good: 920,
			bad: 30,
			quality: "92%",
		},
		{
			machine: "B",
			date: "2024-05-12",
			target: 1200,
			output: 1150,
			good: 1100,
			bad: 50,
			quality: "95%",
		},
		{
			machine: "C",
			date: "2024-05-12",
			target: 800,
			output: 780,
			good: 750,
			bad: 30,
			quality: "96%",
		},
		{
			machine: "D",
			date: "2024-05-12",
			target: 1500,
			output: 1400,
			good: 1370,
			bad: 30,
			quality: "98%",
		},
		{
			machine: "E",
			date: "2024-05-12",
			target: 1100,
			output: 1000,
			good: 970,
			bad: 30,
			quality: "97%",
		},
	];

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
								<CardHeader>Rejects Pareto Chart</CardHeader>
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
								<CardHeader>Overall Quality</CardHeader>
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
												<th scope="col">Target</th>
												<th scope="col">Output</th>
												<th scope="col">Good</th>
												<th scope="col">Bad</th>
												<th scope="col">Quality</th>
											</tr>
										</thead>
										<tbody>
											{currentTableData.map(
												(data, index) => (
													<tr key={index}>
														<td>{data.machine}</td>
														<td>{data.date}</td>
														<td>{data.target}</td>
														<td>{data.output}</td>
														<td>{data.good}</td>
														<td>{data.bad}</td>
														<td>{data.quality}</td>
													</tr>
												)
											)}
										</tbody>
										<tr>
											<td colSpan={7}>
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
				</Container>
			</div>
		</>
	);
};

export default Quality;