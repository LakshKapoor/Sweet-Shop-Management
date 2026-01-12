const calculateBalances = (expenses) =>{
    const balances = {}

    for(const expense of expenses){
        const{paidBy, splits} = expense;

        if(!balances[paidBy]){
            balances[paidBy] = 0
        }

        for(const split of splits){
            const {userId, share, status} = split;
        

        if(status === "CONFIRMED") continue;
        if(userId === paidBy) continue

        

        if(!balances[userId]){
            balances[userId]=0;
        }
        
        if(!balances[paidBy]){
            balances[paidBy]=0;
        }
        
        
        balances[userId]-=share

        balances[paidBy]+=share

        // console.log("Paid by:", paidBy)
        // console.log("splits:", splits.map(s=> s.userId))
        
        
        
        
    }
}

return balances;

};

module.exports = calculateBalances;
