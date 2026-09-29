import { Link } from 'react-router-dom'
function Hero() {
    return (
        <section className = "hero">
            <div className = "hero-content">
                <p className = "hero-label">B2B EXCESS INVERTORY EXCHANGE</p>
                <h1>Give unused inventory a second life.</h1>

                <p className = "hero-description">
                    Connect businesses with excess inventory to businesses that need it.
                    Reduce waste, recover value, and make better use of existing stock.
                </p>

                <Link to="/inventory" className="hero-button">Explore Inventory</Link>
            </div>
        </section>
    )
}


export default Hero