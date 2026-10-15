import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadSummary = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDashboardSummary()
      setSummary(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.message || 'Unable to connect to backend service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    api.getDashboardSummary()
      .then((data) => {
        if (!ignore) {
          setSummary(data)
          setLastUpdated(new Date().toLocaleTimeString())
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Unable to connect to backend service')
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="dashboard-page">
      <section className="dashboard-section">
        <div className="dashboard-header-bar">
          <div>
            <h2>Dashboard</h2>
          </div>

          <div className="dashboard-actions-bar">
            {lastUpdated && (
              <span className="last-sync-text">{lastUpdated}</span>
            )}
            <button
              className="refresh-button"
              onClick={loadSummary}
              disabled={loading}
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="dashboard-error-banner">
            <div>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
            <button className="retry-btn" onClick={loadSummary}>
              Retry
            </button>
          </div>
        )}

        {loading && !summary ? (
          <div className="dashboard-loading-skeleton">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        ) : summary ? (
          <>
            {/* KPI Summary Cards */}
            <div className="kpi-grid">
              <Link to="/inventory" className="kpi-card-link">
                <div className="kpi-card">
                  <span className="kpi-label">ITEMS</span>
                  <div className="kpi-value">{summary.totalInventoryItems}</div>
                </div>
              </Link>

              <div className="kpi-card highlight">
                <span className="kpi-label">TOTAL UNITS</span>
                <div className="kpi-value">
                  {Number(summary.totalAvailableUnits).toLocaleString()}
                </div>
              </div>

              <Link to="/incoming-requests" className="kpi-card-link">
                <div className="kpi-card pending">
                  <span className="kpi-label">PENDING</span>
                  <div className="kpi-value">{summary.pendingRequests}</div>
                </div>
              </Link>

              <div className="kpi-card approved">
                <span className="kpi-label">APPROVED</span>
                <div className="kpi-value">{summary.approvedRequests}</div>
              </div>

              <div className="kpi-card rejected">
                <span className="kpi-label">REJECTED</span>
                <div className="kpi-value">{summary.rejectedRequests}</div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="dashboard-panel full-width">
              <div className="panel-header">
                <h3>Stock by Category</h3>
                <span className="panel-badge">
                  {summary.categoryBreakdown.length}
                </span>
              </div>
              {summary.categoryBreakdown.length === 0 ? (
                <p className="empty-panel-text">No data</p>
              ) : (
                <div className="category-bars-list">
                  {summary.categoryBreakdown.map((cat) => {
                    const maxUnits = Math.max(
                      ...summary.categoryBreakdown.map((c) => c.total_units),
                      1
                    )
                    const pct = Math.round((cat.total_units / maxUnits) * 100)
                    return (
                      <div className="category-row" key={cat.category}>
                        <div className="category-info">
                          <span className="cat-name">{cat.category}</span>
                          <span className="cat-stats">
                            {cat.count} items / <strong>{cat.total_units.toLocaleString()} units</strong>
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity Table */}
            <div className="dashboard-panel full-width">
              <div className="panel-header">
                <div>
                  <h3>Recent Activity</h3>
                </div>
                <Link to="/incoming-requests" className="view-all-link">
                  View all
                </Link>
              </div>

              {summary.recentRequests.length === 0 ? (
                <div className="empty-panel-box">
                  <p>No activity recorded</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Requester</th>
                        <th>Owner</th>
                        <th>Units</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentRequests.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <strong>{req.inventory_name}</strong>
                          </td>
                          <td>{req.requester_business || '—'}</td>
                          <td>{req.owner_business || '—'}</td>
                          <td>{req.quantity}</td>
                          <td>
                            <span
                              className={`status-pill ${req.status.toLowerCase()}`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="text-muted">
                            {req.created_at ? req.created_at.slice(0, 16) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

export default Dashboard
