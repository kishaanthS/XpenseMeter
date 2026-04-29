package com.xpense.meter.data.repository

import androidx.lifecycle.LiveData
import com.xpense.meter.data.db.CategoryTotal
import com.xpense.meter.data.db.TransactionDao
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType

class TransactionRepository(private val dao: TransactionDao) {

    val allTransactions: LiveData<List<Transaction>> = dao.getAllTransactions()

    fun getTransactionsSince(since: Long): LiveData<List<Transaction>> =
        dao.getTransactionsSince(since)

    fun getTotalByType(type: TransactionType): LiveData<Double?> =
        dao.getTotalByType(type)

    fun getTotalByTypeSince(type: TransactionType, since: Long): LiveData<Double?> =
        dao.getTotalByTypeSince(type, since)

    fun getSpendingByCategory(): LiveData<List<CategoryTotal>> =
        dao.getSpendingByCategory()

    fun getSpendingByCategorySince(since: Long): LiveData<List<CategoryTotal>> =
        dao.getSpendingByCategorySince(since)

    suspend fun insert(transaction: Transaction): Long =
        dao.insert(transaction)

    suspend fun delete(transaction: Transaction) =
        dao.delete(transaction)

    suspend fun deleteById(id: Long) =
        dao.deleteById(id)

    suspend fun deleteAll() =
        dao.deleteAll()
}
