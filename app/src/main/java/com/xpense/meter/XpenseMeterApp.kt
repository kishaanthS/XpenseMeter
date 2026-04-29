package com.xpense.meter

import android.app.Application
import com.xpense.meter.data.db.AppDatabase
import com.xpense.meter.data.repository.TransactionRepository

class XpenseMeterApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    val repository by lazy { TransactionRepository(database.transactionDao()) }
}
