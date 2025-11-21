// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ChainTrackSupplyChain
 * @dev Generic supply chain management contract with Merkle tree verification
 * @notice Supports any product type with cryptographic proof of authenticity
 */
contract ChainTrackSupplyChain {
    
    // Batch information structure
    struct Batch {
        string batchCode;
        string productType;
        uint256 productionDate;
        uint256 expiryDate;
        address manufacturer;
        bytes32 merkleRoot;
        uint256 createdAt;
        bool exists;
    }
    
    // Movement tracking structure
    struct Movement {
        string batchCode;
        address fromUser;
        address toUser;
        string location;
        uint256 timestamp;
    }
    
    // Storage mappings
    mapping(string => Batch) public batches;
    mapping(string => Movement[]) public batchMovements;
    mapping(address => bool) public manufacturers;
    mapping(address => bool) public distributors;
    mapping(address => bool) public retailers;
    
    // Events
    event BatchCreated(
        string indexed batchCode,
        string productType,
        address indexed manufacturer,
        bytes32 merkleRoot,
        uint256 timestamp
    );
    
    event MovementRecorded(
        string indexed batchCode,
        address indexed fromUser,
        address indexed toUser,
        string location,
        uint256 timestamp
    );
    
    event RoleAssigned(
        address indexed user,
        string role,
        uint256 timestamp
    );
    
    event BatchVerified(
        string indexed batchCode,
        bytes32 merkleRoot,
        bool verified,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyManufacturer() {
        require(manufacturers[msg.sender], "Only manufacturers can perform this action");
        _;
    }
    
    modifier batchExists(string memory batchCode) {
        require(batches[batchCode].exists, "Batch does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        // Assign contract deployer as a manufacturer
        manufacturers[msg.sender] = true;
        emit RoleAssigned(msg.sender, "manufacturer", block.timestamp);
    }
    
    /**
     * @dev Register a new manufacturer
     * @param _manufacturer Address to register as manufacturer
     */
    function registerManufacturer(address _manufacturer) external onlyManufacturer {
        require(!manufacturers[_manufacturer], "Already registered as manufacturer");
        manufacturers[_manufacturer] = true;
        emit RoleAssigned(_manufacturer, "manufacturer", block.timestamp);
    }
    
    /**
     * @dev Register a distributor
     * @param _distributor Address to register as distributor
     */
    function registerDistributor(address _distributor) external onlyManufacturer {
        require(!distributors[_distributor], "Already registered as distributor");
        distributors[_distributor] = true;
        emit RoleAssigned(_distributor, "distributor", block.timestamp);
    }
    
    /**
     * @dev Register a retailer
     * @param _retailer Address to register as retailer
     */
    function registerRetailer(address _retailer) external onlyManufacturer {
        require(!retailers[_retailer], "Already registered as retailer");
        retailers[_retailer] = true;
        emit RoleAssigned(_retailer, "retailer", block.timestamp);
    }
    
    /**
     * @dev Create a new batch with Merkle root for verification
     * @param _batchCode Unique identifier for the batch
     * @param _productType Type of product (e.g., "Electronics", "Food", "Pharmaceuticals")
     * @param _productionDate Production timestamp
     * @param _expiryDate Expiry timestamp
     * @param _merkleRoot Merkle root hash for batch verification
     */
    function createBatch(
        string memory _batchCode,
        string memory _productType,
        uint256 _productionDate,
        uint256 _expiryDate,
        bytes32 _merkleRoot
    ) external onlyManufacturer {
        require(!batches[_batchCode].exists, "Batch already exists");
        require(_productionDate < _expiryDate, "Invalid dates");
        require(_merkleRoot != bytes32(0), "Invalid Merkle root");
        
        batches[_batchCode] = Batch({
            batchCode: _batchCode,
            productType: _productType,
            productionDate: _productionDate,
            expiryDate: _expiryDate,
            manufacturer: msg.sender,
            merkleRoot: _merkleRoot,
            createdAt: block.timestamp,
            exists: true
        });
        
        emit BatchCreated(
            _batchCode,
            _productType,
            msg.sender,
            _merkleRoot,
            block.timestamp
        );
    }
    
    /**
     * @dev Record movement of a batch in the supply chain
     * @param _batchCode Batch identifier
     * @param _fromUser Origin address
     * @param _toUser Destination address
     * @param _location Physical location
     */
    function recordMovement(
        string memory _batchCode,
        address _fromUser,
        address _toUser,
        string memory _location
    ) external batchExists(_batchCode) {
        require(_fromUser != address(0) && _toUser != address(0), "Invalid addresses");
        require(_fromUser != _toUser, "From and to addresses cannot be the same");
        // Only allow movement if sender is the fromUser or toUser (authorized parties)
        require(msg.sender == _fromUser || msg.sender == _toUser, "Unauthorized: must be from or to user");
        
        Movement memory newMovement = Movement({
            batchCode: _batchCode,
            fromUser: _fromUser,
            toUser: _toUser,
            location: _location,
            timestamp: block.timestamp
        });
        
        batchMovements[_batchCode].push(newMovement);
        
        emit MovementRecorded(
            _batchCode,
            _fromUser,
            _toUser,
            _location,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify a Merkle proof against a batch's root
     * @param _batchCode Batch to verify against
     * @param _leaf Leaf hash to verify
     * @param _proof Array of proof hashes
     * @return bool True if proof is valid
     */
    function verifyMerkleProof(
        string memory _batchCode,
        bytes32 _leaf,
        bytes32[] memory _proof
    ) external view batchExists(_batchCode) returns (bool) {
        bytes32 computedHash = _leaf;
        bytes32 root = batches[_batchCode].merkleRoot;
        
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];
            
            if (computedHash < proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
    
    /**
     * @dev Get batch information
     * @param _batchCode Batch identifier
     * @return Batch struct with all information
     */
    function getBatch(string memory _batchCode) 
        external 
        view 
        batchExists(_batchCode) 
        returns (Batch memory) 
    {
        return batches[_batchCode];
    }
    
    /**
     * @dev Get all movements for a batch
     * @param _batchCode Batch identifier
     * @return Array of Movement structs
     */
    function getMovements(string memory _batchCode) 
        external 
        view 
        batchExists(_batchCode) 
        returns (Movement[] memory) 
    {
        return batchMovements[_batchCode];
    }
    
    /**
     * @dev Get Merkle root for a batch
     * @param _batchCode Batch identifier
     * @return bytes32 Merkle root hash
     */
    function getBatchMerkleRoot(string memory _batchCode) 
        external 
        view 
        batchExists(_batchCode) 
        returns (bytes32) 
    {
        return batches[_batchCode].merkleRoot;
    }
    
    /**
     * @dev Check if address is a manufacturer
     * @param _address Address to check
     * @return bool True if manufacturer
     */
    function isManufacturer(address _address) external view returns (bool) {
        return manufacturers[_address];
    }
    
    /**
     * @dev Check if address is a distributor
     * @param _address Address to check
     * @return bool True if distributor
     */
    function isDistributor(address _address) external view returns (bool) {
        return distributors[_address];
    }
    
    /**
     * @dev Check if address is a retailer
     * @param _address Address to check
     * @return bool True if retailer
     */
    function isRetailer(address _address) external view returns (bool) {
        return retailers[_address];
    }
}
