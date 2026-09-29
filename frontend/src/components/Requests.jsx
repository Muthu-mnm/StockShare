import { useEffect, useState } from 'react'

function Requests() {
  const [requests, setRequests] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const fetchRequests = () => {
    fetch('http://localhost:5000/api/requests')
      .then((response) => response.json())
      .then((data) => {
        setRequests(data)
      })
      .catch(() => {
        setErrorMessage('Unable to load requests.')
      })
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const updateRequest = async (id, status) => {
    setErrorMessage('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Failed to update request.')
        return
      }

      fetchRequests()
    } catch (error) {
      setErrorMessage('Unable to connect to server.')
    }
  }

  const pendingRequests = requests.filter(
    (request) => request.status === 'Pending'
  )

  return (
    <section className="requests">
      <div className="requests-header">
        <p>INVENTORY REQUESTS</p>

        <h2>Manage incoming requests.</h2>
      </div>

      {errorMessage && (
        <div className="request-error">
          <strong>Request Error</strong>
          <p>{errorMessage}</p>

          <button onClick={() => setErrorMessage('')}>
            ×
          </button>
        </div>
      )}

      <div className="requests-list">
        {pendingRequests.length === 0 ? (
          <div className="no-requests">
            <h3>No pending requests</h3>

            <p>
              New inventory requests will appear here.
            </p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div
              className="request-card"
              key={request.id}
            >
              <div className="request-card-header">
                <div>
                  <span>INVENTORY REQUEST</span>

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
                    <strong>Requested By</strong>
                    <p>{request.requester_business}</p>
                </div>
                <div>
                  <strong>Quantity</strong>

                  <p>
                    {request.quantity} units
                  </p>
                </div>

                <div>
                  <strong>Requested On</strong>

                  <p>
                    {request.created_at}
                  </p>
                </div>
              </div>

              <div className="request-message">
                <strong>Message</strong>

                <p>
                  {request.message}
                </p>
              </div>

              <div className="request-actions">
                <button
                  className="approve-button"
                  onClick={() =>
                    updateRequest(
                      request.id,
                      'Approved'
                    )
                  }
                >
                  Approve
                </button>

                <button
                  className="reject-button"
                  onClick={() =>
                    updateRequest(
                      request.id,
                      'Rejected'
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default Requests