"use client";

import { useEffect, useState } from "react";


/* API URL CONSTANT (HERE) */
const APIurl = "http://172.20.10.3:3000";

export default function Page() {

  const users=["u1", "u2", "u3"]

  const [currentUserId, setCurrentUserId] = useState("user1")
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [balances, setbalances] = useState(null);

  


  //fetch expenses
  const fetchExpenses=(groupId) => {

    const url = groupId
    ? `${APIurl}/api/expenses?groupId=${groupId}` 
    : `${APIurl}/api/expenses`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => setExpenses(data))
      .catch((err) => console.error(err));
  };

 
  //runs once page reloads
  useEffect(()=>{
    if(selectedGroupId){
      fetchExpenses(selectedGroupId)
      fetchbalances(selectedGroupId)
    }
    else{
      setExpenses([])
      setbalances(null)
    }
  },[selectedGroupId]);

  const fetchbalances = (groupId)=>{
    fetch(`${APIurl}/api/groups/${groupId}/balances` )
    .then((res)=>res.json())
    .then((data) => setbalances(data))
    .catch((err) => console.error(err));
  }



//handle form submit
const handleSubmit = (e) =>{
  e.preventDefault()

  
  const url =`${APIurl}/api/expenses`

  fetch(url,{
    method:"POST",
    headers:{
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      amount: Number(amount),
      groupId: selectedGroupId,
      paidBy: currentUserId,
      
    }),
  })
  .then(()=>{
    setTitle("")
    setAmount("")
    
    
    fetchExpenses()
  })
  .catch((err)=>console.log(err))
};


//handle Delete operation
const handleDelete = (id) =>{
  fetch(`${APIurl}/api/expenses/${id}`,{
    method: "DELETE",
  })
  .then(() => fetchExpenses())
  .catch((err)=>console.log(err))
}


 //user sends i paid 
 
 const markAsPaid =  async(expenseId) => {
   await fetch(`${APIurl}/api/expenses/${expenseId}/pay`,{
     method:"POST",
     headers:{
       "Content-Type":"application/json"
     },
     body: JSON.stringify({
       userId:currentUserId
     })
   })
   fetchExpenses()
 }

 //function for the reciever to confirm

 const confirmPayment = async(expenseId)=>{
  await fetch(`${APIurl}/api/expenses/${expenseId}/confirm`,{
    method:"POST",
    headers:{
     "Content-Type":"application/json"
    },
    body: JSON.stringify({
      userId:currentUserId
    })
  });
  fetchExpenses()
 }


 //fetch groups
 const fetchGroups = () => {
  fetch(`${APIurl}/api/groups`)
  .then((res) => res.json())
  .then((data) => setGroups(data))
  .catch((err) => console.error(err));
 }

 useEffect(()=>{
  fetchGroups();
 },[]);



  return (
    <main style={{ padding: "20px" }}>
      <h1 className="text-3xl font-bold text-green-500 py-5">Expense Tracker</h1>

      <div style = {{marginBottom: "20px"}}>
      <label>
        Current User:{" "}
        <select
        value ={currentUserId}
        onChange={(e)=>setCurrentUserId(e.target.value)}
        >
          {users.map((user)=>(
            <option key={user} value = {user} style={{color:"black"}}>
              {user}
            </option>
          ))}

        </select>
      </label>
      </div>

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

          <button type="submit" disabled={!selectedGroupId}>
            {"Add Expense"}
            </button>

            {!selectedGroupId && (
              <p style={{color: "red"}}>Please select a group first</p>
            )}
            
            {/*show buttons conditionally of confirmation*/}

        
      </form>

      <hr />


    <h2>Groups</h2>
    {groups.length === 0 && <p>No groups found</p>}
    <ul>
    {groups.map((group)=>(
      <li key={group._id}>
        <button onClick={()=>{
          if(selectedGroupId === group._id){
            console.log("closing group")
            setSelectedGroupId(null);
            setExpenses([]),
            setbalances(null)
          }
          else{ 
            console.log("opening group")
            setSelectedGroupId(group._id)
          }
         
        } }
        style={{margin: "10px"}}>
        {group.name}
        </button>
      </li>
    ))}
    </ul>
    {selectedGroupId && (
      <p style={{color: "green"}}>
        Showing expenses for group: {selectedGroupId.name}
      </p>
    )}


    <h2>Expenses</h2>

      {expenses.length === 0 && <p>No expenses found</p>}

      {expenses.map((expense)=>(
            <div key = {expense._id} style={{}}>
              <h3>{expense.title}</h3>
              
              {expense.splits.map((split)=>(
                <div key = {split.userId}>
                  <span>
                    user {split.userId} = ₹{split.share} ({split.status})
                    
                  </span>

                 

                  {/*PAY button*/}
                  {split.userId===currentUserId && split.status === "UNPAID" && (
                    <button onClick={()=>markAsPaid(expense._id)}>
                      PAY
                    </button>
                  )}

                  {/*CONFIRM button*/}
                  {expense.paidBy===currentUserId && split.status === "PAID" && (
                    <button onClick={()=>confirmPayment(expense._id)}>
                      CONFIRM
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {selectedGroupId && (
          <>
          <h2>Balances</h2>
          
          {!balances &&<p>No balances to show</p>}
          {
             balances && (
              <ul>
                {Object.entries(balances).map(([userId,amount])=>
                <li key = {userId}
                style={{
                  color: amount>0 ? "green": amount<0 ?"red": "gray",
                  fontWeight: "bold"
                }}>
                  {userId}{" "}
                  {amount>0 
                  ?`will recieve ${amount}`
                  :amount<0
                  ?`owes ${Math.abs(amount)}`
                  :"is settled"
                  }

                </li>
                )}
              </ul>
            )
          }
          </>
        )}

        {selectedGroupId && balances &&(
          <button
            className="mt-5 px-4 bg-black text-white"
            onClick={async ()=> {

              console.log("Settle Clicked", selectedGroupId)
              const res = await fetch(`${APIurl}/api/groups/${selectedGroupId}/settle`,{
                method:"POST"
              })

              console.log("Settle Res status ", res.status)
              fetchExpenses(selectedGroupId)
              fetchbalances(selectedGroupId)
            }}>
              Settle Up Balances
          </button>
        )}
      {/* <ul>

        {expenses.map((expense) => (
          <li key={expense._id}>
            {expense.title} — ₹{expense.amount} 

            
            <button
            style = {{margin: "10px"}}
            onClick ={()=>handleDelete(expense._id)} 
            >
              Delete
            </button>

            <button 
            style={{margin: "10px"}}
            onClick={()=>handleEdit(expense)}
            >
              Edit
            </button>
            

          </li>

          
        ))}
      </ul> */}



    </main>
  );
}


