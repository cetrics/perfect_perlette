  // Dynamically loading Page
  document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link'); // Select all navigation links
    const contentDiv = document.getElementById('main-content__container'); // Target the content container

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent the default link behavior
            const page = link.getAttribute('data-page'); // Get the route from data-page

            // Fetch the content from the Flask route
            fetch(page)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(html => {
                    // Inject content into the container
                    contentDiv.innerHTML = html;

                    // Process <script> tags in the loaded content
                    const scriptTags = contentDiv.querySelectorAll('script');
                    scriptTags.forEach(script => {
                        const newScript = document.createElement('script');
                        if (script.src) {
                            newScript.src = script.src;
                            newScript.async = false; // Ensure scripts execute in order
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        document.body.appendChild(newScript);
                        script.remove(); // Remove original <script> to prevent duplication
                    });

                    // Process <link> tags in the loaded content
                    const linkTags = contentDiv.querySelectorAll('link[rel="stylesheet"]');
                    linkTags.forEach(link => {
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = link.href;
                        document.head.appendChild(newLink);
                        link.remove(); // Remove original <link> to prevent duplication
                    });
                })
                .catch(error => {
                    console.error('Error loading content:', error);
                    contentDiv.innerHTML = '<p>Sorry, an error occurred while loading the content.</p>';
                });
        });
    });
});



// Drop down for order table in Admin-dashboard

document.addEventListener('DOMContentLoaded', () => {
    const statusSelects = document.querySelectorAll('.status-select');
  
    // Function to update the color of the dropdown
    function updateSelectColor(select) {
      if (select.value === 'Pending') {
        select.style.backgroundColor = 'red';
        select.style.color = 'white';
      } else if (select.value === 'Delivered') {
        select.style.backgroundColor = 'green';
        select.style.color = 'white';
      }
    }
  
    // Function to display a notification message
    function showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerText = message;
      document.body.appendChild(notification);
  
      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  
    // Add change event listener to each dropdown
    statusSelects.forEach(select => {
      updateSelectColor(select); // Set initial color
  
      select.addEventListener('change', function () {
        const orderId = this.getAttribute('data-order-id');
        const newStatus = this.value;
        updateSelectColor(this); // Update color on change
  
        fetch('/update_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, status: newStatus })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.success) {
              showNotification('Order status updated successfully!', 'success');
            } else {
              showNotification(`Failed to update order status: ${data.message}`, 'error');
            }
          })
          .catch(error => {
            console.error('Error updating order status:', error);
            showNotification('An error occurred while updating the order status.', 'error');
          });
      });
    });
  });
  

  //Popup for order table

  document.addEventListener('DOMContentLoaded', () => {
    // Listen for clicks on "Read More" links
    document.querySelectorAll('.read-more').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault(); // Prevent default link behavior

        // Get the full message from the data attribute
        const fullMessage = link.getAttribute('data-message');

        // Display the message in a popup
        const modalContent = document.getElementById('modal-content');
        modalContent.textContent = fullMessage;

        // Show the modal
        const modal = document.getElementById('message-modal');
        modal.style.display = 'block';
      });
    });

    // Close the modal when the close button is clicked
    document.getElementById('close-modal').addEventListener('click', () => {
      const modal = document.getElementById('message-modal');
      modal.style.display = 'none';
    });
  });

 

