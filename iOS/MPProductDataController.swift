import Foundation
import Alamofire

public class MPProductDataController {
    private static let _sharedInstance: MPProductDataController = MPProductDataController()
    public static var shared: MPProductDataController {
        return _sharedInstance
    }
    
    var products: [MPProduct] = []
    
    func loadProducts(
        related: [String] = [],
        filters: [String] = [],
        order: [String] = [],
        offset: Int = 0,
        limit: Int = 1_000,
        completion: @escaping ListListener<MPProduct>
        ) {
        let combinedRelated = ([
            "mp_stores_by_store_uuid",
            "mp_categories_by_category_uuid",
            "files_by_mp_product_images",
            "files_by_thumbnail_file_uuid",
            "mp_product_options_by_product_uuid"
            ] + related).joined(separator: ",")
        
        let combinedFilter = ([
            "(deleted_at is null)",
            "(published=1)"
            ] + filters).joined(separator: " AND ")
        
        let combinedOrder = ([
            ] + order).joined(separator: ",")
        
        APIClient.shared
            .getRequest(
                path: "data/mp_products",
                filter: combinedFilter,
                related: combinedRelated,
                order: combinedOrder,
                offset: offset,
                limit: limit)
            .responseJSON { (response: DataResponse<Any>) in
                var products: [MPProduct] = []
                var pagination = Pagination()
                var responseError: Error? = nil
                
                do {
                    let responseJSON = try APIClient.shared.JSONFromResponse(response: response)
                    if let resourceJSON = responseJSON["resource"] as? [[String : Any]] {
                        products = self.processResponse(resourceJSON)
                    }
                    if let metadataJSON = responseJSON["meta"] as? [String: Any] {
                        pagination = Pagination(with: metadataJSON)
                    }
                } catch {
                    responseError = error
                    debugPrint("Error loading products: \(error)")
                }
                
                completion(products, pagination, responseError)
        }
    }
    
    func processResponse(_ jsonArray: [[String : Any]]) -> [MPProduct] {
        // Parcel belongs-to UserProfile (userProfile)
        
        var mpStoresJsonArray: [[String : Any]] = []
        mpStoresJsonArray = jsonArray.compactMap { $0["mp_stores_by_store_uuid"] as? [String : Any] }
        if !mpStoresJsonArray.isEmpty {
            _ = MPStoreDataController.shared.processResponse(mpStoresJsonArray)
        }
        
        var mpCategoryJsonArray: [[String : Any]] = []
        mpCategoryJsonArray = jsonArray.compactMap { $0["mp_categories_by_category_uuid"] as? [String : Any] }
        if !mpStoresJsonArray.isEmpty {
            _ = MPCategoryDataController.shared.processResponse(mpCategoryJsonArray)
        }
        
        var products: [MPProduct] = []
        products += self.process(jsonArray)
        self.insert(products)
        
        return products
    }
    
    private func process(_ jsonArray: [[String : Any]]) -> [MPProduct] {
        return jsonArray.compactMap { MPProduct(with: $0) }
    }
    
    private func insert(_ product: [MPProduct]) {
        let allProducts = product + self.products
        
        let incomingUuids = product.compactMap({ $0.uuid })
        let existingUuids = self.products.map({ $0.uuid })
        
        let incomingUnionExistingUuids = Set<UUID>(incomingUuids + existingUuids)
        self.products = incomingUnionExistingUuids.compactMap { (uuid: UUID) -> MPProduct? in
            return allProducts.first(where: { $0.uuid == uuid })
        }
        
        return
    }
    
    public func getPurrchasesHistoryProduct(by userProfile: UserProfile,
                                             residence: Residence,
                                             unit: ResidenceUnit,
                                             completion: @escaping ListListener<MPProduct>) {
        let path = "marketplace/recent-purchases?residence_uuid=\(residence.uuid.uuidString.lowercased())&unit_uuid=\(unit.uuid.uuidString.lowercased())"
        APIClient.shared
            .request(method: .get, path: path)
            .responseJSON { (response: DataResponse<Any>) in
                var responseError: Error? = nil
                let pagination = Pagination()
                var products: [MPProduct] = []
                do {
                    let responseJsonArary = try APIClient.shared.JSONFromResponseArray(response: response)
                    products = self.processResponse(responseJsonArary)
                } catch {
                    responseError = error
                    debugPrint("Error load purchases history product: \(error)")
                }
                completion(products, pagination , responseError)
        }
    }
    
    public func removeRecentDuplicate(products: [MPProduct]) -> [MPProduct] {
        var results : [MPProduct] = []
        for item in products {
            if (!results.contains(where: { $0.uuid == item.uuid})) {
                results.append(item)
            }
        }
        return results
    }
}

public extension MPProductDataController {
    public func loadMPProduct(
        uuid: UUID? = nil,
        category: MPCategory? = nil,
        userProfile: UserProfile? = nil,
        unit: ResidenceUnit? = nil,
        residence: Residence? = nil,
        searchText: String? = nil,
        order: [String] = [],
        offset: Int = 0,
        limit: Int = 1_000,
        completion: @escaping ListListener<MPProduct>
        ) {
        var filters: [String] = []
        
        if let uuid = uuid {
            filters.append("(uuid = \(uuid.uuidString.lowercased()))")
        }
        
        if let category = category {
            filters.append("(category_uuid = \(category.uuid.uuidString.lowercased()))")
        }
        
        if let unit = unit {
            filters.append("(unit_uuid = \(unit.uuid.uuidString.lowercased()))")
        }
        
        if let searchText = searchText {
            filters.append("(code like '%\(searchText)%')")
        }
        
        if let residence = residence {
            filters.append("(residence_uuid = \(residence.uuid.uuidString.lowercased()))")
        }
        
        self.loadProducts(
            filters: filters,
            order: order,
            offset: offset,
            limit: limit,
            completion: completion)
    }
    
    public func getMPProduct(by category: MPCategory?, residence: Residence) -> [MPProduct] {
        var filteredItems = self.products.filter({ $0.residenceUuid == residence.uuid }).filter({ $0.deletedAt == nil })
        if let category = category {
            filteredItems = filteredItems.filter({ $0.categoryUuid == category.uuid })
        }
        return filteredItems
    }
    
    public func getMPProduct(by uuid: UUID) -> MPProduct? {
        return self.products.filter({ $0.uuid == uuid }).first
    }
}

