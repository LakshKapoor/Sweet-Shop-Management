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
  const [expenseSplits, setExpenseSplits] = useState({}); // {userId: amount}
  const [splitMode, setSplitMode] = useState("equal"); // "equal" or "custom"
  const [splitUsers, setSplitUsers] = useState([]); // Users selected for splitting
  const [splitType, setSplitType] = useState("amount"); // "amount" or "percentage"
  const [splitPercentages, setSplitPercentages] = useState({}); // {userId: percentage}

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

  if(!selectedGroupId || !selectedGroup){
    alert("Please select a group first");
    return;
  }

  if(!title.trim() || !amount || Number(amount) <= 0){
    alert("Please enter a valid title and amount");
    return;
  }

  let splits = null;

  if(splitMode === "custom"){
    // Validate selected users
    if(splitUsers.length === 0){
      alert("Please select at least one user to split the expense");
      return;
    }

    // Check if paidBy is in selected users
    if(!splitUsers.includes(currentUserId)){
      alert("You must be included in the split since you paid");
      return;
    }

    // Get amounts for selected users only
    const splitAmounts = splitUsers.map(userId => ({
      userId,
      share: Number(expenseSplits[userId] || 0)
    })).filter(split => split.share > 0);

    if(splitAmounts.length === 0){
      alert("Please set amounts for at least one user");
      return;
    }

    const splitSum = splitAmounts.reduce((sum, split) => sum + split.share, 0);
    const totalAmount = Number(amount);

    if(Math.abs(splitSum - totalAmount) > 0.01){
      alert(`Split amounts (₹${splitSum.toFixed(2)}) must equal total amount (₹${totalAmount.toFixed(2)})`);
      return;
    }

    splits = splitAmounts;
  }
  
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
      splits: splits
    }),
  })
  .then(()=>{
    setTitle("")
    setAmount("")
    setExpenseSplits({})
    setSplitMode("equal")
    setSplitUsers([])
    setSplitPercentages({})
    setSplitType("amount")
    
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

 //handle expense split amount change
 const handleSplitAmountChange = (userId, value) => {
  setExpenseSplits(prev => ({
    ...prev,
    [userId]: value === "" ? "" : Number(value)
  }));
 };

 //handle split mode change
 const handleSplitModeChange = (mode) => {
  setSplitMode(mode);
  if(mode === "equal"){
    setExpenseSplits({});
    setSplitUsers([]);
    setSplitPercentages({});
  } else {
    // Initialize with all group members selected
    if(selectedGroup){
      setSplitUsers([...selectedGroup.members]);
      // Initialize with equal split
      if(amount && selectedGroup.members.length > 0){
        const equalAmount = Number((Number(amount) / selectedGroup.members.length).toFixed(2));
        const equalPercentage = Number((100 / selectedGroup.members.length).toFixed(2));
        const initialSplits = {};
        const initialPercentages = {};
        selectedGroup.members.forEach(member => {
          initialSplits[member] = equalAmount;
          initialPercentages[member] = equalPercentage;
        });
        setExpenseSplits(initialSplits);
        setSplitPercentages(initialPercentages);
      } else {
        const initialSplits = {};
        const initialPercentages = {};
        selectedGroup.members.forEach(member => {
          initialSplits[member] = 0;
          initialPercentages[member] = 0;
        });
        setExpenseSplits(initialSplits);
        setSplitPercentages(initialPercentages);
      }
    }
  }
 };

 //handle split user toggle
 const handleSplitUserToggle = (userId) => {
  setSplitUsers(prev => {
    if(prev.includes(userId)){
      // Remove user
      const newUsers = prev.filter(id => id !== userId);
      setExpenseSplits(prevSplits => {
        const newSplits = {...prevSplits};
        delete newSplits[userId];
        return newSplits;
      });
      setSplitPercentages(prevPerc => {
        const newPerc = {...prevPerc};
        delete newPerc[userId];
        return newPerc;
      });
      return newUsers;
    } else {
      // Add user
      const newUsers = [...prev, userId];
      // Recalculate splits for all selected users
      if(amount && newUsers.length > 0){
        const equalAmount = Number((Number(amount) / newUsers.length).toFixed(2));
        const equalPercentage = Number((100 / newUsers.length).toFixed(2));
        const newSplits = {...expenseSplits};
        const newPerc = {...splitPercentages};
        newUsers.forEach(member => {
          if(!newSplits[member]){
            newSplits[member] = equalAmount;
            newPerc[member] = equalPercentage;
          }
        });
        // Recalculate all to be equal
        newUsers.forEach(member => {
          newSplits[member] = equalAmount;
          newPerc[member] = equalPercentage;
        });
        setExpenseSplits(newSplits);
        setSplitPercentages(newPerc);
      }
      return newUsers;
    }
  });
 };

 //handle percentage change
 const handlePercentageChange = (userId, value) => {
  setSplitPercentages(prev => ({
    ...prev,
    [userId]: value === "" ? "" : Number(value)
  }));
  
  // Auto-calculate amount from percentage
  if(amount && value !== ""){
    const percentage = Number(value);
    const calculatedAmount = Number((Number(amount) * percentage / 100).toFixed(2));
    setExpenseSplits(prev => ({
      ...prev,
      [userId]: calculatedAmount
    }));
  }
 };

 //handle split type change
 const handleSplitTypeChange = (type) => {
  setSplitType(type);
  if(type === "percentage" && amount && splitUsers.length > 0){
    // Convert current amounts to percentages
    const total = calculateSplitSum();
    if(total > 0){
      const newPercentages = {};
      splitUsers.forEach(userId => {
        const amount = Number(expenseSplits[userId] || 0);
        newPercentages[userId] = Number((amount / total * 100).toFixed(2));
      });
      setSplitPercentages(newPercentages);
    }
  }
 };

 // Auto-update splits when amount changes in custom mode (only if splits are currently equal)
 useEffect(() => {
  if(splitMode === "custom" && splitUsers.length > 0 && amount){
    const equalAmount = Number((Number(amount) / splitUsers.length).toFixed(2));
    const equalPercentage = Number((100 / splitUsers.length).toFixed(2));
    
    // Check if current splits are equal (user hasn't customized)
    const allEqual = splitUsers.every(member => {
      const current = Number(expenseSplits[member] || 0);
      return Math.abs(current - equalAmount) < 0.01 || current === 0;
    });
    
    if(allEqual){
      const newSplits = {};
      const newPerc = {};
      splitUsers.forEach(member => {
        newSplits[member] = equalAmount;
        newPerc[member] = equalPercentage;
      });
      setExpenseSplits(newSplits);
      setSplitPercentages(newPerc);
    } else if(splitType === "percentage"){
      // Update amounts from percentages
      const newSplits = {};
      splitUsers.forEach(member => {
        const perc = Number(splitPercentages[member] || 0);
        newSplits[member] = Number((Number(amount) * perc / 100).toFixed(2));
      });
      setExpenseSplits(newSplits);
    }
  }
 }, [amount, splitMode, splitUsers.length, splitType]);

 //calculate split sum
 const calculateSplitSum = () => {
  return Object.values(expenseSplits).reduce((sum, val) => sum + (Number(val) || 0), 0);
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

      <form onSubmit ={handleSubmit} style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Title
          </label>
        <input
            placeholder="Expense title"
          value ={title}
          onChange = {(e)=>setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Amount (₹)
          </label>
        <input
        type="number"
            placeholder="0.00"
          value ={amount}
          onChange = {(e)=>setAmount(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>

        {selectedGroupId && selectedGroup && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
              Split Mode
            </label>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "15px", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="equal"
                  checked={splitMode === "equal"}
                  onChange={(e) => handleSplitModeChange(e.target.value)}
                  style={{ marginRight: "5px" }}
                />
                Equal Split
              </label>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  value="custom"
                  checked={splitMode === "custom"}
                  onChange={(e) => handleSplitModeChange(e.target.value)}
                  style={{ marginRight: "5px" }}
                />
                Custom Split
              </label>
            </div>

            {splitMode === "custom" && amount && selectedGroup && (
              <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                {/* User Selection */}
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                    Select Users to Split With:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedGroup.members.map((member) => (
                      <label 
                        key={member} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "5px",
                          padding: "5px 10px",
                          backgroundColor: splitUsers.includes(member) ? "#e3f2fd" : "#fff",
                          border: `2px solid ${splitUsers.includes(member) ? "#2196f3" : "#ccc"}`,
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: member === currentUserId ? "bold" : "normal"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={splitUsers.includes(member)}
                          onChange={() => handleSplitUserToggle(member)}
                          style={{ cursor: "pointer" }}
                        />
                        {member} {member === currentUserId && "(You)"}
                      </label>
                    ))}
                  </div>
                </div>

                {splitUsers.length > 0 && (
                  <>
                    {/* Split Type Selection */}
                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        Split Type:
                      </label>
                      <div style={{ display: "flex", gap: "15px" }}>
                        <label style={{ cursor: "pointer" }}>
                          <input
                            type="radio"
                            value="amount"
                            checked={splitType === "amount"}
                            onChange={(e) => handleSplitTypeChange(e.target.value)}
                            style={{ marginRight: "5px" }}
                          />
                          By Amount
                        </label>
                        <label style={{ cursor: "pointer" }}>
                          <input
                            type="radio"
                            value="percentage"
                            checked={splitType === "percentage"}
                            onChange={(e) => handleSplitTypeChange(e.target.value)}
                            style={{ marginRight: "5px" }}
                          />
                          By Percentage
                        </label>
                      </div>
                    </div>

                    {/* Quick Percentage Buttons (only in percentage mode) */}
                    {splitType === "percentage" && (
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#666" }}>
                          Quick Split:
                        </label>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          {splitUsers.length === 2 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerc = {
                                    [splitUsers[0]]: 50,
                                    [splitUsers[1]]: 50
                                  };
                                  setSplitPercentages(newPerc);
                                  setExpenseSplits({
                                    [splitUsers[0]]: Number((Number(amount) * 0.5).toFixed(2)),
                                    [splitUsers[1]]: Number((Number(amount) * 0.5).toFixed(2))
                                  });
                                }}
                                style={{ padding: "5px 10px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                50-50
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerc = {
                                    [splitUsers[0]]: Number((100/3).toFixed(2)),
                                    [splitUsers[1]]: Number((200/3).toFixed(2))
                                  };
                                  setSplitPercentages(newPerc);
                                  setExpenseSplits({
                                    [splitUsers[0]]: Number((Number(amount) / 3).toFixed(2)),
                                    [splitUsers[1]]: Number((Number(amount) * 2 / 3).toFixed(2))
                                  });
                                }}
                                style={{ padding: "5px 10px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                1/3 - 2/3
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerc = {
                                    [splitUsers[0]]: Number((200/3).toFixed(2)),
                                    [splitUsers[1]]: Number((100/3).toFixed(2))
                                  };
                                  setSplitPercentages(newPerc);
                                  setExpenseSplits({
                                    [splitUsers[0]]: Number((Number(amount) * 2 / 3).toFixed(2)),
                                    [splitUsers[1]]: Number((Number(amount) / 3).toFixed(2))
                                  });
                                }}
                                style={{ padding: "5px 10px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                2/3 - 1/3
                              </button>
                            </>
                          )}
                          {splitUsers.length === 3 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const equalPerc = Number((100/3).toFixed(2));
                                  const equalAmount = Number((Number(amount) / 3).toFixed(2));
                                  const newPerc = {};
                                  const newSplits = {};
                                  splitUsers.forEach(user => {
                                    newPerc[user] = equalPerc;
                                    newSplits[user] = equalAmount;
                                  });
                                  setSplitPercentages(newPerc);
                                  setExpenseSplits(newSplits);
                                }}
                                style={{ padding: "5px 10px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                Equal (1/3 each)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerc = {
                                    [splitUsers[0]]: 50,
                                    [splitUsers[1]]: 25,
                                    [splitUsers[2]]: 25
                                  };
                                  setSplitPercentages(newPerc);
                                  setExpenseSplits({
                                    [splitUsers[0]]: Number((Number(amount) * 0.5).toFixed(2)),
                                    [splitUsers[1]]: Number((Number(amount) * 0.25).toFixed(2)),
                                    [splitUsers[2]]: Number((Number(amount) * 0.25).toFixed(2))
                                  });
                                }}
                                style={{ padding: "5px 10px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                50-25-25
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Split Inputs */}
                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        {splitType === "amount" ? `Split Amounts (Total: ₹${amount})` : `Split Percentages (Total: 100%)`}
                      </label>
                      {splitUsers.map((member) => (
                        <div key={member} style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <label style={{ minWidth: "80px", fontWeight: member === currentUserId ? "bold" : "normal" }}>
                            {member} {member === currentUserId && "(You)"}:
                          </label>
                          {splitType === "amount" ? (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={expenseSplits[member] || ""}
                                onChange={(e) => handleSplitAmountChange(member, e.target.value)}
                                style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                              />
                              <span style={{ fontSize: "12px", color: "#666" }}>₹</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={splitPercentages[member] || ""}
                                onChange={(e) => handlePercentageChange(member, e.target.value)}
                                style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                              />
                              <span style={{ fontSize: "12px", color: "#666" }}>%</span>
                              {expenseSplits[member] && (
                                <span style={{ fontSize: "12px", color: "#666", minWidth: "80px" }}>
                                  = ₹{Number(expenseSplits[member]).toFixed(2)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Validation Summary */}
                    <div style={{ marginTop: "10px", padding: "8px", backgroundColor: calculateSplitSum() === Number(amount) ? "#d4edda" : "#f8d7da", borderRadius: "4px" }}>
                      <strong>Total {splitType === "amount" ? "Split" : "Percentage"}: {
                        splitType === "amount" 
                          ? `₹${calculateSplitSum().toFixed(2)}`
                          : `${Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0).toFixed(2)}%`
                      }</strong>
                      {splitType === "amount" && Math.abs(calculateSplitSum() - Number(amount)) > 0.01 && (
                        <p style={{ margin: "5px 0 0 0", color: "#721c24", fontSize: "12px" }}>
                          Split amounts must equal total amount (₹{Number(amount).toFixed(2)})
                        </p>
                      )}
                      {splitType === "percentage" && Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) > 0.01 && (
                        <p style={{ margin: "5px 0 0 0", color: "#721c24", fontSize: "12px" }}>
                          Percentages must sum to 100%
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={
            !selectedGroupId || 
            selectedGroup?.status === "SETTLED" || 
            (splitMode === "custom" && (
              splitUsers.length === 0 ||
              Math.abs(calculateSplitSum() - Number(amount)) > 0.01 ||
              (splitType === "percentage" && Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) > 0.01)
            ))
          }
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: (
              !selectedGroupId || 
              selectedGroup?.status === "SETTLED" || 
              (splitMode === "custom" && (
                splitUsers.length === 0 ||
                Math.abs(calculateSplitSum() - Number(amount)) > 0.01 ||
                (splitType === "percentage" && Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) > 0.01)
              ))
            ) ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: (
              !selectedGroupId || 
              selectedGroup?.status === "SETTLED" || 
              (splitMode === "custom" && (
                splitUsers.length === 0 ||
                Math.abs(calculateSplitSum() - Number(amount)) > 0.01 ||
                (splitType === "percentage" && Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) > 0.01)
              ))
            ) ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          Add Expense
            </button>

            {!selectedGroupId && (
          <p style={{color: "red", marginTop: "10px", fontSize: "14px"}}>Please select a group first</p>
            )}

            {selectedGroup?.status === "SETTLED" && (
          <p style={{color: "red", marginTop: "10px", fontSize: "14px"}}>The group is settled. No new expenses allowed</p>
        )}
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


