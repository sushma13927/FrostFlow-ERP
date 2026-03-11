# FrostFlow ERP - Cold Storage Management System
## Database Management Systems Course Activity

**A Mini Project on Cold Storage ERP & Inventory Management**

**Submitted by:** G.Sushma Siri (24B01A4607)  
**B.Tech II year II semester**  
**Under the guidance of:** Dr.P.Sri Ram Chandra B.Tech., M.Tech., Ph.D.  
**Computer Science and Engineering**  
**Shri Vishnu Engineering College for Women (A)**

---

## INDEX:
1. Case Study
2. Entities and Attributes
3. ER Diagram
4. Database Schema
5. System Architecture
6. Use Case Diagram
7. Activity Diagram
8. Modules and Description
9. Screenshots
10. Future Enhancements
11. Conclusion

---

## 1. Case Study of the Project:
The **FrostFlow ERP** system was developed to provide a secure and efficient management experience for cold storage facilities. In many traditional storage systems, tracking inventory across multiple suppliers and customers is manual and prone to errors. This project addresses those limitations by integrating secure authentication, role-based access control, and real-time inventory tracking within a modern web environment.

The system allows users to log in securely using encrypted (hashed) passwords. Once authenticated, the system identifies the user's role—**Inventory Manager**, **Supplier**, or **Customer**—and provides a tailored dashboard. The dashboard provides real-time insights into stock levels, pending orders, and financial balances. These preferences and data points are stored in a relational SQLite database, ensuring data integrity and persistence.

A key feature of this project is the **Role-Based Access Control (RBAC)**. Suppliers can manage their own product catalogs and supply history, while Customers can browse the marketplace and place orders. Inventory Managers have a "God-eye" view of the entire facility, monitoring total weight, capacity, and low-stock alerts.

Another major feature is the **Automated Billing and Wallet System**. The application calculates GST, total amounts, and manages a virtual wallet for customers. This demonstrates effective transaction handling and financial data processing within a web application.

The profile management module allows users to update their details and view their account status. Prepared statements are used throughout the project to prevent SQL injection attacks, ensuring secure communication with the database.

---

## 2. Entities and Attributes:

### 2.1. User Entity
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| id (PK) | INTEGER | Unique user identifier |
| username | TEXT | Unique username of the user |
| email | TEXT | Unique user email address |
| phone | TEXT | User contact number |
| password | TEXT | Hashed password for security |
| verified | INTEGER | OTP verification status (0/1) |
| balance | REAL | Virtual wallet balance |

### 2.2. User_Roles Entity
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| user_id (FK) | INTEGER | Reference to Users table |
| role | TEXT | User role (inventory, supplier, customer) |

### 2.3. Products Entity
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| id (PK) | INTEGER | Unique product identifier |
| name | TEXT | Name of the product |
| description | TEXT | Detailed description |
| price | REAL | Unit price of the product |
| supplier_id (FK) | INTEGER | Reference to the Supplier (User) |
| category | TEXT | Product category (e.g., Dairy, Meat) |

### 2.4. Inventory Entity
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| product_id (PK, FK) | INTEGER | Reference to Products table |
| quantity | REAL | Current stock quantity |
| weight | REAL | Total weight in storage |

### 2.5. Orders Entity
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| id (PK) | INTEGER | Unique order identifier |
| customer_id (FK) | INTEGER | Reference to Customer (User) |
| supplier_id (FK) | INTEGER | Reference to Supplier (User) |
| status | TEXT | Order status (pending, completed, etc.) |
| total_amount | REAL | Total cost including GST |
| gst_amount | REAL | Calculated tax amount |
| created_at | DATETIME | Timestamp of order creation |

---

## 3. ER Diagram:
The ER diagram represents the FrostFlow ERP system with 8 core entities centered around inventory and transaction management.
- **User** is the central entity, linked to **User_Roles** for access control.
- **Supplier** (a User) owns multiple **Products**.
- Each **Product** has a 1:1 relationship with its **Inventory** record.
- **Customers** (Users) place **Orders**, which contain multiple **Order_Items**.
- **Supply_History** tracks stock additions by Suppliers.
- **Notifications** are generated for users based on system events (low stock, new orders).

---

## 4. Database Schema:
- **User Table**: `id (PK), username, email, phone, password, verified, balance`
- **User_Roles Table**: `user_id (FK), role (PK)`
- **Products Table**: `id (PK), name, description, price, supplier_id (FK), category`
- **Inventory Table**: `product_id (PK, FK), quantity, weight`
- **Orders Table**: `id (PK), customer_id (FK), supplier_id (FK), status, total_amount, gst_amount, created_at`
- **Order_Items Table**: `id (PK), order_id (FK), product_id (FK), quantity, price`
- **Supply_History Table**: `id (PK), supplier_id (FK), product_id (FK), quantity, weight, timestamp`
- **Notifications Table**: `id (PK), user_id (FK), role, message, type, order_id, is_read, created_at`

---

## 5. System Architecture:
The system follows a 3-tier architecture:
1. **Presentation Layer**: Built with Vanilla JS and Tailwind CSS, providing a responsive dashboard for all roles.
2. **Application Layer**: Node.js and Express.js handle the business logic, authentication, and API routing.
3. **Database Layer**: SQLite manages the relational data, ensuring ACID compliance and fast local storage.

---

## 6. Use Case Diagram:
- **Inventory Manager**: Monitor global stats, view all suppliers/customers, manage low-stock alerts.
- **Supplier**: Add products, update stock levels, view incoming orders, receive notifications.
- **Customer**: Browse marketplace, manage cart, place orders, track order history, manage wallet.

---

## 7. Activity Diagram:
1. **Login Page**: User enters credentials.
2. **Validation**: System checks SQLite database for user and role.
3. **OTP Verification**: (Mock) User verifies account.
4. **Dashboard**: User is redirected based on role.
5. **Actions**:
   - Manager -> View Stats/Users
   - Supplier -> Supply Stock/Manage Products
   - Customer -> Browse/Order
6. **Logout**: Session is cleared and user redirected.

---

## 8. Modules and Description:
- **Auth Module**: Handles registration, login, and OTP verification.
- **Inventory Module**: Tracks real-time quantity and weight of cold storage items.
- **Supplier Module**: Allows suppliers to manage their catalog and supply chain.
- **Customer Module**: Provides a marketplace interface for browsing and ordering.
- **Billing Module**: Calculates invoices, GST, and manages virtual wallet transactions.
- **Notification Module**: Alerts users about stock levels, order updates, and system events.

---

## 9. Future Enhancements:
1. **AI-Powered Demand Forecasting**: Using Gemini API to predict stock needs.
2. **Real-Time Temperature Monitoring**: Integration with IoT sensors for cold storage health.
3. **Advanced Analytics Dashboard**: Graphical reports for sales and inventory trends.
4. **Multi-Language Support**: For broader accessibility.
5. **Payment Gateway Integration**: Real-world payment processing.

---

## 10. Conclusion:
The FrostFlow ERP project provides an efficient system for managing cold storage data, activities, and security operations. The system allows users to easily manage their roles, customize inventory, and track transactions. The database design ensures data integrity, security, and efficient storage using proper relationships and normalization. Overall, this project helps in improving data management and user experience in a structured and scalable way.
