package com.apptivitylab.dhome.marketplace

import android.support.v7.widget.RecyclerView
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.apptivitylab.android.dhome.data.getFormattedPrice
import com.apptivitylab.android.dhome.data.getFormattedPriceWithQuantity
import com.apptivitylab.android.dhome.data.model.OrderItem
import com.apptivitylab.dhome.R
import kotlinx.android.synthetic.main.cell_order_receipt.view.*
import java.util.ArrayList

class OrderReceiptAdapter(var onItemClickListener: OnItemClickListener?)
    : RecyclerView.Adapter<OrderReceiptAdapter.OrderProductViewHolder>() {
    interface OnItemClickListener {
        fun onItemClicked(orderItem: OrderItem)
    }

    private val items = ArrayList<OrderItem>()
    override fun onCreateViewHolder(parent: ViewGroup?, viewType: Int): OrderProductViewHolder {
        return OrderReceiptAdapter.OrderProductViewHolder(
                LayoutInflater.from(parent?.context).inflate(R.layout.cell_order_receipt, parent, false),
                items, onItemClickListener)
    }

    override fun getItemCount(): Int {
        return items.size
    }

    override fun onBindViewHolder(holder: OrderProductViewHolder?, position: Int) {
        holder?.let {
            val item = items[it.adapterPosition]
            it.updateView(item)
        }
    }

    fun updateDataset(items: ArrayList<OrderItem>) {
        this.items.addAll(items)
        this.notifyDataSetChanged()
    }

    fun removeItem(item: OrderItem) : Boolean {
        if (this.items.contains(item)) {
            this.items.remove(item)
            this.notifyDataSetChanged()
            return true
        }
        return false
    }

    fun clearDataset() {
        items.clear()
    }

    class OrderProductViewHolder(itemView: View?, var items: ArrayList<OrderItem>,
                                 onItemClickListener: OnItemClickListener?
                                 )
        : RecyclerView.ViewHolder(itemView) {

        lateinit var data: OrderItem

        init {
            itemView?.setOnClickListener {
                onItemClickListener?.onItemClicked(data)
            }
        }

        fun updateView(data: OrderItem) {
            this.data = data

            this.itemView.name.text = data.displayName()
            this.itemView.store.text = data.storeName
            this.itemView.price.text = data.product?.getFormattedPriceWithQuantity(data.quantity!!) ?: data.getFormattedPriceWithQuantity("RM", data.quantity!!)
            this.itemView.quantity.text = data.quantity!!.toString()
        }

    }
}