$(document).ready(function () {
  // Function to check if all fields are filled
  function checkFields() {
    const nameFilled = $("#input-field").val().trim() !== "";
    const commentFilled = $("#comment-field").val().trim() !== "";
    $("#submitButton").prop("disabled", !(nameFilled && commentFilled));
  }

  // Monitor input changes
  $("#input-field, #comment-field").on("input", checkFields);

  // Initialize check on page load
  checkFields();

  // Handle form submission via AJAX
  $("#myForm").on("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    const formData = $(this).serialize();

    $.ajax({
      url: "/submit-comment",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.comments) {
          // Assuming the backend sends the most recently submitted comment
          const comment = response.comments;

          // Append new comment to the comments section
          $("#comments-section").prepend(`
                        <div class="blog__details__comment__item">
                            <div class="blog__details__comment__item__pic">
                                <img src="static/img/blog/details/avatar.jpg" width="90" height="90" alt="Avatar">
                            </div>
                            <div class="blog__details__comment__item__text">
                                <h6>${comment[3]}</h6>
                                <span>${comment[4]}</span>
                                <p>${comment[0]}</p>
                            </div>
                        </div>
                    `);

          // Update the comment count dynamically
          const commentCountElement = $("#comment-count");
          const currentCount = parseInt(commentCountElement.text());
          commentCountElement.text(currentCount + 1); // Increment the count

          // Clear the form fields and hide the popup
          $("#myForm")[0].reset();
          $("#popup").removeClass("show");
          checkFields(); // Re-check fields
        } else {
          alert(response.message || "Failed to submit comment.");
        }
      },
      error: function (xhr, status, error) {
        alert("An error occurred: " + error);
      },
    });
  });
});

// Toggle popup visibility
function toggleContent(event) {
  event.preventDefault();
  $("#popup").toggleClass("show");
}

//for Home Contact
$(document).ready(function () {
  // Function to check if all fields are filled
  function checkFields() {
    const nameFilled = $("#contactHome_name").val().trim() !== "";
    const emailFilled = $("#contactHome_phone").val().trim() !== "";
    const messageFilled = $("#contactHome_message").val().trim() !== "";
    $("#contactHome_submit").prop(
      "disabled",
      !(nameFilled && messageFilled && emailFilled)
    );
  }

  // Monitor input changes
  $("#contactHome_name, #contactHome_phone, #contactHome_message").on(
    "input",
    checkFields
  );

  // Initialize check on page load
  checkFields();

  // Handle form submission via AJAX
  $("#contactHome_Form").on("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    const formData = $(this).serialize();

    $.ajax({
      url: "/",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.comments) {
          // Assuming the backend sends the most recently submitted comment
          const comment = response.comments;

          // Append new comment to the comments section
          $("#commentsHome-section").prepend(`
                        <p style="color: green;">Order sent successfully</p>
                    `);
          $("#contactHome_Form")[0].reset();
          checkFields(); // Re-check fields
        } else {
          alert(response.message || "Failed to send message.");
        }
      },
      error: function (xhr, status, error) {
        alert("An error occurred: " + error);
      },
    });
  });
});

//for Contact Page
$(document).ready(function () {
  // Function to check if all fields are filled
  function checkFields() {
    const nameFilled = $("#contact_name").val().trim() !== "";
    const emailFilled = $("#contact_email").val().trim() !== "";
    const messageFilled = $("#contact_message").val().trim() !== "";
    $("#contact_submit").prop(
      "disabled",
      !(nameFilled && messageFilled && emailFilled)
    );
  }

  // Monitor input changes
  $("#contact_name, #contact_email, #contact_message").on("input", checkFields);

  // Initialize check on page load
  checkFields();

  // Handle form submission via AJAX
  $("#contactForm").on("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    const formData = $(this).serialize();

    $.ajax({
      url: "/contact",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.comments) {
          // Assuming the backend sends the most recently submitted comment
          const comment = response.comments;

          // Append new comment to the comments section
          $("#comments-section").prepend(`
                        <p style="color: green;">Message sent successfully</p>
                    `);
          $("#contactForm")[0].reset();
          checkFields(); // Re-check fields
        } else {
          alert(response.message || "Failed to send message.");
        }
      },
      error: function (xhr, status, error) {
        alert("An error occurred: " + error);
      },
    });
  });
});

//for Subscription Form
$(document).ready(function () {
  // Function to check if all fields are filled
  function checkFields() {
    const emailFilled = $("#subscription_email").val().trim() !== "";
    $("#subscription_submit").prop("disabled", !emailFilled);
  }

  // Monitor input changes
  $("#subscription_email").on("input", checkFields);

  // Initialize check on page load
  checkFields();

  // Handle form submission via AJAX
  $("#subscriptionForm").on("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    const formData = $(this).serialize();

    // Clear previous messages
    $("#commentBlog-section").empty();

    $.ajax({
      url: "/main_template",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.existing) {
          // Display a red error message for duplicate email
          $("#commentBlog-section").prepend(`
                        <p style="color: red;">${response.message}</p>
                    `);
        } else {
          // Display a green success message for successful subscription
          $("#commentBlog-section").prepend(`
                        <p style="color: green;">${response.message}</p>
                    `);
          $("#subscriptionBlog_Form")[0].reset();
          checkFields(); // Re-check fields
        }
      },
      error: function (xhr, status, error) {
        // Handle 400 error for duplicate email
        if (xhr.status === 400) {
          const response = JSON.parse(xhr.responseText);
          $("#commentBlog-section").prepend(`
                        <p style="color: red;">${response.message}</p>
                    `);
        } else {
          alert("An error occurred: " + error);
        }
      },
    });
  });
});

// For Subscription Form on Blog
$(document).ready(function () {
  // Function to check if all fields are filled
  function checkFields() {
    const emailFilled = $("#subscriptionBlog_email").val().trim() !== "";
    const checkFilled = $("#agg").prop("checked"); // Check if the checkbox is checked
    $("#subscriptionBlog_submit").prop(
      "disabled",
      !(emailFilled && checkFilled)
    );
  }

  // Monitor input changes and checkbox changes
  $("#subscriptionBlog_email").on("input", checkFields);
  $("#agg").on("change", checkFields); // Use 'change' event for checkboxes

  // Initialize check on page load
  checkFields();

  // Handle form submission via AJAX
  $("#subscriptionBlog_Form").on("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    const formData = $(this).serialize();

    // Clear previous messages
    $("#commentBlog-section").empty();

    $.ajax({
      url: "/main_template",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.existing) {
          // Display a red error message for duplicate email
          $("#commentBlog-section").prepend(`
                        <p style="color: red;">${response.message}</p>
                    `);
        } else {
          // Display a green success message for successful subscription
          $("#commentBlog-section").prepend(`
                        <p style="color: green;">${response.message}</p>
                    `);
          $("#subscriptionBlog_Form")[0].reset();
          checkFields(); // Re-check fields
        }
      },
      error: function (xhr, status, error) {
        // Handle 400 error for duplicate email
        if (xhr.status === 400) {
          const response = JSON.parse(xhr.responseText);
          $("#commentBlog-section").prepend(`
                        <p style="color: red;">${response.message}</p>
                    `);
        } else {
          alert("An error occurred: " + error);
        }
      },
    });
  });
});

//For search in product page using Ajax
$(document).ready(function () {
  $("#search-input").on("input", function () {
    const query = $(this).val();
    const category = $("#category-select").val();

    $.ajax({
      url: "/search",
      method: "GET",
      data: { query: query, category: category },
      success: function (response) {
        // Clear the existing products
        $("#product-container").empty();

        // Append the new results dynamically
        response.forEach((product) => {
          $("#product-container").append(`
                            <div class="col-lg-3 col-md-6 col-sm-6">
                                <div class="product__item">
                                    <div class="product__item__pic set-bg edges" style="background-image: url('/static/img/upload_folder/${product.product_photo}')">
                                        <div class="product__label">
                                            <span>${product.product_category}</span>
                                        </div>
                                    </div>
                                    <div class="product__item__text">
                                        <h6><a href="/contact">${product.product_name}</a></h6>
                                        <div class="product__item__price">${product.product_price}</div>
                                        <div class="cart_add">
                                            <a href="/contact">Add to cart</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
        });
      },
      error: function () {
        console.error("An error occurred while fetching search results.");
      },
    });
  });
});

//For search in Blog page using Ajax
$(document).ready(function () {
  $("#blogSearch-input").on("input", function () {
    const query = $(this).val();
    const category = $("#category-select").val();

    $.ajax({
      url: "/blog_search",
      method: "GET",
      data: { query: query, category: category },
      success: function (response) {
        // Clear the existing products
        $("#product-container").empty();

        // Append the new results dynamically
        response.forEach((product) => {
          $("#product-container").append(`
                        <div class="blog__item">
                            <div class="blog__item__pic set-bg edges" style="background-image: url('/static/img/${product.blog_image}')">
                                <div class="blog__pic__inner">
                                    <div class="label edges">Recipes</div>
                                    <ul>
                                        <li>By <span>${product.blog_author}</span></li>
                                        <li>${product.blog_time}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="blog__item__text">
                                <h2>${product.blog_title}</h2>
                                <p>Some description here...</p>
                                <a href="/blog-details?id=${product.blog_id}">READ MORE</a>
                            </div>
                        </div>
                    `);
        });
      },
      error: function () {
        console.error("An error occurred while fetching search results.");
      },
    });
  });
});
