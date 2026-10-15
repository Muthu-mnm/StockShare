import { useEffect, useState } from 'react'
import api from '../services/api'

function MyRequests() {
  const [businessName, setBusinessName] = useState(() => {
    return localStorage.getItem('stockshare_active_business') || 'XYZ Industries'
  })
  const [inputValue, setInputValue] = useState(() => {
    return localStorage.getItem('stockshare_active_business') || 'XYZ Industries'
  })
  const [requests, setRequests] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false
    const target = businessName.trim()
    if (!target) {
      return
    }

    api.getMyRequests(target)
      .then((data) => {
        if (!ignore) {
          setRequests(data)
          setSearched(true)
          setLoading(false)
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(error.message || 'Unable to load requests.')
          setRequests([])
          setSearched(true)
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [businessName])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setBusinessName(inputValue.trim())
      localStorage.setItem('stockshare_active_business', inputValue.trim())
    }
  }

  const handleQuickSelect = (name) => {
    setInputValue(name)
    setBusinessName(name)
    localStorage.setItem('stockshare_active_business', name)
  }

  return (
    <section className="my-requests">
      <div className="my-requests-header">
        <h2>My Requests</h2>
      </div>

      {/* Concise Business Selector */}
      <div className="business-selector-box">
        <form className="business-input-form" onSubmit={handleSearchSubmit}>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Filter by business name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="search-business-btn"
              disabled={loading || !inputValue.trim()}
            >
              Filter
            </button>
          </div>
        </form>

        <div className="quick-select-pills">
          {['XYZ Industries', 'ABC Manufacturing', 'Chennai Industrial Supplies', 'Test Buyer Ltd'].map(
            (sample) => (
              <button
                type="button"
                key={sample}
                className={`pill-btn ${businessName === sample ? 'selected' : ''}`}
                onClick={() => handleQuickSelect(sample)}
              >
                {sample}
              </button>
            )
          )}
        </div>
      </div>

      <div className="current-business-banner">
        <span>Business: <strong>{businessName}</strong></span>
      </div>

      {errorMessage && (
        <div className="my-request-error">
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
        <div className="my-requests-list">
          {!searched ? (
            <div className="no-requests">
              <p>Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="no-requests full-width">
              <h3>No requests found for &quot;{businessName}&quot;</h3>
            </div>
          ) : (
            requests.map((request) => (
              <div className="my-request-card" key={request.id}>
                <div className="my-request-header">
                  <div>
                    <span className="card-id-tag">#{request.id}</span>
                    <h3>{request.inventory_name}</h3>
                  </div>

                  <span className={`request-status ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
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
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default MyRequests