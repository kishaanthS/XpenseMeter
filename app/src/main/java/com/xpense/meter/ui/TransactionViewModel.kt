package com.xpense.meter.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MediatorLiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.xpense.meter.data.db.CategoryTotal
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType
import com.xpense.meter.data.repository.TransactionRepository
import kotlinx.coroutines.launch
import java.util.Calendar

enum class TimeFilter {
    ALL, TODAY, WEEK, MONTH
}

class TransactionViewModel(private val repository: TransactionRepository) : ViewModel() {

    private val _timeFilter = MutableLiveData(TimeFilter.ALL)
    val timeFilter: LiveData<TimeFilter> = _timeFilter

    val allTransactions: LiveData<List<Transaction>> = repository.allTransactions

    val filteredTransactions: MediatorLiveData<List<Transaction>> = MediatorLiveData<List<Transaction>>().apply {
        addSource(allTransactions) { txns ->
            value = applyFilter(txns, _timeFilter.value ?: TimeFilter.ALL)
        }
        addSource(_timeFilter) { filter ->
            value = applyFilter(allTransactions.value ?: emptyList(), filter)
        }
    }

    val totalPaid: MediatorLiveData<Double> = MediatorLiveData<Double>().apply {
        addSource(filteredTransactions) { txns ->
            value = txns.filter { it.type == TransactionType.PAID }.sumOf { it.amount }
        }
    }

    val totalReceived: MediatorLiveData<Double> = MediatorLiveData<Double>().apply {
        addSource(filteredTransactions) { txns ->
            value = txns.filter { it.type == TransactionType.RECEIVED }.sumOf { it.amount }
        }
    }

    val balance: MediatorLiveData<Double> = MediatorLiveData<Double>().apply {
        addSource(totalReceived) { received ->
            value = received - (totalPaid.value ?: 0.0)
        }
        addSource(totalPaid) { paid ->
            value = (totalReceived.value ?: 0.0) - paid
        }
    }

    val spendingByCategory: MediatorLiveData<List<CategoryTotal>> = MediatorLiveData<List<CategoryTotal>>().apply {
        addSource(filteredTransactions) { txns ->
            val paidTxns = txns.filter { it.type == TransactionType.PAID }
            value = paidTxns.groupBy { it.category }
                .map { (cat, list) -> CategoryTotal(cat, list.sumOf { it.amount }) }
                .sortedByDescending { it.total }
        }
    }

    private fun applyFilter(transactions: List<Transaction>, filter: TimeFilter): List<Transaction> {
        val since = getFilterTimestamp(filter)
        return if (since == 0L) transactions
        else transactions.filter { it.timestamp >= since }
    }

    private fun getFilterTimestamp(filter: TimeFilter): Long {
        val cal = Calendar.getInstance()
        return when (filter) {
            TimeFilter.ALL -> 0L
            TimeFilter.TODAY -> {
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                cal.timeInMillis
            }
            TimeFilter.WEEK -> {
                cal.set(Calendar.DAY_OF_WEEK, cal.firstDayOfWeek)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                cal.timeInMillis
            }
            TimeFilter.MONTH -> {
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                cal.timeInMillis
            }
        }
    }

    fun setTimeFilter(filter: TimeFilter) {
        _timeFilter.value = filter
    }

    fun insert(transaction: Transaction) = viewModelScope.launch {
        repository.insert(transaction)
    }

    fun delete(transaction: Transaction) = viewModelScope.launch {
        repository.delete(transaction)
    }

    fun deleteById(id: Long) = viewModelScope.launch {
        repository.deleteById(id)
    }
}

class TransactionViewModelFactory(private val repository: TransactionRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TransactionViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return TransactionViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
