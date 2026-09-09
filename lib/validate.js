function validateExpense(body) {
    if (!body || typeof body !== 'object') {
        throw new Error("Invalid request body");
    }
    const { name, amount, categoryId, accountId, type, date } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error("Missing or invalid 'name'");
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
        throw new Error("Missing or invalid 'amount'");
    }
    
    return {
        name: name.trim(),
        amount: Number(amount),
        type: type === 'Income' ? 'Income' : 'Expense',
        date: date || null,
        categoryId,
        accountId
    };
}

module.exports = { validateExpense };
