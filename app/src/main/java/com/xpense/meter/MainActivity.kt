package com.xpense.meter

import android.content.Context
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
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
        applySavedTheme()
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

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.toolbar_menu, menu)
        updateThemeIcon(menu.findItem(R.id.action_toggle_theme))
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_toggle_theme -> {
                toggleTheme()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun applySavedTheme() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isDark = prefs.getBoolean(KEY_DARK_MODE, false)
        AppCompatDelegate.setDefaultNightMode(
            if (isDark) AppCompatDelegate.MODE_NIGHT_YES
            else AppCompatDelegate.MODE_NIGHT_NO
        )
    }

    private fun toggleTheme() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isDark = prefs.getBoolean(KEY_DARK_MODE, false)
        val newMode = !isDark
        prefs.edit().putBoolean(KEY_DARK_MODE, newMode).apply()
        AppCompatDelegate.setDefaultNightMode(
            if (newMode) AppCompatDelegate.MODE_NIGHT_YES
            else AppCompatDelegate.MODE_NIGHT_NO
        )
    }

    private fun updateThemeIcon(item: MenuItem) {
        val isDark = AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES
        item.setIcon(
            if (isDark) android.R.drawable.ic_menu_day
            else android.R.drawable.btn_star
        )
        item.title = if (isDark) getString(R.string.light_mode) else getString(R.string.dark_mode)
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

    companion object {
        private const val PREFS_NAME = "xpensemeter_prefs"
        private const val KEY_DARK_MODE = "dark_mode"
    }
}
