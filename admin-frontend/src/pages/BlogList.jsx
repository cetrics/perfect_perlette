import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css";
import { CKEditor } from "ckeditor4-react";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedBody, setUpdatedBody] = useState("");
  const [updatedCategory, setUpdatedCategory] = useState(""); // Stores category id
  const [updatedImage, setUpdatedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingBlog) {
      setUpdatedTitle(editingBlog.blog_title);
      setUpdatedBody(editingBlog.blog_body || "");
      setUpdatedCategory(editingBlog.blog_category_id_fk || ""); // Retain category ID
      setPreviewImage(`/static/img/upload_folder/${editingBlog.blog_image}`);
    }
  }, [editingBlog]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-blogs");
      setBlogs(response.data.blogs || []);
    } catch (error) {
      console.error("Failed to load blogs:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleDelete = async (blog_id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await axios.delete(`http://localhost:5000/delete-blog/${blog_id}`);
        setBlogs(blogs.filter((blog) => blog.blog_id !== blog_id));
      } catch (error) {
        console.error("Failed to delete blog:", error);
      }
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setUpdatedTitle(blog.blog_title);
    setUpdatedBody(blog.blog_body || "");
    setUpdatedCategory(blog.blog_category_id_fk || ""); // Retain category ID
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpdatedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!editingBlog) return;

    try {
      const categoryToSave =
        updatedCategory !== ""
          ? updatedCategory
          : editingBlog.blog_category_id_fk; // Ensure fallback

      const formData = new FormData();
      formData.append("blog_title", updatedTitle);
      formData.append("blog_body", updatedBody);
      formData.append("blog_category_id_fk", categoryToSave); // Retain category
      if (updatedImage) {
        formData.append("blog_image", updatedImage);
      }

      await axios.put(
        `http://localhost:5000/update-blog/${editingBlog.blog_id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      fetchBlogs();
      setEditingBlog(null);
    } catch (error) {
      console.error("Failed to update blog:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
  };

  return (
    <div>
      {!editingBlog ? (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Image</th>
                <th>Published Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length > 0 ? (
                blogs.map((blog) => (
                  <tr key={blog.blog_id}>
                    <td>{blog.blog_id}</td>
                    <td>{blog.blog_title}</td>
                    <td>{blog.blog_author}</td>
                    <td>{blog.category_name}</td>
                    <td>
                      {blog.blog_image ? (
                        <img
                          src={`/static/img/upload_folder/${blog.blog_image}`}
                          alt={blog.blog_title}
                          className="blog-thumbnail"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td>{blog.blog_time}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(blog)}
                        className="select-status-delivered"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog.blog_id)}
                        className="select-status-pending"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No blogs available</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      ) : (
        <section className="center-container">
          <h3>Edit Blog</h3>
          <form className="blog-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={updatedTitle}
              onChange={(e) => setUpdatedTitle(e.target.value)}
            />

            <input
              type="hidden"
              name="blog_category_id_fk"
              value={updatedCategory}
            />

            <select
              value={updatedCategory}
              onChange={(e) => setUpdatedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option
                  key={category.blog_category_id}
                  value={category.blog_category_id}
                >
                  {category.category_name}
                </option>
              ))}
            </select>

            <input type="file" accept="image/*" onChange={handleImageChange} />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="blog-thumbnail"
              />
            )}

            <CKEditor
              config={{ versionCheck: false }}
              initData={updatedBody}
              onChange={(event) => setUpdatedBody(event.editor.getData())}
            />

            <div>
              <button onClick={handleSave} className="select-status-delivered">
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="select-status-pending"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default BlogList;
