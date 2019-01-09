import Foundation
import Alamofire

public class MPCategoryDataController {
    private static let _sharedInstance: MPCategoryDataController = MPCategoryDataController()
    public static var shared: MPCategoryDataController {
        return _sharedInstance
    }
    
    var mpCategories: [MPCategory] = []
    
    func loadMPCategories(
        related: [String] = [],
        filters: [String] = [],
        order: [String] = [],
        offset: Int = 0,
        limit: Int = 1_000,
        completion: @escaping ListListener<MPCategory>
        ) {
        let combinedRelated = ([
            "files_by_icon_file_uuid"
            ] + related).joined(separator: ",")
        
        let combinedFilter = ([
            "(deleted_at is null)",
            ] + filters).joined(separator: " AND ")
        
        let combinedOrder = ([
            ] + order).joined(separator: ",")
        
        APIClient.shared
            .getRequest(
                path: "data/mp_categories",
                filter: combinedFilter,
                related: combinedRelated,
                order: combinedOrder,
                offset: offset,
                limit: limit)
            .responseJSON { (response: DataResponse<Any>) in
                var mpCategories: [MPCategory] = []
                var pagination = Pagination()
                var responseError: Error? = nil
                
                do {
                    let responseJSON = try APIClient.shared.JSONFromResponse(response: response)
                    if let resourceJSON = responseJSON["resource"] as? [[String : Any]] {
                        mpCategories = self.processResponse(resourceJSON)
                    }
                    if let metadataJSON = responseJSON["meta"] as? [String: Any] {
                        pagination = Pagination(with: metadataJSON)
                    }
                } catch {
                    responseError = error
                    debugPrint("Error loading MPCategory: \(error)")
                }
                
                completion(mpCategories, pagination, responseError)
        }
    }
    
    func processResponse(_ jsonArray: [[String : Any]]) -> [MPCategory] {
        var mpCategories: [MPCategory] = []
        mpCategories += self.process(jsonArray)
        self.insert(mpCategories)
        return mpCategories
    }
    
    private func process(_ jsonArray: [[String : Any]]) -> [MPCategory] {
        return jsonArray.compactMap { MPCategory(with: $0) }
    }
    
    private func insert(_ categories: [MPCategory]) {
        let allMPCategories = categories + self.mpCategories
        
        let incomingUuids = categories.compactMap({ $0.uuid })
        let existingUuids = self.mpCategories.map({ $0.uuid })
        
        let incomingUnionExistingUuids = Set<UUID>(incomingUuids + existingUuids)
        let allCategories = incomingUnionExistingUuids.compactMap { (uuid: UUID) -> MPCategory? in
            return allMPCategories.first(where: { $0.uuid == uuid })
        }
        
        self.mpCategories = allCategories.sorted(by: { $0.createdAt.timeIntervalSince1970 < $1.createdAt.timeIntervalSince1970 })
        return
    }
}

public extension MPCategoryDataController {
    public func loadMPcategories(
        uuid: UUID? = nil,
        userProfile: UserProfile? = nil,
        unit: ResidenceUnit? = nil,
        residence: Residence? = nil,
        searchText: String? = nil,
        order: [String] = [],
        offset: Int = 0,
        limit: Int = 1_000,
        completion: @escaping ListListener<MPCategory>
        ) {
        var filters: [String] = []
        
        if let uuid = uuid {
            filters.append("(uuid = \(uuid.uuidString.lowercased()))")
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
        
        self.loadMPCategories(
            filters: filters,
            order: order,
            offset: offset,
            limit: limit,
            completion: completion)
    }
    
    public func getCategories(_ residence: Residence) -> [MPCategory] {
        return self.mpCategories.filter({ $0.residenceUuid == residence.uuid })
    }
    
    public func getMPCatefory(by uuid: UUID) -> MPCategory? {
        return self.mpCategories.first { $0.uuid == uuid }
    }
}

