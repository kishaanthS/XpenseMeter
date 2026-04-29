package com.xpense.meter.data.db

import androidx.lifecycle.LiveData
import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType

@Dao
interface TransactionDao {

    @Insert
    suspend fun insert(transaction: Transaction): Long

    @Delete
    suspend fun delete(transaction: Transaction)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    fun getAllTransactions(): LiveData<List<Transaction>>

    @Query("SELECT * FROM transactions WHERE timestamp >= :since ORDER BY timestamp DESC")
    fun getTransactionsSince(since: Long): LiveData<List<Transaction>>

    @Query("SELECT * FROM transactions WHERE type = :type ORDER BY timestamp DESC")
    fun getTransactionsByType(type: TransactionType): LiveData<List<Transaction>>

    @Query("SELECT SUM(amount) FROM transactions WHERE type = :type")
    fun getTotalByType(type: TransactionType): LiveData<Double?>

    @Query("SELECT SUM(amount) FROM transactions WHERE type = :type AND timestamp >= :since")
    fun getTotalByTypeSince(type: TransactionType, since: Long): LiveData<Double?>

    @Query("SELECT * FROM transactions WHERE type = 'PAID' ORDER BY timestamp DESC")
    fun getPaidTransactions(): LiveData<List<Transaction>>

    @Query("SELECT * FROM transactions WHERE type = 'RECEIVED' ORDER BY timestamp DESC")
    fun getReceivedTransactions(): LiveData<List<Transaction>>

    @Query("SELECT category, SUM(amount) as total FROM transactions WHERE type = 'PAID' GROUP BY category ORDER BY total DESC")
    fun getSpendingByCategory(): LiveData<List<CategoryTotal>>

    @Query("SELECT category, SUM(amount) as total FROM transactions WHERE type = 'PAID' AND timestamp >= :since GROUP BY category ORDER BY total DESC")
    fun getSpendingByCategorySince(since: Long): LiveData<List<CategoryTotal>>

    @Query("DELETE FROM transactions")
    suspend fun deleteAll()
}

data class CategoryTotal(
    val category: String,
    val total: Double
)
