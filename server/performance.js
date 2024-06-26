const express = require("express");
const router = express.Router();
const pool = require("./db");
const moment = require("moment");

router.get("/getOverallRunTime", async (req, res) => {
	try {
		const { startTime, endTime, machineId } = req.query;

		// 	let query = `SELECT SUM(duration_minutes) AS overall_run_time
		//     FROM machine_status
		//     WHERE machine_status = 3
		//       AND status_start_time >= $1
		//       AND status_end_time <= $2
		// ${machineId ? "AND machine_id = $3" : ""}
		//   `;
		let query = `
	SELECT AVG(overall_run_times) AS overall_run_time
	FROM (
	  SELECT machine_id, SUM(duration_minutes) AS overall_run_times
	  FROM machine_status
	  WHERE machine_status = 3
		AND status_start_time >= $1
		AND status_end_time <= $2
		${machineId ? "AND machine_id = $3" : ""} -- Conditionally filter by machine ID
	  GROUP BY machine_id
	) AS machine_runtimes
  `;
		let values = [startTime, endTime];
		if (machineId) {
			values.push(machineId);
		}
		const { rows } = await pool.query(query, values);
		res.json({
			overall_run_time: Math.round(rows[0].overall_run_time),
		});
	} catch (error) {
		console.error("Error executing PostgreSQL query:", error);
		res.status(500).json({ error: "An internal server error occurred" });
	}
});

router.get("/getOverallPerformance", async (req, res) => {
	try {
		const { startTime, endTime, machineId } = req.query;
		// 	const query = `SELECT AVG(performance) AS overall_performance
		//     FROM oee_calculated
		//     WHERE timestamp >= $1::date
		//       AND timestamp <= $2::date
		//       AND machine_id = $3;
		//   `;
		let query = `SELECT AVG(daily_performance) AS overall_performance
		FROM (
		SELECT DATE(timestamp) AS date,
				AVG(performance) AS daily_performance
		FROM oee_calculated
		WHERE timestamp >= $1 AND timestamp < $2
		${machineId ? "AND machine_id = $3" : ""}
		GROUP BY DATE(timestamp)
		) AS daily_performance_summary`;

		let values = [startTime, endTime];
		if (machineId) {
			values.push(machineId);
		}
		const { rows } = await pool.query(query, values);

		let overallPerformance = rows[0].overall_performance || 0;
		res.json({
			overall_performance: parseFloat(overallPerformance.toFixed(2)),
		});
	} catch (error) {
		console.error("Error executing PostgreSQL query:", error);
		res.status(500).json({ error: "An internal server error occurred" });
	}
});

router.get("/performanceBarChart", async (req, res) => {
	try {
		const { startTime, endTime, machineId } = req.query;

		let query = `
				SELECT timestamp,
					AVG(performance) AS performance
				FROM oee_calculated
				WHERE timestamp >= $1 AND timestamp < $2
				${machineId ? "AND machine_id = $3" : ""}
				GROUP BY timestamp
				ORDER BY timestamp ASC
				`;
		let values = [startTime, endTime];
		if (machineId) {
			values.push(machineId);
		}
		const { rows } = await pool.query(query, values);

		res.json(rows);
	} catch (error) {
		console.error("Error executing query:", error);
		res.status(500).json({ error: "An internal server error occurred" });
	}
});

router.get("/performanceDoughnutChart", async (req, res) => {
	try {
		const { startTime, endTime, machineId } = req.query;
		let query = `SELECT AVG(daily_performance) AS performance
			FROM (
			SELECT DATE(timestamp) AS date,
					AVG(performance) AS daily_performance
			FROM oee_calculated
			WHERE timestamp >= $1 AND timestamp < $2
			${machineId ? "AND machine_id = $3" : ""}
			GROUP BY DATE(timestamp)
			) AS daily_performance_summary`;
		let values = [startTime, endTime];
		if (machineId) {
			values.push(machineId);
		}
		const { rows } = await pool.query(query, values);

		if (rows.length === 0 || rows[0].performance === null) {
			return res.json(rows[0]);
		}

		let overallPerformance = rows[0].performance || 0;
		let label = machineId ? machineId : "All Machine";
		res.json({
			machine_id: label,
			performance: parseFloat(overallPerformance.toFixed(2)),
		});
	} catch (error) {
		console.error("Error executing query:", error);
		res.status(500).json({ error: "An internal server error occurred" });
	}
});

router.get("/performanceSummary", async (req, res) => {
	try {
		// less target
		const { startTime, endTime, machineId } = req.query;
		const parameter = [startTime, endTime, machineId];
		const startDateWithTZ = moment(
			`${startTime}`,
			"YYYY-MM-DD HH:mm:ss.SSSSSS+08"
		);
		const endDateWithTZ = moment(
			`${endTime}`,
			"YYYY-MM-DD HH:mm:ss.SSSSSS+08"
		);
		const result = await pool.query(
			`
			SELECT o.machine_id, MAX(o.timestamp) as timestamp,
			SUM (ma.output_qty/ma.duration_minutes) AS cycle_time,
			SUM (ma.output_qty) AS sum_output_qty,
			SUM (CASE WHEN ma.machine_status = '3' THEN ma.duration_minutes END) AS run_time,
			AVG (o.performance) as performance
			FROM oee_calculated o
			LEFT JOIN machine_status ma
			ON o.machine_id = ma.machine_id
			WHERE 	
				ma.status_start_time >= $1 
				AND ma.status_end_time <= $2
				${machineId ? "AND o.machine_id = $3" : ""}
			GROUP BY o.machine_id, DATE_TRUNC('day', ma.status_start_time)
			`,
			machineId ? parameter : [startDateWithTZ, endDateWithTZ]
		);

		const targetOutputMap = {};
		for (let row of result.rows) {
			const { machine_id } = row;

			// Check if target output for this machine ID already exists in the map
			if (!targetOutputMap[machine_id]) {
				// Retrieve the target output for this machine ID
				const targetOutput = await getOverallTargetOutput(
					startTime,
					endTime,
					machine_id
				);

				// Store the target output in the map
				targetOutputMap[machine_id] = targetOutput;
			}

			// Append the target output to the current row
			row.target = targetOutputMap[machine_id];
		}

		res.json(result.rows);
	} catch (error) {
		console.error("Error executing query:", error);
		res.status(500).json({ error: "An internal server error occurred" });
	}
});

// get overall taget and output
router.get("/getOverallTargetOutput", async (req, res) => {
	try {
		const machineId = req.query.machineId;
		const startDate = req.query.startDate;
		const endDate = req.query.endDate;

		const result = await getOverallTargetOutput(
			startDate,
			endDate,
			machineId
		);
		res.json({
			target: result.target,
			current: result.current,
			uphPercentageAverage: result.uphPercentageAverage,
		});
	} catch (err) {
		console.error("Error executing query:", err.message);
		res.status(500).send("Server Error");
	}
});
const getOverallTargetOutput = async (startDate, endDate, machineId) => {
	const defaultValuesQuery = `SELECT operating_hours_start, operating_hours_end FROM default_values`;
	const defaultValuesResult = await pool.query(defaultValuesQuery);
	const operatingHoursStart =
		defaultValuesResult.rows[0].operating_hours_start;
	const operatingHoursEnd = defaultValuesResult.rows[0].operating_hours_end;

	const today = moment().subtract(1, "days").format("YYYY-MM-DD");
	const operatingHoursStartTime = moment(
		`${today} ${operatingHoursStart}`,
		"YYYY-MM-DD HH:mm:ss"
	);
	const operatingHoursEndTime = moment(
		`${today} ${operatingHoursEnd}`,
		"YYYY-MM-DD HH:mm:ss"
	);
	const startDateQuery = moment(
		`${startDate} ${operatingHoursStart}`,
		"YYYY-MM-DD HH:mm:ss"
	);
	const endDateQuery = moment(
		`${endDate} ${operatingHoursEnd}`,
		"YYYY-MM-DD HH:mm:ss"
	);
	console.log(startDate);

	// Get list of jobs planned for the day (for all machines)
	let plannedJobsQuery = `
	SELECT job_order.* 
	FROM job_order
	JOIN oee_metrics ON job_order.job_order_no = oee_metrics.job_order_no
	WHERE 
	job_order.job_start_time BETWEEN $1 AND $2
	AND job_order.job_completion_status = false
	`;

	let queryParams = [
		startDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
		endDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
	];
	if (machineId) {
		plannedJobsQuery += ` AND oee_metrics.machine_id = $3`;
		queryParams.push(machineId);
	}
	let plannedJobsResult = await pool.query(plannedJobsQuery, queryParams);

	// Initialize planned UPH categories
	let plannedUph1 = 0;
	let plannedUph2 = 0;
	let plannedUph3 = 0;
	let plannedUph4 = 0;

	// Process each job
	for (let job of plannedJobsResult.rows) {
		const jobStartTime = moment(job.job_start_time, "YYYY-MM-DD HH:mm:ss");
		const jobEndTime = jobStartTime
			.clone()
			.add(job.planned_duration_hrs, "hours");
		// console.log(
		// 	"Job Start Time: ",
		// 	jobStartTime.format("YYYY-MM-DD HH:mm:ss")
		// );
		// console.log(
		// 	"Job End Time: ",
		// 	jobEndTime.format("YYYY-MM-DD HH:mm:ss")
		// );

		// Job running for multiple days starting from today
		if (
			jobEndTime.isSameOrAfter(operatingHoursEndTime) &&
			jobStartTime.isSameOrAfter(operatingHoursStartTime)
		) {
			plannedUph1 += job.planned_uph;
			console.log("plannedUph1: ", plannedUph1);
		}
		// Job running for multiple days that started but not completing today
		if (
			jobEndTime.isSameOrAfter(operatingHoursEndTime) &&
			jobStartTime.isBefore(operatingHoursStartTime)
		) {
			plannedUph2 += job.planned_uph;
			console.log("plannedUph2: ", plannedUph2);
		}
		// Job running for multiple days that started and completing today
		if (
			jobEndTime.isSameOrBefore(operatingHoursEndTime) &&
			jobStartTime.isBefore(operatingHoursStartTime)
		) {
			plannedUph3 += job.planned_uph;
			console.log("plannedUph3: ", plannedUph3);
		}
		// Job starting and completing within today's operating hours
		if (
			jobStartTime.isSameOrAfter(operatingHoursStartTime) &&
			jobStartTime.isSameOrBefore(operatingHoursEndTime) &&
			job.job_completion_status
		) {
			plannedUph4 += job.planned_uph;
			console.log("plannedUph4: ", plannedUph4);
		}
	}

	const overallUph = plannedUph1 + plannedUph2 + plannedUph3 + plannedUph4;

	// Calculate current UPH
	let maxOutputQuery = `
		SELECT MAX(total_output_qty) AS max_output
		FROM oee_metrics 
		WHERE timestamp <= $1
	`;
	let minOutputQuery = `
		SELECT MIN(total_output_qty) AS min_output
		FROM oee_metrics 
		WHERE timestamp >= $1
	`;
	let parameterMaxOutputQuery = [
		endDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
	];
	let parameterMinOutputQuery = [
		startDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
	];
	if (machineId) {
		maxOutputQuery += ` AND machine_id = $2`;
		parameterMaxOutputQuery.push(machineId);
		minOutputQuery += ` AND machine_id = $2`;
		parameterMinOutputQuery.push(machineId);
	}

	const maxOutputResult = await pool.query(
		maxOutputQuery,
		parameterMaxOutputQuery
	);
	const minOutputResult = await pool.query(
		minOutputQuery,
		parameterMinOutputQuery
	);

	const x =
		maxOutputResult.rows[0].max_output - minOutputResult.rows[0].min_output;

	let machineStatusQuery = `
		SELECT SUM(duration_minutes) AS total_duration 
		FROM machine_status 
		WHERE machine_status = 3 
		AND status_start_time >= $1
		AND status_end_time <= $2
	`;
	let parameterMachineStatusQuery = [
		startDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
		endDateQuery.format("YYYY-MM-DD HH:mm:ss.SSSSSS+08"),
	];
	if (machineId) {
		machineStatusQuery += `AND machine_id = $3`;
		parameterMachineStatusQuery.push(machineId);
	}
	const machineStatusResult = await pool.query(
		machineStatusQuery,
		parameterMachineStatusQuery
	);
	const y = machineStatusResult.rows[0].total_duration / 60;

	const currentUph = Math.round(x / y);
	const uphPercentage = Math.round((currentUph / overallUph) * 100);
	console.log(x, y);
	return {
		target: overallUph,
		current: currentUph,
		uphPercentageAverage: uphPercentage,
	};
};
module.exports = router;
