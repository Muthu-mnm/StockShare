import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'
import AddInventory from './AddInventory'

function Inventory() {
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeModal, setActiveModal] = useState(null)

  // Request State
  const [requestQuantity, setRequestQuantity] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requesterBusiness, setRequesterBusiness] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // Update State
  const [updateQuantity, setUpdateQuantity] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchInventory = async () => {
    setLoading(true)
    setFetchError('')
    try {
      const data = await api.getInventory()
      setInventoryData(data)
    } catch (err) {
      setFetchError(err.message || 'Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    api.getInventory()
      .then((data) => {
        if (!ignore) {
          setInventoryData(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setFetchError(err.message || 'Unable to connect to server')
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set(inventoryData.map((item) => item.category).filter(Boolean))
    return Array.from(set).sort()
  }, [inventoryData])

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.business && item.business.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'Available' && item.quantity > 0 && item.status !== 'Unavailable') ||
        (selectedStatus === 'Unavailable' && (item.quantity === 0 || item.status === 'Unavailable'))

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [inventoryData, searchTerm, selectedCategory, selectedStatus])

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
    setIsSubmittingRequest(false)
    setIsUpdating(false)
    setIsDeleting(false)
  }

  const submitRequest = async () => {
    const quantity = Number(requestQuantity)

    if (!requesterBusiness.trim()) {
      setAlertMessage('Enter your business name.')
      return
    }

    if (!requestQuantity || isNaN(quantity) || quantity <= 0) {
      setAlertMessage('Enter a valid quantity.')
      return
    }

    if (quantity > selectedItem.quantity) {
      setAlertMessage(`Max available: ${selectedItem.quantity} units.`)
      return
    }

    setIsSubmittingRequest(true)
    try {
      await api.createRequest({
        inventory_id: selectedItem.id,
        requester_business: requesterBusiness.trim(),
        quantity: quantity,
        message: requestMessage.trim(),
      })

      setRequestSubmitted(true)
    } catch (error) {
      setAlertMessage(error.message || 'Request failed.')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const updateInventory = async () => {
    const quantity = Number(updateQuantity)

    if (updateQuantity === '' || isNaN(quantity) || quantity < 0) {
      setUpdateMessage('Enter a valid quantity.')
      return
    }

    setIsUpdating(true)
    try {
      await api.updateInventoryQuantity(selectedItem.id, quantity)
      closeModal()
      fetchInventory()
    } catch (error) {
      setUpdateMessage(error.message || 'Update failed.')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteInventory = async () => {
    setIsDeleting(true)
    try {
      await api.deleteInventory(selectedItem.id)
      closeModal()
      fetchInventory()
    } catch (error) {
      setAlertMessage(error.message || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="inventory" id="inventory">
      <div className="inventory-header">
        <h2>Inventory</h2>
      </div>

      <div className="inventory-controls-container">
        <div className="inventory-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search items, business, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-dropdowns">
            <div className="select-wrapper">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        <AddInventory onInventoryAdded={fetchInventory} />
      </div>

      {fetchError && (
        <div className="inventory-error-banner">
          <span>{fetchError}</span>
          <button onClick={fetchInventory} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="inventory-loading-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="empty-inventory-state">
          <h3>No items found</h3>
          {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('ALL')
                setSelectedStatus('ALL')
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredInventory.map((item) => {
            const isOutOfStock = item.quantity === 0 || item.status === 'Unavailable'
            return (
              <div
                className={`inventory-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                key={item.id}
              >
                <div className="card-top-row">
                  <span className="category-tag">{item.category}</span>
                  <button
                    className="delete-icon-button"
                    onClick={() => openModal(item, 'delete')}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>

                <h3>{item.name}</h3>

                <div className="card-meta">
                  <div className="meta-row">
                    <span className="meta-label">Quantity</span>
                    <strong className={isOutOfStock ? 'qty-zero' : 'qty-available'}>
                      {item.quantity} units
                    </strong>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Location</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Business</span>
                    <span className="business-tag">{item.business}</span>
                  </div>
                </div>

                <div className="stock-status-badge">
                  <span
                    className={`status-indicator ${
                      isOutOfStock ? 'status-unavailable' : 'status-available'
                    }`}
                  ></span>
                  {isOutOfStock ? 'Unavailable' : 'Available'}
                </div>

                <div className="inventory-actions">
                  <button
                    className="details-btn"
                    onClick={() => openModal(item, 'details')}
                  >
                    Details
                  </button>

                  <button
                    className="request-btn"
                    disabled={isOutOfStock}
                    onClick={() => openModal(item, 'request')}
                  >
                    Request
                  </button>
                </div>

                <button
                  className="update-inventory-button"
                  onClick={() => openModal(item, 'update')}
                >
                  Edit
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAILS MODAL */}
      {activeModal === 'details' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="inventory-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <span className="modal-category">{selectedItem.category}</span>
            <h3>{selectedItem.name}</h3>

            <div className="inventory-info">
              <div>
                <strong>Quantity</strong>
                <p>{selectedItem.quantity} units</p>
              </div>

              <div>
                <strong>Location</strong>
                <p>{selectedItem.location}</p>
              </div>

              <div>
                <strong>Status</strong>
                <p>{selectedItem.quantity === 0 ? 'Unavailable' : selectedItem.status}</p>
              </div>

              <div>
                <strong>Listed By</strong>
                <p>{selectedItem.business}</p>
              </div>
            </div>

            {selectedItem.description && (
              <div className="inventory-description">
                <strong>Description</strong>
                <p>{selectedItem.description}</p>
              </div>
            )}

            <div className="modal-footer-actions">
              <button
                className="modal-action-btn"
                disabled={selectedItem.quantity === 0}
                onClick={() => openModal(selectedItem, 'request')}
              >
                {selectedItem.quantity === 0 ? 'Out of Stock' : 'Request Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MODAL */}
      {activeModal === 'request' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="inventory-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <span className="modal-category">REQUEST</span>
            <h3>{selectedItem.name}</h3>

            <p className="available-hint">
              {selectedItem.quantity} units available
            </p>

            {alertMessage && (
              <div className="custom-alert">
                <span>{alertMessage}</span>
                <button onClick={() => setAlertMessage('')}>×</button>
              </div>
            )}

            {!requestSubmitted ? (
              <div className="request-form">
                <label>Business Name</label>
                <input
                  type="text"
                  placeholder="Your business name"
                  value={requesterBusiness}
                  onChange={(e) => setRequesterBusiness(e.target.value)}
                  disabled={isSubmittingRequest}
                  required
                />

                <label>Quantity</label>
                <input
                  type="number"
                  placeholder={`Max ${selectedItem.quantity}`}
                  min="1"
                  max={selectedItem.quantity}
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(e.target.value)}
                  disabled={isSubmittingRequest}
                  required
                />

                <label>Message</label>
                <textarea
                  placeholder="Notes or timeline"
                  rows="2"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  disabled={isSubmittingRequest}
                ></textarea>

                <button
                  className="submit-request"
                  onClick={submitRequest}
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            ) : (
              <div className="request-success">
                <h4>Request Submitted</h4>
                <p>
                  Requested {requestQuantity} units of {selectedItem.name}.
                </p>
                <button onClick={closeModal} className="success-close-btn">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {activeModal === 'update' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="inventory-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <span className="modal-category">UPDATE</span>
            <h3>{selectedItem.name}</h3>

            <div className="request-form">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.value)}
                disabled={isUpdating}
              />

              {updateMessage && (
                <div className="custom-alert">
                  <span>{updateMessage}</span>
                  <button onClick={() => setUpdateMessage('')}>×</button>
                </div>
              )}

              <button
                className="submit-request"
                onClick={updateInventory}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {activeModal === 'delete' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="inventory-modal delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <span className="modal-category danger">CONFIRM DELETE</span>
            <h3>{selectedItem.name}</h3>

            <p className="delete-warning-text">
              Delete this inventory listing?
            </p>

            {alertMessage && (
              <div className="custom-alert">
                <span>{alertMessage}</span>
                <button onClick={() => setAlertMessage('')}>×</button>
              </div>
            )}

            <div className="delete-actions">
              <button
                className="cancel-delete"
                onClick={closeModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete"
                onClick={deleteInventory}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Inventory