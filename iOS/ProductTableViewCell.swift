import UIKit

protocol ProductTableViewCellDelegate: class {
    func onClickProductToCart(from cell: ProductTableViewCell,
                        product: MPProduct,
                        sender: Any?)
}

class ProductTableViewCell: UITableViewCell {
    @IBOutlet weak var productImage: UIImageView!
    @IBOutlet weak var name: UILabel!
    @IBOutlet weak var storeName: UILabel!
    @IBOutlet weak var price: UILabel!
    @IBOutlet weak var separator: UIView!
    weak var delegate: ProductTableViewCellDelegate?
    @IBOutlet weak var addToCardButton: UIButton!
    
    private var product: MPProduct? {
        didSet{
            if let product = self.product {
                self.name.text = product.name?.uppercased()
                self.storeName.text = product.mpStore?.name?.uppercased()
                self.thumnail = product.thumnail
                self.price.text = (product.unitPrice ?? 0).currencyStringWithSpace(withSymbol: (product.currency ?? "RM"),
                                                                          minimumFractionDigits: 2)
                if let totalQuantity = product.totalQuantity, totalQuantity != 0 {
                    self.addToCardButton.setTitle(NSLocalizedString("ADD TO CART", comment: "ADD TO CART"), for: .normal)
                    self.addToCardButton.setTitleColor(.core, for: .normal)
                    self.addToCardButton.isEnabled = true
                } else {
                    self.addToCardButton.setTitle(NSLocalizedString("OUT OF STOCK", comment: "OUT OF STOCK"), for: .normal)
                    self.addToCardButton.setTitleColor(.red, for: .normal)
                    self.addToCardButton.isEnabled = false
                }
            }
        }
    }
    
    private var thumnail : RemoteFile? {
        didSet{
            if let thumnail = self.thumnail {
                self.productImage.sd_setImage(with: thumnail.url, completed: { (image, error, cacheType, imageURL) in
                    if let image = image {
                        self.productImage.image = image.cropToBounds(width: self.productImage.bounds.size.width,
                                                             height: self.productImage.bounds.size.height)
                    }else {
                        self.productImage.image = UIImage(named: "placeHolder")
                    }
                })
            }else {
                self.productImage.image = UIImage(named: "placeHolder")
            }
        }
    }
    
    override func awakeFromNib() {
        super.awakeFromNib()
    }
    
    @IBAction func onClickAddToCart(_ sender: Any) {
        if let delegate = self.delegate,
            let product = self.product {
            delegate.onClickProductToCart(from: self,
                                    product: product,
                                    sender: sender)
        }
    }
    
    func updateView(_ product: MPProduct) {
        self.product = product
    }
}
