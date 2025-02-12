import React, { useState, useEffect, useRef } from "react";
import { CKEditor } from "ckeditor4-react";
import axios from "axios";
import BlogList from "./BlogList"; // ✅ Import BlogList component
import "./styles/Home.css";

const UploadBlog = () => {
  const [blogData, setBlogData] = useState({
    blog_title: "",
    blog_author: "",
    blog_image: null,
    blog_category_id_fk: "",
  });

  const [blogBody, setBlogBody] = useState(""); // Blog body text (CKEditor content)
  const [categories, setCategories] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false); // Initially false
  const [categoryName, setCategoryName] = useState("");
  const [showBlogList, setShowBlogList] = useState(true); // Set default view to "Uploaded Blog"

  const fileInputRef = useRef(null);

  // ✅ Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/get-categories");
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setBlogData({ ...blogData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setBlogData({ ...blogData, blog_category_id_fk: e.target.value });
  };

  const handleEditorChange = (event) => {
    setBlogBody(event.editor.getData());
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setBlogData({ ...blogData, blog_image: e.target.files[0] });
    }
  };

  // ✅ Upload Blog Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!blogData.blog_title || !blogBody || !blogData.blog_author || !blogData.blog_image || !blogData.blog_category_id_fk) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("blog_title", blogData.blog_title);
    formData.append("blog_body", blogBody);
    formData.append("blog_author", blogData.blog_author);
    formData.append("blog_image", blogData.blog_image);
    formData.append("blog_category_id_fk", blogData.blog_category_id_fk);

    try {
      const response = await axios.post("http://localhost:5000/upload-blog", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(response.data.message);

      // ✅ Reset form fields after successful upload
      setBlogData({
        blog_title: "",
        blog_author: "",
        blog_image: null,
        blog_category_id_fk: "",
      });

      setBlogBody(""); // Reset CKEditor content

      // ✅ Reset CKEditor via API
      if (window.CKEDITOR.instances.editor1) {
        window.CKEDITOR.instances.editor1.setData("");
      }

      // ✅ Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

    } catch (error) {
      alert(error.response?.data?.error || "An error occurred.");
    }
  };

  // ✅ Add Category Submission
  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!categoryName) {
      alert("Please enter a category name.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/blog-category", { category_name: categoryName });

      alert(response.data.message);
      setCategoryName(""); // Reset category name input

      const updatedCategories = await axios.get("http://localhost:5000/get-categories");
      setCategories(updatedCategories.data.categories || []);
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <div>
      {/* Toggle Section */}
      <section className="summary-section">
        <div className="summary-card black" onClick={() => { setShowBlogList(true); setShowUploadForm(false); }}>Uploaded Blog</div>
        <div className="summary-card green" onClick={() => { setShowUploadForm(true); setShowBlogList(false); }}>Upload Blog</div>
        <div className="summary-card orange center" onClick={() => { setShowUploadForm(false); setShowBlogList(false); }}>Add Category</div>
      </section>

      {/* Show Blog List when "Uploaded Blog" is clicked */}
      {showBlogList && <BlogList />}

      {/* Show Upload Blog Form */}
      {!showBlogList && showUploadForm && (
        <section>
          <form className="blog-form" onSubmit={handleSubmit}>
            <input type="text" name="blog_title" placeholder="Blog Title" onChange={handleChange} value={blogData.blog_title} required />
            <input type="text" name="blog_author" placeholder="Author" onChange={handleChange} value={blogData.blog_author} required />
            <select name="blog_category_id_fk" onChange={handleCategoryChange} value={blogData.blog_category_id_fk} required>
              <option value="">Select Category</option>
              {categories.length > 0 ? categories.map((category) => (
                <option key={category.blog_category_id} value={category.blog_category_id}>
                  {category.category_name}
                </option>
              )) : <option disabled>Loading categories...</option>}
            </select>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} required />
            <div className="ckeditor-container">
              <CKEditor
                id="editor1"
                data={blogBody}
                onChange={handleEditorChange}
                config={{
                  versionCheck: false,
                  height: 300,
                  resize_enabled: true,
                  contentsCss: "/static/custom-editor-styles.css",
                  toolbar: [
                    ["Bold", "Italic", "Underline", "Strike", "Link"],
                    ["NumberedList", "BulletedList", "Outdent", "Indent"],
                    ["Blockquote", "Image", "CodeSnippet"],
                    ["Undo", "Redo"],
                  ],
                }}
              />
            </div>
            <button type="submit">Upload Blog</button>
          </form>
        </section>
      )}

      {/* Show Add Category Form */}
      {!showBlogList && !showUploadForm && (
        <section>
          <form className="category-form blog-form" onSubmit={handleAddCategory}>
            <input type="text" placeholder="Category Name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
            <button type="submit">Add Category</button>
          </form>
        </section>
      )}
    </div>
  );
};

export default UploadBlog;
