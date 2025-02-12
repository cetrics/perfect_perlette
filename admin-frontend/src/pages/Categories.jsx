import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css";

const CategoryList = () => {
  // Default to cake categories
  const [selectedType, setSelectedType] = useState("cake");
  const [categories, setCategories] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  // For cake categories, the id will come from category_id (mapped to id)
  const [editData, setEditData] = useState({ id: "", category_name: "" });

  // When component mounts, fetch cake categories by default.
  useEffect(() => {
    fetchCategories("cake");
  }, []);

  // Function to fetch categories based on type ("cake" or "blog")
  const fetchCategories = async (type) => {
    try {
      let response;
      if (type === "cake") {
        response = await axios.get("http://localhost:5000/cake2-categories");
        console.log("Raw cake categories response:", response.data);
        // Map backend properties to internal keys.
        const mappedData = response.data.map((cat) => ({
          id: cat.category_id, // This will hold the cake category ID
          category_name: cat.category_name,
        }));
        console.log("Mapped cake categories:", mappedData);
        setCategories(mappedData);
      } else if (type === "blog") {
        response = await axios.get("http://localhost:5000/blog-categories");
        console.log("Raw blog categories response:", response.data);
        const mappedData = response.data.map((cat) => ({
          id: cat.blog_category_id,
          category_name: cat.category_name,
        }));
        console.log("Mapped blog categories:", mappedData);
        setCategories(mappedData);
      }
      setSelectedType(type);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Called when the user clicks "Edit"
  const handleEditClick = (id, name) => {
    console.log("Editing category:", id, name); // Debug: Ensure id is not undefined
    setEditData({ id, category_name: name });
    setEditModalOpen(true);
  };

  // Updates the edit input value.
  const handleEditChange = (e) => {
    setEditData({ ...editData, category_name: e.target.value });
  };

  // Sends a PUT request to update the category.
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint =
        selectedType === "cake"
          ? `http://localhost:5000/edit-cake-category/${editData.id}`
          : `http://localhost:5000/edit-blog-category/${editData.id}`;
      await axios.put(endpoint, { category_name: editData.category_name });
      // Update the category list locally.
      setCategories(
        categories.map((cat) =>
          cat.id === editData.id
            ? { ...cat, category_name: editData.category_name }
            : cat
        )
      );
      setEditModalOpen(false);
      alert("Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  // Handles deletion of a category.
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const endpoint =
          selectedType === "cake"
            ? `http://localhost:5000/delete-cake-category/${id}`
            : `http://localhost:5000/delete-blog-category/${id}`;
        await axios.delete(endpoint);
        setCategories(categories.filter((cat) => cat.id !== id));
        alert("Category deleted successfully!");
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <div className="category-list-container">
      {/* Top summary cards */}
      <div className="summary-section">
        <div
          className="summary-card green"
          onClick={() => fetchCategories("cake")}
        >
          Cake Category
        </div>
        <div
          className="summary-card black"
          onClick={() => fetchCategories("blog")}
        >
          Blog Category
        </div>
      </div>

      {/* Table of categories */}
      <div className="table-container">
        <h2>
          {selectedType === "cake" ? "Cake Categories" : "Blog Categories"}
        </h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.category_name}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(cat.id, cat.category_name)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(cat.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No categories available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal Popup */}
      {editModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit {selectedType === "cake" ? "Cake" : "Blog"} Category</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={editData.category_name}
                onChange={handleEditChange}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
