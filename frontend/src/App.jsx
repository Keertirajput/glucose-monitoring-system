import { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [glucose, setGlucose] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [average, setAverage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [timeRange, setTimeRange] = useState("all");

  // --------------------------------------------------
  // FETCH CURRENT GLUCOSE
  // --------------------------------------------------

  const fetchCurrentGlucose = async () => {
    try {
      const response = await fetch(`${API_URL}/glucose`);

      if (!response.ok) {
        throw new Error("Unable to fetch current glucose");
      }

      const data = await response.json();

      if (!data.message) {
        setGlucose(data);
      }
    } catch (err) {
      console.error("Current glucose error:", err);
      setError(err.message);
    }
  };

  // --------------------------------------------------
  // FETCH HISTORY
  // --------------------------------------------------

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/glucose/history`);

      if (!response.ok) {
        throw new Error("Unable to fetch glucose history");
      }

      const data = await response.json();

      setHistory(data);
    } catch (err) {
      console.error("History error:", err);
      setError(err.message);
    }
  };

  // --------------------------------------------------
  // FETCH AVERAGE
  // --------------------------------------------------

  const fetchAverage = async () => {
    try {
      const response = await fetch(`${API_URL}/glucose/average`);

      if (!response.ok) {
        throw new Error("Unable to fetch average glucose");
      }

      const data = await response.json();

      setAverage(data.average);
    } catch (err) {
      console.error("Average error:", err);
    }
  };

  // --------------------------------------------------
  // FETCH ALERTS
  // --------------------------------------------------

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/glucose/alerts`);

      if (!response.ok) {
        throw new Error("Unable to fetch alerts");
      }

      const data = await response.json();

      setAlerts(data);
    } catch (err) {
      console.error("Alerts error:", err);
    }
  };

  // --------------------------------------------------
  // FETCH EVERYTHING
  // --------------------------------------------------

  const fetchAllData = async () => {
    setLoading(true);

    await Promise.all([
      fetchCurrentGlucose(),
      fetchHistory(),
      fetchAverage(),
      fetchAlerts(),
    ]);

    setLastUpdated(new Date());
    setLoading(false);
  };

  // --------------------------------------------------
  // AUTOMATIC REFRESH
  // --------------------------------------------------

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------
  // FILTER HISTORY
  // --------------------------------------------------

  const filteredHistory = useMemo(() => {
    if (timeRange === "all") {
      return history;
    }

    const now = new Date();

    let milliseconds = 0;

    if (timeRange === "24h") {
      milliseconds = 24 * 60 * 60 * 1000;
    }

    if (timeRange === "7d") {
      milliseconds = 7 * 24 * 60 * 60 * 1000;
    }

    if (timeRange === "30d") {
      milliseconds = 30 * 24 * 60 * 60 * 1000;
    }

    return history.filter((reading) => {
      const readingTime = new Date(reading.timestamp);

      return now - readingTime <= milliseconds;
    });
  }, [history, timeRange]);

  // --------------------------------------------------
  // CHART DATA
  // --------------------------------------------------

  const chartData = useMemo(() => {
    return filteredHistory.map((reading) => ({
      id: reading.id,
      glucose: Number(reading.glucose),
      time: new Date(reading.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date(reading.timestamp).toLocaleDateString(),
      status: reading.status,
    }));
  }, [filteredHistory]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const statistics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        min: "--",
        max: "--",
        count: 0,
      };
    }

    const values = filteredHistory.map((item) =>
      Number(item.glucose)
    );

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }, [filteredHistory]);

  // --------------------------------------------------
  // STATUS COLOR
  // --------------------------------------------------

  const getStatusClass = (status) => {
    if (status === "High") return "status-high";
    if (status === "Low") return "status-low";
    return "status-normal";
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (timestamp) => {
    if (!timestamp) return "--";

    return new Date(timestamp).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            ♥
          </div>

          <div>
            <h2>GlucoCare</h2>
            <span>IoT Monitoring</span>
          </div>
        </div>

        <nav className="navigation">

          <a className="nav-item active" href="#dashboard">
            <span>▦</span>
            Dashboard
          </a>

          <a className="nav-item" href="#history">
            <span>◷</span>
            Glucose History
          </a>

          <a className="nav-item" href="#alerts">
            <span>⚠</span>
            Alerts
            {alerts.length > 0 && (
              <span className="notification-count">
                {alerts.length}
              </span>
            )}
          </a>

          <a className="nav-item" href="#device">
            <span>⌁</span>
            Device
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="connection-box">
            <span className="connection-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>Backend connected</small>
            </div>
          </div>

          <div className="version">
            IoT Glucose Monitor
            <br />
            Version 1.0
          </div>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="topbar">

          <div>
            <p className="eyebrow">HEALTH MONITORING</p>

            <h1>Glucose Dashboard</h1>

            <p className="subtitle">
              Real-time glucose monitoring and analytics
            </p>
          </div>

          <div className="topbar-right">

            <div className="live-indicator">
              <span></span>
              LIVE
            </div>

            <button
              className="refresh-button"
              onClick={fetchAllData}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="error-banner">
            <span>⚠</span>

            <div>
              <strong>Connection problem</strong>
              <p>{error}</p>
            </div>

            <button onClick={fetchAllData}>
              Retry
            </button>
          </div>
        )}

        {/* ================= CURRENT STATUS ================= */}

        <section className="hero-grid">

          {/* CURRENT GLUCOSE */}

          <div className="current-card">

            <div className="card-heading">

              <div>
                <p className="card-label">
                  CURRENT GLUCOSE
                </p>

                <h3>Latest Reading</h3>
              </div>

              <div className="pulse-icon">
                ♥
              </div>

            </div>

            {loading && !glucose ? (
              <div className="loading-number">
                Loading...
              </div>
            ) : glucose ? (

              <div className="glucose-value">

                <strong>
                  {Number(glucose.glucose).toFixed(0)}
                </strong>

                <span>{glucose.unit}</span>

              </div>

            ) : (
              <div className="loading-number">
                No data
              </div>
            )}

            {glucose && (
              <div className="current-status-row">

                <span
                  className={`status-badge ${getStatusClass(
                    glucose.status
                  )}`}
                >
                  <span className="status-dot"></span>

                  {glucose.status}
                </span>

                <span className="reading-time">
                  {formatDate(glucose.timestamp)}
                </span>

              </div>
            )}

            <div className="range-bar">

              <div className="range-labels">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>

              <div className="range-track">

                <div className="range-low"></div>
                <div className="range-normal"></div>
                <div className="range-high"></div>

                {glucose && (
                  <div
                    className="range-marker"
                    style={{
                      left: `${Math.min(
                        Math.max(
                          ((Number(glucose.glucose) - 40) /
                            220) *
                            100,
                          2
                        ),
                        98
                      )}%`,
                    }}
                  ></div>
                )}

              </div>

            </div>

          </div>

          {/* QUICK STATS */}

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon">
                ◉
              </div>

              <div>
                <p>Daily Average</p>

                <h3>
                  {average !== null
                    ? `${Number(average).toFixed(0)}`
                    : "--"}
                  <span> mg/dL</span>
                </h3>

                <small>All stored readings</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ↓
              </div>

              <div>
                <p>Minimum</p>

                <h3>
                  {statistics.min}
                  <span> mg/dL</span>
                </h3>

                <small>Selected period</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ↑
              </div>

              <div>
                <p>Maximum</p>

                <h3>
                  {statistics.max}
                  <span> mg/dL</span>
                </h3>

                <small>Selected period</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                #
              </div>

              <div>
                <p>Readings</p>

                <h3>{statistics.count}</h3>

                <small>Stored measurements</small>
              </div>

            </div>

          </div>

        </section>

        {/* ================= CHART ================= */}

        <section
          className="dashboard-panel chart-panel"
          id="history"
        >

          <div className="panel-header">

            <div>
              <p className="panel-label">
                GLUCOSE ANALYTICS
              </p>

              <h2>Glucose Trends</h2>

              <p className="panel-description">
                Track glucose measurements over time
              </p>
            </div>

            <div className="range-buttons">

              <button
                className={timeRange === "24h" ? "selected" : ""}
                onClick={() => setTimeRange("24h")}
              >
                24H
              </button>

              <button
                className={timeRange === "7d" ? "selected" : ""}
                onClick={() => setTimeRange("7d")}
              >
                7D
              </button>

              <button
                className={timeRange === "30d" ? "selected" : ""}
                onClick={() => setTimeRange("30d")}
              >
                30D
              </button>

              <button
                className={timeRange === "all" ? "selected" : ""}
                onClick={() => setTimeRange("all")}
              >
                ALL
              </button>

            </div>

          </div>

          <div className="chart-wrapper">

            {chartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={360}
              >

                <AreaChart data={chartData}>

                  <defs>

                    <linearGradient
                      id="glucoseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="100%"
                        stopOpacity={0.02}
                      />

                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    domain={["auto", "auto"]}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.12)",
                    }}
                    formatter={(value) => [
                      `${value} mg/dL`,
                      "Glucose",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="glucose"
                    strokeWidth={3}
                    fill="url(#glucoseGradient)"
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="glucose"
                    strokeWidth={3}
                    dot={false}
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <div className="empty-chart">

                <div className="empty-icon">
                  ◌
                </div>

                <h3>No glucose data yet</h3>

                <p>
                  Add glucose readings through the backend
                  API to see your trend here.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* ================= LOWER GRID ================= */}

        <section className="lower-grid">

          {/* RECENT READINGS */}

          <div className="dashboard-panel">

            <div className="panel-header compact">

              <div>

                <p className="panel-label">
                  MEASUREMENTS
                </p>

                <h2>Recent Readings</h2>

              </div>

              <span className="record-count">
                {history.length} total
              </span>

            </div>

            <div className="readings-table">

              <div className="table-head">
                <span>TIME</span>
                <span>GLUCOSE</span>
                <span>STATUS</span>
              </div>

              {history.length > 0 ? (

                history
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((reading) => (

                    <div
                      className="table-row"
                      key={reading.id}
                    >

                      <span>
                        {formatDate(
                          reading.timestamp
                        )}
                      </span>

                      <strong>
                        {Number(
                          reading.glucose
                        ).toFixed(0)}
                        <small> mg/dL</small>
                      </strong>

                      <span
                        className={`table-status ${getStatusClass(
                          reading.status
                        )}`}
                      >
                        {reading.status}
                      </span>

                    </div>

                  ))

              ) : (

                <div className="empty-table">
                  No readings available.
                </div>

              )}

            </div>

          </div>

          {/* ALERTS */}

          <div
            className="dashboard-panel"
            id="alerts"
          >

            <div className="panel-header compact">

              <div>

                <p className="panel-label">
                  SAFETY MONITORING
                </p>

                <h2>Alerts</h2>

              </div>

              <div className="alert-count">
                {alerts.length}
              </div>

            </div>

            <div className="alerts-list">

              {alerts.length > 0 ? (

                alerts
                  .slice(0, 6)
                  .map((alert) => (

                    <div
                      className={`alert-item ${getStatusClass(
                        alert.status
                      )}`}
                      key={alert.id}
                    >

                      <div className="alert-icon">
                        ⚠
                      </div>

                      <div className="alert-content">

                        <strong>
                          {alert.message}
                        </strong>

                        <p>
                          Reading:{" "}
                          {alert.glucose} mg/dL
                        </p>

                        <small>
                          {formatDate(
                            alert.timestamp
                          )}
                        </small>

                      </div>

                    </div>

                  ))

              ) : (

                <div className="no-alerts">

                  <div className="success-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      No active alerts
                    </strong>

                    <p>
                      Glucose readings are currently
                      within the configured range.
                    </p>
                  </div>

                </div>

              )}

            </div>

          </div>

        </section>

        {/* ================= DEVICE ================= */}

        <section
          className="device-panel"
          id="device"
        >

          <div className="device-icon">
            ⌁
          </div>

          <div className="device-info">

            <p className="panel-label">
              CONNECTED DEVICE
            </p>

            <h2>Glucose Sensor</h2>

            <p>
              IoT sensor connection is being monitored
              through the FastAPI backend.
            </p>

          </div>

          <div className="device-status">

            <span className="connection-dot"></span>

            <div>
              <strong>Connected</strong>

              <small>
                Last sync:{" "}
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "--"}
              </small>
            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer>

          <span>
            © 2026 GlucoCare IoT Monitoring System
          </span>

          <span>
            Backend: FastAPI • Database: SQLite
          </span>

        </footer>

      </main>

    </div>
  );
}

export default App;