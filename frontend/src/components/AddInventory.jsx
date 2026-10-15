import { useState } from 'react'
import api from '../services/api'

function AddInventory({ onInventoryAdded }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    location: '',
    description: '',
    business: '',
  })

  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const closeModal = () => {
    setIsOpen(false)
    setMessage('')
    setIsError(false)
    setIsSubmitting(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    const parsedQty = Number(formData.quantity)
    if (!formData.name.trim()) {
      setIsError(true)
      setMessage('Name required.')
      return
    }
    if (!formData.category.trim()) {
      setIsError(true)
      setMessage('Category required.')
      return
    }
    if (!formData.quantity || isNaN(parsedQty) || parsedQty <= 0) {
      setIsError(true)
      setMessage('Quantity must be greater than zero.')
      return
    }
    if (!formData.location.trim()) {
      setIsError(true)
      setMessage('Location required.')
      return
    }
    if (!formData.business.trim()) {
      setIsError(true)
      setMessage('Business name required.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.addInventory({
        name: formData.name.trim(),
        category: formData.category.trim(),
        quantity: parsedQty,
        location: formData.location.trim(),
        description: formData.description.trim(),
        business: formData.business.trim(),
        status: 'Available',
      })

      setMessage('Item listed.')
      setIsError(false)

      setFormData({
        name: '',
        category: '',
        quantity: '',
        location: '',
        description: '',
        business: '',
      })

      if (onInventoryAdded) {
        onInventoryAdded()
      }

      setTimeout(() => {
        closeModal()
      }, 800)
    } catch (error) {
      setIsError(true)
      setMessage(error.message || 'Error adding inventory.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="add-inventory-trigger">
        <button
          className="add-inventory-btn"
          onClick={() => setIsOpen(true)}
        >
          Add Item
        </button>
      </div>

      {isOpen && (
        <div className="add-inventory-overlay" onClick={closeModal}>
          <div
            className="add-inventory-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="add-inventory-close"
              onClick={closeModal}
            >
              ×
            </button>

            <div className="add-inventory-title">
              <h2>Add Inventory</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label>Item Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Item name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Packaging, Hardware..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Units"
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City / Warehouse"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Business Name</label>
                <input
                  type="text"
                  name="business"
                  value={formData.business}
                  onChange={handleChange}
                  placeholder="Company name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group full-width">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Specifications or condition"
                  rows="2"
                  disabled={isSubmitting}
                ></textarea>
              </div>

              {message && (
                <div
                  className={`add-inventory-message ${
                    isError ? 'message-error' : 'message-success'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AddInventory