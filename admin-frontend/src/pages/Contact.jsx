import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css";

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-contacts");
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-subscribers");
      setSubscribers(response.data.subscribers || []);
    } catch (error) {
      console.error("Failed to load subscribers:", error);
    }
  };

  const handleSubscriberClick = () => {
    setShowSubscribers(true);
    fetchSubscribers();
  };

  const handleContactClick = () => {
    setShowSubscribers(false);
  };

  const handleReadMore = (message) => {
    setCurrentMessage(message);
    setShowMessagePopup(true); // Show the popup
  };

  const handleClosePopup = () => {
    setShowMessagePopup(false); // Close the popup
  };

  return (
    <div>
      <div className="summary-section">
        <div className="summary-card black center" onClick={handleContactClick}>
          Contacts
        </div>
        <div
          className="summary-card green center"
          onClick={handleSubscriberClick}
        >
          Subscribers
        </div>
      </div>

      {showSubscribers ? (
        <section>
          <h2>Subscribers</h2>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscription Time</th>
                <th>Subscription ID</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length > 0 ? (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.subscription_id}>
                    <td>{subscriber.email}</td>
                    <td>{subscriber.subscription_time}</td>
                    <td>{subscriber.subscription_id}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No subscribers available</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <section>
          <h2>Contacts</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length > 0 ? (
                contacts.map((contact) => {
                  const messageWords = contact.message.split(" ");
                  const previewMessage = messageWords.slice(0, 4).join(" ");
                  const fullMessage = contact.message;

                  return (
                    <tr key={contact.contact_id}>
                      <td>{contact.contact_id}</td>
                      <td>{contact.name}</td>
                      <td>{contact.email}</td>
                      <td>
                        {previewMessage}{" "}
                        {messageWords.length > 4 && (
                          <button
                            onClick={() => handleReadMore(fullMessage)}
                            className="read-more-button"
                          >
                            Read More
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4">No contacts available</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Popup for full message */}
      {showMessagePopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Message</h2>
            <p>{currentMessage}</p>
            <button onClick={handleClosePopup} className="close-popup">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
