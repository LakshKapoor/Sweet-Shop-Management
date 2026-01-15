"use client";

import { useEffect, useState } from "react";


/* API URL CONSTANT (HERE) */
const APIurl = "http://192.168.29.1:3000";

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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-4">Expense Tracker</h1>
          
          {/* Current User Selector */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-700">
              Current User:
            </label>
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Groups and Create Group */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Group Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {!groupName.trim() && (
                    <p className="mt-1 text-xs text-red-500">Group name is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Members
                  </label>
                  
                  {/* Checkboxes */}
                  <div className="mb-4 space-y-2">
                    {users.map((user) => (
                      <label key={user} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user)}
                          onChange={() => handleMemberToggle(user)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{user}</span>
                      </label>
                    ))}
                  </div>

                  {/* Multi-select dropdown */}
                  <div>
                    <select
                      multiple
                      value={selectedMembers}
                      onChange={handleMultiSelectChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] text-sm"
                    >
                      {users.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple
                    </p>
                  </div>
                  
                  {selectedMembers.length === 0 && groupName.trim() && (
                    <p className="mt-1 text-xs text-red-500">Please select at least one member</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingGroup ? "Creating..." : "Create Group"}
                </button>
              </form>
            </div>

            {/* Groups List Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Groups</h2>
              {groups.length === 0 ? (
                <p className="text-gray-500 text-sm">No groups found</p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <button
                      key={group._id}
                      onClick={() => {
                        if (selectedGroupId === group._id) {
                          setSelectedGroupId(null);
                          setExpenses([]);
                          setBalances(null);
                        } else {
                          setSelectedGroupId(group._id);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedGroupId === group._id
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{group.name}</span>
                        {group.status === "SETTLED" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Settled</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Expenses and Balances */}
          <div className="lg:col-span-2 space-y-6">
            {selectedGroupId ? (
              <>
                {/* Selected Group Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Active Group:</span> {selectedGroup?.name}
                  </p>
                </div>

                {/* Add Expense Card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Expense</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          placeholder="Expense title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {selectedGroupId && selectedGroup && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Split Mode
                          </label>
                          <div className="flex gap-4 mb-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                value="equal"
                                checked={splitMode === "equal"}
                                onChange={(e) => handleSplitModeChange(e.target.value)}
                                className="mr-2 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">Equal Split</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                value="custom"
                                checked={splitMode === "custom"}
                                onChange={(e) => handleSplitModeChange(e.target.value)}
                                className="mr-2 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">Custom Split</span>
                            </label>
                          </div>

                          {splitMode === "custom" && amount && selectedGroup && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            {/* User Selection */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Users to Split With:
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {selectedGroup.members.map((member) => (
                                  <label
                                    key={member}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                      splitUsers.includes(member)
                                        ? "bg-indigo-50 border-indigo-500"
                                        : "bg-white border-gray-300 hover:border-gray-400"
                                    } ${member === currentUserId ? "font-semibold" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={splitUsers.includes(member)}
                                      onChange={() => handleSplitUserToggle(member)}
                                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {member} {member === currentUserId && "(You)"}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {splitUsers.length > 0 && (
                              <>
                                {/* Split Type Selection */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Split Type:
                                  </label>
                                  <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        value="amount"
                                        checked={splitType === "amount"}
                                        onChange={(e) => handleSplitTypeChange(e.target.value)}
                                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="text-sm text-gray-700">By Amount</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        value="percentage"
                                        checked={splitType === "percentage"}
                                        onChange={(e) => handleSplitTypeChange(e.target.value)}
                                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="text-sm text-gray-700">By Percentage</span>
                                    </label>
                                  </div>
                                </div>

                                {/* Quick Percentage Buttons */}
                                {splitType === "percentage" && (
                                  <div className="mb-4">
                                    <label className="block text-xs text-gray-500 mb-2">
                                      Quick Split:
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
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
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
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
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
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
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
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
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
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
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                                          >
                                            50-25-25
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Split Inputs */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {splitType === "amount" ? `Split Amounts (Total: ₹${amount})` : `Split Percentages (Total: 100%)`}
                                  </label>
                                  <div className="space-y-2">
                                    {splitUsers.map((member) => (
                                      <div key={member} className="flex items-center gap-2">
                                        <label className={`min-w-[80px] text-sm ${member === currentUserId ? "font-semibold" : ""} text-gray-700`}>
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
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                            />
                                            <span className="text-xs text-gray-500">₹</span>
                                          </>
                                        ) : (
                                          <>
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0"
                                              value={splitPercentages[member] || ""}
                                              onChange={(e) => handlePercentageChange(member, e.target.value)}
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                            />
                                            <span className="text-xs text-gray-500">%</span>
                                            {expenseSplits[member] && (
                                              <span className="text-xs text-gray-500 min-w-[80px]">
                                                = ₹{Number(expenseSplits[member]).toFixed(2)}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Validation Summary */}
                                <div className={`mt-3 p-3 rounded-lg ${
                                  splitType === "amount" 
                                    ? (calculateSplitSum() === Number(amount) ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")
                                    : (Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) < 0.01 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")
                                }`}>
                                  <strong className={`text-sm ${
                                    splitType === "amount" 
                                      ? (calculateSplitSum() === Number(amount) ? "text-green-700" : "text-red-700")
                                      : (Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) < 0.01 ? "text-green-700" : "text-red-700")
                                  }`}>
                                    Total {splitType === "amount" ? "Split" : "Percentage"}: {
                                      splitType === "amount" 
                                        ? `₹${calculateSplitSum().toFixed(2)}`
                                        : `${Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0).toFixed(2)}%`
                                    }
                                  </strong>
                                  {splitType === "amount" && Math.abs(calculateSplitSum() - Number(amount)) > 0.01 && (
                                    <p className="mt-1 text-xs text-red-600">
                                      Split amounts must equal total amount (₹{Number(amount).toFixed(2)})
                                    </p>
                                  )}
                                  {splitType === "percentage" && Math.abs(Object.values(splitPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0) - 100) > 0.01 && (
                                    <p className="mt-1 text-xs text-red-600">
                                      Percentages must sum to 100%
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                            </div>
                          )}
                        </div>
                      </>
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
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Expense
                    </button>

                    {!selectedGroupId && (
                      <p className="mt-2 text-sm text-red-500">Please select a group first</p>
                    )}

                    {selectedGroup?.status === "SETTLED" && (
                      <p className="mt-2 text-sm text-red-500">The group is settled. No new expenses allowed</p>
                    )}
                  </form>
                </div>

                {/* Expenses List */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Expenses</h2>
                  {expenses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No expenses found</p>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((expense) => (
                        <div key={expense._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">{expense.title}</h3>
                            <span className="text-lg font-bold text-indigo-600">₹{expense.amount}</span>
                          </div>
                          <div className="space-y-2">
                            {expense.splits.map((split) => (
                              <div
                                key={split.userId}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-700">
                                    <span className="font-medium">{split.userId}</span> - ₹{split.share}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      split.status === "CONFIRMED"
                                        ? "bg-green-100 text-green-700"
                                        : split.status === "PAID"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {split.status}
                                  </span>
                                </div>
                                <div>
                                  {split.userId === currentUserId && split.status === "UNPAID" && (
                                    <button
                                      onClick={() => markAsPaid(expense._id)}
                                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                    >
                                      Pay
                                    </button>
                                  )}
                                  {expense.paidBy === currentUserId && split.status === "PAID" && (
                                    <button
                                      onClick={() => confirmPayment(expense._id)}
                                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balances Card */}
                {balances && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Balances</h2>
                    <div className="space-y-2">
                      {Object.entries(balances).map(([userId, amount]) => (
                        <div
                          key={userId}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                            amount > 0
                              ? "bg-green-50 border border-green-200"
                              : amount < 0
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-700">{userId}</span>
                          <span
                            className={`font-bold ${
                              amount > 0
                                ? "text-green-600"
                                : amount < 0
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {amount > 0
                              ? `Will receive ₹${amount}`
                              : amount < 0
                              ? `Owes ₹${Math.abs(amount)}`
                              : "Settled"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const res = await fetch(`${APIurl}/api/groups/${selectedGroupId}/settle`, {
                          method: "POST",
                        });
                        fetchExpenses(selectedGroupId);
                        fetchbalances(selectedGroupId);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Settle Up Balances
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-500 text-lg">Select a group to view expenses and balances</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
