import {Link} from 'react-router-dom'

function Navbar() {
    return (
        <nav>
            <h2>
                <Link to="/">StockShare</Link>
            </h2>

            <div>
                <Link to="/">Dashboard</Link>
                <Link to="inventory">Inventory</Link>
                <Link to="/my-requests">My Requests</Link>
                <Link to="/incoming-requests">Incomming Requests</Link>
            </div>
        </nav>
    )
}

export default Navbar