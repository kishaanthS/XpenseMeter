package com.xpense.meter.data.model

object CategoryMapping {

    val categories: Map<String, List<String>> = linkedMapOf(
        "Food" to listOf("Restaurant", "Groceries", "Snacks", "Beverages", "Delivery"),
        "Shopping" to listOf("Clothing", "Electronics", "Household", "Personal Care", "Gifts"),
        "Travel" to listOf("Fuel", "Cab", "Bus/Train", "Flight", "Toll", "Parking"),
        "Entertainment" to listOf("Movies", "Streaming", "Games", "Events", "Sports"),
        "Health" to listOf("Medicine", "Doctor", "Insurance", "Gym", "Lab Tests"),
        "Bills" to listOf("Electricity", "Water", "Internet", "Phone", "Gas", "Rent"),
        "Education" to listOf("Tuition", "Books", "Courses", "Stationery"),
        "Salary" to listOf("Monthly Salary", "Bonus", "Freelance", "Reimbursement"),
        "Investment" to listOf("Stocks", "Mutual Funds", "FD", "Crypto", "Gold"),
        "Transfer" to listOf("Bank Transfer", "UPI", "Wallet", "Cash"),
        "Other" to listOf("Miscellaneous", "Charity", "Subscription", "EMI")
    )

    fun getCategories(): List<String> = categories.keys.toList()

    fun getSubcategories(category: String): List<String> {
        return categories[category] ?: emptyList()
    }
}
