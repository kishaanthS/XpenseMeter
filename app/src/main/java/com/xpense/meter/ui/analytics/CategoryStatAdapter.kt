package com.xpense.meter.ui.analytics

import android.graphics.drawable.GradientDrawable
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.xpense.meter.data.db.CategoryTotal
import com.xpense.meter.databinding.ItemCategoryStatBinding
import java.text.NumberFormat
import java.util.Locale

class CategoryStatAdapter(
    private val colorMap: Map<String, Int>
) : ListAdapter<CategoryStatItem, CategoryStatAdapter.ViewHolder>(DiffCallback()) {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemCategoryStatBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemCategoryStatBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: CategoryStatItem) {
            binding.tvCatName.text = item.category
            binding.tvCatAmount.text = currencyFormat.format(item.total)
            binding.tvCatPercent.text = String.format("%.1f%%", item.percentage)

            val color = colorMap[item.category] ?: 0xFF78909C.toInt()
            val dot = binding.viewColorDot.background as? GradientDrawable
            dot?.setColor(color)
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<CategoryStatItem>() {
        override fun areItemsTheSame(oldItem: CategoryStatItem, newItem: CategoryStatItem) =
            oldItem.category == newItem.category

        override fun areContentsTheSame(oldItem: CategoryStatItem, newItem: CategoryStatItem) =
            oldItem == newItem
    }
}

data class CategoryStatItem(
    val category: String,
    val total: Double,
    val percentage: Double
)
