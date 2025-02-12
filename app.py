from flask import Flask;
from flask import render_template,send_from_directory, request, redirect,session, url_for, jsonify,flash;
from flask_mysqldb import MySQL;
import os
import mysql.connector
from datetime import datetime
from fuzzywuzzy import process
from rapidfuzz import process, fuzz
from flask_cors import CORS
from werkzeug.utils import secure_filename
import time
from werkzeug.security import generate_password_hash, check_password_hash




app = Flask(__name__)


app.secret_key = 'your-secret-key'
cors = CORS(app, origins='*')

#mysql configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'cake_shop'
app.config["IMAGE_UPLOADS"] = os.path.join(app.root_path, "static", "img", "upload_folder")


mysql = MySQL(app)


# Mock static data (you can replace this with real data in a database)
static_data = [
    {'id': 1, 'name': 'About Us', 'category': 'About Page', 'link': '/about'},
    {'id': 2, 'name': 'Blog', 'category': 'Blog Page', 'link': '/blog'},
    {'id': 3, 'name': 'Contact', 'category': 'Contact Page', 'link': '/contact'},
    {'id': 4, 'name': 'Testimonials', 'category': 'Home Page', 'link': '/'}
]


@app.route('/searching', methods=['GET'])
def searching():
    query = request.args.get('query', '').strip()  # Search query
    page = request.args.get('page', 1, type=int)  # Current page
    per_page = 10  # Results per page
    results = []
    has_next = False  # Pagination flag

    if query:
        all_results = []  # To store results from static data and database

        # Fuzzy matching on static data
        for item in static_data:
            match_name = fuzz.ratio(query.lower(), item['name'].lower())
            match_category = fuzz.ratio(query.lower(), item['category'].lower())
            max_score = max(match_name, match_category)

            if max_score >= 30:  # Threshold for fuzzy match
                all_results.append({
                    'id': item['id'],
                    'name': item['name'],
                    'category': item['category'],
                    'link': item['link'],
                    'match_score': max_score
                })

        try:
            cursor = mysql.connection.cursor()

            # Fetch all rows from `cake_products`
            cursor.execute("""
                SELECT product_id, product_name, product_price, product_photo, product_category
                FROM cake_products
            """)
            cake_products = cursor.fetchall()

            # Fuzzy matching on `cake_products`
            for row in cake_products:
                product_id, name, price, photo, category = row
                match_name = fuzz.ratio(query.lower(), name.lower())
                match_category = fuzz.ratio(query.lower(), category.lower())
                max_score = max(match_name, match_category)

                if max_score >= 30:  # Threshold for fuzzy match
                    all_results.append({
                        'id': product_id,
                        'name': name,
                        'price': price,
                        'photo': photo,
                        'category': category,
                        'link': f'/product/{product_id}',
                        'match_score': max_score
                    })

            # Fetch all rows from `blog`
            cursor.execute("""
                SELECT blog_id, blog_title, blog_body, blog_author
                FROM blog
            """)
            blog_data = cursor.fetchall()

            # Fuzzy matching on `blog`
            for row in blog_data:
                blog_id, title, body, author = row
                match_title = fuzz.ratio(query.lower(), title.lower())
                match_author = fuzz.ratio(query.lower(), author.lower())
                max_score = max(match_title, match_author)

                if max_score >= 30:  # Threshold for fuzzy match
                    all_results.append({
                        'id': blog_id,
                        'name': title,
                        'body': body,
                        'author': author,
                        'link': f'/blog-details?id={blog_id}',
                        'match_score': max_score
                    })

        except Exception as e:
            print(f"Database error: {e}")
        finally:
            if cursor:
                cursor.close()

        # Sort all results by match score (descending)
        all_results = sorted(all_results, key=lambda x: x['match_score'], reverse=True)

        # Paginate results
        total_results = len(all_results)
        results = all_results[(page - 1) * per_page: page * per_page]
        has_next = (page * per_page) < total_results

    return render_template(
        'search.html',
        query=query,
        results=results,
        page=page,
        per_page=per_page,
        has_next=has_next
    )

@app.route("/",methods=['GET', 'POST'])
def home():
    # For products in this page
    cur = mysql.connection.cursor()
    # Fetch all products
    query = """
            SELECT 
                cp.product_category, cp.product_name, cp.product_photo, cp.product_price, cc.category_name 
            FROM 
                cake_products cp
            LEFT JOIN 
                cake_category cc 
            ON 
                cp.product_category = cc.cake_product_idfk LIMIT 8
        """
    cur.execute(query)
    users = cur.fetchall()  # Returns a list of tuples (e.g., [('img1.jpg',), ('img2.png',)


    # Get total product count to determine if "READ MORE" link should appear
    cur.execute("SELECT COUNT(*) FROM cake_products")
    total_products = cur.fetchone()[0]  # Get the total number of products
    print("\nPrinting each row")
    cur.close()
    if request.method == 'POST':
      name = request.form['name']
      phone = request.form['phone']
      message = request.form['message']
    
    # Insert the new contact into the database
      cur.execute("""
        INSERT INTO customer_order (customer_name, customer_phone, customer_order)
        VALUES (%s, %s, %s)
    """, (name, phone, message))
      mysql.connection.commit()
      if name:
        # Return all comments (including the new one) as JSON
        return jsonify({
            'message': 'Comment submitted successfully!',
            'comments': name
        })
      else:
         return jsonify({'message': 'Failed to submit comment'}), 400
    return render_template('index.html', users=users,total_products=total_products) 

@app.context_processor
def inject_blog_categories():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM cake_category")  # Fetch blog categories
    category = cur.fetchall()
    cur.close()
    return {'category': category}  # Make 'category' available globally


@app.route("/main_template", methods=['GET', 'POST'])
def mainTemplate():
    email = request.form['email']

    cur = mysql.connection.cursor()
    # Check if the email already exists
    cur.execute("SELECT email FROM subscription WHERE email = %s", (email,))
    existing_email = cur.fetchone()

    if existing_email:
        print("Duplicate email detected")  # Debugging line
        return jsonify({
            'existing': True,
            'message': 'Email already exists in the database.'
        }), 400
    else:
        # Insert the new contact into the database
        cur.execute("""
            INSERT INTO subscription (email, subscription_time)
            VALUES (%s, NOW())
        """, (email,))
        mysql.connection.commit()
        print("Email inserted successfully")  # Debugging line
        return jsonify({
            'existing': False,
            'message': 'Subscribed!',
            'comments': email
        })

#Search for products
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '').strip()  # User search term (for product_name or category_name)

    cur = mysql.connection.cursor()

    # When a search query is provided, match against product_name or category_name
    if query:
        search_query = """
            SELECT cp.product_id, cp.product_name, cp.product_price, cp.product_photo, cc.category_name
            FROM cake_products cp
            JOIN cake_category cc ON cc.cake_product_idfk = cp.product_category
            WHERE LOWER(cp.product_name) LIKE LOWER(%s) OR LOWER(cc.category_name) LIKE LOWER(%s)
        """
        print("Executing query:", search_query)
        print("Parameters:", (f"%{query}%", f"%{query}%"))
        cur.execute(search_query, (f"%{query}%", f"%{query}%"))
    else:
        # When no query is provided, select all products along with their category name.
        search_query = """
            SELECT cp.product_id, cp.product_name, cp.product_price, cp.product_photo, cc.category_name
            FROM cake_products cp
            JOIN cake_category cc ON cc.cake_product_idfk = cp.product_category
        """
        print("Executing query:", search_query)
        cur.execute(search_query)

    results = cur.fetchall()
    print("SQL Query Results:", results)

    products = [
        {
            'product_id': row[0],
            'product_name': row[1],
            'product_price': row[2],
            'product_photo': row[3],
            'product_category': row[4]  # This now holds the category_name from cake_category
        }
        for row in results
    ]
    return jsonify(products)


#Search for blog
@app.route('/blog_search', methods=['GET'])
def blogSearch():
    query = request.args.get('query', '').strip()  # User search term (product_name)

    cur = mysql.connection.cursor()

    # Case when query (product_name) is provided
    if query:
        search_query = """
            SELECT blog_id, blog_title, blog_author, blog_time, blog_image
            FROM blog
            WHERE LOWER(blog_title) LIKE LOWER(%s) OR LOWER(blog_author) LIKE LOWER(%s)
        """
        print("Executing query:", search_query)
        print("Parameters:", (f"%{query}%", f"%{query}%"))  # Log parameters
        cur.execute(search_query, (f"%{query}%", f"%{query}%"))  # Pass both parameters for product_name and product_category
    
    # Case when no query is provided (show all products)
    else:
        search_query = """
            SELECT blog_id, blog_title, blog_author, blog_time, blog_image
            FROM blog
        """
        print("Executing query:", search_query)
        cur.execute(search_query)

    results = cur.fetchall()
    print("SQL Query Results:", results)  # Log the result to check if it's coming back correctly

    products = [
        {
            'blog_id': row[0],
            'blog_title': row[1],
            'blog_author': row[2],
            'blog_time': row[3],
            'blog_image': row[4]
        }
        for row in results
    ]
    return jsonify(products)



@app.route("/about")
def aboutPage():
    return render_template('about.html')

@app.route("/categories")
def categoriesPage():
    return render_template('categories.html')

@app.route("/product", methods=['GET'])
def productPage():
    category_id = request.args.get('category_id')  # Get category_id from query parameters
    cur = mysql.connection.cursor()

    if category_id:
        # Fetch products for a specific category
        query = """
            SELECT 
                cp.product_id, cp.product_name, cp.product_photo, cp.product_price, cc.category_name 
            FROM 
                cake_products cp
            LEFT JOIN 
                cake_category cc 
            ON 
                cp.product_category = cc.cake_product_idfk
            WHERE 
                cc.cake_product_idfk = %s
        """
        print("Executing query:", query)
        print("Parameters:", (category_id,))
        cur.execute(query, (category_id,))
    else:
        # Fetch all products if no category_id is provided
        query = """
            SELECT 
                cp.product_id, cp.product_name, cp.product_photo, cp.product_price, cc.category_name 
            FROM 
                cake_products cp
            LEFT JOIN 
                cake_category cc 
            ON 
                cp.product_category = cc.cake_product_idfk
        """
        print("Executing query:", query)
        cur.execute(query)

    users = cur.fetchall()
    cur.close()

    return render_template('product.html', users=users)



@app.route("/blog")
def blogPage():
    cur = mysql.connection.cursor()
    cur.execute(f"SELECT * FROM blog")
    users = cur.fetchall()  # Returns a list of tuples (e.g., [('img1.jpg',), ('img2.png',)
    print("\nPrinting each row")
    cur.close()
    return render_template('blog.html', users=users)

@app.route("/contact",methods=['GET', 'POST'])
def contactPage():
    if request.method == 'POST':
      name = request.form['name']
      email = request.form['email']
      message = request.form['message']
    
    # Insert the new contact into the database
      cur = mysql.connection.cursor()
      cur.execute("""
        INSERT INTO contact (name, email, message)
        VALUES (%s, %s, %s)
    """, (name, email, message))
      mysql.connection.commit()
      if name:
        # Return all comments (including the new one) as JSON
        return jsonify({
            'message': 'Comment submitted successfully!',
            'comments': name
        })
      else:
         return jsonify({'message': 'Failed to submit comment'}), 400
    return render_template('contact.html')

@app.route("/blog-details", methods=['GET', 'POST'])
def blog_detailsPage():
     id = request.args.get('id')
     cur = mysql.connection.cursor()
     cur.execute(f"select blog_title,blog_id, blog_image, blog_body,blog_time, blog_author from blog where blog_id = '{id}'")
     user= cur.fetchone()

     #For blog Category
     cur.execute(f"SELECT * FROM blog_comments where blog_id_fk = '{id}' ORDER BY blog_comment_time DESC;")
     comments = cur.fetchall()  # Returns a list of tuples (e.g., [('img1.jpg',), ('img2.png',)
     print("\nPrinting each row")
     cur.close()
     if not user:
        return "User not found", 404
        
        
     return render_template('blog-details.html',user=user, comments=comments)



@app.route('/submit-comment', methods=['POST'])
def submit_comment():
    comment_author = request.form['comment_author']
    blog_comment = request.form['blog_comment']
    blog_id_fk = request.form['blog_id_fk']
    
    # Insert the new comment into the database
    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO blog_comments (blog_comment, blog_id_fk, comment_author, blog_comment_time)
        VALUES (%s, %s, %s, NOW())
    """, (blog_comment, blog_id_fk, comment_author))
    mysql.connection.commit()

    # Fetch all comments for the blog, ordered by the most recent first
    cur.execute("""
        SELECT blog_comment, blog_comment_id, blog_id_fk, comment_author, blog_comment_time
        FROM blog_comments
        WHERE blog_id_fk = %s
        ORDER BY blog_comment_time DESC
    """, (blog_id_fk,))
    
    comments = cur.fetchone()
    cur.close()
    
    if comments:
        # Return all comments (including the new one) as JSON
        return jsonify({
            'message': 'Comment submitted successfully!',
            'comments': comments
        })
    else:
        return jsonify({'message': 'Failed to submit comment'}), 400
    




#Admin Code, React as the Admin-frontend
@app.route('/admin', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    return render_template('admin/index.html')
# Serve React index.html for the /admin and other frontend routes
@app.route('/api/admin-dashboard', methods=['GET'])
def get_admin_dashboard_data():
    cur = mysql.connection.cursor()
    cur.execute("SELECT customer_name, customer_phone, customer_order, customer_order_id, order_status FROM customer_order")
    users = cur.fetchall()  # Example: [('John', '123456789', 'Cake', 1, 'Delivered'), ...]
    cur.close()
    
    # Format the data into a list of dictionaries for React
    users_list = [
        {
            "name": row[0],
            "phone": row[1],
            "order": row[2],
            "order_id": row[3],
            "status": row[4]
        }
        for row in users
    ]
    return jsonify(users_list)

#Updates the order status
@app.route('/api/update-status', methods=['POST'])
def update_status():
    data = request.json
    order_id = data.get('order_id')
    status = data.get('status')

    try:
        cur = mysql.connection.cursor()
        cur.execute("UPDATE customer_order SET order_status = %s WHERE customer_order_id = %s", (status, order_id))
        mysql.connection.commit()
        cur.close()

        return jsonify({"success": True, "message": "Order status updated successfully"})
    except Exception as e:
        print("Error updating order status:", e)
        return jsonify({"success": False, "message": "Failed to update order status"}), 500


# Serve static files (e.g., assets)
@app.route('/static/dist/<path:filename>')
def serve_static(filename):
    return send_from_directory('static/dist', filename)


#For AdminOrder page
@app.route('/api/admin-dashboard', methods=['GET'])
def get_orders():
    if 'admin_id' not in session:
        return redirect(url_for('admin/admin_login'))
    conn = mysql.connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_order")  # Fetch all orders from the orders table
    orders = cursor.fetchall()
    
    # Return orders in JSON format
    return jsonify([
        {
            'customer_order_id': order[0],
            'customer_name': order[1],
            'customer_phone': order[2],
            'customer_order': order[3],
            'order_status': order[4],
        }
        for order in orders
    ])




@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        cur = mysql.connection.cursor()
        cur.execute("SELECT admin_username, admin_password, email, admin_id FROM admin_register WHERE admin_username = %s", (username,))
        admin = cur.fetchone()
        cur.close()

        if admin and check_password_hash(admin[1], password):
            session['admin_id'] = admin[3]
            session['admin_username'] = admin[0]
            flash('Login successful!', 'success')
            return redirect('/admin-dashboard')
        else:
            if not admin:
                flash('Invalid username', 'danger')
            else:
                flash('Invalid password', 'danger')

    return render_template('admin/admin_login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route("/test-display", methods=['GET', 'POST'])
def product_formPage():
    cur = mysql.connection.cursor()
    cur.execute(f"SELECT * FROM cake_products")
    users = cur.fetchall()  # Returns a list of tuples (e.g., [('img1.jpg',), ('img2.png',)
    print("\nPrinting each row")
    cur.close()
    return render_template('admin/test.html', users=users) 

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"  # HTTP 1.1.
    response.headers["Pragma"] = "no-cache"  # HTTP 1.0.
    response.headers["Expires"] = "0"  # Proxies.
    return response
    
#Adding Product Category
@app.route("/add-category", methods=["POST"])
def add_category():
    data = request.get_json()
    category_name = data.get("category_name")

    if not category_name:
        return jsonify({"error": "Category name is required"}), 400

    try:
        cur = mysql.connection.cursor()

        # Get the next value for `cake_product_idfk`
        cur.execute("SELECT IFNULL(MAX(cake_product_idfk), 0) + 1 AS next_id FROM cake_category")
        next_id = cur.fetchone()[0]

        # Insert the new category with the calculated `cake_product_idfk`
        cur.execute(
            "INSERT INTO cake_category (category_name, cake_product_idfk) VALUES (%s, %s)",
            (category_name, next_id)
        )
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Category added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# Adding Blog Category
@app.route("/blog-category", methods=["POST"])
def add_blog_category():
    data = request.get_json()
    category_name = data.get("category_name")

    if not category_name:
        return jsonify({"error": "Category name is required"}), 400

    try:
        cur = mysql.connection.cursor()

        # Insert the new category, let MySQL handle the auto-increment ID
        cur.execute(
            "INSERT INTO blog_category (category_name) VALUES (%s)",
            (category_name,)
        )
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Category added successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Fetch all categories
@app.route("/get-categories", methods=["GET"])
def get_categories():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT blog_category_id, category_name FROM blog_category")
        categories = cur.fetchall()  # Returns a list of tuples
        cur.close()

        # Convert tuples to dictionaries
        categories_list = [{"blog_category_id": row[0], "category_name": row[1]} for row in categories]

        return jsonify({"categories": categories_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#Uploaded Blogs
@app.route("/get-blogs", methods=["GET"])
def get_blogs():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT b.blog_id, b.blog_title, b.blog_body, b.blog_author, b.blog_time, b.blog_image, c.category_name
            FROM blog b
            JOIN blog_category c ON b.blog_category_id_fk = c.blog_category_id
        """)
        blogs = cur.fetchall()
        cur.close()

        return jsonify({
            "blogs": [
                {
                    "blog_id": row[0],
                    "blog_title": row[1],
                    "blog_body": row[2],
                    "blog_author": row[3],
                    "blog_time": row[4],
                    "blog_image": row[5],
                    "category_name": row[6]
                }
                for row in blogs
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



#Uploading Products
# Configure the image upload folder
@app.route("/upload-product", methods=['POST'])
def upload_product():
    if request.method == "POST":
        # Check if files are in the request
        if 'image' not in request.files:
            return jsonify({"error": "No image file found in the request"}), 400

        image = request.files["image"]

        # Check if the image has a filename
        if image.filename == "":
            return jsonify({"error": "Image must have a filename"}), 400

        # Secure the filename and ensure it's unique by adding a timestamp
        filename = secure_filename(image.filename)
        image_path = os.path.join(app.config["IMAGE_UPLOADS"], filename)

        # Check if the file already exists, and if it does, modify the filename
        if os.path.exists(image_path):
            # Modify filename by adding a timestamp to avoid collision
            name, extension = os.path.splitext(filename)
            timestamp = int(time.time())  # Use current timestamp
            filename = f"{name}_{timestamp}{extension}"
            image_path = os.path.join(app.config["IMAGE_UPLOADS"], filename)

        # Save the image
        image.save(image_path)

        # Retrieve other product details from form data
        product_name = request.form.get('product_name')
        product_price = request.form.get('product_price')
        product_category = request.form.get('product_category')  # This will now receive category_id

        # Ensure all form fields are provided
        if not product_name or not product_price or not product_category:
            return jsonify({"error": "Missing product details"}), 400

        # Insert product details into MySQL database securely using parameterized queries
        try:
            cur = mysql.connection.cursor()
            cur.execute(
                """
                INSERT INTO cake_products (product_name, product_price, product_photo, product_category, product_Date) 
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (product_name, product_price, filename, product_category)
            )
            mysql.connection.commit()
            cur.close()

            return jsonify({"message": "Product uploaded successfully!"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "Invalid request method. Use POST to upload a product."}), 405




#Fetching Category from cake_category table
@app.route("/cake-categories", methods=["GET"])
def get_cake_categories():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT cake_product_idfk, category_name FROM cake_category")
        categories = cur.fetchall()
        cur.close()

        # Transform the categories into a list of dictionaries
        categories_list = [
            {"cake_product_idfk": row[0], "category_name": row[1]} for row in categories
        ]

        return jsonify(categories_list), 200  # Return JSON data
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/img/upload_folder/<filename>')
def serve_image(filename):
    return send_from_directory('static/img/upload_folder', filename)





#Uploaded Products
@app.route("/delete-product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        cur = mysql.connection.cursor()
        # Fetch the product's image filename before deleting
        cur.execute("SELECT product_photo FROM cake_products WHERE product_id = %s", (product_id,))
        product = cur.fetchone()
        
        if product:
            image_path = os.path.join(app.config["IMAGE_UPLOADS"], product[0])
            if os.path.exists(image_path):
                os.remove(image_path)  # Remove the image from the filesystem
            
            # Delete the product from the database
            cur.execute("DELETE FROM cake_products WHERE product_id = %s", (product_id,))
            mysql.connection.commit()
            return jsonify({"message": "Product deleted successfully"}), 200
        else:
            return jsonify({"error": "Product not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# Endpoint to update a product
@app.route("/update-product/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    try:
        # Parse input data
        data = request.form
        product_name = data.get("product_name")
        product_price = data.get("product_price")
        product_category = data.get("product_category")  # Expecting the category ID (cake_product_idfk)
        image = request.files.get("image")

        # Log incoming product details
        print(f"Updating product ID: {product_id}")
        print(f"Product Name: {product_name}")
        print(f"Product Price: {product_price}")
        print(f"Product Category (ID): {product_category}")
        if image:
            print(f"New Image Uploaded: {image.filename}")
        else:
            print("No new image uploaded. Retaining current image.")

        if not product_name or not product_price or not product_category:
            return jsonify({"error": "Missing product details"}), 400

        # Check if the provided category exists in the cake_category table
        with mysql.connection.cursor() as cur:
            cur.execute("SELECT * FROM cake_category WHERE cake_product_idfk = %s", (product_category,))
            category = cur.fetchone()
            if not category:
                print(f"Category ID {product_category} not found in the database.")
                return jsonify({"error": "Category not found"}), 400

            # Check if product exists
            cur.execute("SELECT product_photo FROM cake_products WHERE product_id = %s", (product_id,))
            product = cur.fetchone()
            if not product:
                print(f"Product ID {product_id} not found in the database.")
                return jsonify({"error": "Product not found"}), 404

            # Log current image from the database
            old_image_filename = product[0]
            print(f"Current Image in Database: {old_image_filename}")

            # Handle image update
            if image:
                # Remove the old image if it exists
                if old_image_filename:
                    old_image_path = os.path.join(app.config["IMAGE_UPLOADS"], old_image_filename)
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                        print(f"Deleted old image: {old_image_filename}")

                # Save the new image
                image_filename = secure_filename(image.filename)
                image.save(os.path.join(app.config["IMAGE_UPLOADS"], image_filename))
                print(f"New image saved as: {image_filename}")
            else:
                # Retain the old image filename if no new image is uploaded
                image_filename = old_image_filename
                print("Retaining the existing image filename.")

            # Update the product in the database
            cur.execute(
                """
                UPDATE cake_products 
                SET product_name = %s, product_price = %s, product_category = %s, product_photo = %s 
                WHERE product_id = %s
                """,
                (product_name, product_price, product_category, image_filename, product_id)
            )
            mysql.connection.commit()

        # Construct the image URL to send back to the frontend
        image_url = f"http://127.0.0.1:5000/static/img/upload_folder/{image_filename}"
        print(f"Updated product image URL: {image_url}")
        
        return jsonify({"message": "Product updated successfully", "image_url": image_url}), 200

    except Exception as e:
        print(f"Error while updating product: {str(e)}")
        return jsonify({"error": str(e)}), 500





@app.route("/uploaded-products", methods=["GET"])
def get_uploaded_products():
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT 
                p.product_id, 
                p.product_name, 
                p.product_price, 
                p.product_date,
                p.product_photo, 
                c.category_name AS category_name,
                p.product_category AS product_category  -- Added this to include the product_category
            FROM 
                cake_products p 
            JOIN 
                cake_category c 
            ON 
                p.product_category = c.cake_product_idfk
            """
        )
        products = cur.fetchall()
        product_list = [
            {
                "product_id": row[0],
                "product_name": row[1],
                "product_price": row[2],
                "product_date": row[3],
                "product_photo": row[4],
                "category_name": row[5],
                "product_category": row[6],  # Added to include the product_category column
            }
            for row in products
        ]
        return jsonify(product_list), 200
    except Exception as e:
        print(f"Error in /uploaded-products: {str(e)}")  # Log the error in the console
        return jsonify({"error": "Failed to fetch products", "details": str(e)}), 500
    finally:
        cur.close()




#Adding blog
@app.route("/upload-blog", methods=["POST"])
def upload_blog():
    data = request.form
    blog_title = data.get("blog_title")
    blog_body = data.get("blog_body")
    blog_author = data.get("blog_author")
    blog_image = request.files.get("blog_image")
    blog_category_id_fk = data.get("blog_category_id_fk")

    if not blog_title or not blog_body or not blog_author or not blog_image or not blog_category_id_fk:
        return jsonify({"error": "Please fill in all fields."}), 400

    try:
        cur = mysql.connection.cursor()

        # Insert the new blog
        cur.execute(
            "INSERT INTO blog (blog_title, blog_body, blog_author, blog_image, blog_category_id_fk) "
            "VALUES (%s, %s, %s, %s, %s)",
            (blog_title, blog_body, blog_author, blog_image, blog_category_id_fk)
        )
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Blog uploaded successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
 #Updating Blogs   
@app.route("/update-blog/<int:blog_id>", methods=["PUT"])
def update_blog(blog_id):
    try:
        blog_title = request.form.get("blog_title")
        blog_body = request.form.get("blog_body")
        blog_category_id_fk = request.form.get("blog_category_id_fk")
        blog_image = request.files.get("blog_image")

        cur = mysql.connection.cursor()

        if blog_image:
            image_filename = secure_filename(blog_image.filename)
            blog_image.save(os.path.join("static/img/upload_folder", image_filename))
            cur.execute("""
                UPDATE blog 
                SET blog_title = %s, blog_body = %s, blog_category_id_fk = %s, blog_image = %s 
                WHERE blog_id = %s
            """, (blog_title, blog_body, blog_category_id_fk, image_filename, blog_id))
        else:
            cur.execute("""
                UPDATE blog 
                SET blog_title = %s, blog_body = %s, blog_category_id_fk = %s 
                WHERE blog_id = %s
            """, (blog_title, blog_body, blog_category_id_fk, blog_id))

        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Blog updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
#Deleting Blog
@app.route("/delete-blog/<int:blog_id>", methods=["DELETE"])
def delete_blog(blog_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM blog WHERE blog_id = %s", (blog_id,))
        mysql.connection.commit()
        cur.close()
        return jsonify({"message": "Blog deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

#Fetching Contacts
@app.route("/get-contacts", methods=["GET"])
def get_contacts():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT contact_id, name, email, message FROM contact")
        contacts = cur.fetchall()
        cur.close()

        return jsonify({
            "contacts": [
                {
                    "contact_id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "message": row[3]
                }
                for row in contacts
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get-subscribers", methods=["GET"])
def get_subscribers():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT email, subscription_time, subscription_id FROM subscription")
        subscribers = cur.fetchall()
        cur.close()

        return jsonify({
            "subscribers": [
                {
                    "email": row[0],
                    "subscription_time": row[1],
                    "subscription_id": row[2]
                }
                for row in subscribers
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

#Getting cake categories and blog categories
@app.route("/cake2-categories", methods=["GET"])
def get_cake2_categories():
    cur = mysql.connection.cursor()
    cur.execute("SELECT category_id, category_name FROM cake_category")
    categories = cur.fetchall()
    cur.close()
    return jsonify([{"category_id": cat[0], "category_name": cat[1]} for cat in categories])

@app.route("/blog-categories", methods=["GET"])
def get_blog_categories():
    cur = mysql.connection.cursor()
    cur.execute("SELECT blog_category_id, category_name FROM blog_category")
    categories = cur.fetchall()
    cur.close()
    return jsonify([{"blog_category_id": cat[0], "category_name": cat[1]} for cat in categories])

@app.route("/edit-cake-category/<int:id>", methods=["PUT"])
def edit_cake_category(id):
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("UPDATE cake_category SET category_name = %s WHERE category_id = %s", (data["category_name"], id))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Cake category updated successfully"})

@app.route("/edit-blog-category/<int:id>", methods=["PUT"])
def edit_blog_category(id):
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("UPDATE blog_category SET category_name = %s WHERE blog_category_id = %s", (data["category_name"], id))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Blog category updated successfully"})

@app.route("/delete-cake-category/<int:id>", methods=["DELETE"])
def delete_cake_category(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM cake_category WHERE category_id = %s", (id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Cake category deleted successfully"})

@app.route("/delete-blog-category/<int:id>", methods=["DELETE"])
def delete_blog_category(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM blog_category WHERE blog_category_id = %s", (id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Blog category deleted successfully"})




if __name__ == '__main__':
    app.run(debug=True)







    