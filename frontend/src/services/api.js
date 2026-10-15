/**
 * StockShare Shared API Utility
 * Uses relative URLs to work seamlessly with Vite dev proxy and Nginx production reverse proxy.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function handleResponse(response) {
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const errorMessage =
      (isJson && data && data.message) ||
      (typeof data === 'string' && data) ||
      `HTTP Error ${response.status}: ${response.statusText}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  // Health & Monitoring
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`)
    return handleResponse(res)
  },

  // Dashboard Metrics & Summary
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/api/dashboard/summary`)
    return handleResponse(res)
  },

  // Inventory APIs
  async getInventory() {
    const res = await fetch(`${API_BASE}/api/inventory`)
    return handleResponse(res)
  },

  async addInventory(item) {
    const res = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    return handleResponse(res)
  },

  async updateInventoryQuantity(id, quantity) {
    const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    return handleResponse(res)
  },

  async deleteInventory(id) {
    const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(res)
  },

  // Request APIs
  async getRequests() {
    const res = await fetch(`${API_BASE}/api/requests`)
    return handleResponse(res)
  },

  async getMyRequests(business) {
    const query = encodeURIComponent(business.trim())
    const res = await fetch(`${API_BASE}/api/requests/my?business=${query}`)
    return handleResponse(res)
  },

  async createRequest(payload) {
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  async updateRequestStatus(id, status) {
    const res = await fetch(`${API_BASE}/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return handleResponse(res)
  },
}

export default api
