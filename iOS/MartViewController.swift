import UIKit
import MBProgressHUD

enum MarketType: Int {
    case categories
    case recentPurchases
    case unknown
    
    var title: String {
        switch self {
        case .categories:
            return NSLocalizedString("What do you need, \(AccountController.shared.profile.name ?? "")?", comment: "")
        case .recentPurchases:
            return NSLocalizedString("Recent Purchases", comment: "")
        case .unknown:
            return NSLocalizedString("Assistance", comment: "")
        }
    }
}

class MartViewController: MartketBaseViewController {
    // MARK: Properties
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var categoryTitle: UILabel!
    @IBOutlet weak var categoryCollectionView: UICollectionView!
    
    private var marketTypes: [MarketType] {
        return [.recentPurchases]
    }
    
    private var categoryItems: [MPCategory] = []
    
    private var recentProducts : [MPProduct] = []
    
    fileprivate func setupTableView() {
        self.tableView.tableFooterView = UIView()
        self.tableView.estimatedSectionHeaderHeight = 60
        self.tableView.rowHeight = UITableViewAutomaticDimension
        self.tableView.estimatedRowHeight = 60
        self.tableView.tableFooterView = UIView(frame: CGRect(x: 0, y: 0, width: self.tableView.frame.size.width, height: 1))
        self.tableView.register(UINib(nibName: "ProductTableViewCell", bundle: nil), forCellReuseIdentifier: "ProductTableViewCell")
    }
    
    fileprivate func setupCollectionView() {
        self.categoryCollectionView.register(UINib(nibName: "MarketCategoryCollectionViewCell", bundle: nil),
                                     forCellWithReuseIdentifier: "MarketCategoryCollectionViewCell")
    }
    
    // MARK: View Cycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
        setupCollectionView()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.categoryTitle.text = NSLocalizedString("What do you need, \(String(describing: AccountController.shared.profile.name ?? ""))?",comment: "What do you need")
        self.updateData()
        self.navigationController?.navigationBar.isHidden = true
        self.tabBarController?.tabBar.isHidden = false
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        self.navigationController?.navigationBar.isHidden = false
    }
    
    private func updateData() {
        guard let selectedUnit = AccountController.shared.selectedUnit,
            let residence = selectedUnit.residence,
            let userProfile = AccountController.shared.profile else {
                return
        }
        
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        let HUB = MBProgressHUD.showAdded(to: self.navigationController?.view ?? self.view, animated: true)
        MPCategoryDataController.shared.loadMPcategories(residence: residence) { (mpCategories, paging, error) in
            dispatchGroup.leave()
            self.categoryItems = mpCategories.sorted(by: { (item1, item2) -> Bool in

                guard let name1 = item1.name, let name2 = item2.name else {
                    return false
                }
                return name1 < name2
            })
        }
        dispatchGroup.enter()
        MPProductDataController.shared.getPurrchasesHistoryProduct(by: userProfile,
                                                                    residence: residence,
                                                                    unit: selectedUnit) { (productsHistory, paging, error) in
                                                                        dispatchGroup.leave()
                                                                        self.recentProducts = MPProductDataController.shared.removeRecentDuplicate(products: productsHistory)
        }
        
        dispatchGroup.notify(queue: .main) {
            self.tableView.reloadData()
            self.categoryCollectionView.reloadData()
            HUB.hide(animated: true)
        }
    }
    
    @IBAction func onClickMarketHistory(_ sender: Any) {
        goToOrderHistory()
    }
    
    @IBAction func onClickCart(_ sender: Any) {
        goToOrderSummary()
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "productListSegue" {
            if let indexPath = sender as? IndexPath,
                let productListVC: ProductListViewController = segue.destination as? ProductListViewController {
                productListVC.category = self.categoryItems[indexPath.row]
            }
        }
    }
}

// MARK: TableView Delegates, datasource
extension MartViewController : UITableViewDelegate, UITableViewDataSource {
    func numberOfSections(in tableView: UITableView) -> Int {
        return marketTypes.count
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch self.marketTypes[section] {
        case .categories:
            return 1
        case .recentPurchases:
            return self.recentProducts.count
        default:
            return 0
        }
    }
    
    func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let view = UIView(frame: CGRect(x: 0, y: 0, width: self.view.frame.size.width, height: 45))
        let title = UILabel(frame: CGRect(x: 24, y: 0, width: self.view.frame.size.width, height: 45))
        title.text = marketTypes[section].title
        title.font = UIFont.boldSystemFont(ofSize: 18)
        title.textColor = .black
        view.backgroundColor = .white
        view.addSubview(title)
        return view
    }
    
    func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
        return 45
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        guard self.marketTypes.count > indexPath.section  else {
            return UITableViewAutomaticDimension
        }
        switch self.marketTypes[indexPath.section] {
        case .categories:
            return 120
        default:
            return 130
        }
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        guard self.recentProducts.count > indexPath.row  else {
            return
        }
        let product = self.recentProducts[indexPath.row]
        self.goToDetails(product)
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard self.marketTypes.count > indexPath.section  else {
            return UITableViewCell()
        }
        switch self.marketTypes[indexPath.section] {
        case .recentPurchases:
            let product = self.recentProducts[indexPath.row]
            let cell = tableView.dequeueReusableCell(withIdentifier: "ProductTableViewCell",
                                                     for: indexPath) as! ProductTableViewCell
            cell.delegate = self
            cell.updateView(product)
            return cell
        default:
            return UITableViewCell()
        }
    }
    
    func goToDetails(_ product: MPProduct) {
        if let productDetails = UIStoryboard(name: "Mart", bundle: nil)
            .instantiateViewController(withIdentifier: "ProductDetailsViewController") as? ProductDetailsViewController {
            productDetails.product = product
            self.navigationController?.pushViewController(productDetails, animated: true)
        }
    }
}

// MARRK: CollectionView Delegates, Datasource
extension MartViewController: UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return self.categoryItems.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard self.categoryItems.count > indexPath.row  else {
            return UICollectionViewCell()
        }
        let item = self.categoryItems[indexPath.row]
        let cell: MarketCategoryCollectionViewCell = collectionView.dequeueReusableCell(withReuseIdentifier: "MarketCategoryCollectionViewCell",
                                                                                        for: indexPath) as! MarketCategoryCollectionViewCell
        cell.updateView(item)
        return cell
    }
    
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        self.performSegue(withIdentifier: "productListSegue", sender: indexPath)
    }
    
    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        sizeForItemAt indexPath: IndexPath) -> CGSize {
        return CGSize(width: self.categoryCollectionView.bounds.size.height - 40,
                      height: self.categoryCollectionView.bounds.size.height)
    }
    
    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        insetForSectionAt section: Int) -> UIEdgeInsets {
        return UIEdgeInsets(top: 0, left: 20, bottom: 0, right: 20)
    }
}

extension MartViewController: ProductTableViewCellDelegate {
    func onClickProductToCart(from cell: ProductTableViewCell, product: MPProduct, sender: Any?) {
        if let option = product.mpOptions?.filter({ $0.isDefault ?? false}).first,
            let residence = AccountController.shared.selectedUnit.residence  {
            let HUB = MBProgressHUD.showAdded(to: self.navigationController?.view ?? self.view, animated: true)
            MPCartDataController.shared.addToCart(with: product,
                                                  residence: residence,
                                                  unit: AccountController.shared.selectedUnit,
                                                  mpOption:option,
                                                  quantity: 1) { (product, error) in
                                                    HUB.hide(animated: true)
                                                    guard let error = error else {
                                                        self.goToOrderSummary()
                                                        return
                                                    }
                                                    self.showAlertMessage(with: error)
            }
        }
    }
}

extension UIButton {
    override open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        isHighlighted = true
        super.touchesBegan(touches, with: event)
    }
    
    override open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        isHighlighted = false
        super.touchesEnded(touches, with: event)
    }
    
    override open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        isHighlighted = false
        super.touchesCancelled(touches, with: event)
    }
}
