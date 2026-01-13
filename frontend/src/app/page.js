"use client";

import { useEffect, useState } from "react";


/* API URL CONSTANT (HERE) */
const APIurl = "http://172.20.10.3:3000";

export default function Page() {

  const users=["u1", "u2", "u3"]

  const [currentUserId, setCurrentUserId] = useState("u1")
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [balances, setBalances] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const selectedGroup = groups.find(
    (group) => group._id === selectedGroupId
  )
  


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
      setBalances(null)
    }
  },[selectedGroupId]);

  const fetchbalances = (groupId)=>{
    fetch(`${APIurl}/api/groups/${groupId}/balances` )
    .then((res)=>res.json())
    .then((data) => setBalances(data))
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
    
    
    fetchExpenses(selectedGroupId)
    fetchbalances(selectedGroupId)
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
   fetchExpenses(selectedGroupId)
   fetchbalances(selectedGroupId)
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
  fetchExpenses(selectedGroupId)
  fetchbalances(selectedGroupId)
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

 //handle group creation
 const handleCreateGroup = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!groupName.trim()) {
    alert("Please enter a group name");
    return;
  }
  
  if (selectedMembers.length === 0) {
    alert("Please select at least one member");
    return;
  }

  setIsCreatingGroup(true);

  try {
    const response = await fetch(`${APIurl}/api/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: groupName.trim(),
        members: selectedMembers,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create group");
    }

    // Clear form
    setGroupName("");
    setSelectedMembers([]);
    
    // Refresh groups list
    fetchGroups();
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to create group. Please try again.");
  } finally {
    setIsCreatingGroup(false);
  }
 };

 //handle member selection (checkboxes)
 const handleMemberToggle = (userId) => {
  setSelectedMembers((prev) => {
    if (prev.includes(userId)) {
      return prev.filter((id) => id !== userId);
    } else {
      return [...prev, userId];
    }
  });
 };

 //handle member selection (multi-select)
 const handleMultiSelectChange = (e) => {
  const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
  setSelectedMembers(selectedOptions);
 };



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

          <button type="submit" 
          disabled={!selectedGroupId || selectedGroup?.status === "SETTLED"}>
            {"Add Expense"}
            </button>

            {!selectedGroupId && (
              <p style={{color: "red"}}>Please select a group first</p>
            )}

            {selectedGroup?.status === "SETTLED" && (
              <p style={{color: "red"}}>The group is settled. no new expenses allowed</p>
            )}
            
            {/*show buttons conditionally of confirmation*/}

        
      </form>

      <hr />

      <h2>Create Group</h2>
      <form onSubmit={handleCreateGroup} style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Group Name:{" "}
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ padding: "5px", marginLeft: "5px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>Select Members:</label>
          
          {/* Checkboxes */}
          <div style={{ marginBottom: "10px" }}>
            <strong>Checkboxes:</strong>
            {users.map((user) => (
              <label key={user} style={{ display: "block", marginLeft: "20px", marginTop: "5px" }}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user)}
                  onChange={() => handleMemberToggle(user)}
                />
                {" "}{user}
              </label>
            ))}
          </div>

          {/* Multi-select dropdown */}
          <div>
            <strong>Multi-select Dropdown:</strong>
            <select
              multiple
              value={selectedMembers}
              onChange={handleMultiSelectChange}
              style={{ 
                padding: "5px", 
                marginTop: "5px", 
                minHeight: "80px",
                width: "200px"
              }}
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "12px", color: "gray", marginTop: "5px" }}>
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
          style={{
            padding: "8px 16px",
            backgroundColor: isCreatingGroup ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isCreatingGroup ? "not-allowed" : "pointer",
          }}
        >
          {isCreatingGroup ? "Creating..." : "Create Group"}
        </button>

        {!groupName.trim() && (
          <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
            Group name is required
          </p>
        )}
        {selectedMembers.length === 0 && groupName.trim() && (
          <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
            Please select at least one member
          </p>
        )}
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
            setBalances(null)
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


