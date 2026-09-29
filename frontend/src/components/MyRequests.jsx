import { useEffect, useState } from 'react'

function MyRequests() {
  const [businessName] = useState('XYZ Industries')
  const [requests, setRequests] = useState([])
  const [searched, setSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const findRequests = async () => {
    try {
      setErrorMessage('')

      const response = await fetch(
        `http://localhost:5000/api/requests/my?business=${encodeURIComponent(businessName)}`
      )

      if (!response.ok) {
        throw new Error('Failed to load requests')
      }

      const data = await response.json()

      setRequests(data)
      setSearched(true)
    } catch (error) {
      console.error('Unable to load requests:', error)
      setErrorMessage('Unable to load your requests.')
    }
  }

  useEffect(() => {
    findRequests()
  }, [])

  return (
    <section className="my-requests">
      <div className="my-requests-header">
        <p>MY REQUESTS</p>

        <h2>Requests I have sent.</h2>
      </div>

      <div className="current-business">
        <span>Current Business</span>

        <strong>{businessName}</strong>
      </div>

      {errorMessage && (
        <div className="my-request-error">
          <div>
            <strong>Request Error</strong>

            <p>{errorMessage}</p>
          </div>

          <button
            onClick={() => setErrorMessage('')}
          >
            ×
          </button>
        </div>
      )}

      <div className="my-requests-list">
        {!searched ? (
          <div className="no-requests">
            <h3>Loading requests...</h3>

            <p>
              Please wait while your requests are loaded.
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="no-requests">
            <h3>No requests found</h3>

            <p>
              You have not submitted any inventory requests yet.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              className="my-request-card"
              key={request.id}
            >
              <div className="my-request-header">
                <div>
                  <span>MY REQUEST</span>

                  <h3>{request.inventory_name}</h3>
                </div>

                <span
                  className={`request-status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>
              </div>

              <div className="request-details">
                <div>
                  <strong>Requested From</strong>

                  <p>{request.owner_business}</p>
                </div>

                <div>
                  <strong>Quantity</strong>

                  <p>{request.quantity} units</p>
                </div>

                <div>
                  <strong>Requested On</strong>

                  <p>{request.created_at}</p>
                </div>
              </div>

              <div className="request-message">
                <strong>Message</strong>

                <p>
                  {request.message || 'No message provided.'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default MyRequests