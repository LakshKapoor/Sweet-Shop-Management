"use client";

import { useEffect, useState } from "react";
import { useStyleRegistry } from "styled-jsx";

/* API URL CONSTANT (HERE) */
const APIurl = "http://172.25.9.156:3000";

export default function Page() {
  const [expenses, setExpenses] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  //fetch expenses
  const fetchExpenses=() => {
    fetch(`${APIurl}/api/expenses`)
      .then((res) => res.json())
      .then((data) => setExpenses(data))
      .catch((err) => console.error(err));
  };

  //runs once page reloads
  useEffect(()=>{
    fetchExpenses();
  },[]);

//handle form submit
const handleSubmit = (e) =>{
  e.preventDefault()
  fetch(`${APIurl}/api/expenses`,{
    method: "POST",
    headers:{
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      amount: Number(amount),
      category,
    }),
  })
  .then(()=>{
    setTitle("")
    setAmount("")
    setCategory("")
    fetchExpenses()
  })
  .catch((err)=>console.log(err))
};

  return (
    <main style={{ padding: "20px" }}>
      <h1>Expense Tracker</h1>

      <form onSubmit ={handleSubmit}>
        <input
          placeholder="Title"
          value ={title}
          onChange = {(e)=>setTitle(e.target.value)}
          />

        <br />

        <input
        type="number"
          placeholder="Amount"
          value ={amount}
          onChange = {(e)=>setAmount(e.target.value)}
          />

        <br />

        <input
          placeholder="Category"
          value ={category}
          onChange = {(e)=>setCategory(e.target.value)}
          />

          <br />

          <button type="submit">Add Expense</button>
      </form>


      <hr />

      {expenses.length === 0 && <p>No expenses found</p>}

      <ul>
        {expenses.map((expense) => (
          <li key={expense._id}>
            {expense.title} — ₹{expense.amount}
          </li>
        ))}
      </ul>
    </main>
  );
}


