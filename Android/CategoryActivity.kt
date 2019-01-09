package com.apptivitylab.dhome.marketplace

import android.app.ProgressDialog
import android.content.Intent
import android.os.Bundle
import android.support.v7.widget.SearchView
import android.view.Menu
import com.apptivitylab.android.dhome.data.api.DHomeRestClient
import com.apptivitylab.android.dhome.data.controller.DHomeAccountController
import com.apptivitylab.android.dhome.data.controller.MarketplaceCategoryDataController
import com.apptivitylab.android.dhome.data.controller.MarketplaceProductDataController
import com.apptivitylab.android.dhome.data.controller.MarketplaceShoppingCartDataController
import com.apptivitylab.android.dhome.data.model.Category
import com.apptivitylab.android.dhome.data.model.Product
import com.apptivitylab.android.dhome.data.model.RemoteFile
import com.apptivitylab.dhome.DHomeBaseActivity
import com.apptivitylab.dhome.R
import kotlinx.android.synthetic.main.activity_category.*
import java.util.*
import kotlin.collections.ArrayList

class CategoryActivity : DHomeBaseActivity(), ProductAdapter.OnItemClickListener {
    private lateinit var category: Category
    private lateinit var productAdapter: ProductAdapter
    private lateinit var originalProducts: ArrayList<Product>

    lateinit var progressDialog: ProgressDialog
    companion object {
        val CATEGORY = "com.apptivitylab.dhome.marketplace.CategoryActivity.CATEGORY"
    }
	
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_category)

        this.setSupportActionBar(this.toolbar)
        this.supportActionBar?.setHomeButtonEnabled(true)
        this.supportActionBar?.setDisplayHomeAsUpEnabled(true)

        this.progressDialog = this.createProgressDialog()

        this.searchView.isActivated = true
        this.searchView.onActionViewExpanded()
        this.searchView.isIconified = false
        this.searchView.clearFocus()
        this.searchView.queryHint = getString(R.string.search)
        this.searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String): Boolean {
                return false
            }

            override fun onQueryTextChange(newText: String): Boolean {
                handleSearch(newText)
                return false
            }
        })

        this.productAdapter = ProductAdapter(this)
        this.products.adapter = this.productAdapter
        intent.getSerializableExtra(CategoryActivity.CATEGORY)?.let {
            this.category = it as Category
            this.updateViews()
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        this.setupToolbar()
        return true
    }

    override fun onOptionsItemSelected(item: android.view.MenuItem?): Boolean {
        if (item?.itemId == android.R.id.home) {
            if (this.supportFragmentManager.backStackEntryCount > 0) {
                this.supportFragmentManager.popBackStack()
                return true
            }
        }

        return super.onOptionsItemSelected(item)
    }
	
    private fun navigateToShoppingCart(){
        val intent = Intent(this, ShoppingCartActivity::class.java)
        startActivity(intent)
    }
	
    override fun onItemClicked(product: Product) {
        val intent = ProductDetailActivity.newIntent(this, product)
        startActivity(intent)
    }

    override fun onAddToCartClicked(product: Product) {
        this.showDialogIfNeed()
        MarketplaceShoppingCartDataController.addToCart(
                this,
                product,
                DHomeAccountController.selectedUnit?.uuid,
                DHomeAccountController.selectedUnit?.residenceUuid,
                object : DHomeRestClient.SimpleRequestListener {
                    override fun onComplete(error: Error?) {
                        this@CategoryActivity.hideDialogIfNeed()

                        error?.let {
                            this@CategoryActivity.showErrorDialog(error)
                            return
                        }

                        this@CategoryActivity.navigateToShoppingCart()
                    }
                })
      //  val intent = ProductDetailActivity.newIntent(this, product)
      //  startActivity(intent)
    }

    private fun setupToolbar() {
        this.toolbar.menu.clear()
        this.toolbar.inflateMenu(R.menu.menu_category)
        this.toolbar.setOnMenuItemClickListener { menuItem ->
            when (menuItem?.itemId) {
                R.id.actionHistory -> {
                    onHistoryClicked()
                }
                R.id.actionCart -> {
                    onShoppingCartClicked()
                }
            }
            true
        }
    }

    private fun handleSearch(searchText: String) {
        val filteredProduct = MarketplaceProductDataController.getProducts( searchText )
        this.productAdapter.clearDataset()
        this.productAdapter.updateDataset(ArrayList(filteredProduct), searchText)
    }

    private fun onHistoryClicked() {
        val intent = Intent(this, HistoryActivity::class.java)
        startActivity(intent)
    }

    private fun onShoppingCartClicked() {
        val intent = Intent(this, ShoppingCartActivity::class.java)
        startActivity(intent)
    }
	
    private fun updateViews(){
        this.title = category.name

    }

    override fun onResume() {
        super.onResume()
        loadProducts()
    }
	
    private fun loadProducts() {
        MarketplaceProductDataController.loadProducts(
                context = this,
                categoryUUID = category.uuid,
                residence = DHomeAccountController.selectedUnit?.residence,
                listener = object : DHomeRestClient.LoadListListener<Product> {
                    override fun onComplete(list: List<Product>, nextOffset: Int, totalCount: Int, error: Error?) {
                        error?.let {
                            this@CategoryActivity.showErrorDialog(error)
                            return
                        }

                        productAdapter.clearDataset()
                        updateProductDataSet()
                    }
                })
    }
	
    private fun updateProductDataSet() {
        Thread({
            val products = MarketplaceProductDataController.getProducts()
            this.runOnUiThread({
                this.productAdapter.updateDataset(ArrayList(products))
            })
        }).start()
    }
	
    private fun showDialogIfNeed() {
        if (!this.progressDialog.isShowing) {
            this.progressDialog.show()
        }
    }

    private fun hideDialogIfNeed() {
        if (this.progressDialog.isShowing) {
            this.progressDialog.dismiss()
        }
    }
}
