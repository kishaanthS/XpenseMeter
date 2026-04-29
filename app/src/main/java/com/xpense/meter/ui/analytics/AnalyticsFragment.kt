package com.xpense.meter.ui.analytics

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.BarData
import com.github.mikephil.charting.data.BarDataSet
import com.github.mikephil.charting.data.BarEntry
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import com.github.mikephil.charting.data.PieData
import com.github.mikephil.charting.data.PieDataSet
import com.github.mikephil.charting.data.PieEntry
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.github.mikephil.charting.formatter.PercentFormatter
import com.xpense.meter.R
import com.xpense.meter.XpenseMeterApp
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType
import com.xpense.meter.databinding.FragmentAnalyticsBinding
import com.xpense.meter.ui.TransactionViewModel
import com.xpense.meter.ui.TransactionViewModelFactory
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class AnalyticsFragment : Fragment() {

    private var _binding: FragmentAnalyticsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TransactionViewModel by activityViewModels {
        TransactionViewModelFactory((requireActivity().application as XpenseMeterApp).repository)
    }

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

    private val categoryColors = linkedMapOf(
        "Food" to 0xFFFF7043.toInt(),
        "Shopping" to 0xFFAB47BC.toInt(),
        "Travel" to 0xFF42A5F5.toInt(),
        "Entertainment" to 0xFFFFCA28.toInt(),
        "Health" to 0xFFEF5350.toInt(),
        "Bills" to 0xFF26A69A.toInt(),
        "Education" to 0xFF5C6BC0.toInt(),
        "Salary" to 0xFF66BB6A.toInt(),
        "Investment" to 0xFFFFA726.toInt(),
        "Transfer" to 0xFF8D6E63.toInt(),
        "Other" to 0xFF78909C.toInt()
    )

    private lateinit var categoryStatAdapter: CategoryStatAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAnalyticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupCategoryList()
        setupCharts()
        observeData()
    }

    private fun setupCategoryList() {
        categoryStatAdapter = CategoryStatAdapter(categoryColors)
        binding.rvTopCategories.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTopCategories.adapter = categoryStatAdapter
    }

    private fun setupCharts() {
        // Pie chart setup
        binding.chartCategory.apply {
            setUsePercentValues(true)
            description.isEnabled = false
            isDrawHoleEnabled = true
            holeRadius = 45f
            transparentCircleRadius = 50f
            setHoleColor(Color.WHITE)
            setDrawEntryLabels(false)
            legend.isEnabled = true
            legend.textSize = 11f
        }

        // Bar chart setup
        binding.chartIncomeExpense.apply {
            description.isEnabled = false
            setDrawGridBackground(false)
            setDrawBarShadow(false)
            setFitBars(true)
            legend.isEnabled = true
            legend.textSize = 11f
            xAxis.position = XAxis.XAxisPosition.BOTTOM
            xAxis.setDrawGridLines(false)
            axisLeft.setDrawGridLines(true)
            axisLeft.gridColor = Color.parseColor("#E0E0E0")
            axisRight.isEnabled = false
        }

        // Line chart setup
        binding.chartTrend.apply {
            description.isEnabled = false
            setDrawGridBackground(false)
            legend.isEnabled = true
            legend.textSize = 11f
            xAxis.position = XAxis.XAxisPosition.BOTTOM
            xAxis.setDrawGridLines(false)
            xAxis.granularity = 1f
            axisLeft.setDrawGridLines(true)
            axisLeft.gridColor = Color.parseColor("#E0E0E0")
            axisRight.isEnabled = false
        }
    }

    private fun observeData() {
        viewModel.totalPaid.observe(viewLifecycleOwner) { total ->
            binding.tvAnalyticsExpense.text = currencyFormat.format(total ?: 0.0)
        }

        viewModel.totalReceived.observe(viewLifecycleOwner) { total ->
            binding.tvAnalyticsIncome.text = currencyFormat.format(total ?: 0.0)
        }

        viewModel.spendingByCategory.observe(viewLifecycleOwner) { categories ->
            updatePieChart(categories.map { Pair(it.category, it.total) })
            updateCategoryList(categories.map { Pair(it.category, it.total) })
        }

        viewModel.filteredTransactions.observe(viewLifecycleOwner) { transactions ->
            updateBarChart(transactions)
            updateTrendChart(transactions)
        }
    }

    private fun updatePieChart(categories: List<Pair<String, Double>>) {
        if (categories.isEmpty()) {
            binding.chartCategory.clear()
            return
        }

        val entries = categories.map { (cat, total) ->
            PieEntry(total.toFloat(), cat)
        }

        val colors = categories.map { (cat, _) ->
            categoryColors[cat] ?: 0xFF78909C.toInt()
        }

        val dataSet = PieDataSet(entries, "").apply {
            this.colors = colors
            valueTextSize = 12f
            valueTextColor = Color.WHITE
            valueFormatter = PercentFormatter(binding.chartCategory)
            sliceSpace = 2f
        }

        binding.chartCategory.data = PieData(dataSet)
        binding.chartCategory.invalidate()
    }

    private fun updateCategoryList(categories: List<Pair<String, Double>>) {
        val totalSpending = categories.sumOf { it.second }
        val items = categories.map { (cat, total) ->
            CategoryStatItem(
                category = cat,
                total = total,
                percentage = if (totalSpending > 0) (total / totalSpending) * 100 else 0.0
            )
        }
        categoryStatAdapter.submitList(items)
    }

    private fun updateBarChart(transactions: List<Transaction>) {
        val paid = transactions.filter { it.type == TransactionType.PAID }.sumOf { it.amount }
        val received = transactions.filter { it.type == TransactionType.RECEIVED }.sumOf { it.amount }

        if (paid == 0.0 && received == 0.0) {
            binding.chartIncomeExpense.clear()
            return
        }

        val paidEntry = BarEntry(0f, paid.toFloat())
        val receivedEntry = BarEntry(1f, received.toFloat())

        val paidDataSet = BarDataSet(listOf(paidEntry), "Paid").apply {
            color = ContextCompat.getColor(requireContext(), R.color.paid_red)
            valueTextSize = 12f
        }

        val receivedDataSet = BarDataSet(listOf(receivedEntry), "Received").apply {
            color = ContextCompat.getColor(requireContext(), R.color.received_green)
            valueTextSize = 12f
        }

        val barData = BarData(paidDataSet, receivedDataSet).apply {
            barWidth = 0.35f
        }

        binding.chartIncomeExpense.apply {
            data = barData
            xAxis.valueFormatter = IndexAxisValueFormatter(listOf("Paid", "Received"))
            xAxis.granularity = 1f
            xAxis.setCenterAxisLabels(false)
            invalidate()
        }
    }

    private fun updateTrendChart(transactions: List<Transaction>) {
        if (transactions.isEmpty()) {
            binding.chartTrend.clear()
            return
        }

        val dateFormat = SimpleDateFormat("MMM", Locale.getDefault())
        val cal = Calendar.getInstance()

        // Group by month
        val monthlyPaid = mutableMapOf<String, Double>()
        val monthlyReceived = mutableMapOf<String, Double>()
        val monthOrder = mutableListOf<String>()

        transactions.sortedBy { it.timestamp }.forEach { tx ->
            cal.timeInMillis = tx.timestamp
            val monthKey = dateFormat.format(cal.time)

            if (monthKey !in monthOrder) monthOrder.add(monthKey)

            when (tx.type) {
                TransactionType.PAID -> monthlyPaid[monthKey] = (monthlyPaid[monthKey] ?: 0.0) + tx.amount
                TransactionType.RECEIVED -> monthlyReceived[monthKey] = (monthlyReceived[monthKey] ?: 0.0) + tx.amount
            }
        }

        val paidEntries = monthOrder.mapIndexed { index, month ->
            Entry(index.toFloat(), (monthlyPaid[month] ?: 0.0).toFloat())
        }

        val receivedEntries = monthOrder.mapIndexed { index, month ->
            Entry(index.toFloat(), (monthlyReceived[month] ?: 0.0).toFloat())
        }

        val paidLine = LineDataSet(paidEntries, "Paid").apply {
            color = ContextCompat.getColor(requireContext(), R.color.paid_red)
            setCircleColor(ContextCompat.getColor(requireContext(), R.color.paid_red))
            lineWidth = 2f
            circleRadius = 4f
            valueTextSize = 10f
            mode = LineDataSet.Mode.CUBIC_BEZIER
            setDrawFilled(true)
            fillColor = ContextCompat.getColor(requireContext(), R.color.paid_red)
            fillAlpha = 30
        }

        val receivedLine = LineDataSet(receivedEntries, "Received").apply {
            color = ContextCompat.getColor(requireContext(), R.color.received_green)
            setCircleColor(ContextCompat.getColor(requireContext(), R.color.received_green))
            lineWidth = 2f
            circleRadius = 4f
            valueTextSize = 10f
            mode = LineDataSet.Mode.CUBIC_BEZIER
            setDrawFilled(true)
            fillColor = ContextCompat.getColor(requireContext(), R.color.received_green)
            fillAlpha = 30
        }

        binding.chartTrend.apply {
            data = LineData(paidLine, receivedLine)
            xAxis.valueFormatter = IndexAxisValueFormatter(monthOrder)
            xAxis.granularity = 1f
            invalidate()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
