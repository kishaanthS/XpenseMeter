package com.xpense.meter.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.xpense.meter.R
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType
import com.xpense.meter.databinding.ItemTransactionBinding
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TransactionAdapter(
    private val onItemClick: (Transaction) -> Unit,
    private val onItemLongClick: (Transaction) -> Unit
) : ListAdapter<Transaction, TransactionAdapter.ViewHolder>(DiffCallback()) {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    private val dateFormat = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTransactionBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemTransactionBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(transaction: Transaction) {
            val context = binding.root.context
            val isPaid = transaction.type == TransactionType.PAID

            binding.tvCategory.text = transaction.category
            binding.tvSubcategory.text = transaction.subcategory
            binding.tvDate.text = dateFormat.format(Date(transaction.timestamp))

            val amountText = currencyFormat.format(transaction.amount)
            binding.tvAmount.text = if (isPaid) "- $amountText" else "+ $amountText"
            binding.tvAmount.setTextColor(
                ContextCompat.getColor(context, if (isPaid) R.color.paid_red else R.color.received_green)
            )

            binding.viewTypeIndicator.setBackgroundColor(
                ContextCompat.getColor(context, if (isPaid) R.color.paid_red else R.color.received_green)
            )

            if (transaction.notes.isNotBlank()) {
                binding.tvNotes.visibility = View.VISIBLE
                binding.tvNotes.text = transaction.notes
            } else {
                binding.tvNotes.visibility = View.GONE
            }

            binding.root.setOnClickListener { onItemClick(transaction) }
            binding.root.setOnLongClickListener {
                onItemLongClick(transaction)
                true
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<Transaction>() {
        override fun areItemsTheSame(oldItem: Transaction, newItem: Transaction): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Transaction, newItem: Transaction): Boolean =
            oldItem == newItem
    }
}
