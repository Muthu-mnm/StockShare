function Features() {
    return (
        <section className = "features">
            <div className = "feature-header">
                <p> How Stock Share Works</p>
                <h2>A simple way to put excess inventory to use.</h2>
            </div>

            <div className = "feature-grid">
                <div className = "feature-card">
                    <span>01</span>
                    <h3>List Inventory</h3>
                    <p>
                        Businesses can list unused or excess inventory with quantity and 
                        basic details.
                    </p>
                </div>

                <div className = "feature-card">
                    <span>02</span>
                    <h3>Find Inventory</h3>
                    <p>
                        Business can browse available inventory and find items that 
                        match their needs.
                    </p>
                </div>

                <div className = 'feature-card'>
                    <span>03</span>
                    <h3>Send Request</h3>
                    <p>
                        Interested businesses can send a request to the business offering
                        the inventory.
                    </p>
                </div>

                <div className = "feature-card">
                    <span>04</span>
                    <h3>Complete Transfer</h3>
                    <p>
                        The inventory owner can approve the request and mark the transfer as completed.
                    </p>
                </div>
            </div>
        </section>
    )
}


export default Features