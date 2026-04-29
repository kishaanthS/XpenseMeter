package com.xpense.meter.ui.addentry

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.fragment.app.activityViewModels
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.xpense.meter.R
import com.xpense.meter.XpenseMeterApp
import com.xpense.meter.data.model.CategoryMapping
import com.xpense.meter.data.model.Transaction
import com.xpense.meter.data.model.TransactionType
import com.xpense.meter.databinding.BottomSheetAddEntryBinding
import com.xpense.meter.ui.TransactionViewModel
import com.xpense.meter.ui.TransactionViewModelFactory

class AddEntryBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetAddEntryBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TransactionViewModel by activityViewModels {
        TransactionViewModelFactory((requireActivity().application as XpenseMeterApp).repository)
    }

    private var selectedType: TransactionType = TransactionType.PAID
    private var selectedCategory: String = ""
    private var selectedSubcategory: String = ""

    override fun getTheme(): Int = R.style.BottomSheetDialogTheme

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetAddEntryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupTypeToggle()
        setupCategoryDropdown()
        setupSaveButton()

        // Default to PAID
        binding.toggleType.check(R.id.btn_paid)
    }

    private fun setupTypeToggle() {
        binding.toggleType.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                selectedType = when (checkedId) {
                    R.id.btn_paid -> TransactionType.PAID
                    R.id.btn_received -> TransactionType.RECEIVED
                    else -> TransactionType.PAID
                }
                updateTitle()
            }
        }
    }

    private fun updateTitle() {
        binding.tvSheetTitle.text = when (selectedType) {
            TransactionType.PAID -> getString(R.string.paid)
            TransactionType.RECEIVED -> getString(R.string.received)
        }
    }

    private fun setupCategoryDropdown() {
        val categories = CategoryMapping.getCategories()
        val categoryAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_dropdown_item_1line,
            categories
        )
        binding.dropdownCategory.setAdapter(categoryAdapter)

        binding.dropdownCategory.setOnItemClickListener { _, _, position, _ ->
            selectedCategory = categories[position]
            selectedSubcategory = ""
            binding.dropdownSubcategory.setText("", false)
            updateSubcategoryDropdown(selectedCategory)
        }

        // Initialize subcategory as empty
        binding.dropdownSubcategory.setAdapter(
            ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, emptyList<String>())
        )
    }

    private fun updateSubcategoryDropdown(category: String) {
        val subcategories = CategoryMapping.getSubcategories(category)
        val subAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_dropdown_item_1line,
            subcategories
        )
        binding.dropdownSubcategory.setAdapter(subAdapter)

        binding.dropdownSubcategory.setOnItemClickListener { _, _, position, _ ->
            selectedSubcategory = subcategories[position]
        }
    }

    private fun setupSaveButton() {
        binding.btnSave.setOnClickListener {
            if (validateInput()) {
                val amount = binding.etAmount.text.toString().toDoubleOrNull() ?: 0.0
                val notes = binding.etNotes.text?.toString()?.trim() ?: ""

                val transaction = Transaction(
                    amount = amount,
                    type = selectedType,
                    category = selectedCategory,
                    subcategory = selectedSubcategory,
                    notes = notes
                )

                viewModel.insert(transaction)
                dismiss()
            }
        }
    }

    private fun validateInput(): Boolean {
        var valid = true

        val amountText = binding.etAmount.text?.toString()
        if (amountText.isNullOrBlank() || amountText.toDoubleOrNull() == null || amountText.toDouble() <= 0) {
            binding.tilAmount.error = "Enter a valid amount"
            valid = false
        } else {
            binding.tilAmount.error = null
        }

        if (selectedCategory.isBlank()) {
            binding.tilCategory.error = "Select a category"
            valid = false
        } else {
            binding.tilCategory.error = null
        }

        if (selectedSubcategory.isBlank()) {
            binding.tilSubcategory.error = "Select a subcategory"
            valid = false
        } else {
            binding.tilSubcategory.error = null
        }

        return valid
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "AddEntryBottomSheet"

        fun newInstance(type: TransactionType? = null): AddEntryBottomSheet {
            return AddEntryBottomSheet().apply {
                arguments = Bundle().apply {
                    type?.let { putString("type", it.name) }
                }
            }
        }
    }
}
