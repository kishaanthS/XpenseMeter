package com.xpense.meter

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.xpense.meter.databinding.ActivityMainBinding
import com.xpense.meter.ui.TransactionViewModel
import com.xpense.meter.ui.TransactionViewModelFactory
import com.xpense.meter.ui.addentry.AddEntryBottomSheet
import com.xpense.meter.ui.analytics.AnalyticsFragment
import com.xpense.meter.ui.home.HomeFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val viewModel: TransactionViewModel by viewModels {
        TransactionViewModelFactory((application as XpenseMeterApp).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(true)

        if (savedInstanceState == null) {
            showHomeFragment()
        }

        setupBottomNavigation()
        setupFab()
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    showHomeFragment()
                    true
                }
                R.id.nav_analytics -> {
                    showAnalyticsFragment()
                    true
                }
                else -> false
            }
        }
    }

    private fun setupFab() {
        binding.fabAdd.setOnClickListener {
            val bottomSheet = AddEntryBottomSheet.newInstance()
            bottomSheet.show(supportFragmentManager, AddEntryBottomSheet.TAG)
        }
    }

    private fun showHomeFragment() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, HomeFragment())
            .commit()
    }

    private fun showAnalyticsFragment() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, AnalyticsFragment())
            .commit()
    }
}
