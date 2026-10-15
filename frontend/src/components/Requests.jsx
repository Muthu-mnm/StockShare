import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'

function Requests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [filterTab, setFilterTab] = useState('Pending')
  const [processingId, setProcessingId] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await api.getRequests()
      setRequests(data)
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    api.getRequests()
      .then((data) => {
        if (!ignore) {
          setRequests(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMessage(err.message || 'Unable to load incoming requests.')
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const updateRequest = async (id, status) => {
    setErrorMessage('')
    setSuccessMessage('')
    setProcessingId(id)

    try {
      await api.updateRequestStatus(id, status)
      setSuccessMessage(`Request #${id} marked as ${status}.`)
      await fetchRequests()
    } catch (error) {
      setErrorMessage(error.message || 'Action failed.')
    } finally {
      setProcessingId(null)
    }
  }

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === 'Pending').length,
      approved: requests.filter((r) => r.status === 'Approved').length,
      rejected: requests.filter((r) => r.status === 'Rejected').length,
      all: requests.length,
    }
  }, [requests])

  const filteredRequests = useMemo(() => {
    if (filterTab === 'ALL') return requests
    return requests.filter((r) => r.status === filterTab)
  }, [requests, filterTab])

  return (
    <section className="requests">
      <div className="requests-header">
        <h2>Incoming Requests</h2>
      </div>

      {/* Filter Tabs */}
      <div className="requests-tabs-bar">
        <button
          className={`tab-btn ${filterTab === 'Pending' ? 'active' : ''}`}
          onClick={() => setFilterTab('Pending')}
        >
          Pending <span className="tab-badge warning">{counts.pending}</span>
        </button>
        <button
          className={`tab-btn ${filterTab === 'Approved' ? 'active' : ''}`}
          onClick={() => setFilterTab('Approved')}
        >
          Approved <span className="tab-badge success">{counts.approved}</span>
        </button>
        <button
          className={`tab-btn ${filterTab === 'Rejected' ? 'active' : ''}`}
          onClick={() => setFilterTab('Rejected')}
        >
          Rejected <span className="tab-badge danger">{counts.rejected}</span>
        </button>
        <button
          className={`tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterTab('ALL')}
        >
          All <span className="tab-badge">{counts.all}</span>
        </button>
      </div>

      {successMessage && (
        <div className="custom-alert success-alert">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {errorMessage && (
        <div className="request-error">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="requests-loading-state">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="no-requests">
              <h3>No {filterTab.toLowerCase()} requests</h3>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div className="request-card" key={request.id}>
                <div className="request-card-header">
                  <div>
                    <span className="request-card-id">#{request.id}</span>
                    <h3>{request.inventory_name}</h3>
                  </div>

                  <span className={`request-status ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
                  <div>
                    <strong>Requester</strong>
                    <p className="highlight-text">{request.requester_business || '—'}</p>
                  </div>
                  <div>
                    <strong>Owner</strong>
                    <p>{request.owner_business || '—'}</p>
                  </div>
                  <div>
                    <strong>Units</strong>
                    <p className="units-count">{request.quantity}</p>
                  </div>
                  <div>
                    <strong>Date</strong>
                    <p>{request.created_at ? request.created_at.slice(0, 16) : '—'}</p>
                  </div>
                </div>

                {request.message && (
                  <div className="request-message">
                    <p>{request.message}</p>
                  </div>
                )}

                {request.status === 'Pending' ? (
                  <div className="request-actions">
                    <button
                      className="approve-button"
                      disabled={processingId === request.id}
                      onClick={() => updateRequest(request.id, 'Approved')}
                    >
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                      className="reject-button"
                      disabled={processingId === request.id}
                      onClick={() => updateRequest(request.id, 'Rejected')}
                    >
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <div className="processed-status-indicator">
                    <span>{request.status}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default Requests