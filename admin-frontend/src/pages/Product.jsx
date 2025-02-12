import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css";

const UploadProduct = () => {
  const [formData, setFormData] = useState({
    product_name: "",
    product_price: "",
    product_category: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showProducts, setShowProducts] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/cake-categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5000/uploaded-products"
      );
      setProducts(response.data);
      setShowForm(false);
      setShowProducts(true);
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setErrorMessage("Category name cannot be empty!");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/add-category", {
        category_name: newCategory,
      });
      setSuccessMessage("Category added successfully!");
      setNewCategory("");
      fetchCategories();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding category:", error);
      setErrorMessage("Failed to add category. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFormData((prevData) => ({
        ...prevData,
        image: e.target.files[0],
      }));
      setCurrentImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("product_name", formData.product_name);
    data.append("product_price", formData.product_price);
    data.append("product_category", formData.product_category);
    if (formData.image) data.append("image", formData.image);

    try {
      if (editMode) {
        await axios.put(
          `http://127.0.0.1:5000/update-product/${editProductId}`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setSuccessMessage("Product updated successfully!");
        setEditMode(false);
        setEditProductId(null);
      } else {
        await axios.post("http://127.0.0.1:5000/upload-product", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccessMessage("Product uploaded successfully!");
      }
      fetchProducts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error submitting product:", error);
      setErrorMessage("Failed to submit product. Please try again.");
    }
  };

  const handleEdit = (product) => {
    const categoryId = categories.find(
      (category) => category.category_name === product.category_name
    )?.cake_product_idfk;

    setFormData({
      product_name: product.product_name,
      product_price: product.product_price,
      product_category: categoryId || "",
      image: null,
    });
    setCurrentImage(`/static/img/upload_folder/${product.product_photo}`);
    setEditMode(true);
    setEditProductId(product.product_id);
    setShowForm(true);
    setShowProducts(false);
    setShowCategoryForm(false);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/delete-product/${productId}`);
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setErrorMessage("Failed to delete product. Please try again.");
    }
  };

  const showAddCategoryForm = () => {
    setShowCategoryForm(true);
    setShowForm(false);
    setShowProducts(false);
  };

  return (
    <div className="home-container">
      <header></header>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <section className="summary-section">
        <div
          className="summary-card green"
          onClick={() => {
            setFormData({
              product_name: "",
              product_price: "",
              product_category: "",
              image: null,
            });
            setCurrentImage(null);
            setEditMode(false);
            setShowForm(true);
            setShowProducts(false);
            setShowCategoryForm(false);
          }}
        >
          Upload Product
        </div>
        <div className="summary-card black center" onClick={fetchProducts}>
          Uploaded Products
        </div>
        <div
          className="summary-card orange center"
          onClick={showAddCategoryForm}
        >
          Add Category
        </div>
      </section>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {showCategoryForm && (
        <section className="center-container">
          <form className="form" onSubmit={handleCategorySubmit}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit">Add Category</button>
          </form>
        </section>
      )}

      {showForm && (
        <section className="center-container">
          <form className="form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="product_name"
              placeholder="Product Name"
              value={formData.product_name}
              onChange={handleChange}
            />
            <input
              type="number"
              name="product_price"
              placeholder="Product Price"
              value={formData.product_price}
              onChange={handleChange}
            />
            <select
              name="product_category"
              value={formData.product_category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option
                  key={category.cake_product_idfk}
                  value={category.cake_product_idfk}
                >
                  {category.category_name}
                </option>
              ))}
            </select>
            {currentImage && (
              <div className="image-preview">
                <img
                  src={currentImage}
                  alt="Current Product"
                  style={{ width: "100px", height: "100px" }}
                />
              </div>
            )}
            <input type="file" name="image" onChange={handleFileChange} />
            <button type="submit">
              {editMode ? "Update Product" : "Upload Product"}
            </button>
          </form>
        </section>
      )}

      {showProducts && (
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Product Price</th>
              <th>Product Date</th>
              <th>Product Category</th>
              <th>Product Photo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.product_id}>
                  <td>{product.product_name}</td>
                  <td>{product.product_price}</td>
                  <td>{product.product_date}</td>
                  <td>{product.category_name}</td>
                  <td>
                    <img
                      src={`/static/img/upload_folder/${product.product_photo}`}
                      alt={product.product_name}
                      style={{ width: "100px", height: "100px" }}
                    />
                  </td>
                  <td>
                    <button
                      className="select-status-delivered"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="select-status-pending"
                      onClick={() => handleDelete(product.product_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-products">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UploadProduct;
