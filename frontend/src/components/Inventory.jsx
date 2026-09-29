import { useEffect, useState } from 'react'
import AddInventory from './AddInventory'

function Inventory() {
  const [inventoryData, setInventoryData] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeModal, setActiveModal] = useState(null)

  const [requestQuantity, setRequestQuantity] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requesterBusiness, setRequesterBusiness] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const [updateQuantity, setUpdateQuantity] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')

  const fetchInventory = () => {
    fetch('http://localhost:5000/api/inventory')
      .then((response) => response.json())
      .then((data) => {
        setInventoryData(data)
      })
      .catch(() => {
        console.error('Unable to load inventory')
      })
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const openModal = (item, modalType) => {
    setSelectedItem(item)
    setActiveModal(modalType)
    setAlertMessage('')
    setUpdateMessage('')

    if (modalType === 'update') {
      setUpdateQuantity(item.quantity)
    }
  }

  const closeModal = () => {
    setSelectedItem(null)
    setActiveModal(null)

    setRequestQuantity('')
    setRequestMessage('')
    setRequesterBusiness('')
    setRequestSubmitted(false)
    setAlertMessage('')

    setUpdateQuantity('')
    setUpdateMessage('')
  }

  const submitRequest = async () => {
    const quantity = Number(requestQuantity)

    if (!requestQuantity || quantity <= 0) {
      setAlertMessage('Please enter a valid quantity.')
      return
    }

    if (quantity > selectedItem.quantity) {
      setAlertMessage(
        `Only ${selectedItem.quantity} units are available.`
      )
      return
    }

    if (!requestMessage.trim()) {
      setAlertMessage('Please enter a message.')
      return
    }

    if(!requesterBusiness.trim()){
      setAlertMessage('Please enter your business name.')
      return
    }
    try {
      const response = await fetch(
        'http://localhost:5000/api/requests',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inventory_id: selectedItem.id,
            requester_business: requesterBusiness,
            quantity: quantity,
            message: requestMessage,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setAlertMessage(
          data.message || 'Failed to submit request.'
        )
        return
      }

      setRequestSubmitted(true)
    } catch (error) {
      setAlertMessage('Unable to connect to server.')
    }
  }

  const updateInventory = async () => {
    const quantity = Number(updateQuantity)

    if (updateQuantity === '' || quantity < 0) {
      setUpdateMessage('Please enter a valid quantity.')
      return
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/inventory/${selectedItem.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: quantity,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setUpdateMessage(
          data.message || 'Failed to update inventory.'
        )
        return
      }

      closeModal()
      fetchInventory()
    } catch (error) {
      setUpdateMessage('Unable to connect to server.')
    }
  }

  const deleteInventory = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/inventory/${selectedItem.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setAlertMessage(
          data.message || 'Failed to delete inventory.'
        )
        return
      }

      closeModal()
      fetchInventory()
    } catch (error) {
      setAlertMessage('Unable to connect to server.')
    }
  }

  return (
    <section className="inventory" id="inventory">
      <div className="inventory-header">
        <p>AVAILABLE INVENTORY</p>

        <h2>Find what your business needs.</h2>
      </div>

      <AddInventory onInventoryAdded={fetchInventory} />

      <div className="inventory-grid">
        {inventoryData.map((item) => (
          <div className="inventory-card" key={item.id}>

            <button 
              className="delete-icon-button"
              onClick={() => openModal(item, 'delete')}
              title="Delete Inventory"
            >🗑</button>
            <span>{item.category}</span>

            <h3>{item.name}</h3>

            <p>Quantity: {item.quantity}</p>

            <p>Location: {item.location}</p>

            <div className="inventory-actions">
              <button
                onClick={() => openModal(item, 'details')}
              >
                View Details
              </button>

              <button
                onClick={() => openModal(item, 'request')}
              >
                Request Inventory
              </button>
            </div>

            <button
              className="update-inventory-button"
              onClick={() => openModal(item, 'update')}
            >
              Update Quantity
            </button>

          </div>
        ))}
      </div>

      {/* DETAILS POPUP */}

      {activeModal === 'details' && selectedItem && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <button
              className="modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <span>{selectedItem.category}</span>

            <h3>{selectedItem.name}</h3>

            <div className="inventory-info">
              <div>
                <strong>Available Quantity</strong>
                <p>{selectedItem.quantity} units</p>
              </div>

              <div>
                <strong>Location</strong>
                <p>{selectedItem.location}</p>
              </div>

              <div>
                <strong>Status</strong>
                <p>{selectedItem.status}</p>
              </div>

              <div>
                <strong>Listed By</strong>
                <p>{selectedItem.business}</p>
              </div>
            </div>

            <div className="inventory-description">
              <strong>Description</strong>

              <p>{selectedItem.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST POPUP */}

      {activeModal === 'request' && selectedItem && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <button
              className="modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <span>REQUEST INVENTORY</span>

            <h3>{selectedItem.name}</h3>

            <p>
              Available Quantity: {selectedItem.quantity} units
            </p>

            {alertMessage && (
              <div className="custom-alert">
                <div>
                  <strong>Invalid Request</strong>
                  <p>{alertMessage}</p>
                </div>

                <button
                  onClick={() => setAlertMessage('')}
                >
                  ×
                </button>
              </div>
            )}

            {!requestSubmitted ? (
              <div className="request-form">

                <label>Business Name</label>
                <input 
                  type="text"
                  placeholder="Enter your business name"
                  value={requesterBusiness}
                  onChange={(e) =>
                    setRequesterBusiness(e.target.value)
                  }
                />

                <label>Required Quantity</label>
                
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={requestQuantity}
                  onChange={(e) =>
                    setRequestQuantity(e.target.value)
                  }
                />

                <label>Message</label>

                <textarea
                  placeholder="Write a message to the inventory owner"
                  rows="4"
                  value={requestMessage}
                  onChange={(e) =>
                    setRequestMessage(e.target.value)
                  }
                ></textarea>

                <button
                  className="submit-request"
                  onClick={submitRequest}
                >
                  Submit Request
                </button>
              </div>
            ) : (
              <div className="request-success">
                <h4>Request Submitted Successfully</h4>

                <p>
                  Your request for {selectedItem.name} has
                  been submitted.
                </p>

                <button onClick={closeModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPDATE QUANTITY POPUP */}

      {activeModal === 'update' && selectedItem && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <button
              className="modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <span>UPDATE INVENTORY</span>

            <h3>{selectedItem.name}</h3>

            <div className="request-form">
              <label>Available Quantity</label>

              <input
                type="number"
                min="0"
                value={updateQuantity}
                onChange={(e) =>
                  setUpdateQuantity(e.target.value)
                }
              />

              {updateMessage && (
                <div className="custom-alert">
                  <div>
                    <strong>Update Error</strong>
                    <p>{updateMessage}</p>
                  </div>

                  <button
                    onClick={() => setUpdateMessage('')}
                  >
                    ×
                  </button>
                </div>
              )}

              <button
                className="submit-request"
                onClick={updateInventory}
              >
                Update Quantity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE POPUP */}

      {activeModal === 'delete' && selectedItem && (
        <div className="modal-overlay">
          <div className="inventory-modal delete-modal">
            <button
              className="modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <span>DELETE INVENTORY</span>

            <h3>{selectedItem.name}</h3>

            <p>
              Are you sure you want to delete this inventory?
              This action cannot be undone.
            </p>

            {alertMessage && (
              <div className="custom-alert">
                <div>
                  <strong>Cannot Delete</strong>
                  <p>{alertMessage}</p>
                </div>

                <button
                  onClick={() => setAlertMessage('')}
                >
                  ×
                </button>
              </div>
            )}

            <div className="delete-actions">
              <button
                className="cancel-delete"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="confirm-delete"
                onClick={deleteInventory}
              >
                Delete Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Inventory