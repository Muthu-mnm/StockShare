import { useState } from 'react'

function AddInventory({ onInventoryAdded }) {
  const [isOpen, setIsOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    location: '',
    description: '',
    business: '',
  })

  const [message, setMessage] = useState('')

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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        'http://localhost:5000/api/inventory',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            quantity: Number(formData.quantity),
            status: 'Available',
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setMessage('Inventory added successfully')

        setFormData({
          name: '',
          category: '',
          quantity: '',
          location: '',
          description: '',
          business: '',
        })

        onInventoryAdded()
      } else {
        setMessage(data.message || 'Failed to add inventory')
      }
    } catch (error) {
      setMessage('Unable to connect to server')
    }
  }

  return (
    <>
      <div className="add-inventory-trigger">
        <button onClick={() => setIsOpen(true)}>
          + Add Inventory
        </button>
      </div>

      {isOpen && (
        <div className="add-inventory-overlay">
          <div className="add-inventory-modal">

            <button
              className="add-inventory-close"
              onClick={closeModal}
            >
              ×
            </button>

            <div className="add-inventory-title">
              <span>LIST INVENTORY</span>

              <h2>Add Inventory</h2>

              <p>
                Add your excess inventory for other businesses to discover.
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group full-width">
                <label>Product Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Packaging"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>

                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location"
                  required
                />
              </div>

              <div className="form-group">
                <label>Business Name</label>

                <input
                  type="text"
                  name="business"
                  value={formData.business}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the inventory"
                  rows="4"
                ></textarea>
              </div>

              {message && (
                <div className="add-inventory-message">
                  {message}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-button"
                >
                  Add Inventory
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