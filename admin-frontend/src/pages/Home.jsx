import React, { useEffect, useState } from "react";
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

const Home = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMessageActive, setIsMessageActive] = useState(false); // State to manage message visibility

  useEffect(() => {
    // Fetch data from the backend API
    axios
      .get("/api/admin-dashboard") // Flask API endpoint
      .then((response) => {
        setUsers(response.data); // Set the users state with the API response
      })
      .catch((error) => {
        console.error("Error fetching admin data:", error);
      });
  }, []);

  const handleReadMore = (order, event) => {
    event.preventDefault(); // Prevent any unexpected behaviors
    setSelectedOrder(order); // Set the full order details
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const handleStatusChange = (orderId, newStatus) => {
    // Send the updated status to the backend
    axios
      .post("/api/update-status", { order_id: orderId, status: newStatus })
      .then(() => {
        // Update the status locally after a successful backend update
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.order_id === orderId ? { ...user, status: newStatus } : user
          )
        );
        // Show the success message
        setSuccessMessage(`Status updated to: ${newStatus}`);
        setIsMessageActive(true); // Activate the success message

        // Hide the success message after 3 seconds
        setTimeout(() => {
          setIsMessageActive(false); // Deactivate the success message
          setSuccessMessage(""); // Clear the message
        }, 3000);
      })
      .catch((error) => {
        console.error("Error updating order status:", error);
      });
  };

  return (
    <div className="home-container">
      <header></header>

      {/* Success Message */}
      {successMessage && (
        <div className={`success-message ${isMessageActive ? "active" : ""}`}>
          {successMessage}
        </div>
      )}

      {/* Summary Section */}
      <section className="summary-section">
        <div className="summary-card green">
          <p>Total Orders</p>
        </div>
        <div className="summary-card orange">
          <p>Total Blogs</p>
        </div>
        <div className="summary-card black center">
          <p>Total Visitors</p>
        </div>
      </section>

      <section>
        <h2>Customer Orders</h2>
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
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.name}</td>
                <td>{user.phone}</td>
                <td>
                  {user.order.split(" ").slice(0, 4).join(" ")}{" "}
                  {user.order.split(" ").length > 4 && (
                    <button
                      onClick={(e) => handleReadMore(user.order, e)}
                      className="read-more-button"
                    >
                      Read More
                    </button>
                  )}
                </td>
                <td>{user.order_id}</td>
                <td>
                  <select
                    value={user.status}
                    onChange={(e) =>
                      handleStatusChange(user.order_id, e.target.value)
                    }
                    className={`select-status ${
                      user.status === "Delivered"
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

export default Home;
