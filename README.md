# Expense Tracker (Splitwise-like Application)

A full-stack expense tracking application inspired by Splitwise.  
Users can create groups, add expenses, split costs equally or custom-wise, track balances, and settle group expenses securely using authentication.

---

## 🚀 Features

- User Authentication (Register & Login using JWT)
- Create Groups (Trips, Roommates, Friends, etc.)
- Add Expenses inside Groups
- Split Expenses:
  - Equal split
  - Custom split (amount or percentage)
- Track who owes whom (Balances)
- Mark expenses as Paid & Confirmed
- Settle an entire group
- Protected APIs using JWT Authentication
- Real-time balance updates

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- React Hooks
- Tailwind CSS
- Fetch API

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt (password hashing)

---

## 🔐 Authentication Flow

1. User registers using email & password
2. Password is hashed using bcrypt
3. User logs in → JWT token is generated
4. Token is stored in `localStorage`
5. Token is sent in `Authorization` header for protected routes

---

## 📌 Group Workflow

1. User creates a group
2. Creator is automatically added as a member
3. Members can be added later
4. Expenses are always linked to a group

---

## 💸 Expense Workflow

- Expense includes:
  - title
  - amount
  - groupId
  - paidBy (logged-in user)
  - splits

### Equal Split
Amount is divided equally among all group members.

### Custom Split
User can:
- Select who participates
- Split by amount or percentage
- Backend validates that split total = expense amount

---

## 📊 Balance Calculation

Balances are calculated by:
- Subtracting unpaid shares from users
- Adding shares to the payer
- Ignoring CONFIRMED splits

---

## 🧾 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Groups
- `POST /api/groups`
- `GET /api/groups`
- `POST /api/groups/:groupId/settle`

### Expenses
- `POST /api/expenses`
- `GET /api/expenses?groupId=`
- `POST /api/expenses/:expenseId/pay`
- `POST /api/expenses/:expenseId/confirm`

---

## ⚠️ Important Validations

- Only group members can add expenses
- PaidBy must be included in splits
- Split total must equal expense amount
- No expenses allowed after group is settled
- All protected routes require JWT

---

## 🧠 Learning Outcomes

- Full-stack architecture
- JWT-based authentication
- MongoDB relational modeling
- Business logic for expense splitting
- State management in React
- Secure API design

---

## 📌 Future Enhancements

- Invite users via email
- User profile pages
- Notifications
- Expense categories
- Payment gateway integration
- Mobile-friendly UI

---

## 👨‍💻 Author

**Laksh Kapoor**  
Built as a learning-driven full-stack project inspired by Splitwise.