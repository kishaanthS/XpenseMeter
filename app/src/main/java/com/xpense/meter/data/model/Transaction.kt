package com.xpense.meter.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class TransactionType {
    PAID,
    RECEIVED
}

@Entity(tableName = "transactions")
data class Transaction(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val amount: Double,
    val type: TransactionType,
    val category: String,
    val subcategory: String,
    val notes: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
