import { NavLink, Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>
          <Link to="/" className="brand-logo">
            <span className="brand-accent">Stock</span>Share
          </Link>
        </h2>
      </div>

      <div className="nav-links">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          end
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Inventory
        </NavLink>
        <NavLink
          to="/my-requests"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          My Requests
        </NavLink>
        <NavLink
          to="/incoming-requests"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Incoming Requests
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar