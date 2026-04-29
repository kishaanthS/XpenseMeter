package com.xpense.meter.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.xpense.meter.R
import com.xpense.meter.XpenseMeterApp
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.databinding.FragmentHomeBinding
import com.xpense.meter.ui.TimeFilter
import com.xpense.meter.ui.TransactionViewModel
import com.xpense.meter.ui.TransactionViewModelFactory
import java.text.NumberFormat
import java.util.Locale

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TransactionViewModel by activityViewModels {
        TransactionViewModelFactory((requireActivity().application as XpenseMeterApp).repository)
    }

    private lateinit var adapter: TransactionAdapter
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupFilterChips()
        observeData()
    }

    private fun setupRecyclerView() {
        adapter = TransactionAdapter(
            onItemClick = { /* expand details in future */ },
            onItemLongClick = { transaction -> showDeleteDialog(transaction) }
        )
        binding.rvTransactions.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTransactions.adapter = adapter
    }

    private fun setupFilterChips() {
        binding.chipAll.setOnClickListener { viewModel.setTimeFilter(TimeFilter.ALL) }
        binding.chipToday.setOnClickListener { viewModel.setTimeFilter(TimeFilter.TODAY) }
        binding.chipWeek.setOnClickListener { viewModel.setTimeFilter(TimeFilter.WEEK) }
        binding.chipMonth.setOnClickListener { viewModel.setTimeFilter(TimeFilter.MONTH) }
    }

    private fun observeData() {
        viewModel.filteredTransactions.observe(viewLifecycleOwner) { transactions ->
            adapter.submitList(transactions)
            binding.emptyState.visibility = if (transactions.isEmpty()) View.VISIBLE else View.GONE
            binding.rvTransactions.visibility = if (transactions.isEmpty()) View.GONE else View.VISIBLE
        }

        viewModel.totalPaid.observe(viewLifecycleOwner) { total ->
            binding.tvTotalPaid.text = currencyFormat.format(total ?: 0.0)
        }

        viewModel.totalReceived.observe(viewLifecycleOwner) { total ->
            binding.tvTotalReceived.text = currencyFormat.format(total ?: 0.0)
        }

        viewModel.balance.observe(viewLifecycleOwner) { bal ->
            binding.tvBalance.text = currencyFormat.format(bal ?: 0.0)
            val color = if ((bal ?: 0.0) >= 0) R.color.received_green else R.color.paid_red
            binding.tvBalance.setTextColor(requireContext().getColor(color))
        }
    }

    private fun showDeleteDialog(transaction: Transaction) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.confirm_delete)
            .setMessage(R.string.confirm_delete_message)
            .setPositiveButton(R.string.delete) { _, _ ->
                viewModel.delete(transaction)
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
