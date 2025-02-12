import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css"; // Import the CSS file

// Modal Component
const Modal = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Order Details</h2>
        <p>{content}</p>
        <button onClick={onClose} className="modal-close-button">
          Close
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState("total");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");

  useEffect(() => {
    // Fetch orders from /api/orders
    axios
      .get("/api/admin-dashboard")
      .then((response) => {
        setOrders(response.data);
      })
      .catch((error) => console.error("Error fetching orders:", error));
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    // Update the status of an order
    axios
      .post("/api/update-status", { order_id: orderId, status: newStatus })
      .then(() => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setSuccessMessage(`Status updated to: ${newStatus}`);
        setTimeout(() => setSuccessMessage(""), 3000); // Hide after 3 seconds
      })
      .catch((error) => console.error("Error updating order status:", error));
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const handleReadMore = (order, event) => {
    event.preventDefault(); // Prevent default link behavior
    setSelectedOrder(order); // Set the full message in the modal
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const filteredOrders = () => {
    if (activeSection === "total") return orders;
    return orders.filter(
      (order) => order.status.toLowerCase() === activeSection
    );
  };

  return (
    <div className="home-container">
      <header></header>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message active">{successMessage}</div>
      )}

      {/* Summary Section */}
      <section className="summary-section">
        <div
          className={`summary-card ${
            activeSection === "total" ? "active" : ""
          } green`}
          onClick={() => handleSectionClick("total")}
        >
          Total Orders
        </div>
        <div
          className={`summary-card ${
            activeSection === "pending" ? "active" : ""
          } orange`}
          onClick={() => handleSectionClick("pending")}
        >
          Pending Orders
        </div>
        <div
          className={`summary-card ${
            activeSection === "delivered" ? "active" : ""
          } black`}
          onClick={() => handleSectionClick("delivered")}
        >
          Delivered Orders
        </div>
      </section>

      {/* Orders Table */}
      <section>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Order</th>
              <th>Order ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders().map((order, index) => (
              <tr key={index}>
                <td>{order.name}</td>
                <td>{order.phone}</td>
                <td>
                  {order.order.split(" ").slice(0, 4).join(" ")}{" "}
                  {order.order.split(" ").length > 4 && (
                    <button
                      onClick={(e) => handleReadMore(order.order, e)}
                      className="read-more-button"
                    >
                      Read More
                    </button>
                  )}
                </td>
                <td>{order.order_id}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.order_id, e.target.value)
                    }
                    className={`select-status ${
                      order.status === "Delivered"
                        ? "select-status-delivered"
                        : "select-status-pending"
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        content={selectedOrder}
      />

      <footer></footer>
    </div>
  );
};

export default AdminDashboard;
